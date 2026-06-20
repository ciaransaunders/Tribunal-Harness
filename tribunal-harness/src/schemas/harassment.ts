import type { ClaimSchema } from "./types";
import { ERA_2025, formatCommencementMonth } from "@/lib/constants";

export const harassmentSchema: ClaimSchema = {
    id: "harassment",
    label: "Harassment",
    statute: "EA 2010 s26",
    description:
        "Unwanted conduct related to a protected characteristic that has the purpose or effect of violating dignity or creating an intimidating, hostile, degrading, humiliating or offensive environment.",
    legalTest: [
        "Was there unwanted conduct?",
        "Was the conduct related to a protected characteristic?",
        "Did the conduct have the purpose or effect of violating dignity or creating an intimidating/hostile/degrading/humiliating/offensive environment?",
        "In assessing effect: was it reasonable for the conduct to have that effect? (perception, circumstances, reasonableness)",
    ],
    keyAuthorities: [
        "Pemberton v Inwood [2018] ICR 1291",
        "Richmond Pharmacology v Dhaliwal [2009] ICR 724",
        "Land Registry v Grant [2011] ICR 1390",
    ],
    era2025Changes: [
        `Employer duty changes from "reasonable steps" to "all reasonable steps" (from ${formatCommencementMonth(ERA_2025.HARASSMENT_ALL_REASONABLE_STEPS)})`,
        `Third-party harassment liability introduced (from ${formatCommencementMonth(ERA_2025.THIRD_PARTY_HARASSMENT)})`,
        `NDAs preventing disclosure of harassment/discrimination are void (from ${formatCommencementMonth(ERA_2025.NDA_VOID)})`,
        `Sexual harassment becomes qualifying disclosure for whistleblowing (from ${formatCommencementMonth(ERA_2025.SEXUAL_HARASSMENT_WHISTLEBLOWING)})`,
    ],
    fields: [
        {
            id: "protected_characteristic", label: "Protected Characteristic", type: "select", required: true,
            options: [
                { value: "age", label: "Age" }, { value: "disability", label: "Disability" },
                { value: "gender_reassignment", label: "Gender reassignment" }, { value: "race", label: "Race" },
                { value: "religion", label: "Religion or belief" }, { value: "sex", label: "Sex" },
                { value: "sexual_orientation", label: "Sexual orientation" },
                { value: "pregnancy", label: "Pregnancy and maternity" },
                { value: "marriage", label: "Marriage and civil partnership" },
            ],
        },
        { id: "unwanted_conduct", label: "Description of Unwanted Conduct", type: "textarea", required: true },
        { id: "date_of_last_act", label: "Date of Last Act", type: "date", required: true },
        {
            id: "purpose_or_effect", label: "Purpose or Effect?", type: "select", required: true,
            options: [
                { value: "purpose", label: "Purpose — intended to harass" },
                { value: "effect", label: "Effect — had harassing effect regardless of intent" },
                { value: "both", label: "Both purpose and effect" },
            ],
        },
        {
            id: "third_party_harassment", label: "Third-Party Harassment", type: "boolean", required: false,
            helpText: "Was the harassment committed by a third party (customer, client, contractor)?",
            era2025: {
                isNew: true, commencementDate: ERA_2025.THIRD_PARTY_HARASSMENT, status: "upcoming",
                note: `Employers liable for third-party harassment unless 'all reasonable steps' taken. From ${formatCommencementMonth(ERA_2025.THIRD_PARTY_HARASSMENT)}.`,
            },
        },
        {
            id: "employer_steps", label: "Employer Prevention Steps", type: "select", required: false,
            options: [
                { value: "none", label: "No steps taken" },
                { value: "some", label: "Some steps — policy exists but not enforced" },
                { value: "reasonable", label: "Reasonable steps taken" },
                { value: "all_reasonable", label: "All reasonable steps taken" },
            ],
            era2025: {
                isNew: false, changedFrom: '"reasonable steps" defence',
                commencementDate: ERA_2025.HARASSMENT_ALL_REASONABLE_STEPS, status: "upcoming",
                note: `Standard rises to "all reasonable steps" from ${formatCommencementMonth(ERA_2025.HARASSMENT_ALL_REASONABLE_STEPS)}.`,
            },
        },
        {
            id: "nda_clause", label: "NDA / Confidentiality Clause", type: "boolean", required: false,
            helpText: "Does any agreement prevent you from speaking about the harassment?",
            era2025: {
                isNew: true, commencementDate: ERA_2025.NDA_VOID, status: "upcoming",
                note: `Any NDA preventing disclosure of harassment/discrimination is void from ${formatCommencementMonth(ERA_2025.NDA_VOID)}.`,
            },
        },
        { id: "narrative", label: "Full Account", type: "textarea", required: false },
    ],
};

export default harassmentSchema;
