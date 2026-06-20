import { describe, it, expect, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// ---------------------------------------------------------------------------
// /api/roadmap (POST)  — builds a Timeline from a date of last act
// /api/roadmap/[caseId] (GET) — static procedural roadmap template (16 stages)
// ---------------------------------------------------------------------------

function makeRequest(body: unknown, method = "POST"): NextRequest {
    return new NextRequest("http://localhost:3000/api/roadmap", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    });
}

// ---------------------------------------------------------------------------
// POST /api/roadmap
// ---------------------------------------------------------------------------
describe("POST /api/roadmap", () => {
    let POST: (req: NextRequest) => Promise<Response>;

    beforeEach(async () => {
        const mod = await import("./route");
        POST = mod.POST;
    });

    it("returns 400 when dateOfLastAct is missing", async () => {
        const req = makeRequest({ claimType: "unfair_dismissal" });
        const res = await POST(req);
        expect(res.status).toBe(400);
        const json = await res.json();
        expect(json.error).toBe("dateOfLastAct is required");
    });

    it("returns 200 with a JSON array of stages for a valid dateOfLastAct", async () => {
        const req = makeRequest({ dateOfLastAct: "2025-06-16", claimType: "unfair_dismissal" });
        const res = await POST(req);
        expect(res.status).toBe(200);
        const json = await res.json();
        expect(Array.isArray(json)).toBe(true);
        expect(json.length).toBeGreaterThan(0);
        // Top-level entry is the Employment Tribunal stage with nested steps.
        const stage = json[0];
        expect(stage.level).toBe("Employment Tribunal");
        expect(stage.abbrev).toBe("ET");
        expect(Array.isArray(stage.steps)).toBe(true);
        expect(stage.steps.length).toBe(3);
        const labels = stage.steps.map((s: { label: string }) => s.label);
        expect(labels).toContain("ACAS Early Conciliation");
        expect(labels).toContain("ET1 Claim Form");
        expect(labels).toContain("Case Management Preliminary Hearing");
    });

    it("defaults claimType when omitted and still returns 200", async () => {
        const req = makeRequest({ dateOfLastAct: "2025-06-16" });
        const res = await POST(req);
        expect(res.status).toBe(200);
        const json = await res.json();
        expect(Array.isArray(json)).toBe(true);
    });
});

// ---------------------------------------------------------------------------
// GET /api/roadmap/[caseId]
// ---------------------------------------------------------------------------
describe("GET /api/roadmap/[caseId]", () => {
    let GET: (req: Request, ctx: { params: Promise<{ caseId: string }> }) => Promise<Response>;

    // FSM order from src/lib/constants / CLAUDE.md Pillar 3.
    const EXPECTED_STAGE_IDS = [
        "PRE_ACTION",
        "ACAS_EC",
        "ET1_FILED",
        "ET3_RECEIVED",
        "CASE_MANAGED",
        "DISCLOSURE",
        "WITNESS_STATEMENTS",
        "BUNDLE_PREP",
        "HEARING",
        "JUDGMENT",
        "EAT_APPEAL",
        "EAT_SIFT",
        "EAT_RULE3_10",
        "EAT_FULL_HEARING",
        "COA_PERMISSION",
        "COA_HEARING",
    ];

    beforeEach(async () => {
        const mod = await import("./[caseId]/route");
        GET = mod.GET;
    });

    it("returns 16 stages with current_stage PRE_ACTION and ids in FSM order", async () => {
        const req = new NextRequest("http://localhost:3000/api/roadmap/case-123", { method: "GET" });
        const res = await GET(req, { params: Promise.resolve({ caseId: "case-123" }) });
        expect(res.status).toBe(200);
        const json = await res.json();

        expect(json.case_id).toBe("case-123");
        expect(json.current_stage).toBe("PRE_ACTION");
        expect(Array.isArray(json.stages)).toBe(true);
        expect(json.stages.length).toBe(16);

        const ids = json.stages.map((s: { id: string }) => s.id);
        expect(ids).toEqual(EXPECTED_STAGE_IDS);
    });
});
