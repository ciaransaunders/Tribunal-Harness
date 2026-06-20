/**
 * Find Case Law — live UK case-law retrieval & verification
 *
 * Queries The National Archives "Find Case Law" public API
 * (caselaw.nationalarchives.gov.uk) at request time, so the engine can FIND
 * relevant authorities and DOUBLE-CHECK cited ones against the primary source
 * — instead of relying on a large pre-built RAG corpus.
 *
 * Design ported from the uk-legal-mcp project's case_law module:
 *  - Authoritative free source, no API key, ~1,000 req / 5 min per IP.
 *  - Structured {status,...} envelope so callers can tell "no match" from
 *    "lookup failed" and never confabulate on failure (Obs 183).
 *  - Exact match vs nearby candidate is kept explicit (VERIFIED vs CHECK).
 *  - Coverage is ~early-2000s onward; older landmark authorities are handled
 *    by the curated known-good list in verified-authorities.ts, not here.
 *
 * Parsing note: TNA's search response is a flat Atom/XML feed. We extract the
 * handful of fields we need with defensive regex (no XML dependency, no XXE
 * surface — we never expand entities). Full-judgment XML is not parsed here.
 */

const TNA_BASE = "https://caselaw.nationalarchives.gov.uk";
const DEFAULT_TIMEOUT_MS = 12_000;
const USER_AGENT = "tribunal-harness/1.0 (UK employment tribunal legal-information tool)";

export type LookupStatus =
    | "ok"
    | "empty"
    | "not_found"
    | "upstream_timeout"
    | "upstream_unavailable"
    | "error";

export type LiveTrustLevel = "VERIFIED" | "CHECK" | "QUARANTINED";

export interface CaseLawHit {
    /** Neutral citation as published, e.g. "[2021] UKSC 5". null if absent. */
    neutralCitation: string | null;
    /** Case title as published. */
    title: string;
    /** Court name, e.g. "Employment Appeal Tribunal". */
    court: string | null;
    /** Judgment date (YYYY-MM-DD). */
    date: string | null;
    /** TNA slug, e.g. "eat/2026/90" — stable id for the judgment. */
    slug: string | null;
    /** Canonical TNA URL for the judgment. */
    url: string | null;
}

export interface SearchEnvelope {
    status: LookupStatus;
    results: CaseLawHit[];
    /** Human-readable detail for empty/error statuses (surface this, never the raw error). */
    detail?: string;
    /** Total results reported by TNA, when available. */
    total?: number;
}

export interface VerifyResult {
    /** VERIFIED = exact neutral-citation match in the archive; CHECK = case name found but citation unconfirmed; QUARANTINED = not found / could not verify. */
    trustLevel: LiveTrustLevel;
    /** How the verdict was reached, surfaced to the user. */
    reason: string;
    /** Where the verdict came from. */
    source: "find_case_law" | "unavailable";
    matchedTitle?: string;
    matchedCitation?: string;
    slug?: string;
    url?: string;
}

const ENTITIES: Record<string, string> = {
    "&amp;": "&",
    "&lt;": "<",
    "&gt;": ">",
    "&quot;": '"',
    "&apos;": "'",
    "&#39;": "'",
};

function decodeEntities(s: string): string {
    return s
        .replace(/&(amp|lt|gt|quot|apos|#39);/g, (m) => ENTITIES[m] ?? m)
        .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCodePoint(parseInt(h, 16)))
        .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(parseInt(d, 10)))
        .trim();
}

/** Normalise a neutral citation for comparison: lowercase, collapse whitespace, strip non-alphanumerics. */
export function normaliseCitation(c: string): string {
    return c.toLowerCase().replace(/[^a-z0-9]/g, "");
}

/** Pull a neutral-citation token (e.g. "[2021] UKSC 5", "[2009] EWCA Civ 1202", "[2026] EAT 90") out of a free string. */
export function extractNeutralCitation(text: string): string | null {
    const m = text.match(/\[\s*\d{4}\s*\]\s*[A-Za-z][A-Za-z./ ]*?\s*\d+/);
    return m ? m[0].replace(/\s+/g, " ").trim() : null;
}

/**
 * Parse the TNA Atom search feed into hits. Exported for offline testing.
 * Resilient to attribute order on <tna:identifier ... type="ukncn" slug="...">.
 */
