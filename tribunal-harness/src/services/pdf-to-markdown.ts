/**
 * PDF -> Markdown
 *
 * Convert a PDF (in-memory buffer, or an online PDF from a trusted legal source)
 * into clean Markdown/text so an LLM can reason over it. Models reason far better
 * over Markdown than raw PDF bytes — so the engine converts judgment / source
 * PDFs to Markdown BEFORE sending them to Claude.
 *
 * Uses pdf-parse (already a dependency; pure JS; server-side only — Node runtime).
 *
 * Online fetching is SSRF-hardened: HTTPS only, and the host must be on an
 * allowlist of trusted legal sources. Responses are size-capped.
 *
 * (For local dev / agent sessions, the heavier Nutrient `pdf-to-markdown` CLI
 * pipeline — scanned + null-byte fallbacks — is documented in CLAUDE.md. This
 * service is the deployable runtime path.)
 */

const ALLOWED_HOSTS = new Set([
    "caselaw.nationalarchives.gov.uk",
    "assets.caselaw.nationalarchives.gov.uk",
    "www.bailii.org",
    "www.legislation.gov.uk",
    "www.gov.uk",
]);

const MAX_PDF_BYTES = 20 * 1024 * 1024; // 20 MB
const DEFAULT_TIMEOUT_MS = 20_000;

export type PdfStatus =
    | "ok"
    | "empty"
    | "too_large"
    | "not_pdf"
    | "forbidden_host"
    | "upstream_timeout"
    | "upstream_unavailable"
    | "error";

export interface PdfMarkdownResult {
    status: PdfStatus;
    markdown?: string;
    pages?: number;
    detail?: string;
    sourceUrl?: string;
}

/** Light text -> Markdown tidy: normalise newlines, drop trailing spaces, collapse blank runs. */
export function tidyToMarkdown(text: string): string {
    return text
        .replace(/\r/g, "")
        .replace(/[ \t]+\n/g, "\n")
        .replace(/\n{3,}/g, "\n\n")
        .trim();
}

/** True if the buffer starts with the %PDF- magic header. */
export function looksLikePdf(buffer: Buffer): boolean {
    return buffer.length >= 5 && buffer.subarray(0, 5).toString("latin1") === "%PDF-";
}

/** Convert an in-memory PDF buffer to Markdown. Never throws. */
export async function pdfBufferToMarkdown(buffer: Buffer): Promise<PdfMarkdownResult> {
    if (!buffer || buffer.length === 0) return { status: "empty", detail: "Empty buffer." };
    if (!looksLikePdf(buffer)) return { status: "not_pdf", detail: "Not a PDF (missing %PDF- header)." };
    try {
        const pdfParse = (await import("pdf-parse")).default;
        const data = await pdfParse(buffer);
        const md = tidyToMarkdown(data.text || "");
        if (!md) {
            return {
                status: "empty",
                pages: data.numpages,
                detail: "No extractable text — the PDF is likely scanned/image-only (would need OCR).",
            };
        }
        return { status: "ok", markdown: md, pages: data.numpages };
    } catch (e) {
        return { status: "error", detail: `PDF parse failed: ${e instanceof Error ? e.message : String(e)}` };
    }
}

/** Whether a URL is an allowlisted, https legal source (SSRF guard). Exported for testing. */
export function isAllowedPdfUrl(url: string): boolean {
    try {
        const u = new URL(url);
        return u.protocol === "https:" && ALLOWED_HOSTS.has(u.hostname);
    } catch {
        return false;
    }
}

/**
 * Fetch a PDF from a trusted legal source and convert it to Markdown. Never
 * throws. Rejects non-allowlisted hosts (SSRF guard) and oversized payloads.
 */
export async function fetchPdfAsMarkdown(
    url: string,
    opts?: { timeoutMs?: number }
): Promise<PdfMarkdownResult> {
    let parsed: URL;
    try {
        parsed = new URL(url);
    } catch {
        return { status: "error", detail: "Invalid URL.", sourceUrl: url };
    }
    if (!isAllowedPdfUrl(url)) {
        return {
            status: "forbidden_host",
            detail: `Refusing to fetch: only https PDFs from trusted legal sources are allowed (${[...ALLOWED_HOSTS].join(", ")}).`,
            sourceUrl: url,
        };
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), opts?.timeoutMs ?? DEFAULT_TIMEOUT_MS);
    try {
        const resp = await fetch(parsed.toString(), {
            headers: { "User-Agent": "tribunal-harness/1.0", Accept: "application/pdf" },
            signal: controller.signal,
        });
        if (!resp.ok) {
            if (resp.status >= 500 || resp.status === 429) {
                return { status: "upstream_unavailable", detail: `Source returned ${resp.status}.`, sourceUrl: url };
            }
            return { status: "error", detail: `Source returned ${resp.status}.`, sourceUrl: url };
        }
        const declared = parseInt(resp.headers.get("content-length") || "0", 10);
        if (declared && declared > MAX_PDF_BYTES) {
            return { status: "too_large", detail: `PDF too large (${declared} bytes).`, sourceUrl: url };
        }
        const ab = await resp.arrayBuffer();
        if (ab.byteLength > MAX_PDF_BYTES) {
            return { status: "too_large", detail: `PDF too large (${ab.byteLength} bytes).`, sourceUrl: url };
        }
        const result = await pdfBufferToMarkdown(Buffer.from(ab));
        return { ...result, sourceUrl: url };
    } catch (err) {
        if (err instanceof Error && err.name === "AbortError") {
            return { status: "upstream_timeout", detail: "Fetch timed out.", sourceUrl: url };
        }
        return { status: "upstream_unavailable", detail: "Could not fetch the PDF.", sourceUrl: url };
    } finally {
        clearTimeout(timer);
    }
}
