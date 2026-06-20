import { NextResponse } from "next/server";
import { ERA_2025_TRACKER } from "@/lib/constants";

/**
 * GET /api/era-2025/tracker
 *
 * Returns ERA 2025 implementation tracker data showing which changes
 * are in force, upcoming, and how the tool handles each.
 *
 * The provision / position / commencement / status data is DERIVED from the
 * single source of truth (ERA_2025_TRACKER in src/lib/constants.ts) so
 * commencement dates can never drift. Only the API-specific tool_status and
 * notes metadata lives here, keyed by each tracker entry's `key`.
 */

interface APITrackerEntry {
    provision: string;
    old_position: string;
    new_position: string;
    commencement: string;
    status: "in_force" | "upcoming" | "awaiting_si";
    tool_status: "implemented" | "planned" | "not_applicable";
    notes: string;
}

// API-specific metadata layered on top of the canonical tracker.
// Keyed by ERA_2025_TRACKER `key`. Dates/positions/status are NOT duplicated
// here — they are read from constants.ts at map time below.
const API_METADATA: Record<
    string,
    { tool_status: APITrackerEntry["tool_status"]; notes: string }
> = {
    INDUSTRIAL_ACTION_DISMISSAL: { tool_status: "implemented", notes: "Added to unfair dismissal schema auto-unfair grounds" },
    SSP_DAY_ONE: { tool_status: "implemented", notes: "Updated remedy considerations" },
    PATERNITY_LEAVE_DAY_ONE: { tool_status: "implemented", notes: "Updated qualifying service checks" },
    PARENTAL_LEAVE_DAY_ONE: { tool_status: "implemented", notes: "Updated qualifying service checks" },
    SEXUAL_HARASSMENT_WHISTLEBLOWING: { tool_status: "implemented", notes: "Added to whistleblowing schema disclosure categories. Creates dual-track claim possibility." },
    COLLECTIVE_REDUNDANCY_180_DAYS: { tool_status: "implemented", notes: "Updated remedy calculator" },
    FAIR_WORK_AGENCY: { tool_status: "not_applicable", notes: "Enforcement body — no direct schema impact" },
    ET_TIME_LIMIT_6_MONTHS: { tool_status: "implemented", notes: "Deadline calculator applies correct regime based on act date. Commencement date configurable." },
    HARASSMENT_ALL_REASONABLE_STEPS: { tool_status: "implemented", notes: "Harassment schema updated with new field for employer steps standard" },
    THIRD_PARTY_HARASSMENT: { tool_status: "implemented", notes: "Added third_party_harassment field to harassment schema" },
    NDA_VOID: { tool_status: "implemented", notes: "Added nda_clause field to harassment schema" },
    UNION_INFORM_RIGHT: { tool_status: "not_applicable", notes: "Procedural change — no direct schema impact" },
    QUALIFYING_PERIOD_6_MONTHS: { tool_status: "implemented", notes: "Unfair dismissal schema checks EDT against commencement date" },
    COMPENSATORY_AWARD_UNCAPPED: { tool_status: "implemented", notes: "Remedy calculator applies cap or uncapped based on EDT" },
    FIRE_AND_REHIRE_AUTO_UNFAIR: { tool_status: "implemented", notes: "New claim type schema created with financial distress defence fields" },
    ZERO_HOURS_PROTECTIONS: { tool_status: "implemented", notes: "New claim type schema created. Exact commencement date to be confirmed by SI." },
    MATERNITY_EXTENDED_PROTECTION: { tool_status: "planned", notes: "Will be integrated when secondary legislation confirms scope" },
    FLEXIBLE_WORKING_STRENGTHENED: { tool_status: "planned", notes: "Will be integrated when secondary legislation confirms scope" },
};

const TRACKER_DATA: APITrackerEntry[] = ERA_2025_TRACKER.map((entry) => ({
    provision: entry.provision,
    old_position: entry.old_position,
    new_position: entry.new_position,
    commencement: entry.commencement,
    status: entry.status,
    tool_status: API_METADATA[entry.key]?.tool_status ?? "planned",
    notes: API_METADATA[entry.key]?.notes ?? "",
}));

export async function GET() {
    return NextResponse.json({ changes: TRACKER_DATA });
}
