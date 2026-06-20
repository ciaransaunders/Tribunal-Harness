import type { ClaimSchema } from "./types";

export const directDiscriminationSchema: ClaimSchema = {
    id: "direct_discrimination",
    label: "Direct Discrimination",
    statute: "EA 2010 s13",
    description: "Less favourable treatment because of a protected characteristic.",
    legalTest: [
        "Does the claimant have/is perceived to have/is associated with a protected characteristic?",
        "Was the claimant treated less favourably than an actual or hypothetical comparator?",
        "Was the less favourable treatment because of the protected characteristic?",
    ],
    keyAuthorities: [
        "Igen Ltd v Wong [2005] ICR 931",
        "Madarassy v Nomura [2007] ICR 867",
        "Nagarajan v London Regional Transport [2000] 1 AC 501",
        "Shamoon v Chief Constable of the RUC [2003] ICR 337",
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
        {
            id: "comparator_type", label: "Comparator", type: "select", required: true,
            options: [
                { value: "actual", label: "Actual comparator (named individual)" },
                { value: "hypothetical", label: "Hypothetical comparator" },
            ],
        },
        { id: "comparator_details", label: "Comparator Details", type: "textarea", required: false },
        { id: "less_favourable_treatment", label: "Less Favourable Treatment", type: "textarea", required: true },
        { id: "date_of_last_act", label: "Date of Last Act", type: "date", required: true },
        {
            id: "continuing_act", label: "Continuing Act / Course of Conduct", type: "boolean", required: false,
            helpText: "Was this part of a continuing course of conduct (EA 2010 s123(3)(a))?",
        },
        { id: "narrative", label: "Full Account", type: "textarea", required: false },
    ],
};

export default directDiscriminationSchema;
