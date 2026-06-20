import { TIME_LIMIT_CONFIG } from "@/lib/constants";
import type { DeadlineResult } from "@/schemas/types";

/**
 * Deadline Calculator — UK Employment Tribunal
 *
 * Applies the correct time limit regime based on ERA 2025. The commencement
 * date is read from TIME_LIMIT_CONFIG.COMMENCEMENT_DATE in constants.ts (the
 * single source of truth) — never hardcode it here:
 * - Before commencement: 3 months less 1 day from the act complained of
 * - On or after commencement: 6 months less 1 day (ERA 2025 amendment)
 *
 * ACAS early conciliation clock-stopping (s207B ERA 1996):
 * - Clock stops on Day A (EC notification to ACAS)
 * - Restarts on Day B (certificate issued)
 * - Extended deadline = Day B + (original deadline − Day A) in days
 * - Minimum: 1 calendar month from Day B
 * - Claimant gets whichever is longer
 *
 * Bank holidays: if the calculated deadline falls on a weekend or UK bank
 * holiday, it is extended to the next working day (standard tribunal practice).
 *
 * All date arithmetic uses UTC to avoid timezone-related off-by-one errors.
 *
 * Wrongful dismissal: follows the same ET time limit as other claims when
 * brought in the ET (capped at £25,000). County court route has 6-year limit.
 */

// ---------------------------------------------------------------------------
// UTC-safe date utilities
// ---------------------------------------------------------------------------

/**
 * Parse an ISO date string (YYYY-MM-DD) as a UTC date.
 * Avoids the timezone shift that occurs when using new Date("YYYY-MM-DD")
 * directly with local-time methods.
 */
function parseUTC(iso: string): Date {
    const [y, m, d] = iso.split("-").map(Number);
    return new Date(Date.UTC(y, m - 1, d));
}

