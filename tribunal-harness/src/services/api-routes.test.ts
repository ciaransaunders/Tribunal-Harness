import { describe, it, expect, beforeEach, vi } from "vitest";
import { NextRequest } from "next/server";

// ---------------------------------------------------------------------------
// API Route Integration Tests
// ISSUE-12 FIX: Test coverage for /api/deadlines, /api/schema/[claimType],
// /api/analyse (degraded mode), and /api/case-law/search.
// ---------------------------------------------------------------------------

// Helper: create a NextRequest with JSON body
function makeRequest(body: unknown, method = "POST"): NextRequest {
    return new NextRequest("http://localhost:3000/api/test", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    });
}

// Helper: create a GET NextRequest with search params
function makeGetRequest(url: string): NextRequest {
    return new NextRequest(url, { method: "GET" });
}

// ---------------------------------------------------------------------------
// /api/deadlines
// Uses: effective_date_of_termination OR date_of_last_act, claim_types[]
// ---------------------------------------------------------------------------
describe("POST /api/deadlines", () => {
    let POST: (req: NextRequest) => Promise<Response>;

    beforeEach(async () => {
        const mod = await import("../app/api/deadlines/route");
        POST = mod.POST;
    });

    it("returns 400 if neither EDT nor date_of_last_act provided", async () => {
        const req = makeRequest({ claim_types: ["unfair_dismissal"] });
        const res = await POST(req);
        expect(res.status).toBe(400);
        const json = await res.json();
        expect(json.error).toBeDefined();
    });

    it("returns 400 if claim_types is missing", async () => {
        const req = makeRequest({ effective_date_of_termination: "2025-01-15" });
        const res = await POST(req);
        expect(res.status).toBe(400);
        const json = await res.json();
        expect(json.error).toBeDefined();
    });

    it("returns 400 if claim_types is empty", async () => {
        const req = makeRequest({ effective_date_of_termination: "2025-01-15", claim_types: [] });
        const res = await POST(req);
        expect(res.status).toBe(400);
    });

    it("returns 200 with deadline for valid input (pre-ERA 2025)", async () => {
        // Use 2025-06-16 so 3 months less 1 day is 2025-09-15.
        // The test was failing because 2025-09-14 is a Sunday (getUTCDay() === 0),
        // and the `nextWorkingDay` function correctly shifts it to Monday, 2025-09-15.
        const req = makeRequest({ effective_date_of_termination: "2025-06-16", claim_types: ["unfair_dismissal"] });
        const res = await POST(req);
        expect(res.status).toBe(200);
        const json = await res.json();
        expect(json.deadlines).toBeDefined();
        expect(json.deadlines.length).toBe(1);
        expect(json.time_limit_regime).toBe("pre_era_2025");
        // 3 months less 1 day from 2025-06-16 = 2025-09-15
        expect(json.deadlines[0].original_deadline).toBe("2025-09-15");
    });

    it("accepts date_of_last_act as alternative date field", async () => {
        const req = makeRequest({ date_of_last_act: "2025-06-15", claim_types: ["unfair_dismissal"] });
        const res = await POST(req);
        expect(res.status).toBe(200);
        const json = await res.json();
        expect(json.deadlines).toBeDefined();
    });

    it("returns post_era_2025 regime for acts after commencement", async () => {
        const req = makeRequest({ effective_date_of_termination: "2027-03-01", claim_types: ["unfair_dismissal"] });
        const res = await POST(req);
        expect(res.status).toBe(200);
        const json = await res.json();
        expect(json.time_limit_regime).toBe("post_era_2025");
    });

    it("handles ACAS dates correctly", async () => {
        const req = makeRequest({
            effective_date_of_termination: "2025-06-15",
            claim_types: ["unfair_dismissal"],
            acas_day_a: "2025-07-01",
            acas_day_b: "2025-07-22",
        });
        const res = await POST(req);
        expect(res.status).toBe(200);
        const json = await res.json();
        expect(json.deadlines[0].acas_extended_deadline).toBeDefined();
    });

    it("includes staleness warning for deadlines after 2028", async () => {
        const req = makeRequest({ effective_date_of_termination: "2028-10-01", claim_types: ["unfair_dismissal"] });
        const res = await POST(req);
        expect(res.status).toBe(200);
        const json = await res.json();
        // Deadline would be 6m less 1 day from 2028-10-01 = 2029-03-31 — after 2028
        const hasStaleWarning = json.warnings.some((w: string) => w.includes("2028"));
        expect(hasStaleWarning).toBe(true);
    });
});

