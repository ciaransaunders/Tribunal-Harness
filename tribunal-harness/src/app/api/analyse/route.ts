import { NextRequest, NextResponse } from "next/server";
import type { AnalyseRequest, Authority } from "@/schemas/types";
import { getSchema } from "@/schemas";
import { ERA_2025 } from "@/lib/constants";
import { validateAllCitationsAuthoritative } from "@/services/citation-validator";
import { ANALYSE_PROMPT_v2, PROMPT_VERSIONS } from "@/agents/prompts";
import { callClaude, isClientAvailable } from "@/lib/claude-client";
import { refineForUser } from "@/services/legal-writing-refinement";

/**
 * POST /api/analyse
 *
 * Main analysis endpoint. Receives claim data, calls Claude API
 * with an ERA 2025-aware system prompt, and returns structured analysis.
 *
 * Model routing:
 * - Standard complexity → Sonnet (via 'analyse' config)
 * - High complexity → Opus (via 'analyse_complex' config)
 *
 * Set { complexity: "high" } in request body to trigger Opus routing.
 */

// Extremely basic in-memory rate limiter for demo purposes
// In production, use Vercel KV or Upstash Redis
const rateLimitMap = new Map<string, { count: number; timestamps: number[] }>();
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const RATE_LIMIT_MAX_REQUESTS = 10;

function checkRateLimit(ip: string): boolean {
    const now = Date.now();
    const record = rateLimitMap.get(ip) || { count: 0, timestamps: [] };

    // Clean up old timestamps
    record.timestamps = record.timestamps.filter((ts) => now - ts < RATE_LIMIT_WINDOW_MS);

    if (record.timestamps.length >= RATE_LIMIT_MAX_REQUESTS) {
        return false;
    }

    record.timestamps.push(now);
    record.count = record.timestamps.length;
    rateLimitMap.set(ip, record);
    return true;
}

