import type { ClaimSchema } from "./types";

export const victimisationSchema: ClaimSchema = {
    id: "victimisation",
    label: "Victimisation",
    statute: "EA 2010 s27",
    description: "Subjecting a person to a detriment because they have done, or may do, a protected act.",
    legalTest: [
        "Did the claimant do a protected act (or did the employer believe they had/might)?",
        "Was the claimant subjected to a detriment?",
        "Was the detriment because of the protected act?",
    ],
    keyAuthorities: [
        "Derbyshire v St Helens Metropolitan Borough Council [2007] ICR 841",
        "Woodhouse v West North West Homes Leeds Ltd [2013] IRLR 773",
    ],
    fields: [
        {
            id: "protected_act", label: "Protected Act", type: "select", required: true,
            options: [
                { value: "proceedings", label: "Bringing proceedings under the EA 2010" },
                { value: "evidence", label: "Giving evidence or information in connection with proceedings" },
                { value: "allegation", label: "Making an allegation of discrimination" },
                { value: "anything_else", label: "Doing anything else for purposes of the EA 2010" },
            ],
        },
        { id: "protected_act_details", label: "Details of Protected Act", type: "textarea", required: true },
        { id: "detriment", label: "Detriment Suffered", type: "textarea", required: true },
        { id: "date_of_detriment", label: "Date of Detriment", type: "date", required: true },
        { id: "narrative", label: "Full Account", type: "textarea", required: false },
    ],
};
