import { NextResponse } from "next/server";
import { ERA_2025, formatCommencementMonth } from "@/lib/constants";

/**
 * GET /api/roadmap/[caseId]
 *
 * Returns procedural roadmap with all stages (ET → EAT → CoA).
 */

const ROADMAP_STAGES = [
    { id: "PRE_ACTION", label: "Pre-Action", phase: "ET", description: "Assess claim viability, gather evidence, calculate time limits", actions: ["Run gap analysis", "Identify claim types", "Calculate deadlines"], era2025_note: `Time limits change from ${formatCommencementMonth(ERA_2025.ET_TIME_LIMIT_6_MONTHS)} — check which regime applies` },
    { id: "ACAS_EC", label: "ACAS Early Conciliation", phase: "ET", description: "Mandatory pre-claim conciliation (up to 6 weeks)", actions: ["Notify ACAS", "Engage in conciliation", "Obtain EC certificate"], era2025_note: null },
    { id: "ET1_FILED", label: "ET1 Filed", phase: "ET", description: "Claim form submitted to Employment Tribunal", actions: ["Complete ET1 form", "Attach supporting documents", "Pay fee (if applicable)"], era2025_note: null },
    { id: "ET3_RECEIVED", label: "ET3 Response", phase: "ET", description: "Respondent files defence (28 days)", actions: ["Review ET3", "Identify disputed facts", "Consider default judgment"], era2025_note: null },
    { id: "CASE_MANAGED", label: "Case Management", phase: "ET", description: "Preliminary hearing for directions", actions: ["Prepare case summary", "Draft proposed directions", "Attend PH"], era2025_note: null },
    { id: "DISCLOSURE", label: "Disclosure", phase: "ET", description: "Exchange of relevant documents", actions: ["Prepare disclosure list", "Review respondent's disclosure", "Apply for specific disclosure if needed"], era2025_note: null },
    { id: "WITNESS_STATEMENTS", label: "Witness Statements", phase: "ET", description: "Preparation and simultaneous exchange", actions: ["Draft witness statements", "Obtain supporting statements", "Exchange on deadline"], era2025_note: null },
    { id: "BUNDLE_PREP", label: "Bundle Preparation", phase: "ET", description: "Agreed hearing bundle compiled", actions: ["Agree bundle contents", "Paginate and index", "Submit to tribunal"], era2025_note: null },
    { id: "HEARING", label: "Final Hearing", phase: "ET", description: "Full merits hearing before tribunal panel", actions: ["Prepare skeleton argument", "Compile authorities bundle", "Attend hearing"], era2025_note: `From ${formatCommencementMonth(ERA_2025.QUALIFYING_PERIOD_6_MONTHS)}: qualifying period for UD = 6 months, no compensatory cap` },
    { id: "JUDGMENT", label: "Judgment", phase: "ET", description: "Tribunal decision", actions: ["Request written reasons (14 days)", "Assess grounds of appeal", "Consider remedy hearing"], era2025_note: null },
    { id: "EAT_APPEAL", label: "Notice of Appeal", phase: "EAT", description: "Appeal on point of law (42 days from written reasons)", actions: ["Draft Notice of Appeal", "Identify error of law", "File with EAT"], era2025_note: null },
    { id: "EAT_SIFT", label: "EAT Sift", phase: "EAT", description: "Registrar/judge reviews on paper", actions: ["Await sift decision", "Prepare for Rule 3(10) if needed"], era2025_note: null },
    { id: "EAT_RULE3_10", label: "Rule 3(10) Hearing", phase: "EAT", description: "Oral hearing to argue appeal should proceed", actions: ["Prepare oral submissions", "Attend hearing"], era2025_note: null },
    { id: "EAT_FULL_HEARING", label: "EAT Full Hearing", phase: "EAT", description: "Full appeal hearing", actions: ["Prepare skeleton", "Compile authorities", "Attend hearing"], era2025_note: null },
    { id: "COA_PERMISSION", label: "Court of Appeal Permission", phase: "CoA", description: "Application for permission to appeal", actions: ["Draft grounds", "Permission application"], era2025_note: null },
    { id: "COA_HEARING", label: "Court of Appeal Hearing", phase: "CoA", description: "Full hearing before CoA", actions: ["Instruct counsel (recommended)", "Prepare skeleton", "Attend hearing"], era2025_note: null },
];

export async function GET(
    request: Request,
    { params }: { params: Promise<{ caseId: string }> }
) {
    const { caseId } = await params;

    return NextResponse.json({
        case_id: caseId,
        stages: ROADMAP_STAGES,
        current_stage: "PRE_ACTION",
        note: "Stage tracking requires Temporal.io integration (Phase 4). Currently showing full roadmap template.",
    });
}
