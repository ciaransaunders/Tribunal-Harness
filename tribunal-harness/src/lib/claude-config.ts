/**
 * Claude Model Configuration — Tribunal Harness
 *
 * Centralised configuration for all Claude API interactions.
 * Controls model routing, extended thinking, effort levels,
 * and token budgets per endpoint.
 *
 * This file is the SINGLE SOURCE OF TRUTH for Claude model settings.
 * Do not hardcode model strings or max_tokens in route handlers.
 *
 * Reference: "Optimising Claude 4.x for Legal Workflows in E&W"
 * - Opus: high-stakes reasoning hub (Critic, Judge, complex analysis)
 * - Sonnet: day-to-day drafting and analysis (Drafter, standard analysis)
 * - Haiku: high-volume triage and extraction (triage, classification)
 */

// ─── Model Identifiers ──────────────────────────────────────────────
// Update these when new model versions are released.
// Check: https://docs.anthropic.com/en/docs/about-claude/models

export const CLAUDE_MODELS = {
  /** Frontier model – complex legal reasoning, adversarial debate, multi-document synthesis */
  OPUS: "claude-opus-4-20250514",
  /** Mid-tier model – standard drafting, analysis, structured output */
  SONNET: "claude-sonnet-4-20250514",
  /** Fast/cheap model – triage, extraction, classification, bulk tagging */
  HAIKU: "claude-haiku-4-20250514",
} as const;

export type ClaudeModel = (typeof CLAUDE_MODELS)[keyof typeof CLAUDE_MODELS];

// ─── Effort Levels (Adaptive Thinking) ───────────────────────────────
// Controls how much extended thinking Claude uses.
// 'low'    = selectively skips thinking, fastest
// 'medium' = balanced – matches frontier quality at ~76% fewer tokens
// 'high'   = almost always thinks, best for complex reasoning
// 'max'    = maximum reasoning depth, highest cost

export type EffortLevel = "low" | "medium" | "high" | "max";

// ─── Thinking Configuration ─────────────────────────────────────────

export interface ThinkingConfig {
  type: "enabled" | "disabled";
  /** Token budget for extended thinking. Only used when type is 'enabled'. */
  budget_tokens?: number;
}

// ─── Endpoint Configuration ─────────────────────────────────────────

export interface EndpointConfig {
  /** Which Claude model to use */
  model: ClaudeModel;
  /** Adaptive thinking effort level */
  effort: EffortLevel;
  /** Maximum output tokens */
  max_tokens: number;
  /** Extended thinking configuration */
  thinking: ThinkingConfig;
  /** Temperature override (0.0–1.0). Omit to use model default. */
  temperature?: number;
  /** Human-readable label for logging */
  label: string;
}

/**
 * Per-endpoint Claude configuration.
 *
 * Routing rationale (from research document):
 * - Triage: Haiku – near-frontier at 1/3 cost, 2x speed
 * - Analysis (standard): Sonnet – balanced cost/intelligence
 * - Analysis (complex): Opus – frontier reasoning, 1M context
 * - Drafter: Sonnet – good drafting, controlled temperature
 * - Critic: Opus – deep reasoning to find real weaknesses
 * - Judge: Opus – consistency and neutrality in scoring
 */
