import { NextRequest, NextResponse } from "next/server";
import { calculateDeadline } from "@/services/deadline-calculator";
import { TimelineStage } from "@/components/analysis/Timeline";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { dateOfLastAct, claimType } = body;

        if (!dateOfLastAct) {
            return NextResponse.json({ error: "dateOfLastAct is required" }, { status: 400 });
        }

        // Calculate actual deadline safely
        const deadlineRes = calculateDeadline(dateOfLastAct, undefined, undefined, claimType || "unfair_dismissal");
        const acasDeadline = new Date(deadlineRes.original_deadline);

        // Add roughly 30 days for ET1 if no ACAS dates provided (simulating standard Early Conciliation pause for roadmap)
        const et1Deadline = new Date(acasDeadline);
        et1Deadline.setUTCDate(et1Deadline.getUTCDate() + 30);

        const primaryDate = new Date(dateOfLastAct);
        const now = new Date();

        const stages: TimelineStage[] = [
            {
                level: "Employment Tribunal",
                abbrev: "ET",
                color: "#8B5CF6", // Purple accent
                steps: [
                    {
                        label: "ACAS Early Conciliation",
                        deadline: acasDeadline,
                        description: `Must contact ACAS before issuing ET1. Regime: ${deadlineRes.regime}.`,
                        status: now > acasDeadline ? "overdue" : "upcoming",
                        critical: true,
                    },
                    {
                        label: "ET1 Claim Form",
                        deadline: et1Deadline,
                        description: "Submit claim to Employment Tribunal within time limit (plus ACAS extension).",
                        status: now > et1Deadline ? "overdue" : "upcoming",
                        critical: true,
                    },
                    {
                        label: "Case Management Preliminary Hearing",
                        deadline: new Date(primaryDate.getTime() + 150 * 24 * 60 * 60 * 1000), // Approx 150 days
                        description: "Tribunal sets directions: disclosure, witness statements, hearing dates.",
                        status: "future",
                        critical: false,
                    }
                ]
            }
        ];

        return NextResponse.json(stages);
    } catch (error) {
        return NextResponse.json(
            { error: "Internal server error", details: String(error) },
            { status: 500 }
        );
    }
}
