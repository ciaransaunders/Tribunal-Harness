import { describe, it, expect, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// ---------------------------------------------------------------------------
// POST /api/triage — document triage (multipart upload)
//
// Non-LLM branches covered here (ANTHROPIC_API_KEY deleted in beforeEach):
//   - no `document` field          → 400
//   - unsupported file extension   → 400
//   - .txt upload, no API key      → 200 degraded response with extracted text
//
// The real Claude triage path is NOT exercised (would need a live key).
// File / FormData are global in Node 18+ (undici); guarded just in case.
// ---------------------------------------------------------------------------

const hasFile = typeof File !== "undefined" && typeof FormData !== "undefined";

function makeRequest(form: FormData): NextRequest {
    return new NextRequest("http://localhost:3000/api/triage", {
        method: "POST",
        body: form,
    });
}

describe.skipIf(!hasFile)("POST /api/triage — non-LLM branches", () => {
    let POST: (req: NextRequest) => Promise<Response>;

    beforeEach(async () => {
        delete process.env.ANTHROPIC_API_KEY;
        const mod = await import("./route");
        POST = mod.POST;
    });

    it("returns 400 when no document is provided", async () => {
        const form = new FormData();
        const res = await POST(makeRequest(form));
        expect(res.status).toBe(400);
        const json = await res.json();
        expect(json.error).toContain("No document");
    });

    it("returns 400 for an unsupported file extension", async () => {
        const form = new FormData();
        form.append(
            "document",
            new File(["binary-ish content"], "evidence.exe", { type: "application/octet-stream" })
        );
        const res = await POST(makeRequest(form));
        expect(res.status).toBe(400);
        const json = await res.json();
        expect(json.error).toContain("Unsupported file type");
    });

    it("returns a 200 degraded response for a .txt file when no API key is set", async () => {
        const textContent = "I was dismissed on 14 January 2025 without any disciplinary process.";
        const form = new FormData();
        form.append("document", new File([textContent], "narrative.txt", { type: "text/plain" }));
        const res = await POST(makeRequest(form));
        expect(res.status).toBe(200);
        const json = await res.json();
        // Degraded shape per route.ts
        expect(json.updated_fields).toEqual({});
        expect(Array.isArray(json.query_array)).toBe(true);
        expect(json.query_array[0].field_id).toBe("narrative");
        expect(json.extracted_text).toBe(textContent);
        expect(json.document_summary).toContain("narrative.txt");
        expect(json.document_summary).toContain(String(textContent.length));
    });
});
