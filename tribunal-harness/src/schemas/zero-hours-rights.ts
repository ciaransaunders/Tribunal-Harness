import type { ClaimSchema } from "./types";
import { ERA_2025 } from "@/lib/constants";

export const zeroHoursRightsSchema: ClaimSchema = {
    id: "zero_hours_rights",
    label: "Zero-Hours Contract Rights",
    statute: "ERA 2025",
    description: "New rights for zero-hours and low-hours workers to guaranteed hours, shift notice, and cancellation payment.",
    legalTest: [
        "Is the worker on a zero-hours or low-hours contract?",
        "Has the reference period of 12 weeks been met?",
        "Was the worker denied guaranteed hours reflecting regular hours worked?",
        "Was reasonable notice of shifts provided?",
        "Was compensation paid for short-notice cancellation?",
    ],
    keyAuthorities: [
        "This is a new statutory provision — case law will develop from 2027",
    ],
    era2025Changes: [
        "Entirely new set of rights created by ERA 2025 (from 2027)",
        "Rights extend to agency workers",
    ],
    fields: [
        {
            id: "contract_type", label: "Contract Type", type: "select", required: true,
            options: [
                { value: "zero_hours", label: "Zero-hours contract" },
                { value: "low_hours", label: "Low-hours contract" },
                { value: "agency", label: "Agency worker" },
            ],
            era2025: {
                isNew: true, commencementDate: ERA_2025.ZERO_HOURS_PROTECTIONS ?? "TBC (SI awaited)", status: "awaiting_si",
                note: "Exact commencement date to be confirmed by Statutory Instrument.",
            },
        },
        {
            id: "regular_hours", label: "Regular Hours Worked (per week)", type: "number", required: true,
            helpText: "Average hours worked over a 12-week reference period.",
        },
        { id: "guaranteed_hours_offered", label: "Were Guaranteed Hours Offered?", type: "boolean", required: true },
        { id: "shift_notice", label: "Was Reasonable Shift Notice Given?", type: "boolean", required: true },
        {
            id: "cancellation_payment", label: "Was Cancellation Payment Made?", type: "boolean", required: false,
            helpText: "Payment for shifts cancelled at short notice.",
        },
        { id: "narrative", label: "Full Account", type: "textarea", required: false },
    ],
};
