import type { ClaimSchema } from "./types";
import { ERA_2025, formatCommencementMonth, formatCommencementDate } from "@/lib/constants";

export const unfairDismissalSchema: ClaimSchema = {
    id: "unfair_dismissal",
    label: "Unfair Dismissal",
    statute: "ERA 1996 s98",
    description:
        "A claim that an employer dismissed an employee without a fair reason or without following a fair procedure.",
    legalTest: [
        "Was the claimant an employee?",
        "Was the claimant dismissed (s95)?",
        "Does the claimant have sufficient qualifying service?",
        "Has the employer shown a potentially fair reason (s98(1)-(2))?",
        "Did the employer act reasonably in treating that reason as sufficient (s98(4))?",
    ],
    keyAuthorities: [
        "Polkey v AE Dayton Services [1988] ICR 142",
        "Iceland Frozen Foods v Jones [1983] ICR 17",
        "BHS v Burchell [1980] ICR 303",
        "Western Excavating v Sharp [1978] ICR 221",
    ],
    era2025Changes: [
        `Qualifying period reduces from 2 years to 6 months (from ${formatCommencementMonth(ERA_2025.QUALIFYING_PERIOD_6_MONTHS)})`,
        `Compensatory award cap removed entirely (from ${formatCommencementMonth(ERA_2025.COMPENSATORY_AWARD_UNCAPPED)})`,
        `Fire and rehire dismissals automatically unfair (from ${formatCommencementMonth(ERA_2025.FIRE_AND_REHIRE_AUTO_UNFAIR)})`,
        `Industrial action dismissals automatically unfair with no 12-week limit (from ${formatCommencementMonth(ERA_2025.INDUSTRIAL_ACTION_DISMISSAL)}, in force)`,
    ],
    fields: [
        {
            id: "employee_status",
            label: "Employment Status",
            type: "select",
            required: true,
            options: [
                { value: "employee", label: "Employee" },
                { value: "worker", label: "Worker" },
                { value: "self_employed", label: "Self-employed" },
                { value: "uncertain", label: "Uncertain / Disputed" },
            ],
        },
        {
            id: "start_date",
            label: "Employment Start Date",
            type: "date",
            required: true,
            helpText: "The date you started continuous employment.",
        },
        {
            id: "effective_date_of_termination",
            label: "Effective Date of Termination (EDT)",
            type: "date",
            required: true,
            helpText:
                "The date your employment ended — last day of notice, or date of summary dismissal.",
        },
        {
            id: "qualifying_service",
            label: "Qualifying Service Met",
            type: "boolean",
            required: false,
            helpText: `Auto-calculated: Pre-${formatCommencementMonth(ERA_2025.QUALIFYING_PERIOD_6_MONTHS)} = 2 years; Post-${formatCommencementMonth(ERA_2025.QUALIFYING_PERIOD_6_MONTHS)} = 6 months.`,
            era2025: {
                isNew: false,
                changedFrom: "2 years continuous employment",
                commencementDate: ERA_2025.QUALIFYING_PERIOD_6_MONTHS,
                status: "upcoming",
                note: `Reduces to 6 months from ${formatCommencementDate(ERA_2025.QUALIFYING_PERIOD_6_MONTHS)}.`,
            },
        },
        {
            id: "dismissal_reason",
            label: "Reason Given for Dismissal",
            type: "select",
            required: true,
            options: [
                { value: "capability", label: "Capability / Performance" },
                { value: "conduct", label: "Conduct" },
                { value: "redundancy", label: "Redundancy" },
                { value: "statutory_bar", label: "Statutory Restriction" },
                { value: "sosr", label: "Some Other Substantial Reason (SOSR)" },
                { value: "none_given", label: "No reason given" },
                { value: "constructive", label: "Constructive dismissal" },
                {
                    value: "fire_and_rehire",
                    label: "Fire and rehire (ERA 2025 — auto unfair)",
                },
            ],
        },
        {
            id: "automatically_unfair",
            label: "Automatically Unfair Ground",
            type: "select",
            required: false,
            options: [
                { value: "none", label: "None / Not applicable" },
                { value: "whistleblowing", label: "Whistleblowing" },
                { value: "pregnancy", label: "Pregnancy / Maternity" },
                { value: "trade_union", label: "Trade union membership / activity" },
                { value: "health_safety", label: "Health and safety" },
                { value: "statutory_right", label: "Assertion of statutory right" },
                { value: "tupe", label: "TUPE" },
                {
                    value: "industrial_action",
                    label: "Industrial action (ERA 2025 — no 12-week limit)",
                },
                {
                    value: "fire_and_rehire",
                    label: `Fire and rehire (ERA 2025 — from ${formatCommencementMonth(ERA_2025.FIRE_AND_REHIRE_AUTO_UNFAIR)})`,
                },
                {
                    value: "fire_and_replace",
                    label: `Fire and replace (ERA 2025 — from ${formatCommencementMonth(ERA_2025.FIRE_AND_REHIRE_AUTO_UNFAIR)})`,
                },
            ],
            era2025: {
                isNew: false,
                changedFrom: "Industrial action had 12-week protected period",
                commencementDate: ERA_2025.INDUSTRIAL_ACTION_DISMISSAL,
                status: "in_force",
                note: `Industrial action dismissal now automatically unfair. Fire and rehire/replace added from ${formatCommencementMonth(ERA_2025.FIRE_AND_REHIRE_AUTO_UNFAIR)}.`,
            },
        },
        {
            id: "procedure_followed",
            label: "Was a Fair Procedure Followed?",
            type: "select",
            required: true,
            options: [
                { value: "yes", label: "Yes — full ACAS Code procedure" },
                { value: "partial", label: "Partial — some steps missed" },
                { value: "no", label: "No — no procedure at all" },
                { value: "unknown", label: "Unknown / Need to review" },
            ],
        },
        {
            id: "compensatory_award_cap",
            label: "Compensatory Award Cap Applies",
            type: "boolean",
            required: false,
            helpText: "Auto-calculated based on EDT.",
            era2025: {
                isNew: false,
                changedFrom:
                    "Capped at lower of 1 year's pay or statutory maximum (£115,115)",
                commencementDate: ERA_2025.COMPENSATORY_AWARD_UNCAPPED,
                status: "upcoming",
                note: `Cap removed entirely from ${formatCommencementDate(ERA_2025.COMPENSATORY_AWARD_UNCAPPED)}.`,
            },
        },
        {
            id: "narrative",
            label: "Describe What Happened",
            type: "textarea",
            required: false,
            helpText: "Provide a chronological account of the events.",
        },
    ],
};
