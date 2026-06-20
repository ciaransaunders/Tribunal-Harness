// Employment Rights Act 2025 — Commencement Dates
// Update these when Statutory Instruments confirm exact dates
// All dates are the first date ON WHICH the new provision applies

export const ERA_2025 = {
    // Royal Assent
    ROYAL_ASSENT: "2025-12-18",

    // Already in force (February 2026)
    TRADE_UNION_BALLOT_CHANGES: "2026-02-18",
    INDUSTRIAL_ACTION_DISMISSAL: "2026-02-18",

    // April 2026 commencement
    SSP_DAY_ONE: "2026-04-06",
    PATERNITY_LEAVE_DAY_ONE: "2026-04-06",
    PARENTAL_LEAVE_DAY_ONE: "2026-04-06",
    COLLECTIVE_REDUNDANCY_180_DAYS: "2026-04-06",
    SEXUAL_HARASSMENT_WHISTLEBLOWING: "2026-04-06",
    FAIR_WORK_AGENCY: "2026-04-07",

    // October 2026 commencement (exact date TBC by Statutory Instrument)
    ET_TIME_LIMIT_6_MONTHS: "2026-10-01",
    HARASSMENT_ALL_REASONABLE_STEPS: "2026-10-01",
    THIRD_PARTY_HARASSMENT: "2026-10-01",
    NDA_VOID: "2026-10-01",
    UNION_INFORM_RIGHT: "2026-10-01",

    // January 2027 commencement
    QUALIFYING_PERIOD_6_MONTHS: "2027-01-01",
    COMPENSATORY_AWARD_UNCAPPED: "2027-01-01",
    FIRE_AND_REHIRE_AUTO_UNFAIR: "2027-01-01",

    // 2027 (exact dates TBC by Statutory Instrument — do not rely on 1 Jan)
    ZERO_HOURS_PROTECTIONS: null,
    MATERNITY_EXTENDED_PROTECTION: null,
    FLEXIBLE_WORKING_STRENGTHENED: null,
    AGGREGATE_REDUNDANCY_THRESHOLD: null,
} as const;

