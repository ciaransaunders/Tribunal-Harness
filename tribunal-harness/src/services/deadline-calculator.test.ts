/**
 * Deadline Calculator — Unit Tests
 *
 * Tests the statutory "N months less 1 day" calculation, ACAS clock-stopping,
 * bank holiday extension, and regime selection.
 *
 * Run: npm test
 */

import { describe, it, expect } from "vitest";
import {
    addMonthsLessOneDay,
    calculateDeadline,
    calculateDeadlines,
} from "@/services/deadline-calculator";

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------
function parseUTC(iso: string): Date {
    const [y, m, d] = iso.split("-").map(Number);
    return new Date(Date.UTC(y, m - 1, d));
}

function iso(d: Date): string {
    const y = d.getUTCFullYear();
    const m = String(d.getUTCMonth() + 1).padStart(2, "0");
    const day = String(d.getUTCDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
}

// ---------------------------------------------------------------------------
// addMonthsLessOneDay — core statutory arithmetic
// ---------------------------------------------------------------------------
describe("addMonthsLessOneDay", () => {
    it("standard case: act on 15 Jan, 3 months less 1 day = 14 Apr", () => {
        const result = addMonthsLessOneDay(parseUTC("2025-01-15"), 3);
        expect(iso(result)).toBe("2025-04-14");
    });

    it("standard case: act on 15 Jan, 6 months less 1 day = 14 Jul", () => {
        const result = addMonthsLessOneDay(parseUTC("2025-01-15"), 6);
        expect(iso(result)).toBe("2025-07-14");
    });

    it("month-end: act on 31 Jan, 3 months less 1 day = 29 Apr (April has 30 days)", () => {
        // 31 Jan + 3 months → clamp to 30 Apr (April has 30 days) → less 1 = 29 Apr
        const result = addMonthsLessOneDay(parseUTC("2025-01-31"), 3);
        expect(iso(result)).toBe("2025-04-29");
    });

    it("month-end: act on 31 Oct, 3 months less 1 day = 30 Jan", () => {
        // 31 Oct + 3 months → 31 Jan → less 1 = 30 Jan
        const result = addMonthsLessOneDay(parseUTC("2025-10-31"), 3);
        expect(iso(result)).toBe("2026-01-30");
    });

    it("month-end: act on 30 Nov, 3 months less 1 day = 27 Feb (non-leap year)", () => {
        // 30 Nov + 3 months → clamp to 28 Feb (Feb 2026 has 28 days) → less 1 = 27 Feb
        const result = addMonthsLessOneDay(parseUTC("2025-11-30"), 3);
        expect(iso(result)).toBe("2026-02-27");
    });

    it("month-end: act on 28 Feb, 3 months less 1 day = 27 May", () => {
        // 28 Feb + 3 months → 28 May → less 1 = 27 May
        const result = addMonthsLessOneDay(parseUTC("2025-02-28"), 3);
        expect(iso(result)).toBe("2025-05-27");
    });

    it("year boundary: act on 15 Nov, 3 months less 1 day = 14 Feb", () => {
        const result = addMonthsLessOneDay(parseUTC("2025-11-15"), 3);
        expect(iso(result)).toBe("2026-02-14");
    });

    it("6-month regime: act on 31 Aug, 6 months less 1 day = 27 Feb (non-leap)", () => {
        // 31 Aug + 6 months → clamp to 28 Feb (Feb 2026 has 28 days) → less 1 = 27 Feb
        const result = addMonthsLessOneDay(parseUTC("2025-08-31"), 6);
        expect(iso(result)).toBe("2026-02-27");
    });

    it("day 1 of month: act on 1 Jun, 3 months less 1 day = 31 Aug", () => {
        // 1 Jun + 3 months → 1 Sep → less 1 = 31 Aug
        const result = addMonthsLessOneDay(parseUTC("2025-06-01"), 3);
        expect(iso(result)).toBe("2025-08-31");
    });
});

// ---------------------------------------------------------------------------
// Regime selection — pre vs post ERA 2025
// ---------------------------------------------------------------------------
describe("calculateDeadline — regime selection", () => {
    it("act before Oct 2026 uses pre-ERA 2025 regime (3 months)", () => {
        const result = calculateDeadline("2025-06-01");
        expect(result.regime).toBe("pre_era_2025");
        // 1 Jun + 3 months less 1 day = 31 Aug (Sunday) → extended to 1 Sep (Monday)
        expect(result.original_deadline).toBe("2025-09-01");
    });

    it("act on or after Oct 2026 uses post-ERA 2025 regime (6 months)", () => {
        const result = calculateDeadline("2026-10-15");
        expect(result.regime).toBe("post_era_2025");
        // 15 Oct + 6 months less 1 day = 14 Apr 2027 (Wednesday)
        expect(result.original_deadline).toBe("2027-04-14");
    });

    it("act on exact commencement date (2026-10-01) uses post-ERA 2025", () => {
        const result = calculateDeadline("2026-10-01");
        expect(result.regime).toBe("post_era_2025");
    });

    it("act one day before commencement (2026-09-30) uses pre-ERA 2025", () => {
        const result = calculateDeadline("2026-09-30");
        expect(result.regime).toBe("pre_era_2025");
    });
});

// ---------------------------------------------------------------------------
// ACAS clock-stopping (s207B ERA 1996)
// ---------------------------------------------------------------------------
describe("calculateDeadline — ACAS clock-stopping", () => {
    it("extends deadline by the number of days the clock was stopped", () => {
        // Act: 1 Jan 2025. Base deadline: 31 Mar 2025 (3 months less 1 day)
        // Day A: 1 Feb 2025 (clock stops). Days remaining at Day A: 58 days (1 Feb → 31 Mar)
        // Day B: 15 Feb 2025. Extended deadline: 15 Feb + 58 days = 14 Apr 2025
        // One month from Day B: 15 Mar 2025
        // Claimant gets longer: 14 Apr 2025
        const result = calculateDeadline("2025-01-01", "2025-02-01", "2025-02-15");
        expect(result.acas_extended_deadline).toBeDefined();
        // Extended deadline should be after the base deadline
        expect(result.acas_extended_deadline! >= "2025-03-31").toBe(true);
    });

    it("uses minimum 1 month from Day B when remainder is very short", () => {
        // Act: 1 Jan 2025. Base deadline: 31 Mar 2025
        // Day A: 30 Mar 2025 (1 day remaining). Day B: 1 Apr 2025
        // Extended: 1 Apr + 1 day = 2 Apr. One month from Day B: 1 May.
        // Claimant gets 1 May (the longer)
        const result = calculateDeadline("2025-01-01", "2025-03-30", "2025-04-01");
        expect(result.acas_extended_deadline).toBeDefined();
        // Should be at least 1 month from Day B (May 2025)
        expect(result.acas_extended_deadline! >= "2025-05-01").toBe(true);
    });

    it("without ACAS dates, acas_extended_deadline is undefined", () => {
        const result = calculateDeadline("2025-01-01");
        expect(result.acas_extended_deadline).toBeUndefined();
    });

    it("handles Day A falling after the base deadline (remainder days is 0)", () => {
        // Act: 1 Jan 2025. Base deadline: 31 Mar 2025 (Monday)
        // Day A: 10 Apr 2025 (after base deadline)
        // Day B: 15 Apr 2025
        // remainderDays = max(0, 31 Mar - 10 Apr) = 0
        // Extended deadline = 15 Apr + 0 days = 15 Apr
        // One month from Day B = 15 May
        // Claimant gets 15 May (the longer)
        const result = calculateDeadline("2025-01-01", "2025-04-10", "2025-04-15");
        expect(result.acas_extended_deadline).toBe("2025-05-15");
    });

    it("handles inverted dates where Day A > Day B", () => {
        // Act: 1 Jan 2025. Base deadline: 31 Mar 2025 (Monday)
        // Day A: 15 Feb 2025 (44 days remaining to 31 Mar)
        // Day B: 1 Feb 2025 (invalid/inverted, but function should process it safely)
        // Extended deadline: 1 Feb + 44 days = 17 Mar 2025
        // One month from Day B = 1 Mar 2025
        // Claimant gets 17 Mar (the longer)
        const result = calculateDeadline("2025-01-01", "2025-02-15", "2025-02-01");
        expect(result.acas_extended_deadline).toBe("2025-03-17");
    });

    it("handles Day A == Day B (same day conciliation)", () => {
        // Act: 1 Jan 2025. Base deadline: 31 Mar 2025 (Monday)
        // Day A: 10 Feb 2025
        // Day B: 10 Feb 2025
        // remainderDays = 31 Mar - 10 Feb = 49 days
        // Extended deadline = 10 Feb + 49 days = 31 Mar 2025
        // One month from Day B = 10 Mar 2025
        // Claimant gets 31 Mar (the longer)
        const result = calculateDeadline("2025-01-01", "2025-02-10", "2025-02-10");
        expect(result.acas_extended_deadline).toBe("2025-03-31");
    });
});

// ---------------------------------------------------------------------------
// Bank holiday / weekend extension
// ---------------------------------------------------------------------------
describe("calculateDeadline — bank holiday extension", () => {
    it("deadline falling on Saturday is extended to Monday", () => {
        // Act: 2025-04-06 → 3 months less 1 day = 2025-07-05 (Saturday) → extend to 2025-07-07 (Monday)
        const result = calculateDeadline("2025-04-06");
        expect(result.original_deadline).toBe("2025-07-07");
    });

    it("deadline falling on Sunday is extended to Monday", () => {
        // Act: 2025-04-07 → 3 months less 1 day = 2025-07-06 (Sunday) → extend to 2025-07-07
        const result = calculateDeadline("2025-04-07");
        expect(result.original_deadline).toBe("2025-07-07");
    });

    it("deadline falling on a working day is not changed", () => {
        // Act: 2025-01-15 → 3 months less 1 day = 2025-04-14 (Monday)
        const result = calculateDeadline("2025-01-15");
        expect(result.original_deadline).toBe("2025-04-14");
    });
});

// ---------------------------------------------------------------------------
// calculateDeadlines — multi-claim and warnings
// ---------------------------------------------------------------------------
describe("calculateDeadlines", () => {
    it("returns correct regime for all claim types", () => {
        const result = calculateDeadlines("2025-06-01", [
            "unfair_dismissal",
            "direct_discrimination",
        ]);
        expect(result.time_limit_regime).toBe("pre_era_2025");
        expect(result.deadlines).toHaveLength(2);
        expect(result.deadlines[0].claim_type).toBe("unfair_dismissal");
        expect(result.deadlines[1].claim_type).toBe("direct_discrimination");
    });

    it("warns when near commencement date (within 30 days)", () => {
        const result = calculateDeadlines("2026-09-15", ["unfair_dismissal"]);
        expect(result.warnings.some((w) => w.includes("close to the ERA 2025"))).toBe(true);
    });

    it("warns when deadline is expired", () => {
        const result = calculateDeadlines("2020-01-01", ["unfair_dismissal"]);
        expect(result.warnings.some((w) => w.includes("expired"))).toBe(true);
    });

    it("warns about wrongful dismissal county court route", () => {
        const result = calculateDeadlines("2025-06-01", ["wrongful_dismissal"]);
        expect(result.warnings.some((w) => w.includes("county court"))).toBe(true);
    });

    it("does not warn about wrongful dismissal when not in claim types", () => {
        const result = calculateDeadlines("2025-06-01", ["unfair_dismissal"]);
        expect(result.warnings.some((w) => w.includes("county court"))).toBe(false);
    });

    it("returns is_expired=true for old dates", () => {
        const result = calculateDeadlines("2020-01-01", ["unfair_dismissal"]);
        expect(result.deadlines[0].is_expired).toBe(true);
    });
});