export function parseAtomFeed(xml: string, limit = 10): { hits: CaseLawHit[]; total?: number } {
    const hits: CaseLawHit[] = [];
    const totalMatch = xml.match(/<(?:\w+:)?totalResults>\s*(\d+)\s*</);
    const total = totalMatch ? parseInt(totalMatch[1], 10) : undefined;

    const entryRe = /<entry>([\s\S]*?)<\/entry>/g;
    let m: RegExpExecArray | null;
    while ((m = entryRe.exec(xml)) !== null && hits.length < limit) {
        const e = m[1];

        const titleM = e.match(/<title[^>]*>([\s\S]*?)<\/title>/);
        const title = titleM ? decodeEntities(titleM[1]) : "(untitled)";

        // <tna:identifier ... type="ukncn" ...>[2021] UKSC 5</tna:identifier>  (attr order varies)
        let neutralCitation: string | null = null;
        let slug: string | null = null;
        const idRe = /<tna:identifier\b([^>]*)>([\s\S]*?)<\/tna:identifier>/g;
        let idm: RegExpExecArray | null;
        while ((idm = idRe.exec(e)) !== null) {
            const attrs = idm[1];
            if (/type="ukncn"/.test(attrs)) {
                const text = decodeEntities(idm[2]);
                if (text) neutralCitation = text;
                const slugM = attrs.match(/slug="([^"]*)"/);
                if (slugM) slug = slugM[1];
            }
        }

        // Fallback slug from the bare alternate link (no type attribute).
        if (!slug) {
            const linkRe = /<link\b([^>]*)\/?>/g;
            let lm: RegExpExecArray | null;
            while ((lm = linkRe.exec(e)) !== null) {
                const a = lm[1];
                if (/rel="alternate"/.test(a) && !/type=/.test(a)) {
                    const href = a.match(/href="([^"]*)"/);
                    if (href && href[1].startsWith(`${TNA_BASE}/`)) {
                        slug = href[1].slice(TNA_BASE.length + 1).replace(/\/+$/, "");
                        break;
                    }
                }
            }
        }

        const courtM = e.match(/<author>[\s\S]*?<name>([\s\S]*?)<\/name>/);
        const court = courtM ? decodeEntities(courtM[1]) : null;

        const pubM = e.match(/<published>([\s\S]*?)<\/published>/);
        const date = pubM ? pubM[1].trim().slice(0, 10) : null;

        const url = slug ? `${TNA_BASE}/${slug}` : null;

        hits.push({ neutralCitation, title, court, date, slug, url });
    }
    return { hits, total };
}

async function fetchAtom(params: Record<string, string>, signal?: AbortSignal): Promise<Response> {
    const qs = new URLSearchParams(params).toString();
    return fetch(`${TNA_BASE}/atom.xml?${qs}`, {
        headers: { "User-Agent": USER_AGENT, Accept: "application/atom+xml,application/xml" },
        signal,
        // Cache at the platform edge where supported; harmless elsewhere.
        cache: "no-store",
    });
}

function statusForResponse(code: number): { status: LookupStatus; detail: string } {
    if (code === 404) return { status: "not_found", detail: "Find Case Law returned 404." };
    if (code === 429) return { status: "upstream_unavailable", detail: "Find Case Law rate limit hit — retry shortly." };
    if (code >= 500) return { status: "upstream_unavailable", detail: `Find Case Law returned ${code} — try again later.` };
    if (code >= 400) return { status: "error", detail: `Find Case Law rejected the request (${code}).` };
    return { status: "ok", detail: "" };
}

export interface SearchOptions {
    query: string;
    /** Court slug filter, e.g. "eat", "uksc", "ewca/civ". Defaults to none. */
    court?: string;
    party?: string;
    limit?: number;
    page?: number;
    timeoutMs?: number;
}

/**
 * Search UK case law live. Returns a structured envelope: callers distinguish
 * ok / empty / not_found / upstream_* / error and must surface `status`, never
 * fabricate results when status !== "ok".
 */
export async function searchCaseLaw(opts: SearchOptions): Promise<SearchEnvelope> {
    const limit = Math.min(Math.max(opts.limit ?? 10, 1), 50);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), opts.timeoutMs ?? DEFAULT_TIMEOUT_MS);
    try {
        const params: Record<string, string> = { query: opts.query, page: String(opts.page ?? 1) };
        if (opts.court) params.court = opts.court;
        if (opts.party) params.party = opts.party;

        const resp = await fetchAtom(params, controller.signal);
        if (!resp.ok) {
            const { status, detail } = statusForResponse(resp.status);
            return { status, results: [], detail };
        }
        const xml = await resp.text();
        const { hits, total } = parseAtomFeed(xml, limit);
        if (hits.length === 0) {
            return { status: "empty", results: [], detail: "No matching judgments in Find Case Law (coverage is ~2003 onward).", total };
        }
        return { status: "ok", results: hits, total };
    } catch (err) {
        if (err instanceof Error && err.name === "AbortError") {
            return { status: "upstream_timeout", results: [], detail: "Find Case Law timed out — it may be slow; retry." };
        }
        return { status: "upstream_unavailable", results: [], detail: "Could not reach Find Case Law." };
    } finally {
        clearTimeout(timer);
    }
}

// Small in-memory cache so repeated verification of the same citation within a
// session does not re-hit the upstream (mirrors the MCP's 1-hour response cache).
const verifyCache = new Map<string, { at: number; result: VerifyResult }>();
const VERIFY_TTL_MS = 60 * 60 * 1000;