// ---------------------------------------------------------------------------
// ERA 2025 Implementation Tracker
// SINGLE SOURCE OF TRUTH — import this wherever tracker data is needed.
// Do NOT hardcode ERA 2025 provision data in individual page files.
// ---------------------------------------------------------------------------
export const ERA_2025_TRACKER = [
    {
        provision: "Industrial action dismissal — auto unfair",
        old_position: "12-week protected period",
        new_position: "No time limit — automatically unfair",
        commencement: "18 Feb 2026",
        status: "in_force" as const,
        key: "INDUSTRIAL_ACTION_DISMISSAL",
    },
    {
        provision: "SSP from day 1",
        old_position: "3-day waiting period",
        new_position: "Payable from day 1 of sickness",
        commencement: "6 Apr 2026",
        status: "in_force" as const,
        key: "SSP_DAY_ONE",
    },
    {
        provision: "Paternity leave — day 1 right",
        old_position: "26 weeks' service required",
        new_position: "Day 1 right",
        commencement: "6 Apr 2026",
        status: "in_force" as const,
        key: "PATERNITY_LEAVE_DAY_ONE",
    },
    {
        provision: "Parental leave — day 1 right",
        old_position: "1 year's service required",
        new_position: "Day 1 right",
        commencement: "6 Apr 2026",
        status: "in_force" as const,
        key: "PARENTAL_LEAVE_DAY_ONE",
    },
    {
        provision: "Sexual harassment as whistleblowing",
        old_position: "Not a qualifying disclosure",
        new_position: "Qualifying disclosure under ERA 1996 Part IVA",
        commencement: "6 Apr 2026",
        status: "in_force" as const,
        key: "SEXUAL_HARASSMENT_WHISTLEBLOWING",
    },
    {
        provision: "Collective redundancy — 180-day period",
        old_position: "90 days maximum",
        new_position: "180 days maximum",
        commencement: "6 Apr 2026",
        status: "in_force" as const,
        key: "COLLECTIVE_REDUNDANCY_180_DAYS",
    },
    {
        provision: "Fair Work Agency established",
        old_position: "No single enforcement body",
        new_position: "Fair Work Agency enforces employment rights",
        commencement: "7 Apr 2026",
        status: "in_force" as const,
        key: "FAIR_WORK_AGENCY",
    },
    {
        provision: "ET time limit — 6 months",
        old_position: "3 months less 1 day",
        new_position: "6 months less 1 day",
        commencement: "Oct 2026 (SI awaited)",
        status: "upcoming" as const,
        key: "ET_TIME_LIMIT_6_MONTHS",
    },
    {
        provision: "Harassment — all reasonable steps",
        old_position: "Reasonable steps defence",
        new_position: "All reasonable steps required",
        commencement: "Oct 2026 (SI awaited)",
        status: "upcoming" as const,
        key: "HARASSMENT_ALL_REASONABLE_STEPS",
    },
    {
        provision: "Third-party harassment liability",
        old_position: "No employer liability for third-party acts",
        new_position: "Employer liable unless all reasonable steps taken",
        commencement: "Oct 2026 (SI awaited)",
        status: "upcoming" as const,
        key: "THIRD_PARTY_HARASSMENT",
    },
    {
        provision: "NDAs void for harassment/discrimination",
        old_position: "NDAs enforceable",
        new_position: "NDAs preventing disclosure are void",
        commencement: "Oct 2026 (SI awaited)",
        status: "upcoming" as const,
        key: "NDA_VOID",
    },
    {
        provision: "Union right to inform workers",
        old_position: "No right",
        new_position: "Right to inform workers of union membership",
        commencement: "Oct 2026 (SI awaited)",
        status: "upcoming" as const,
        key: "UNION_INFORM_RIGHT",
    },
    {
        provision: "Qualifying period — 6 months",
        old_position: "2 years' continuous employment",
        new_position: "6 months' continuous employment",
        commencement: "1 Jan 2027",
        status: "upcoming" as const,
        key: "QUALIFYING_PERIOD_6_MONTHS",
    },
    {
        provision: "Compensatory award — uncapped",
        old_position: "Capped at lower of 1 year's pay or ~£115,115",
        new_position: "No statutory cap",
        commencement: "1 Jan 2027",
        status: "upcoming" as const,
        key: "COMPENSATORY_AWARD_UNCAPPED",
    },
    {
        provision: "Fire and rehire — automatically unfair",
        old_position: "No specific statutory protection",
        new_position: "Automatically unfair (limited financial distress defence)",
        commencement: "1 Jan 2027",
        status: "upcoming" as const,
        key: "FIRE_AND_REHIRE_AUTO_UNFAIR",
    },
    {
        provision: "Zero-hours contract rights",
        old_position: "No guaranteed hours",
        new_position: "Right to guaranteed hours, shift notice, cancellation pay",
        commencement: "2027 (SI awaited)",
        status: "awaiting_si" as const,
        key: "ZERO_HOURS_PROTECTIONS",
    },
    {
        provision: "Maternity — extended redundancy protection",
        old_position: "Protection during maternity leave",
        new_position: "Extended protection period post-return",
        commencement: "2027 (SI awaited)",
        status: "awaiting_si" as const,
        key: "MATERNITY_EXTENDED_PROTECTION",
    },
    {
        provision: "Flexible working — strengthened right",
        old_position: "Right to request (employer can refuse on 8 grounds)",
        new_position: "Strengthened right — fewer refusal grounds",
        commencement: "2027 (SI awaited)",
        status: "awaiting_si" as const,
        key: "FLEXIBLE_WORKING_STRENGTHENED",
    },
] as const;

export type ERA2025TrackerEntry = (typeof ERA_2025_TRACKER)[number];