export async function POST(request: NextRequest) {
    const startTime = Date.now();
    try {
        // Implement rate limiting
        const ip = request.headers.get("x-forwarded-for") || "unknown-ip";
        if (!checkRateLimit(ip)) {
            console.warn(`[API] Rate limit exceeded for IP: ${ip}`);
            return NextResponse.json(
                { error: "Rate limit exceeded. Please try again later." },
                { status: 429 }
            );
        }

        const body = (await request.json()) as AnalyseRequest & { complexity?: "standard" | "high" };

        // Validate required fields
        if (!body.claim_type) {
            return NextResponse.json(
                { error: "claim_type is required" },
                { status: 400 }
            );
        }

        // Validate narrative length if in narrative mode
        if (body.mode === "narrative" && (!body.narrative_text || body.narrative_text.trim().length < 50)) {
            return NextResponse.json(
                { error: "Please provide a more detailed narrative (minimum 50 characters) so the engine can accurately assess your claim." },
                { status: 400 }
            );
        }

        // Check schema exists
        const schema = getSchema(body.claim_type);
        if (!schema) {
            return NextResponse.json(
                { error: `Unknown claim type: ${body.claim_type}` },
                { status: 400 }
            );
        }

        // Graceful degradation when API key is not configured
        if (!isClientAvailable()) {
            return NextResponse.json(
                {
                    error: "ANTHROPIC_API_KEY not configured",
                    message:
                        "Set the ANTHROPIC_API_KEY environment variable in .env.local to enable AI analysis.",
                    claims: [],
                    authorities: [],
                    statutory_provisions: [
                        {
                            statute: schema.statute,
                            section: schema.label,
                            relevance: schema.description,
                        },
                    ],
                    procedural_notes: [
                        "AI analysis requires an Anthropic API key. The schema and legal test are shown below.",
                        ...schema.legalTest.map((t, i) => `${i + 1}. ${t}`),
                    ],
                    era_2025_flags: (schema.era2025Changes || []).map((change) => ({
                        provision: change,
                        applies: true,
                        reason: "ERA 2025 provision relevant to this claim type",
                        commencement_date: "See implementation tracker",
                        status: "upcoming" as const,
                    })),
                    refinement: { applied: false, reason: "llm-unavailable" },
                },
                { status: 200 } // Return 200 with degraded response, not 500
            );
        }

        // Build the user message
        const userMessage = buildUserMessage(body, schema);

        // Determine endpoint config based on complexity
        const endpoint = body.complexity === "high" ? "analyse_complex" : "analyse";

        // Call Claude via centralised client
        const result = await callClaude({
            endpoint,
            system: ANALYSE_PROMPT_v2,
            userMessage,
            promptVersion: PROMPT_VERSIONS.ANALYSE,
        });

        if (!result) {
            // Should not happen if isClientAvailable() passed, but defensive
            return NextResponse.json(
                { error: "Claude client unavailable" },
                { status: 500 }
            );
        }

        // Try to parse as JSON
        try {
            const parsed = JSON.parse(result.content);

            // Epistemic Quarantine: verify citations against the curated known-good
            // database AND double-check them live against The National Archives Find
            // Case Law (find-case-law.ts). Never throws — degrades to the curated
            // verdict if the live source is unreachable.
            if (parsed.authorities && Array.isArray(parsed.authorities)) {
                const validation = await validateAllCitationsAuthoritative(parsed.authorities);

                // Override Claude's self-reported trust with our verification.
                parsed.authorities = parsed.authorities.map((auth: Authority, index: number) => {
                    const vr = validation.results[index];
                    return {
                        ...auth,
                        verified: vr.trustLevel === "VERIFIED",
                        trust_level: vr.trustLevel,
                        validation_reason: vr.reason,
                        matched_case: vr.matchedName,
                        matched_citation: vr.matchedCitation,
                        source_url: vr.url,
                        verification_source: vr.source,
                    };
                });

                // Attach summary to response for analytics/debugging
                parsed.quarantine_summary = validation.summary;
            }

            // Attach debug metadata
            parsed._debug = result.debug;

            // Refinement pass — style polish over allowlisted prose fields.
            // Never throws; returns refinement metadata for the response.
            const { payload: refined, refinement } = await refineForUser(
                "analyse",
                parsed
            );
            (refined as Record<string, unknown>).refinement = refinement;
            return NextResponse.json(refined);
        } catch {
            const duration = Date.now() - startTime;
            console.warn(`[API /api/analyse] Failed to parse JSON, returning raw text. Duration: ${duration}ms`);
            // If Claude didn't return valid JSON, wrap in structured response
            const fallback = {
                claims: [],
                authorities: [],
                statutory_provisions: [],
                procedural_notes: [result.content],
                era_2025_flags: [],
                raw_analysis: result.content,
                _debug: {
                    ...result.debug,
                    error: "JSON mapping failed"
                }
            };
            const { payload: refined, refinement } = await refineForUser(
                "analyse",
                fallback
            );
            (refined as Record<string, unknown>).refinement = refinement;
            return NextResponse.json(refined);
        }
    } catch (error) {
        const duration = Date.now() - startTime;
        console.error(`[API /api/analyse] Error. Duration: ${duration}ms`, error);
        return NextResponse.json(
            { error: "Internal server error", details: String(error) },
            { status: 500 }
        );
    }
}

function buildUserMessage(body: AnalyseRequest, schema: import("@/schemas/types").ClaimSchema): string {
    const parts = [
        `Claim type: ${body.claim_type}`,
        `Mode: ${body.mode}`,
        `Schema: ${schema.label} (${schema.statute})`,
    ];

    if (body.narrative_text) {
        parts.push(`\nNarrative:\n${body.narrative_text}`);
    }

    if (body.key_dates && Object.keys(body.key_dates).length > 0) {
        parts.push(`\nKey dates: ${JSON.stringify(body.key_dates)}`);
    }

    if (body.schema_fields && Object.keys(body.schema_fields).length > 0) {
        parts.push(`\nSchema fields: ${JSON.stringify(body.schema_fields)}`);
    }

    if (schema.legalTest.length > 0) {
        parts.push(`\nLegal test elements:\n${schema.legalTest.map((t, i) => `${i + 1}. ${t}`).join("\n")}`);
    }

    if (schema.era2025Changes && schema.era2025Changes.length > 0) {
        parts.push(`\nERA 2025 changes for this claim type:\n${schema.era2025Changes.join("\n")}`);
    }

    parts.push(
        `\nToday's date: ${new Date().toISOString().split("T")[0]}`,
        `\nERA 2025 key dates: Royal Assent ${ERA_2025.ROYAL_ASSENT}, ` +
        `Time limit change ${ERA_2025.ET_TIME_LIMIT_6_MONTHS}, ` +
        `Qualifying period change ${ERA_2025.QUALIFYING_PERIOD_6_MONTHS}`
    );

    return parts.join("\n");
}
