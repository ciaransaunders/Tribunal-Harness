import { NextRequest, NextResponse } from "next/server";
import { getJudgmentMarkdown } from "@/services/find-case-law";

// pdf-parse needs the Node.js runtime (not Edge).
export const runtime = "nodejs";

/**
 * GET /api/case-law/judgment?slug=<tna-slug>
 *
 * Fetches a UK judgment from TNA Find Case Law (by slug, e.g. "eat/2026/90")
 * and returns it as clean Markdown — so the engine/LLM can read the full
 * judgment as Markdown before reasoning, instead of raw PDF bytes.
 *
 * Get slugs from GET /api/case-law/find. Returns { slug, status, markdown?,
 * pages?, sourceUrl, detail? }. status is ok | empty | not_pdf | too_large |
 * forbidden_host | upstream_timeout | upstream_unavailable | error.
 */
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const slug = (searchParams.get("slug") || "").trim();

    if (!slug) {
        return NextResponse.json(
            { error: "Query parameter 'slug' is required (e.g. ?slug=eat/2026/90)." },
            { status: 400 }
        );
    }

    const result = await getJudgmentMarkdown(slug);
    return NextResponse.json(result);
}