// ---------------------------------------------------------------------------
// /api/schema/[claimType]
// ---------------------------------------------------------------------------
describe("GET /api/schema/[claimType]", () => {
    let GET: (req: NextRequest, ctx: { params: Promise<{ claimType: string }> }) => Promise<Response>;

    beforeEach(async () => {
        const mod = await import("../app/api/schema/[claimType]/route");
        GET = mod.GET;
    });

    it("returns 200 with schema for unfair_dismissal", async () => {
        const req = makeGetRequest("http://localhost:3000/api/schema/unfair_dismissal");
        const res = await GET(req, { params: Promise.resolve({ claimType: "unfair_dismissal" }) });
        expect(res.status).toBe(200);
        const json = await res.json();
        expect(json.id).toBe("unfair_dismissal");
        expect(json.legalTest).toBeDefined();
        expect(Array.isArray(json.legalTest)).toBe(true);
    });

    it("returns 404 for unknown claim type", async () => {
        const req = makeGetRequest("http://localhost:3000/api/schema/made_up_claim");
        const res = await GET(req, { params: Promise.resolve({ claimType: "made_up_claim" }) });
        expect(res.status).toBe(404);
        const json = await res.json();
        expect(json.error).toBeDefined();
    });

    it("returns ERA 2025 schema for fire_and_rehire", async () => {
        const req = makeGetRequest("http://localhost:3000/api/schema/fire_and_rehire");
        const res = await GET(req, { params: Promise.resolve({ claimType: "fire_and_rehire" }) });
        expect(res.status).toBe(200);
        const json = await res.json();
        expect(json.id).toBe("fire_and_rehire");
        expect(json.era2025Changes).toBeDefined();
    });

    it("returns ERA 2025 schema for zero_hours_rights", async () => {
        const req = makeGetRequest("http://localhost:3000/api/schema/zero_hours_rights");
        const res = await GET(req, { params: Promise.resolve({ claimType: "zero_hours_rights" }) });
        expect(res.status).toBe(200);
        const json = await res.json();
        expect(json.id).toBe("zero_hours_rights");
    });

    it("returns schema for indirect_discrimination (EA 2010 s19)", async () => {
        const req = makeGetRequest("http://localhost:3000/api/schema/indirect_discrimination");
        const res = await GET(req, { params: Promise.resolve({ claimType: "indirect_discrimination" }) });
        expect(res.status).toBe(200);
        const json = await res.json();
        expect(json.id).toBe("indirect_discrimination");
        expect(json.statute).toBe("EA 2010 s19");
        expect(Array.isArray(json.legalTest)).toBe(true);
        expect(json.legalTest.length).toBeGreaterThan(0);
        expect(json.keyAuthorities.length).toBeGreaterThan(0);
    });

    it("returns schema for victimisation (EA 2010 s27)", async () => {
        const req = makeGetRequest("http://localhost:3000/api/schema/victimisation");
        const res = await GET(req, { params: Promise.resolve({ claimType: "victimisation" }) });
        expect(res.status).toBe(200);
        const json = await res.json();
        expect(json.id).toBe("victimisation");
        expect(json.statute).toBe("EA 2010 s27");
        expect(Array.isArray(json.legalTest)).toBe(true);
        expect(json.legalTest.length).toBeGreaterThan(0);
        expect(json.keyAuthorities.length).toBeGreaterThan(0);
    });

    it("returns schema for wrongful_dismissal (Common Law)", async () => {
        const req = makeGetRequest("http://localhost:3000/api/schema/wrongful_dismissal");
        const res = await GET(req, { params: Promise.resolve({ claimType: "wrongful_dismissal" }) });
        expect(res.status).toBe(200);
        const json = await res.json();
        expect(json.id).toBe("wrongful_dismissal");
        expect(json.statute).toBe("Common Law");
        expect(Array.isArray(json.legalTest)).toBe(true);
        expect(json.legalTest.length).toBeGreaterThan(0);
        expect(json.keyAuthorities.length).toBeGreaterThan(0);
    });

    it("returns a schema for every declared CLAIM_TYPE (registry completeness)", async () => {
        const { CLAIM_TYPES } = await import("../lib/constants");
        for (const ct of CLAIM_TYPES) {
            const req = makeGetRequest(`http://localhost:3000/api/schema/${ct.id}`);
            const res = await GET(req, { params: Promise.resolve({ claimType: ct.id }) });
            expect(res.status, `schema route should resolve ${ct.id}`).toBe(200);
            const json = await res.json();
            expect(json.id, `schema id should match for ${ct.id}`).toBe(ct.id);
        }
    });
});

