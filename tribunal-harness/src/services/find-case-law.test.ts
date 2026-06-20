import { describe, it, expect, vi, afterEach } from "vitest";
import {
    parseAtomFeed,
    normaliseCitation,
    extractNeutralCitation,
    searchCaseLaw,
    verifyCitation,
    _clearVerifyCache,
} from "./find-case-law";

// A 2-entry Atom feed in the real TNA structure (slug attr + ukncn text,
// author/name = court, published = date). Used to keep tests offline.
const FEED = `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom" xmlns:tna="https://caselaw.nationalarchives.gov.uk">
<entry><title>Essop &amp; Ors v Home Office (UK Border Agency)</title><link href="https://caselaw.nationalarchives.gov.uk/uksc/2017/27" rel="alternate"/><published>2017-04-05T00:00:00+00:00</published><updated>2017-04-05T00:00:00+00:00</updated><author><name>United Kingdom Supreme Court</name></author><tna:identifier slug="uksc/2017/27" type="ukncn">[2017] UKSC 27</tna:identifier></entry>
<entry><title>G Laffy v Wkcic Group T/A Capital City College Group</title><link href="https://caselaw.nationalarchives.gov.uk/eat/2026/90" rel="alternate"/><published>2026-06-19T00:00:00+00:00</published><updated>2026-06-19T09:37:47+00:00</updated><author><name>Employment Appeal Tribunal</name></author><tna:identifier slug="eat/2026/90" type="ukncn">[2026] EAT 90</tna:identifier></entry>
</feed>`;

const EMPTY_FEED = `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom" xmlns:tna="https://caselaw.nationalarchives.gov.uk"></feed>`;

function mockFetchOk(body: string) {
    return vi.fn(async () => ({ ok: true, status: 200, text: async () => body }) as unknown as Response);
}
function mockFetchStatus(status: number) {
    return vi.fn(async () => ({ ok: false, status, text: async () => "" }) as unknown as Response);
}
function mockFetchAbort() {
    return vi.fn(async () => {
        throw Object.assign(new Error("aborted"), { name: "AbortError" });
    });
}

afterEach(() => {
    vi.unstubAllGlobals();
    _clearVerifyCache();
});

describe("parseAtomFeed", () => {
    it("extracts neutral citation, slug, court, date, url, title (entity-decoded)", () => {
        const { hits } = parseAtomFeed(FEED, 10);
        expect(hits.length).toBe(2);
        const essop = hits[0];
        expect(essop.neutralCitation).toBe("[2017] UKSC 27");
        expect(essop.slug).toBe("uksc/2017/27");
        expect(essop.court).toBe("United Kingdom Supreme Court");
        expect(essop.date).toBe("2017-04-05");
        expect(essop.url).toBe("https://caselaw.nationalarchives.gov.uk/uksc/2017/27");
        expect(essop.title).toContain("Essop & Ors v Home Office"); // &amp; decoded
        expect(hits[1].neutralCitation).toBe("[2026] EAT 90");
        expect(hits[1].court).toBe("Employment Appeal Tribunal");
    });

    it("respects the limit", () => {
        expect(parseAtomFeed(FEED, 1).hits.length).toBe(1);
    });

    it("returns no hits for an empty feed", () => {
        expect(parseAtomFeed(EMPTY_FEED, 10).hits.length).toBe(0);
    });
});

describe("extractNeutralCitation / normaliseCitation", () => {
    it("pulls a neutral citation out of free text", () => {
        expect(extractNeutralCitation("see Essop v Home Office [2017] UKSC 27 at [25]")).toBe("[2017] UKSC 27");
        expect(extractNeutralCitation("[2009] EWCA Civ 1202")).toBe("[2009] EWCA Civ 1202");
        expect(extractNeutralCitation("no citation here")).toBeNull();
    });
    it("normalises for comparison", () => {
        expect(normaliseCitation("[2017] UKSC 27")).toBe(normaliseCitation("[2017]  uksc 27"));
    });
});

describe("searchCaseLaw (mocked fetch)", () => {
    it("returns ok with parsed results", async () => {
        vi.stubGlobal("fetch", mockFetchOk(FEED));
        const env = await searchCaseLaw({ query: "unfair dismissal", court: "eat" });
        expect(env.status).toBe("ok");
        expect(env.results.length).toBe(2);
    });
    it("returns empty (not error) when the feed has no entries", async () => {
        vi.stubGlobal("fetch", mockFetchOk(EMPTY_FEED));
        const env = await searchCaseLaw({ query: "zzzz no match" });
        expect(env.status).toBe("empty");
        expect(env.results).toEqual([]);
    });
    it("maps 5xx to upstream_unavailable", async () => {
        vi.stubGlobal("fetch", mockFetchStatus(503));
        const env = await searchCaseLaw({ query: "x" });
        expect(env.status).toBe("upstream_unavailable");
    });
    it("maps abort/timeout to upstream_timeout", async () => {
        vi.stubGlobal("fetch", mockFetchAbort());
        const env = await searchCaseLaw({ query: "x" });
        expect(env.status).toBe("upstream_timeout");
    });
});

describe("verifyCitation (mocked fetch) — the double-check", () => {
    it("VERIFIED on exact neutral-citation match", async () => {
        vi.stubGlobal("fetch", mockFetchOk(FEED));
        const r = await verifyCitation({ citation: "[2017] UKSC 27", caseName: "Essop v Home Office" });
        expect(r.trustLevel).toBe("VERIFIED");
        expect(r.source).toBe("find_case_law");
        expect(r.matchedCitation).toBe("[2017] UKSC 27");
        expect(r.url).toContain("uksc/2017/27");
    });
    it("CHECK when the case name matches but the citation does not", async () => {
        vi.stubGlobal("fetch", mockFetchOk(FEED));
        const r = await verifyCitation({ citation: "[2017] UKSC 999", caseName: "Essop v Home Office" });
        expect(r.trustLevel).toBe("CHECK");
        expect(r.source).toBe("find_case_law");
    });
    it("QUARANTINED when nothing matches (empty feed)", async () => {
        vi.stubGlobal("fetch", mockFetchOk(EMPTY_FEED));
        const r = await verifyCitation({ citation: "[1801] FAKE 1", caseName: "Madeup v Nobody" });
        expect(r.trustLevel).toBe("QUARANTINED");
        expect(r.source).toBe("find_case_law");
    });
    it("source 'unavailable' (not falsely verified) when upstream is down", async () => {
        vi.stubGlobal("fetch", mockFetchAbort());
        const r = await verifyCitation({ citation: "[2017] UKSC 27", caseName: "Essop v Home Office" });
        expect(r.source).toBe("unavailable");
        expect(r.trustLevel).toBe("QUARANTINED");
    });
});

// Gated live smoke test — only runs with RUN_LIVE_CASELAW=1 (hits the real TNA API).
describe.skipIf(!process.env.RUN_LIVE_CASELAW)("LIVE Find Case Law", () => {
    it("finds real EAT judgments", async () => {
        const env = await searchCaseLaw({ query: "unfair dismissal", court: "eat", limit: 3 });
        expect(env.status).toBe("ok");
        expect(env.results[0].neutralCitation).toMatch(/\[\d{4}\]\s+EAT\s+\d+/);
    });
});
