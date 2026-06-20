import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";

const FEED = `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom" xmlns:tna="https://caselaw.nationalarchives.gov.uk">
<entry><title>Essop v Home Office</title><link href="https://caselaw.nationalarchives.gov.uk/uksc/2017/27" rel="alternate"/><published>2017-04-05T00:00:00+00:00</published><updated>2017-04-05T00:00:00+00:00</updated><author><name>United Kingdom Supreme Court</name></author><tna:identifier slug="uksc/2017/27" type="ukncn">[2017] UKSC 27</tna:identifier></entry>
</feed>`;

function makeGet(url: string): NextRequest {
    return new NextRequest(url, { method: "GET" });
}

describe("GET /api/case-law/find", () => {
    let GET: (req: NextRequest) => Promise<Response>;
    beforeEach(async () => {
        const mod = await import("./route");
        GET = mod.GET;
    });
    afterEach(() => vi.unstubAllGlobals());

    it("returns 400 when q is missing (no network needed)", async () => {
        const res = await GET(makeGet("http://localhost:3000/api/case-law/find"));
        expect(res.status).toBe(400);
        const json = await res.json();
        expect(json.error).toBeDefined();
    });

    it("returns the live envelope (status ok) for a query", async () => {
        vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, status: 200, text: async () => FEED }) as unknown as Response));
        const res = await GET(makeGet("http://localhost:3000/api/case-law/find?q=unfair%20dismissal&court=eat"));
        expect(res.status).toBe(200);
        const json = await res.json();
        expect(json.status).toBe("ok");
        expect(json.results[0].neutralCitation).toBe("[2017] UKSC 27");
    });

    it("surfaces upstream failure as a structured envelope, not a 500", async () => {
        vi.stubGlobal("fetch", vi.fn(async () => ({ ok: false, status: 503, text: async () => "" }) as unknown as Response));
        const res = await GET(makeGet("http://localhost:3000/api/case-law/find?q=x"));
        expect(res.status).toBe(200);
        const json = await res.json();
        expect(json.status).toBe("upstream_unavailable");
        expect(json.results).toEqual([]);
    });
});
