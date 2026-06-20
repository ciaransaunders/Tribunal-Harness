import { NextRequest, NextResponse } from "next/server";
import {
    DRAFTER_PROMPT_v2,
    CRITIC_PROMPT_v2,
    JUDGE_PROMPT_v2,
    PROMPT_VERSIONS,
} from "@/agents/prompts";
import { callClaude, isClientAvailable } from "@/lib/claude-client";
import { refineForUser } from "@/services/legal-writing-refinement";

export const maxDuration = 60; // Allow up to 60 seconds on Vercel for the sequential calls

/**
 * POST /api/debate
 *
 * Adversarial debate engine: three agents stress-test an argument.
 *
 * Model routing per agent:
 * - Drafter → Sonnet (good drafting quality, controlled cost)
 * - Critic  → Opus (deep reasoning to find genuine weaknesses)
 * - Judge   → Opus (consistency and neutrality in scoring)
 *
 * Debate flow: Drafter → Critic → Judge
 * Judge scores on a 100-point rubric; ≥70 = viable.
 */

export async function POST(request: NextRequest) {
    const startTime = Date.now();
    try {
        const body = await request.json();
        const { facts, claim_type } = body;

        if (!facts || !claim_type) {
            return NextResponse.json(
                { error: "facts and claim_type are required" },
                { status: 400 }
            );
        }

        if (!isClientAvailable()) {
            return NextResponse.json(
                { error: "ANTHROPIC_API_KEY not configured" },
                { status: 500 }
            );
        }

        // ── 1. Drafter Round (Sonnet — builds strongest case) ─────────
        const drafterResult = await callClaude({
            endpoint: "drafter",
            system: DRAFTER_PROMPT_v2,
            userMessage: `Claim Type: ${claim_type}\n\nFacts:\n${facts}`,
            promptVersion: PROMPT_VERSIONS.DRAFTER,
        });

        if (!drafterResult) {
            return NextResponse.json(
                { error: "Drafter agent failed" },
                { status: 500 }
            );
        }

        // ── 2. Critic Round (Opus — deep reasoning for real weaknesses) ──
        const criticResult = await callClaude({
            endpoint: "critic",
            system: CRITIC_PROMPT_v2,
            userMessage: `Claim Type: ${claim_type}\n\nOriginal Facts:\n${facts}\n\nDrafter Argument:\n${drafterResult.content}`,
            promptVersion: PROMPT_VERSIONS.CRITIC,
        });

        if (!criticResult) {
            return NextResponse.json(
                { error: "Critic agent failed" },
                { status: 500 }
            );
        }

        // ── 3. Judge Round (Opus — neutral scoring) ──────────────────
        const judgeResult = await callClaude({
            endpoint: "judge",
            system: JUDGE_PROMPT_v2,
            userMessage: `Claim Type: ${claim_type}\n\nOriginal Facts:\n${facts}\n\nDrafter Argument:\n${drafterResult.content}\n\nCritic Attack:\n${criticResult.content}`,
            promptVersion: PROMPT_VERSIONS.JUDGE,
        });

        if (!judgeResult) {
            return NextResponse.json(
                { error: "Judge agent failed" },
                { status: 500 }
            );
        }

        // Parse judge output for structured scoring
        let judgeOutput: Record<string, unknown> = {};
        try {
            judgeOutput = JSON.parse(judgeResult.content);
        } catch {
            judgeOutput = { synthesis: judgeResult.content };
        }

        // Parse drafter and critic outputs too
        let drafterOutput: Record<string, unknown> = {};
        try {
            drafterOutput = JSON.parse(drafterResult.content);
        } catch {
            drafterOutput = { argument: drafterResult.content };
        }

        let criticOutput: Record<string, unknown> = {};
        try {
            criticOutput = JSON.parse(criticResult.content);
        } catch {
            criticOutput = { attacks: criticResult.content };
        }

        const duration = Date.now() - startTime;

        // Calculate total token usage and costs
        const totalInputTokens =
            drafterResult.usage.input_tokens +
            criticResult.usage.input_tokens +
            judgeResult.usage.input_tokens;
        const totalOutputTokens =
            drafterResult.usage.output_tokens +
            criticResult.usage.output_tokens +
            judgeResult.usage.output_tokens;

        const responseBody = {
            drafter: drafterOutput,
            critic: criticOutput,
            judge: judgeOutput,
            viable: typeof judgeOutput.score === "number" ? judgeOutput.score >= 70 : null,
            _debug: {
                duration_ms: duration,
                total_input_tokens: totalInputTokens,
                total_output_tokens: totalOutputTokens,
                agents: {
                    drafter: drafterResult.debug,
                    critic: criticResult.debug,
                    judge: judgeResult.debug,
                },
            },
        };

        const { payload: refined, refinement } = await refineForUser(
            "debate",
            responseBody
        );
        (refined as Record<string, unknown>).refinement = refinement;
        return NextResponse.json(refined);

    } catch (error) {
        const duration = Date.now() - startTime;
        console.error(`[API /api/debate] Error. Duration: ${duration}ms`, error);
        return NextResponse.json(
            { error: "Internal server error", details: String(error) },
            { status: 500 }
        );
    }
}
