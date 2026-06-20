import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("pdf-parse", () => ({
    default: vi.fn(async () => ({ text: "Judgment paragraph one.\n\nParagraph two.", numpages: 1 })),
}));

function makeGet(url: string): NextRequest {
    return new NextRequest(url, { method: "GET" });
}

describe("GET /api/case-law/judgment", () => {
    let GET: (req: NextRequest) => Promise<Response>;
    beforeEach(async () => {
        const mod = await import("./route");
        GET = mod.GET;
    });
    afterEach(() => vi.unstubAllGlobals());

    it("returns 400 when slug is missing", async () => {
        const res = await GET(makeGet("http://localhost:3000/api/case-law/judgment"));
        expect(res.status).toBe(400);
        const json = await res.json();
        expect(json.error).toBeDefined();
    });

    it("returns judgment markdown for a slug (mocked fetch + pdf-parse)", async () => {
        vi.stubGlobal(
            "fetch",
            vi.fn(async () => ({
                ok: true,
                status: 200,
                headers: { get: () => null },
                arrayBuffer: async () => {
                    const b = Buffer.from("%PDF-1.4 x", "latin1");
                    return b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength);
                },
            }) as unknown as Response)
        );
        const res = await GET(makeGet("http://localhost:3000/api/case-law/judgment?slug=eat/2026/90"));
        expect(res.status).toBe(200);
        const json = await res.json();
        expect(json.slug).toBe("eat/2026/90");
        expect(json.status).toBe("ok");
        expect(json.markdown).toContain("Judgment paragraph one.");
        expect(json.sourceUrl).toContain("eat/2026/90/data.pdf");
    });
});
