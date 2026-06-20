import type { ClaimSchema } from "./types";

export const indirectDiscriminationSchema: ClaimSchema = {
    id: "indirect_discrimination",
    label: "Indirect Discrimination",
    statute: "EA 2010 s19",
    description: "A provision, criterion or practice (PCP) that puts persons sharing a protected characteristic at a particular disadvantage.",
    legalTest: [
        "Did the employer apply a PCP?",
        "Does the PCP put persons sharing the claimant's protected characteristic at a particular disadvantage compared to those who do not share it?",
        "Does the PCP put the claimant at that disadvantage?",
        "Can the employer show the PCP is a proportionate means of achieving a legitimate aim?",
    ],
    keyAuthorities: [
        "Essop v Home Office [2017] UKSC 27",
        "Homer v Chief Constable of West Yorkshire [2012] ICR 704",
        "Bilka-Kaufhaus v Weber von Hartz [1987] ICR 110",
    ],
    fields: [
        {
            id: "protected_characteristic", label: "Protected Characteristic", type: "select", required: true,
            options: [
                { value: "age", label: "Age" }, { value: "disability", label: "Disability" },
                { value: "gender_reassignment", label: "Gender reassignment" }, { value: "race", label: "Race" },
                { value: "religion", label: "Religion or belief" }, { value: "sex", label: "Sex" },
                { value: "sexual_orientation", label: "Sexual orientation" },
                { value: "marriage", label: "Marriage and civil partnership" },
            ],
        },
        { id: "pcp", label: "Provision, Criterion or Practice (PCP)", type: "textarea", required: true },
        { id: "group_disadvantage", label: "How Does the PCP Disadvantage the Group?", type: "textarea", required: true },
        { id: "individual_disadvantage", label: "How Are You Personally Disadvantaged?", type: "textarea", required: true },
        { id: "date_of_last_act", label: "Date of Last Act", type: "date", required: true },
        { id: "narrative", label: "Full Account", type: "textarea", required: false },
    ],
};
