/**
 * Claude Client Factory — Tribunal Harness
 *
 * Provides a shared Anthropic client instance and helper functions
 * for making Claude API calls with the correct model configuration,
 * extended thinking, and usage logging.
 *
 * All API routes should use this module instead of directly
 * instantiating the Anthropic SDK.
 */

import Anthropic from "@anthropic-ai/sdk";
import {
    type EndpointConfig,
    type CostEstimate,
    getEndpointConfig,
    estimateCost,
} from "./claude-config";

// ─── Singleton Client ────────────────────────────────────────────────
// Initialised once per cold start, reused across requests.
// The API key is read from the environment at construction time.

let _client: Anthropic | null = null;

function getClient(): Anthropic | null {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) return null;

    if (!_client) {
        _client = new Anthropic({ apiKey });
    }
    return _client;
}

/**
 * Check if the Claude client is available (i.e., API key is configured).
 */
export function isClientAvailable(): boolean {
    return !!process.env.ANTHROPIC_API_KEY;
}

// ─── Response Types ─────────────────────────────────────────────────

export interface ClaudeCallResult {
    /** The text content of Claude's response */
    content: string;
    /** Usage metrics from the API */
    usage: {
        input_tokens: number;
        output_tokens: number;
    };
    /** Debug metadata for logging and analytics */
    debug: {
        model: string;
        endpoint_config: string;
        prompt_version: string;
        duration_ms: number;
        effort: string;
        thinking_enabled: boolean;
        thinking_budget?: number;
        cost_estimate: CostEstimate;
    };
}

// ─── Main Call Function ──────────────────────────────────────────────

interface CallClaudeParams {
    /** The endpoint config key (e.g., 'analyse', 'triage', 'critic') */
    endpoint: string;
    /** System prompt text */
    system: string;
    /** User message content */
    userMessage: string;
    /** Prompt version identifier for audit logging */
    promptVersion: string;
    /** Override the endpoint config (e.g., for dynamic complexity routing) */
    configOverride?: Partial<EndpointConfig>;
}

/**
 * Make a Claude API call using the centralised configuration.
 *
 * Returns null if the API key is not configured (graceful degradation).
 * Throws on API errors (caller should handle).
 */
export async function callClaude(
    params: CallClaudeParams
): Promise<ClaudeCallResult | null> {
    const client = getClient();
    if (!client) return null;

    const startTime = Date.now();
    const config = { ...getEndpointConfig(params.endpoint), ...params.configOverride };

    // Build the messages request
    const requestParams: Anthropic.MessageCreateParamsNonStreaming = {
        model: config.model,
        max_tokens: config.max_tokens,
        system: params.system,
        messages: [{ role: "user", content: params.userMessage }],
    };

    // Apply temperature if specified
    if (config.temperature !== undefined) {
        requestParams.temperature = config.temperature;
    }

    // Apply extended thinking if enabled
    // Note: When thinking is enabled, temperature must not be set (API constraint)
    if (config.thinking.type === "enabled" && config.thinking.budget_tokens) {
        requestParams.thinking = {
            type: "enabled",
            budget_tokens: config.thinking.budget_tokens,
        };
        // Anthropic API requires temperature to be unset when thinking is enabled
        delete requestParams.temperature;
    }

    const response = await client.messages.create(requestParams);

    // Extract text content (skip thinking blocks if present)
    let content = "";
    for (const block of response.content) {
        if (block.type === "text") {
            content = block.text;
            break;
        }
    }

    const duration = Date.now() - startTime;
    const usage = response.usage;

    // Build cost estimate
    const cost = estimateCost(config.model, usage.input_tokens, usage.output_tokens);

    // Log to console (structured for future Supabase migration)
    console.log(
        `[Claude] ${config.label} | ${duration}ms | ` +
        `${usage.input_tokens}→${usage.output_tokens} tokens | ` +
        `£${cost.cost_gbp} | ${params.promptVersion}`
    );

    return {
        content,
        usage: {
            input_tokens: usage.input_tokens,
            output_tokens: usage.output_tokens,
        },
        debug: {
            model: response.model,
            endpoint_config: params.endpoint,
            prompt_version: params.promptVersion,
            duration_ms: duration,
            effort: config.effort,
            thinking_enabled: config.thinking.type === "enabled",
            thinking_budget: config.thinking.budget_tokens,
            cost_estimate: cost,
        },
    };
}
