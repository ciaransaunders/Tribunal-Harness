import type { ClaimSchema } from "./types";
import { ERA_2025, formatCommencementMonth, formatCommencementDate } from "@/lib/constants";

export const fireAndRehireSchema: ClaimSchema = {
    id: "fire_and_rehire",
    label: "Fire and Rehire",
    statute: "ERA 2025",
    description: "Automatically unfair dismissal where an employer dismisses an employee to impose changes to restricted contractual terms.",
    legalTest: [
        "Was the employee dismissed?",
        "Was the purpose of the dismissal to impose a variation to a restricted term?",
        "Is the restricted term one of: pay, hours, pensions, holidays, or shift patterns?",
        "Does the employer claim severe financial distress?",
        "Were there no reasonable alternatives to dismissal?",
    ],
    keyAuthorities: [
        "This is a new statutory provision — case law will develop from 2027",
    ],
    era2025Changes: [
        `Entirely new claim type created by ERA 2025 (from ${formatCommencementMonth(ERA_2025.FIRE_AND_REHIRE_AUTO_UNFAIR)})`,
        "Dismissals to impose restricted variations are automatically unfair",
        "Limited defence: employer must prove severe financial distress AND no alternative",
    ],
    fields: [
        {
            id: "effective_date_of_termination", label: "Date of Dismissal", type: "date", required: true,
            era2025: {
                isNew: true, commencementDate: ERA_2025.FIRE_AND_REHIRE_AUTO_UNFAIR, status: "upcoming",
                note: `This claim type is only available for dismissals on or after ${formatCommencementDate(ERA_2025.FIRE_AND_REHIRE_AUTO_UNFAIR)}.`,
            },
        },
        {
            id: "restricted_variation", label: "Which Restricted Term Was Changed?", type: "select", required: true,
            options: [
                { value: "pay", label: "Pay" }, { value: "hours", label: "Hours" },
                { value: "pensions", label: "Pensions" }, { value: "holidays", label: "Holidays" },
                { value: "shift_patterns", label: "Shift patterns" }, { value: "multiple", label: "Multiple terms" },
            ],
        },
        { id: "offered_new_contract", label: "Were You Offered New Terms?", type: "boolean", required: true },
        {
            id: "financial_distress_defence", label: "Employer Claims Financial Distress?", type: "boolean", required: false,
            helpText: "The employer must demonstrate severe financial distress to rely on this defence.",
        },
        { id: "no_alternative_defence", label: "Employer Claims No Alternative?", type: "boolean", required: false },
        {
            id: "fire_and_replace", label: "Replaced with Contractor/Agency Worker?", type: "boolean", required: false,
            helpText: "Were you replaced with a contractor or agency worker doing the same role?",
        },
        { id: "narrative", label: "Full Account", type: "textarea", required: false },
    ],
};
