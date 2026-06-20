import type { ClaimSchema } from "./types";

export const reasonableAdjustmentsSchema: ClaimSchema = {
    id: "reasonable_adjustments",
    label: "Failure to Make Reasonable Adjustments",
    statute: "EA 2010 ss20-21",
    description: "An employer's failure to make reasonable adjustments for a disabled employee where a PCP, physical feature, or lack of auxiliary aid puts them at a substantial disadvantage.",
    legalTest: [
        "Is the claimant a disabled person within the meaning of EA 2010 s6?",
        "Did a PCP / physical feature / lack of auxiliary aid put the claimant at a substantial disadvantage compared to non-disabled persons?",
        "Did the employer know, or ought they reasonably to have known, about the disability and the disadvantage?",
        "Were there steps that were reasonable for the employer to take to avoid the disadvantage?",
        "Did the employer fail to take those steps?",
    ],
    keyAuthorities: [
        "Environment Agency v Rowan [2008] ICR 218",
        "Archibald v Fife Council [2004] ICR 954",
        "Smith v Churchills Stairlifts Plc [2006] ICR 524",
    ],
    fields: [
        { id: "disability", label: "Disability / Condition", type: "text", required: true },
        {
            id: "employer_knowledge", label: "Did the Employer Know About Your Disability?", type: "select", required: true,
            options: [
                { value: "actual", label: "Yes — informed employer directly" },
                { value: "constructive", label: "Should have known — obvious signs / medical evidence" },
                { value: "denied", label: "Employer denies knowledge" },
            ],
        },
        {
            id: "disadvantage_type", label: "Source of Disadvantage", type: "select", required: true,
            options: [
                { value: "pcp", label: "Provision, criterion or practice" },
                { value: "physical", label: "Physical feature of premises" },
                { value: "auxiliary", label: "Lack of auxiliary aid" },
            ],
        },
        { id: "disadvantage_details", label: "Describe the Substantial Disadvantage", type: "textarea", required: true },
        { id: "adjustments_requested", label: "Adjustments Requested", type: "textarea", required: true },
        { id: "adjustments_provided", label: "Adjustments Actually Provided", type: "textarea", required: false },
        { id: "date_of_last_act", label: "Date of Last Failure to Adjust", type: "date", required: true },
        { id: "narrative", label: "Full Account", type: "textarea", required: false },
    ],
};
