import { describe, it, expect, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { createHmac } from "node:crypto";

// ---------------------------------------------------------------------------
// POST /api/webhook — HMAC-SHA256 verified Phase 4 stub
//
// Documented behaviour (see route.ts):
//   - WEBHOOK_SECRET unset                → 503 (not configured)
//   - missing / invalid X-Webhook-Signature → 403
//   - valid HMAC sha256=<hex>             → 200 acknowledged
//   - valid signature but malformed JSON  → 400
// ---------------------------------------------------------------------------

const SECRET = "test-webhook-secret-123";

function sign(rawBody: string, secret: string): string {
    return "sha256=" + createHmac("sha256", secret).update(rawBody).digest("hex");
}

function makeRequest(rawBody: string, signature?: string): NextRequest {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (signature !== undefined) {
        headers["x-webhook-signature"] = signature;
    }
    return new NextRequest("http://localhost:3000/api/webhook", {
        method: "POST",
        headers,
        body: rawBody,
    });
}

describe("POST /api/webhook", () => {
    let POST: (req: NextRequest) => Promise<Response>;

    beforeEach(async () => {
        process.env.WEBHOOK_SECRET = SECRET;
        const mod = await import("./route");
        POST = mod.POST;
    });

    it("returns 503 when WEBHOOK_SECRET is not configured", async () => {
        delete process.env.WEBHOOK_SECRET;
        const rawBody = JSON.stringify({ event: "test" });
        const res = await POST(makeRequest(rawBody, sign(rawBody, SECRET)));
        expect(res.status).toBe(503);
        const json = await res.json();
        expect(json.error).toContain("WEBHOOK_SECRET");
    });

    it("returns 403 when the signature header is missing", async () => {
        const rawBody = JSON.stringify({ event: "test" });
        const res = await POST(makeRequest(rawBody));
        expect(res.status).toBe(403);
        const json = await res.json();
        expect(json.error).toContain("signature");
    });

    it("returns 403 when the signature is invalid", async () => {
        const rawBody = JSON.stringify({ event: "test" });
        const res = await POST(makeRequest(rawBody, "sha256=deadbeef"));
        expect(res.status).toBe(403);
    });

    it("returns 403 when the body is signed with the wrong secret", async () => {
        const rawBody = JSON.stringify({ event: "test" });
        const res = await POST(makeRequest(rawBody, sign(rawBody, "wrong-secret")));
        expect(res.status).toBe(403);
    });

    it("returns 200 acknowledged for a valid HMAC-signed JSON body", async () => {
        const rawBody = JSON.stringify({ event: "et1_filed", caseId: "abc" });
        const res = await POST(makeRequest(rawBody, sign(rawBody, SECRET)));
        expect(res.status).toBe(200);
        const json = await res.json();
        expect(json.status).toBe("acknowledged");
        expect(json.phase).toBe(4);
    });

    it("returns 400 when the signature is valid but the body is not JSON", async () => {
        const rawBody = "not-json-at-all";
        const res = await POST(makeRequest(rawBody, sign(rawBody, SECRET)));
        expect(res.status).toBe(400);
        const json = await res.json();
        expect(json.error).toContain("JSON");
    });
});
