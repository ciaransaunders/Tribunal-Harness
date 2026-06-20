import { describe, it, expect } from "vitest";
import {
    VERIFIED_AUTHORITIES,
    findAuthorityByShortName,
    findAuthorityByPartialMatch,
} from "./verified-authorities";

// ---------------------------------------------------------------------------
// VERIFIED_AUTHORITIES — curated known-good case law database
// ---------------------------------------------------------------------------
describe("VERIFIED_AUTHORITIES", () => {
    it("has no duplicate shortName", () => {
        const names = VERIFIED_AUTHORITIES.map((a) => a.shortName);
        expect(new Set(names).size).toBe(names.length);
    });

    it("every authority has a non-empty citation (neutralCitation)", () => {
        for (const auth of VERIFIED_AUTHORITIES) {
            expect(typeof auth.neutralCitation).toBe("string");
            expect(auth.neutralCitation.trim().length).toBeGreaterThan(0);
        }
    });

    it("every authority has at least one claimType", () => {
        for (const auth of VERIFIED_AUTHORITIES) {
            expect(Array.isArray(auth.claimTypes)).toBe(true);
            expect(auth.claimTypes.length).toBeGreaterThanOrEqual(1);
        }
    });

    it("every authority has a non-empty shortName, fullName and principle", () => {
        for (const auth of VERIFIED_AUTHORITIES) {
            expect(auth.shortName.trim().length).toBeGreaterThan(0);
            expect(auth.fullName.trim().length).toBeGreaterThan(0);
            expect(auth.principle.trim().length).toBeGreaterThan(0);
        }
    });
});

// ---------------------------------------------------------------------------
// findAuthorityByShortName — case-insensitive exact lookup
// ---------------------------------------------------------------------------
describe("findAuthorityByShortName", () => {
    it("finds an authority by its exact shortName", () => {
        const result = findAuthorityByShortName("Polkey");
        expect(result).toBeDefined();
        expect(result?.shortName).toBe("Polkey");
    });

    it("is case-insensitive", () => {
        const lower = findAuthorityByShortName("polkey");
        const upper = findAuthorityByShortName("POLKEY");
        expect(lower).toBeDefined();
        expect(lower?.shortName).toBe("Polkey");
        expect(upper).toBe(lower);
    });

    it("returns undefined for an unknown name", () => {
        expect(findAuthorityByShortName("Nonexistent Case Name")).toBeUndefined();
    });
});

// ---------------------------------------------------------------------------
// findAuthorityByPartialMatch — substring match against shortName or fullName
// ---------------------------------------------------------------------------
describe("findAuthorityByPartialMatch", () => {
    it("matches when the text contains a known shortName", () => {
        const result = findAuthorityByPartialMatch(
            "The tribunal relied on Polkey in its reasoning."
        );
        expect(result).toBeDefined();
        expect(result?.shortName).toBe("Polkey");
    });

    it("matches when the text contains a known fullName", () => {
        const result = findAuthorityByPartialMatch(
            "See Polkey v AE Dayton Services Ltd for the principle."
        );
        expect(result).toBeDefined();
        expect(result?.shortName).toBe("Polkey");
    });

    it("is case-insensitive", () => {
        const result = findAuthorityByPartialMatch("the polkey principle");
        expect(result).toBeDefined();
        expect(result?.shortName).toBe("Polkey");
    });

    it("returns undefined when no authority name appears in the text", () => {
        expect(
            findAuthorityByPartialMatch("This text mentions no known case.")
        ).toBeUndefined();
    });
});
