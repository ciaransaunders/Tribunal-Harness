import { describe, it, expect, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// ---------------------------------------------------------------------------
// POST /api/debate — adversarial 3-agent debate engine
//
// Only the non-LLM branches are covered here:
//   - missing `facts` or `claim_type` → 400
//   - ANTHROPIC_API_KEY unset (client unavailable) → 500 with a clear error,
//     BEFORE any real Claude call is made.
// The real Drafter/Critic/Judge path is NOT exercised (would need a live key).
// ---------------------------------------------------------------------------

function makeRequest(body: unknown): NextRequest {
    return new NextRequest("http://localhost:3000/api/debate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    });
}

describe("POST /api/debate — non-LLM branches", () => {
    let POST: (req: NextRequest) => Promise<Response>;

    beforeEach(async () => {
        // Ensure the client is unavailable so we never hit the real 3-agent path.
        delete process.env.ANTHROPIC_API_KEY;
        const mod = await import("./route");
        POST = mod.POST;
    });

    it("returns 400 when facts is missing", async () => {
        const res = await POST(makeRequest({ claim_type: "unfair_dismissal" }));
        expect(res.status).toBe(400);
        const json = await res.json();
        expect(json.error).toContain("facts");
    });

    it("returns 400 when claim_type is missing", async () => {
        const res = await POST(makeRequest({ facts: "I was dismissed without process" }));
        expect(res.status).toBe(400);
        const json = await res.json();
        expect(json.error).toContain("claim_type");
    });

    it("returns 400 when both fields are missing", async () => {
        const res = await POST(makeRequest({}));
        expect(res.status).toBe(400);
    });

    it("returns 500 when ANTHROPIC_API_KEY is not configured", async () => {
        const res = await POST(
            makeRequest({ facts: "I was dismissed without process", claim_type: "unfair_dismissal" })
        );
        expect(res.status).toBe(500);
        const json = await res.json();
        expect(json.error).toContain("ANTHROPIC_API_KEY");
    });
});
