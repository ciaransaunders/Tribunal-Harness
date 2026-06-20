import { NextRequest, NextResponse } from "next/server";
import { searchCaseLaw } from "@/services/find-case-law";

/**
 * GET /api/case-law/find
 *
 * Live UK case-law search against The National Archives Find Case Law
 * (caselaw.nationalarchives.gov.uk) — the authoritative free source. Unlike
 * /api/case-law/search (curated seed data), this hits the primary source at
 * request time, so the engine can find relevant authorities without a
 * pre-built RAG corpus.
 *
 * Query params:
 *   q | query   (required) — full-text search, e.g. "unfair dismissal whistleblowing"
 *   court       (optional)  — court slug, e.g. "eat", "uksc", "ewca/civ"
 *   limit       (optional)  — 1..50 (default 10)
 *
 * Returns the structured envelope from find-case-law: { status, results, detail?, total? }.
 * status is one of ok | empty | not_found | upstream_timeout | upstream_unavailable | error.
 * Coverage is ~2003 onward; older landmark authorities live in the curated
 * verified-authorities database.
 */
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const q = (searchParams.get("q") || searchParams.get("query") || "").trim();

    if (!q) {
        return NextResponse.json(
            { error: "Query parameter 'q' is required." },
            { status: 400 }
        );
    }

    const court = searchParams.get("court")?.trim() || undefined;
    const limitRaw = parseInt(searchParams.get("limit") || "10", 10);
    const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(limitRaw, 1), 50) : 10;

    const envelope = await searchCaseLaw({ query: q, court, limit });

    // Always 200 with the structured envelope — the `status` field carries the
    // ok/empty/upstream_* distinction so the client never confabulates results.
    return NextResponse.json(envelope);
}
