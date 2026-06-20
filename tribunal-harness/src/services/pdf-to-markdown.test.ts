import { describe, it, expect, vi, afterEach } from "vitest";
import {
    tidyToMarkdown,
    looksLikePdf,
    isAllowedPdfUrl,
    pdfBufferToMarkdown,
    fetchPdfAsMarkdown,
} from "./pdf-to-markdown";

// Mock pdf-parse so tests are deterministic and offline.
vi.mock("pdf-parse", () => ({
    default: vi.fn(async () => ({ text: "Para one.\n\n\nPara two.   \nWrapped line.", numpages: 2 })),
}));

function pdfBuffer(extra = "test content"): Buffer {
    return Buffer.from(`%PDF-1.4 ${extra}`, "latin1");
}
function okFetch(buf: Buffer, contentLength?: string) {
    return vi.fn(async () => ({
        ok: true,
        status: 200,
        headers: { get: (k: string) => (k.toLowerCase() === "content-length" ? contentLength ?? null : null) },
        arrayBuffer: async () => buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength),
    }) as unknown as Response);
}

afterEach(() => vi.unstubAllGlobals());

describe("pure helpers", () => {
    it("tidyToMarkdown collapses blank runs and trailing spaces", () => {
        expect(tidyToMarkdown("a\r\n\n\n\nb   \n")).toBe("a\n\nb");
    });
    it("looksLikePdf checks the %PDF- header", () => {
        expect(looksLikePdf(Buffer.from("%PDF-1.7"))).toBe(true);
        expect(looksLikePdf(Buffer.from("not a pdf"))).toBe(false);
    });
    it("isAllowedPdfUrl enforces https + host allowlist (SSRF guard)", () => {
        expect(isAllowedPdfUrl("https://caselaw.nationalarchives.gov.uk/eat/2026/90/data.pdf")).toBe(true);
        expect(isAllowedPdfUrl("https://www.bailii.org/x.pdf")).toBe(true);
        expect(isAllowedPdfUrl("http://caselaw.nationalarchives.gov.uk/x.pdf")).toBe(false); // not https
        expect(isAllowedPdfUrl("https://evil.example.com/x.pdf")).toBe(false); // not allowlisted
        expect(isAllowedPdfUrl("https://169.254.169.254/latest/meta-data")).toBe(false); // SSRF target
        expect(isAllowedPdfUrl("not a url")).toBe(false);
    });
});

describe("pdfBufferToMarkdown", () => {
    it("returns ok markdown for a valid PDF buffer", async () => {
        const r = await pdfBufferToMarkdown(pdfBuffer());
        expect(r.status).toBe("ok");
        expect(r.markdown).toContain("Para one.");
        expect(r.markdown).not.toMatch(/\n{3,}/); // tidied
        expect(r.pages).toBe(2);
    });
    it("rejects an empty buffer", async () => {
        expect((await pdfBufferToMarkdown(Buffer.alloc(0))).status).toBe("empty");
    });
    it("rejects a non-PDF buffer", async () => {
        expect((await pdfBufferToMarkdown(Buffer.from("hello"))).status).toBe("not_pdf");
    });
});

describe("fetchPdfAsMarkdown (SSRF-guarded)", () => {
    it("refuses a non-allowlisted host without any network call", async () => {
        const spy = vi.fn();
        vi.stubGlobal("fetch", spy);
        const r = await fetchPdfAsMarkdown("https://evil.example.com/x.pdf");
        expect(r.status).toBe("forbidden_host");
        expect(spy).not.toHaveBeenCalled();
    });
    it("refuses plain http on an allowlisted host", async () => {
        const r = await fetchPdfAsMarkdown("http://www.bailii.org/x.pdf");
        expect(r.status).toBe("forbidden_host");
    });
    it("converts an allowlisted PDF to markdown", async () => {
        vi.stubGlobal("fetch", okFetch(pdfBuffer()));
        const r = await fetchPdfAsMarkdown("https://caselaw.nationalarchives.gov.uk/eat/2026/90/data.pdf");
        expect(r.status).toBe("ok");
        expect(r.markdown).toContain("Para two.");
        expect(r.sourceUrl).toContain("data.pdf");
    });
    it("maps a 5xx to upstream_unavailable", async () => {
        vi.stubGlobal("fetch", vi.fn(async () => ({ ok: false, status: 503, headers: { get: () => null } }) as unknown as Response));
        const r = await fetchPdfAsMarkdown("https://www.legislation.gov.uk/x.pdf");
        expect(r.status).toBe("upstream_unavailable");
    });
    it("rejects oversized PDFs via content-length", async () => {
        vi.stubGlobal("fetch", okFetch(pdfBuffer(), String(99 * 1024 * 1024)));
        const r = await fetchPdfAsMarkdown("https://www.gov.uk/big.pdf");
        expect(r.status).toBe("too_large");
    });
});

describe.skipIf(!process.env.RUN_LIVE_CASELAW)("LIVE PDF fetch", () => {
    it("converts a real TNA judgment PDF to markdown", async () => {
        const r = await fetchPdfAsMarkdown("https://caselaw.nationalarchives.gov.uk/eat/2023/1/data.pdf");
        expect(["ok", "empty"]).toContain(r.status);
    });
});