/**
 * Double-check a single authority against Find Case Law.
 *
 * Pass the citation string and/or the case name as they appear in AI output.
 * Returns VERIFIED only on an exact neutral-citation match in the archive;
 * CHECK when the case name is found but the citation is not confirmed;
 * QUARANTINED when nothing matches. If the upstream is unreachable the trust
 * level is QUARANTINED with source "unavailable" — caller may fall back to the
 * curated known-good list rather than treating the claim as verified.
 */
export async function verifyCitation(input: { citation?: string; caseName?: string }): Promise<VerifyResult> {
    const citation = input.citation?.trim() ?? "";
    const caseName = input.caseName?.trim() ?? "";
    const ncn = extractNeutralCitation(citation) ?? extractNeutralCitation(caseName);
    const cacheKey = `${ncn ?? ""}|${caseName.toLowerCase()}`;

    const cached = verifyCache.get(cacheKey);
    if (cached && Date.now() - cached.at < VERIFY_TTL_MS) return cached.result;

    // Query by the strongest signal available: the neutral citation, else the name.
    const query = ncn ?? caseName ?? citation;
    if (!query) {
        return { trustLevel: "QUARANTINED", reason: "No citation or case name to verify.", source: "find_case_law" };
    }

    const env = await searchCaseLaw({ query, limit: 10 });

    if (env.status === "upstream_timeout" || env.status === "upstream_unavailable" || env.status === "error") {
        return { trustLevel: "QUARANTINED", reason: `Live verification unavailable (${env.detail ?? env.status}).`, source: "unavailable" };
    }
    if (env.status === "empty" || env.status === "not_found" || env.results.length === 0) {
        const result: VerifyResult = {
            trustLevel: "QUARANTINED",
            reason: ncn
                ? `Neutral citation ${ncn} not found in Find Case Law (note: coverage is ~2003 onward).`
                : `No Find Case Law match for "${caseName || citation}".`,
            source: "find_case_law",
        };
        verifyCache.set(cacheKey, { at: Date.now(), result });
        return result;
    }

    // Exact neutral-citation match → VERIFIED.
    if (ncn) {
        const wanted = normaliseCitation(ncn);
        const exact = env.results.find((h) => h.neutralCitation && normaliseCitation(h.neutralCitation) === wanted);
        if (exact) {
            const result: VerifyResult = {
                trustLevel: "VERIFIED",
                reason: `Exact neutral-citation match in Find Case Law: ${exact.neutralCitation} — ${exact.title}.`,
                source: "find_case_law",
                matchedTitle: exact.title,
                matchedCitation: exact.neutralCitation ?? undefined,
                slug: exact.slug ?? undefined,
                url: exact.url ?? undefined,
            };
            verifyCache.set(cacheKey, { at: Date.now(), result });
            return result;
        }
    }

    // Case-name match but citation not confirmed → CHECK (a nearby candidate).
    const nameKey = caseName.toLowerCase();
    const nameHit =
        (nameKey &&
            env.results.find((h) => {
                const t = h.title.toLowerCase();
                return nameKey.split(/\s+v\.?\s+/).every((part) => part.length > 2 && t.includes(part));
            })) ||
        env.results[0];

    const result: VerifyResult = {
        trustLevel: "CHECK",
        reason: ncn
            ? `Citation ${ncn} not confirmed, but a related judgment exists: ${nameHit.neutralCitation ?? nameHit.title}. Verify manually.`
            : `Possible match in Find Case Law: ${nameHit.neutralCitation ?? nameHit.title}. Citation not independently confirmed.`,
        source: "find_case_law",
        matchedTitle: nameHit.title,
        matchedCitation: nameHit.neutralCitation ?? undefined,
        slug: nameHit.slug ?? undefined,
        url: nameHit.url ?? undefined,
    };
    verifyCache.set(cacheKey, { at: Date.now(), result });
    return result;
}

/** Test-only: clear the verification cache. */
export function _clearVerifyCache(): void {
    verifyCache.clear();
}

export interface JudgmentMarkdown {
    slug: string;
    status: import("./pdf-to-markdown").PdfStatus;
    markdown?: string;
    pages?: number;
    sourceUrl: string;
    detail?: string;
}

/**
 * Fetch a found judgment as Markdown (TNA serves the PDF at /<slug>/data.pdf),
 * so the engine can read the full judgment as clean Markdown before reasoning
 * over it — rather than feeding raw PDF bytes to the model. Never throws.
 */
export async function getJudgmentMarkdown(slug: string): Promise<JudgmentMarkdown> {
    const clean = slug.replace(/^\/+|\/+$/g, "");
    const sourceUrl = `${TNA_BASE}/${clean}/data.pdf`;
    if (!clean) {
        return { slug, status: "error", sourceUrl, detail: "Empty judgment slug." };
    }
    const { fetchPdfAsMarkdown } = await import("./pdf-to-markdown");
    const res = await fetchPdfAsMarkdown(sourceUrl);
    return {
        slug: clean,
        status: res.status,
        markdown: res.markdown,
        pages: res.pages,
        sourceUrl,
        detail: res.detail,
    };
}
