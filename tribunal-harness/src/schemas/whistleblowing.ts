import type { ClaimSchema } from "./types";
import { ERA_2025, formatCommencementMonth } from "@/lib/constants";

export const whistleblowingSchema: ClaimSchema = {
    id: "whistleblowing",
    label: "Whistleblowing Detriment / Dismissal",
    statute: "ERA 1996 Part IVA",
    description: "Protection for workers who make qualifying disclosures in the public interest.",
    legalTest: [
        "Was there a disclosure of information (not just an allegation)?",
        "Did the disclosure tend to show one of the six categories of wrongdoing?",
        "Was the disclosure made in the public interest?",
        "Was the disclosure made to an appropriate person?",
        "Did the worker suffer a detriment or dismissal because of the disclosure?",
    ],
    keyAuthorities: [
        "Cavendish Munro v Geduld [2010] ICR 325",
        "Chesterton Global v Nurmohamed [2017] ICR 920",
        "Kilraine v London Borough of Wandsworth [2018] ICR 1850",
        "Babula v Waltham Forest College [2007] ICR 1026",
    ],
    era2025Changes: [
        `Sexual harassment disclosures are now a qualifying disclosure category (from ${formatCommencementMonth(ERA_2025.SEXUAL_HARASSMENT_WHISTLEBLOWING)})`,
    ],
    fields: [
        {
            id: "disclosure_type", label: "Category of Qualifying Disclosure", type: "select", required: true,
            options: [
                { value: "criminal_offence", label: "Criminal offence" },
                { value: "legal_obligation", label: "Failure to comply with legal obligation" },
                { value: "miscarriage_justice", label: "Miscarriage of justice" },
                { value: "health_safety", label: "Danger to health and safety" },
                { value: "environmental", label: "Damage to the environment" },
                { value: "concealment", label: "Deliberate concealment of any of the above" },
                { value: "sexual_harassment", label: "Sexual harassment (ERA 2025)" },
            ],
        },
        {
            id: "sexual_harassment_disclosure", label: "Sexual Harassment Disclosure", type: "boolean", required: false,
            helpText: "Does the disclosure relate to sexual harassment?",
            era2025: {
                isNew: true, commencementDate: ERA_2025.SEXUAL_HARASSMENT_WHISTLEBLOWING, status: "in_force",
                note: `Sexual harassment is now a separate qualifying disclosure from ${formatCommencementMonth(ERA_2025.SEXUAL_HARASSMENT_WHISTLEBLOWING)}. Creates dual-track claim possibility.`,
            },
        },
        { id: "disclosure_date", label: "Date of Disclosure", type: "date", required: true },
        {
            id: "disclosure_recipient", label: "Who Was the Disclosure Made To?", type: "select", required: true,
            options: [
                { value: "employer", label: "Employer" },
                { value: "legal_adviser", label: "Legal adviser" },
                { value: "prescribed_person", label: "Prescribed person / regulator" },
                { value: "other", label: "Other (wider disclosure)" },
            ],
        },
        {
            id: "public_interest", label: "Public Interest Element", type: "textarea", required: true,
            helpText: "Explain why this disclosure was in the public interest.",
        },
        {
            id: "detriment_or_dismissal", label: "Detriment or Dismissal", type: "select", required: true,
            options: [
                { value: "detriment", label: "Subjected to detriment" },
                { value: "dismissal", label: "Dismissed" },
                { value: "both", label: "Both detriment and dismissal" },
            ],
        },
        { id: "narrative", label: "Full Account", type: "textarea", required: false },
    ],
};

export default whistleblowingSchema;