export const TIME_LIMIT_CONFIG = {
    PRE_ERA_2025_MONTHS: 3,
    POST_ERA_2025_MONTHS: 6,
    COMMENCEMENT_DATE:
        process.env.ERA_2025_TIME_LIMIT_COMMENCEMENT ||
        ERA_2025.ET_TIME_LIMIT_6_MONTHS,
} as const;

export const QUALIFYING_PERIOD_CONFIG = {
    PRE_ERA_2025_YEARS: 2,
    POST_ERA_2025_MONTHS: 6,
    COMMENCEMENT_DATE: ERA_2025.QUALIFYING_PERIOD_6_MONTHS,
} as const;

// Claim types supported by the system
export const CLAIM_TYPES = [
    {
        id: "unfair_dismissal",
        label: "Unfair Dismissal",
        statute: "ERA 1996 s98",
        era2025: true,
    },
    {
        id: "direct_discrimination",
        label: "Direct Discrimination",
        statute: "EA 2010 s13",
        era2025: false,
    },
    {
        id: "indirect_discrimination",
        label: "Indirect Discrimination",
        statute: "EA 2010 s19",
        era2025: false,
    },
    {
        id: "harassment",
        label: "Harassment",
        statute: "EA 2010 s26",
        era2025: true,
    },
    {
        id: "victimisation",
        label: "Victimisation",
        statute: "EA 2010 s27",
        era2025: false,
    },
    {
        id: "reasonable_adjustments",
        label: "Failure to Make Reasonable Adjustments",
        statute: "EA 2010 ss20-21",
        era2025: false,
    },
    {
        id: "whistleblowing",
        label: "Whistleblowing",
        statute: "ERA Part IVA",
        era2025: true,
    },
    {
        id: "wrongful_dismissal",
        label: "Wrongful Dismissal",
        statute: "Common Law",
        era2025: false,
    },
    {
        id: "fire_and_rehire",
        label: "Fire and Rehire",
        statute: "ERA 2025",
        era2025: true,
        effectiveFrom: "2027-01-01",
    },
    {
        id: "zero_hours_rights",
        label: "Zero-Hours Contract Rights",
        statute: "ERA 2025",
        era2025: true,
        effectiveFrom: "2027-01-01",
    },
] as const;

export type ClaimTypeId = (typeof CLAIM_TYPES)[number]["id"];

// FSM States — UK Employment Tribunal procedure
export const FSM_STATES = [
    "PRE_ACTION",
    "ACAS_EC",
    "ET1_FILED",
    "ET3_RECEIVED",
    "CASE_MANAGED",
    "DISCLOSURE",
    "WITNESS_STATEMENTS",
    "BUNDLE_PREP",
    "HEARING",
    "JUDGMENT",
    "EAT_APPEAL",
    "EAT_SIFT",
    "EAT_RULE3_10",
    "EAT_FULL_HEARING",
    "COA_PERMISSION",
    "COA_HEARING",
] as const;

export type FSMState = (typeof FSM_STATES)[number];

// ---------------------------------------------------------------------------
// ERA 2025 date formatting helpers
// Use these to render commencement dates in user-facing copy so that the
// displayed date always derives from the ERA_2025 constants above — never
// hardcode a commencement date string elsewhere in the codebase.
//
// - formatCommencementDate  → "1 January 2027"   (full date, for CONFIRMED dates)
// - formatCommencementMonth → "January 2027"     (month + year, for dates whose
//                              exact day is TBC by Statutory Instrument — avoids
//                              asserting a precise day the SI has not confirmed)
// ---------------------------------------------------------------------------
export function formatCommencementDate(iso: string): string {
    return new Intl.DateTimeFormat("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
        timeZone: "UTC",
    }).format(new Date(iso));
}

export function formatCommencementMonth(iso: string): string {
    return new Intl.DateTimeFormat("en-GB", {
        month: "long",
        year: "numeric",
        timeZone: "UTC",
    }).format(new Date(iso));
}