export const ENDPOINT_CONFIG: Record<string, EndpointConfig> = {
  // ── Triage ──────────────────────────────────────────────────────
  triage: {
    model: CLAUDE_MODELS.HAIKU,
    effort: "low",
    max_tokens: 2048,
    thinking: { type: "disabled" },
    temperature: 0.3,
    label: "Triage (Haiku)",
  },

  // ── Analysis (standard complexity) ─────────────────────────────
  analyse: {
    model: CLAUDE_MODELS.SONNET,
    effort: "medium",
    max_tokens: 4096,
    thinking: { type: "enabled", budget_tokens: 10_000 },
    temperature: 0.3,
    label: "Analysis (Sonnet)",
  },

  // ── Analysis (high complexity — multi-jurisdiction, novel law) ──
  analyse_complex: {
    model: CLAUDE_MODELS.OPUS,
    effort: "high",
    max_tokens: 8192,
    thinking: { type: "enabled", budget_tokens: 20_000 },
    temperature: 0.3,
    label: "Analysis Complex (Opus)",
  },

  // ── Adversarial Debate: Drafter ────────────────────────────────
  drafter: {
    model: CLAUDE_MODELS.SONNET,
    effort: "medium",
    max_tokens: 3000,
    thinking: { type: "enabled", budget_tokens: 8_000 },
    temperature: 0.3,
    label: "Drafter (Sonnet)",
  },

  // ── Adversarial Debate: Critic ─────────────────────────────────
  critic: {
    model: CLAUDE_MODELS.OPUS,
    effort: "high",
    max_tokens: 3000,
    thinking: { type: "enabled", budget_tokens: 15_000 },
    temperature: 0.7,
    label: "Critic (Opus)",
  },

  // ── Adversarial Debate: Judge ──────────────────────────────────
  judge: {
    model: CLAUDE_MODELS.OPUS,
    effort: "medium",
    max_tokens: 3000,
    thinking: { type: "enabled", budget_tokens: 10_000 },
    temperature: 0.1,
    label: "Judge (Opus)",
  },

  // ── Legal-writing refinement (post-processing prose pass) ──────
  // Editor-only pass over allowlisted prose fields after the substantive
  // LLM call has returned. Never edits citations, dates, statutes,
  // strengths or enums — see LEGAL_WRITING_REFINEMENT_PROMPT_v1.
  refine: {
    model: CLAUDE_MODELS.SONNET,
    effort: "low",
    max_tokens: 4000,
    thinking: { type: "disabled" },
    temperature: 0.2,
    label: "Legal-writing refinement (Sonnet)",
  },
};

// ─── Cost Estimation ─────────────────────────────────────────────────
// Approximate pricing per million tokens (USD, as of March 2026).
// Update when Anthropic changes pricing.

const PRICING: Record<
  ClaudeModel,
  { input_per_mtok: number; output_per_mtok: number }
> = {
  [CLAUDE_MODELS.OPUS]: { input_per_mtok: 15.0, output_per_mtok: 75.0 },
  [CLAUDE_MODELS.SONNET]: { input_per_mtok: 3.0, output_per_mtok: 15.0 },
  [CLAUDE_MODELS.HAIKU]: { input_per_mtok: 0.25, output_per_mtok: 1.25 },
};

const USD_TO_GBP = 0.79; // approximate, update periodically

export interface CostEstimate {
  model: ClaudeModel;
  input_tokens: number;
  output_tokens: number;
  cost_usd: number;
  cost_gbp: number;
}

/**
 * Estimate the cost of a Claude API call.
 * Returns approximate cost in USD and GBP for logging/budgeting.
 */
export function estimateCost(
  model: ClaudeModel,
  inputTokens: number,
  outputTokens: number
): CostEstimate {
  const pricing = PRICING[model];
  const inputCost = (inputTokens / 1_000_000) * pricing.input_per_mtok;
  const outputCost = (outputTokens / 1_000_000) * pricing.output_per_mtok;
  const totalUsd = inputCost + outputCost;

  return {
    model,
    input_tokens: inputTokens,
    output_tokens: outputTokens,
    cost_usd: Math.round(totalUsd * 10000) / 10000, // 4 decimal places
    cost_gbp: Math.round(totalUsd * USD_TO_GBP * 10000) / 10000,
  };
}

/**
 * Get the endpoint config, defaulting to 'analyse' if the key is not found.
 */
export function getEndpointConfig(endpoint: string): EndpointConfig {
  return ENDPOINT_CONFIG[endpoint] ?? ENDPOINT_CONFIG.analyse;
}