function toISODate(d: Date): string {
    const y = d.getUTCFullYear();
    const m = String(d.getUTCMonth() + 1).padStart(2, "0");
    const day = String(d.getUTCDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
}

// ---------------------------------------------------------------------------
// UK Bank Holidays (England & Wales) — update annually
// Source: GOV.UK bank holidays API / statutory instruments
// ---------------------------------------------------------------------------
const UK_BANK_HOLIDAYS_EW = new Set([
    // 2025
    "2025-01-01", "2025-04-18", "2025-04-21", "2025-05-05",
    "2025-05-26", "2025-08-25", "2025-12-25", "2025-12-26",
    // 2026
    "2026-01-01", "2026-04-03", "2026-04-06", "2026-05-04",
    "2026-05-25", "2026-08-31", "2026-12-25", "2026-12-28",
    // 2027
    "2027-01-01", "2027-03-26", "2027-03-29", "2027-05-03",
    "2027-05-31", "2027-08-30", "2027-12-27", "2027-12-28",
    // 2028
    "2028-01-03", "2028-04-14", "2028-04-17", "2028-05-01",
    "2028-05-29", "2028-08-28", "2028-12-25", "2028-12-26",
]);

function isNonWorkingDay(d: Date): boolean {
    const dow = d.getUTCDay(); // 0 = Sunday, 6 = Saturday
    if (dow === 0 || dow === 6) return true;
    return UK_BANK_HOLIDAYS_EW.has(toISODate(d));
}

function nextWorkingDay(d: Date): Date {
    const result = new Date(d);
    while (isNonWorkingDay(result)) {
        result.setUTCDate(result.getUTCDate() + 1);
    }
    return result;
}

// ---------------------------------------------------------------------------
// Core statutory arithmetic — all UTC
// ---------------------------------------------------------------------------

/**
 * Add N calendar months to a UTC date, then subtract 1 day.
 *
 * Statutory rule: "3 months less 1 day" means the deadline is the day before
 * the same calendar date N months later. For month-end dates where the target
 * month is shorter, the last day of that month is used before subtracting 1.
 *
 * Examples:
 *   15 Jan + 3 months less 1 day = 14 Apr ✓
 *   31 Jan + 3 months less 1 day = 29 Apr (Apr has 30 days → clamp to 30 → less 1 = 29) ✓
 *   31 Oct + 3 months less 1 day = 30 Jan ✓
 *   30 Nov + 3 months less 1 day = 27 Feb (Feb 2026 has 28 days → clamp to 28 → less 1 = 27) ✓
 */
export function addMonthsLessOneDay(date: Date, months: number): Date {
    const y = date.getUTCFullYear();
    const m = date.getUTCMonth(); // 0-indexed
    const d = date.getUTCDate();

    // Target month (0-indexed)
    const targetMonth = m + months;
    const targetYear = y + Math.floor(targetMonth / 12);
    const targetMonthNorm = targetMonth % 12;

    // Days in target month
    const daysInTargetMonth = new Date(Date.UTC(targetYear, targetMonthNorm + 1, 0)).getUTCDate();

    // Clamp day to last day of target month, then subtract 1
    const clampedDay = Math.min(d, daysInTargetMonth);
    const finalDay = clampedDay - 1;

    if (finalDay <= 0) {
        // Subtracting 1 day rolls back to previous month
        // e.g. clampedDay = 1 → go to last day of previous month
        const prevMonthDays = new Date(Date.UTC(targetYear, targetMonthNorm, 0)).getUTCDate();
        return new Date(Date.UTC(targetYear, targetMonthNorm - 1, prevMonthDays));
    }

    return new Date(Date.UTC(targetYear, targetMonthNorm, finalDay));
}

/**
 * Add N calendar months to a UTC date (used for ACAS minimum extension).
 */
function addMonths(date: Date, months: number): Date {
    const y = date.getUTCFullYear();
    const m = date.getUTCMonth();
    const d = date.getUTCDate();

    const targetMonth = m + months;
    const targetYear = y + Math.floor(targetMonth / 12);
    const targetMonthNorm = targetMonth % 12;

    const daysInTargetMonth = new Date(Date.UTC(targetYear, targetMonthNorm + 1, 0)).getUTCDate();
    const clampedDay = Math.min(d, daysInTargetMonth);

    return new Date(Date.UTC(targetYear, targetMonthNorm, clampedDay));
}

// ---------------------------------------------------------------------------
// Core calculation
// ---------------------------------------------------------------------------

export function calculateDeadline(
    dateOfAct: string,
    acasDayA?: string,
    acasDayB?: string,
    claimType?: string
): DeadlineResult {
    const actDate = parseUTC(dateOfAct);
    const commencementDate = parseUTC(TIME_LIMIT_CONFIG.COMMENCEMENT_DATE);

    // Determine regime
    const isPostERA2025 = actDate >= commencementDate;
    const months = isPostERA2025
        ? TIME_LIMIT_CONFIG.POST_ERA_2025_MONTHS
        : TIME_LIMIT_CONFIG.PRE_ERA_2025_MONTHS;

    // Correct statutory month arithmetic
    const baseDeadline = addMonthsLessOneDay(actDate, months);

    let finalDeadline = baseDeadline;

    // ACAS early conciliation extension (s207B ERA 1996)
    if (acasDayA && acasDayB) {
        const dayA = parseUTC(acasDayA);
        const dayB = parseUTC(acasDayB);

        // Days remaining in the limitation period when clock stopped on Day A
        const remainderMs = baseDeadline.getTime() - dayA.getTime();
        const remainderDays = Math.max(0, Math.ceil(remainderMs / (1000 * 60 * 60 * 24)));

        // Extended deadline = Day B + remainder days
        const extendedDeadline = new Date(dayB);
        extendedDeadline.setUTCDate(extendedDeadline.getUTCDate() + remainderDays);

        // Minimum: 1 calendar month from Day B
        const oneMonthFromDayB = addMonths(dayB, 1);

        // Claimant gets the longer of the two
        finalDeadline =
            extendedDeadline > oneMonthFromDayB ? extendedDeadline : oneMonthFromDayB;
    }

    // If deadline falls on non-working day, extend to next working day
    finalDeadline = nextWorkingDay(finalDeadline);

    const now = new Date();
    const daysRemaining = Math.ceil(
        (finalDeadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    return {
        claim_type: claimType || "general",
        original_deadline: toISODate(finalDeadline),
        acas_extended_deadline:
            acasDayA && acasDayB
                ? toISODate(finalDeadline)
                : undefined,
        regime: isPostERA2025 ? "post_era_2025" : "pre_era_2025",
        days_remaining: daysRemaining,
        is_expired: daysRemaining < 0,
    };
}

/**
 * Calculate deadlines for multiple claim types.
 *
 * D7.6: Wrongful dismissal note — when brought in the ET, wrongful dismissal
 * follows the same time limit as unfair dismissal (3 or 6 months less 1 day).
 * If the claim exceeds the ET damages cap of £25,000, the county court route
 * has a 6-year limitation period under the Limitation Act 1980 s5.
 */
export function calculateDeadlines(
    dateOfAct: string,
    claimTypes: string[],
    acasDayA?: string,
    acasDayB?: string
): {
    deadlines: DeadlineResult[];
    time_limit_regime: "pre_era_2025" | "post_era_2025";
    warnings: string[];
} {
    const actDate = parseUTC(dateOfAct);
    const commencementDate = parseUTC(TIME_LIMIT_CONFIG.COMMENCEMENT_DATE);
    const isPostERA2025 = actDate >= commencementDate;

    const deadlines = claimTypes.map((ct) =>
        calculateDeadline(dateOfAct, acasDayA, acasDayB, ct)
    );

    const warnings: string[] = [];

    // Transitional warning: near commencement date
    const daysDiff = Math.abs(
        (actDate.getTime() - commencementDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysDiff < 30) {
        warnings.push(
            "The date of the act is close to the ERA 2025 time limit commencement date. " +
            "The exact commencement date is to be confirmed by Statutory Instrument. " +
            "Both 3-month and 6-month deadlines are shown for safety."
        );
    }

    // Urgent warning
    const soonest = Math.min(...deadlines.map((d) => d.days_remaining));
    if (soonest >= 0 && soonest <= 14) {
        warnings.push(
            `URGENT: Your earliest deadline expires in ${soonest} days. ` +
            "Seek immediate advice if you have not already filed your claim."
        );
    }

    // Expired warning
    if (deadlines.some((d) => d.is_expired)) {
        warnings.push(
            "One or more deadlines have expired. A tribunal may still accept a late claim " +
            "under the 'just and equitable' (discrimination) or 'not reasonably practicable' " +
            "(unfair dismissal) tests. Seek legal advice immediately."
        );
    }

    // Wrongful dismissal note
    if (claimTypes.includes("wrongful_dismissal")) {
        warnings.push(
            "Wrongful dismissal: this calculator shows the ET route time limit (3 or 6 months less 1 day). " +
            "If your claim exceeds the ET damages cap of £25,000, you may wish to bring it in the " +
            "county court instead, where the Limitation Act 1980 allows 6 years from breach of contract."
        );
    }

    // ISSUE-17 FIX: Bank holiday staleness warning.
    // UK_BANK_HOLIDAYS_EW covers 2025–2028 only. If any deadline falls after 2028,
    // bank holiday extension may not be applied correctly.
    const BANK_HOLIDAY_DATA_LAST_YEAR = 2028;
    const hasStaleDeadline = deadlines.some((d) => {
        const year = new Date(d.original_deadline).getUTCFullYear();
        return year > BANK_HOLIDAY_DATA_LAST_YEAR;
    });
    if (hasStaleDeadline) {
        warnings.push(
            `WARNING: One or more deadlines fall after ${BANK_HOLIDAY_DATA_LAST_YEAR}. ` +
            "The bank holiday calendar used by this calculator only covers up to " +
            `${BANK_HOLIDAY_DATA_LAST_YEAR}. Bank holiday extensions may not be applied correctly. ` +
            "Please verify your deadline against the GOV.UK bank holidays calendar."
        );
    }

    return {
        deadlines,
        time_limit_regime: isPostERA2025 ? "post_era_2025" : "pre_era_2025",
        warnings,
    };
}
