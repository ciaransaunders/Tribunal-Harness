import { describe, it, expect } from "vitest";
import {
    ERA_2025_TRACKER,
    TIME_LIMIT_CONFIG,
    CLAIM_TYPES,
    formatCommencementDate,
    formatCommencementMonth,
} from "./constants";

// ---------------------------------------------------------------------------
// ERA_2025_TRACKER — single source of truth for the implementation tracker
// ---------------------------------------------------------------------------
describe("ERA_2025_TRACKER", () => {
    it("has unique, non-empty keys", () => {
        const keys = ERA_2025_TRACKER.map((entry) => entry.key);
        for (const key of keys) {
            expect(typeof key).toBe("string");
            expect(key.length).toBeGreaterThan(0);
        }
        expect(new Set(keys).size).toBe(keys.length);
    });

    it("each entry has a non-empty commencement string", () => {
        for (const entry of ERA_2025_TRACKER) {
            expect(typeof entry.commencement).toBe("string");
            expect(entry.commencement.length).toBeGreaterThan(0);
        }
    });

    it("each entry status is one of in_force | upcoming | awaiting_si", () => {
        const allowed = new Set(["in_force", "upcoming", "awaiting_si"]);
        for (const entry of ERA_2025_TRACKER) {
            expect(allowed.has(entry.status)).toBe(true);
        }
    });

    it("each entry has non-empty provision text", () => {
        for (const entry of ERA_2025_TRACKER) {
            expect(typeof entry.provision).toBe("string");
            expect(entry.provision.length).toBeGreaterThan(0);
        }
    });
});

// ---------------------------------------------------------------------------
// Date formatting helpers — must be UTC-stable regardless of the runner's TZ
// ---------------------------------------------------------------------------
describe("formatCommencementDate", () => {
    it("renders a full GB date", () => {
        expect(formatCommencementDate("2027-01-01")).toBe("1 January 2027");
    });

    it("is UTC-stable for an October date", () => {
        expect(formatCommencementDate("2026-10-01")).toBe("1 October 2026");
    });
});

describe("formatCommencementMonth", () => {
    it("renders month and year only", () => {
        expect(formatCommencementMonth("2026-10-01")).toBe("October 2026");
    });

    it("is UTC-stable for a January date", () => {
        expect(formatCommencementMonth("2027-01-01")).toBe("January 2027");
    });
});

// ---------------------------------------------------------------------------
// TIME_LIMIT_CONFIG
// ---------------------------------------------------------------------------
describe("TIME_LIMIT_CONFIG", () => {
    it("has a defined COMMENCEMENT_DATE", () => {
        expect(TIME_LIMIT_CONFIG.COMMENCEMENT_DATE).toBeDefined();
        expect(typeof TIME_LIMIT_CONFIG.COMMENCEMENT_DATE).toBe("string");
        expect(TIME_LIMIT_CONFIG.COMMENCEMENT_DATE.length).toBeGreaterThan(0);
    });
});

// ---------------------------------------------------------------------------
// CLAIM_TYPES — exactly 10 with unique ids
// ---------------------------------------------------------------------------
describe("CLAIM_TYPES", () => {
    it("has exactly 10 entries", () => {
        expect(CLAIM_TYPES.length).toBe(10);
    });

    it("has unique ids", () => {
        const ids = CLAIM_TYPES.map((ct) => ct.id);
        expect(new Set(ids).size).toBe(ids.length);
    });

    it("every entry has a non-empty id and label", () => {
        for (const ct of CLAIM_TYPES) {
            expect(typeof ct.id).toBe("string");
            expect(ct.id.length).toBeGreaterThan(0);
            expect(typeof ct.label).toBe("string");
            expect(ct.label.length).toBeGreaterThan(0);
        }
    });
});