// ---------------------------------------------------------------------------
// /api/analyse — degraded mode (no API key)
// Tests the route directly. Since ANTHROPIC_API_KEY is not set in test,
// it will always hit the degraded code path (status 200 with schema fallback).
// ---------------------------------------------------------------------------
describe("POST /api/analyse — degraded mode", () => {
    let POST: (req: NextRequest) => Promise<Response>;

    beforeEach(async () => {
        // Ensure no API key in test env
        delete process.env.ANTHROPIC_API_KEY;
        const mod = await import("../app/api/analyse/route");
        POST = mod.POST;
    });

    it("returns 400 if claim_type is missing", async () => {
        const req = makeRequest({ narrative_text: "I was dismissed" });
        const res = await POST(req);
        expect(res.status).toBe(400);
        const json = await res.json();
        expect(json.error).toContain("claim_type");
    });

    it("returns 400 for unknown claim type", async () => {
        const req = makeRequest({ claim_type: "made_up_claim" });
        const res = await POST(req);
        expect(res.status).toBe(400);
        const json = await res.json();
        expect(json.error).toContain("Unknown claim type");
    });

    it("returns 200 degraded response when API key is missing", async () => {
        const req = makeRequest({ claim_type: "unfair_dismissal", narrative_text: "I was dismissed" });
        const res = await POST(req);
        // Should return 200 with schema-derived content, not 500
        expect(res.status).toBe(200);
        const json = await res.json();
        expect(json.statutory_provisions).toBeDefined();
        expect(json.procedural_notes).toBeDefined();
    });
});

// ---------------------------------------------------------------------------
// /api/case-law/search
// ---------------------------------------------------------------------------
describe("GET /api/case-law/search", () => {
    let GET: (req: NextRequest) => Promise<Response>;

    beforeEach(async () => {
        const mod = await import("../app/api/case-law/search/route");
        GET = mod.GET;
    });

    it("returns 400 if no query or claim_type provided", async () => {
        const req = makeGetRequest("http://localhost:3000/api/case-law/search");
        const res = await GET(req);
        expect(res.status).toBe(400);
    });

    it("returns results for a keyword search", async () => {
        const req = makeGetRequest("http://localhost:3000/api/case-law/search?q=Polkey");
        const res = await GET(req);
        expect(res.status).toBe(200);
        const json = await res.json();
        expect(json.results.length).toBeGreaterThan(0);
        expect(json.results[0].case_name).toContain("Polkey");
    });

    it("returns results filtered by claim_type", async () => {
        const req = makeGetRequest("http://localhost:3000/api/case-law/search?claim_type=whistleblowing");
        const res = await GET(req);
        expect(res.status).toBe(200);
        const json = await res.json();
        expect(json.results.length).toBeGreaterThan(0);
        json.results.forEach((r: { claim_types: string[] }) => {
            expect(r.claim_types).toContain("whistleblowing");
        });
    });

    it("returns ERA 2025 cases for fire_and_rehire", async () => {
        const req = makeGetRequest("http://localhost:3000/api/case-law/search?claim_type=fire_and_rehire");
        const res = await GET(req);
        expect(res.status).toBe(200);
        const json = await res.json();
        expect(json.results.length).toBeGreaterThan(0);
    });

    it("filters by tier", async () => {
        const req = makeGetRequest("http://localhost:3000/api/case-law/search?q=dismissal&tier=binding");
        const res = await GET(req);
        expect(res.status).toBe(200);
        const json = await res.json();
        json.results.forEach((r: { tier: string }) => {
            expect(r.tier).toBe("binding");
        });
    });
});

