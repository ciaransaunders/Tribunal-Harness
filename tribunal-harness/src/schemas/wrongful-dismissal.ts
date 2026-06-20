import type { ClaimSchema } from "./types";

export const wrongfulDismissalSchema: ClaimSchema = {
    id: "wrongful_dismissal",
    label: "Wrongful Dismissal",
    statute: "Common Law",
    description: "A breach of contract claim where the employer dismissed without giving proper contractual or statutory notice.",
    legalTest: [
        "Was there a contract of employment?",
        "Was the employee dismissed?",
        "Was the dismissal in breach of the contract (e.g., insufficient notice)?",
        "Did the employee's conduct justify summary dismissal (gross misconduct defence)?",
    ],
    keyAuthorities: [
        "Geys v Société Générale [2013] 1 AC 523",
        "Gunton v Richmond-upon-Thames LBC [1981] Ch 448",
        "Laws v London Chronicle [1959] 1 WLR 698",
    ],
    fields: [
        {
            id: "contractual_notice", label: "Contractual Notice Period", type: "text", required: true,
            helpText: "e.g., '3 months', '1 week per year of service'",
        },
        { id: "notice_given", label: "Notice Actually Given", type: "text", required: true },
        { id: "summary_dismissal", label: "Was It Summary Dismissal (No Notice)?", type: "boolean", required: true },
        { id: "gross_misconduct_alleged", label: "Gross Misconduct Alleged?", type: "boolean", required: false },
        { id: "effective_date_of_termination", label: "Date of Dismissal", type: "date", required: true },
        { id: "pay_in_lieu", label: "Was Payment in Lieu of Notice (PILON) Made?", type: "boolean", required: false },
        { id: "narrative", label: "Full Account", type: "textarea", required: false },
    ],
};
