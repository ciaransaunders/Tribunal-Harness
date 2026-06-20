import { describe, it, expect, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// ---------------------------------------------------------------------------
// /api/request-access (POST) — lead capture form.
// Validates name/email/user_type, persists a JSON line under data/, and
// optionally emails via Resend. We unset RESEND_API_KEY so the email step is
// skipped (sendEmailNotification returns early). Persistence to the app data
// dir is acceptable in the node test env; we only assert it does not throw.
// ---------------------------------------------------------------------------

function makeRequest(body: unknown, method = "POST"): NextRequest {
    return new NextRequest("http://localhost:3000/api/request-access", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    });
}

describe("POST /api/request-access", () => {
    let POST: (req: NextRequest) => Promise<Response>;

    beforeEach(async () => {
        // Ensure email is skipped — no API key in test env.
        delete process.env.RESEND_API_KEY;
        delete process.env.NOTIFY_EMAIL;
        const mod = await import("./route");
        POST = mod.POST;
    });

    it("returns 400 when name is missing", async () => {
        const req = makeRequest({ email: "a@b.com", user_type: "lip" });
        const res = await POST(req);
        expect(res.status).toBe(400);
        const json = await res.json();
        expect(json.error).toBe("name, email, and user_type are required");
    });

    it("returns 400 when email is missing", async () => {
        const req = makeRequest({ name: "Ada", user_type: "lip" });
        const res = await POST(req);
        expect(res.status).toBe(400);
        const json = await res.json();
        expect(json.error).toBe("name, email, and user_type are required");
    });

    it("returns 400 when user_type is missing", async () => {
        const req = makeRequest({ name: "Ada", email: "a@b.com" });
        const res = await POST(req);
        expect(res.status).toBe(400);
        const json = await res.json();
        expect(json.error).toBe("name, email, and user_type are required");
    });

    it("returns 400 for an invalid email format", async () => {
        const req = makeRequest({ name: "Ada", email: "not-an-email", user_type: "lip" });
        const res = await POST(req);
        expect(res.status).toBe(400);
        const json = await res.json();
        expect(json.error).toBe("Invalid email format");
    });

    it("returns 400 for an invalid user_type", async () => {
        const req = makeRequest({ name: "Ada", email: "a@b.com", user_type: "wizard" });
        const res = await POST(req);
        expect(res.status).toBe(400);
        const json = await res.json();
        expect(json.error).toContain("user_type must be one of");
    });

    it("returns a success response for valid input (email skipped, persistence does not throw)", async () => {
        const req = makeRequest({
            name: "Ada Lovelace",
            email: "ada@example.com",
            user_type: "lip",
            description: "Interested in the LiP tooling.",
        });
        const res = await POST(req);
        expect(res.status).toBe(200);
        const json = await res.json();
        expect(json.success).toBe(true);
        expect(typeof json.message).toBe("string");
    });

    it("accepts every valid user_type", async () => {
        for (const user_type of ["lip", "solicitor", "legal_aid", "researcher", "other"]) {
            const req = makeRequest({ name: "Ada", email: "ada@example.com", user_type });
            const res = await POST(req);
            expect(res.status, `user_type ${user_type} should be accepted`).toBe(200);
            const json = await res.json();
            expect(json.success).toBe(true);
        }
    });
});