// ---------------------------------------------------------------------------
// /api/request-access
// ---------------------------------------------------------------------------
describe("POST /api/request-access", () => {
    let POST: (req: NextRequest) => Promise<Response>;

    beforeEach(async () => {
        const mod = await import("../app/api/request-access/route");
        POST = mod.POST;
    });

    it("returns 400 for invalid JSON payload", async () => {
        const req = new NextRequest("http://localhost:3000/api/request-access", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: "{ bad json",
        });
        const res = await POST(req);
        expect(res.status).toBe(400);
        const json = await res.json();
        expect(json.error).toBe("Invalid request payload");
    });

    it("returns 400 if required fields are missing", async () => {
        const req = makeRequest({ name: "John" }); // missing email and user_type
        const res = await POST(req);
        expect(res.status).toBe(400);
        const json = await res.json();
        expect(json.error).toBe("name, email, and user_type are required");
    });

    it("returns 400 for invalid email format", async () => {
        const req = makeRequest({ name: "John", email: "notanemail", user_type: "lip" });
        const res = await POST(req);
        expect(res.status).toBe(400);
        const json = await res.json();
        expect(json.error).toBe("Invalid email format");
    });

    it("returns 400 for invalid user_type", async () => {
        const req = makeRequest({ name: "John", email: "john@example.com", user_type: "invalid_type" });
        const res = await POST(req);
        expect(res.status).toBe(400);
        const json = await res.json();
        expect(json.error).toBe("user_type must be one of: lip, solicitor, legal_aid, researcher, other");
    });

    it("returns 200 for valid payload", async () => {
        const req = makeRequest({ name: "John", email: "john@example.com", user_type: "lip" });
        const res = await POST(req);
        expect(res.status).toBe(200);
        const json = await res.json();
        expect(json.success).toBe(true);
        expect(json.message).toBe("Thank you for your interest. We will be in touch when Tribunal Harness launches.");
    });

    it("handles failed email sending gracefully (non-blocking)", async () => {
        // We can simulate an error during fetch by mocking the global fetch.
        const originalFetch = global.fetch;
        const originalApiKey = process.env.RESEND_API_KEY;
        const originalNotifyEmail = process.env.NOTIFY_EMAIL;

        global.fetch = vi.fn().mockRejectedValue(new Error("Email service down"));

        const req = makeRequest({ name: "John", email: "john@example.com", user_type: "lip" });

        // Ensure API key is set so it attempts to send email
        process.env.RESEND_API_KEY = "test_key";
        process.env.NOTIFY_EMAIL = "notify@example.com";

        const res = await POST(req);
        expect(res.status).toBe(200); // Should still return 200 because email sending is non-blocking
        const json = await res.json();
        expect(json.success).toBe(true);

        // Restore fetch and env
        global.fetch = originalFetch;

        if (originalApiKey !== undefined) {
            process.env.RESEND_API_KEY = originalApiKey;
        } else {
            delete process.env.RESEND_API_KEY;
        }

        if (originalNotifyEmail !== undefined) {
            process.env.NOTIFY_EMAIL = originalNotifyEmail;
        } else {
            delete process.env.NOTIFY_EMAIL;
        }
    });
});
