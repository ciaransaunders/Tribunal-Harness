/**
 * Legal-Writing Refinement Service — Tribunal Harness
 *
 * WHAT THIS DOES
 * --------------
 * Polishes LLM-generated prose values inside the JSON payloads returned by
 * /api/analyse, /api/triage and /api/debate. The refinement is a second,
 * editor-only pass: it only touches an allowlisted set of dot-paths into the
 * payload, never edits citations / dates / statutes / enums / scores, and
 * preserves the JSON shape exactly.
 *
 * The prompt is LEGAL_WRITING_REFINEMENT_PROMPT_v1 (src/agents/prompts.ts).
 * The model is the 'refine' endpoint in src/lib/claude-config.ts (Sonnet, low
 * effort, thinking disabled).
 *
 * SAFETY
 * ------
 * 1. Pure: never mutates the input payload (uses structuredClone).
 * 2. Never throws to the caller — failures degrade to { applied:false } and
 *    return the original payload untouched.
 * 3. Honours REFINEMENT_DISABLED=1 (hard kill-switch).
 * 4. Honours LLM_PROVIDER=agent (offline pass-through via agent-provider).
 *
 * LEGAL POSTURE
 * -------------
 * This module produces legal INFORMATION, not legal advice (LSA 2007). It is
 * a style pass; it does not alter legal substance. The prompt enforces hard
 * substance-invariants; this service enforces shape-invariants in code.
 */

import { callClaude } from "@/lib/claude-client";
import {
    LEGAL_WRITING_REFINEMENT_PROMPT_v1,
    PROMPT_VERSIONS,
} from "@/agents/prompts";

// ─── Public types ────────────────────────────────────────────────────────────

export type RefineEndpoint = "analyse" | "triage" | "debate";

export interface RefineRequest {
    endpoint: RefineEndpoint;
    prose_fields: { [dotPath: string]: string };
}

export interface RefineResponse {
    refined_fields: { [dotPath: string]: string };
    notes: string;
}

export interface RefineError {
    applied: false;
    error: string;
    reason?: "disabled" | "llm_error" | "shape_mismatch" | "empty_input";
}

export interface RefineMeta {
    applied: boolean;
    source?: "claude-sonnet" | "agent-stand-in";
    changes?: number;
    error?: string;
    reason?: "disabled" | "llm_error" | "shape_mismatch" | "empty_input";
}

export interface RefinedResult<T = unknown> {
    payload: T;
    refinement: RefineMeta;
}

// ─── Per-endpoint prose allowlists ───────────────────────────────────────────
// `[]` denotes "iterate every element of the array at this position".
// e.g. `claims[].reasoning` means "for every element c of claims, c.reasoning".

export const ENDPOINT_PROSE_FIELDS: Record<RefineEndpoint, string[]> = {
    analyse: [
        "claims[].reasoning",
        "claims[].legal_test_elements[].evidence",
        "authorities[].principle",
        "statutory_provisions[].relevance",
        "procedural_notes[]",
        "era_2025_flags[].reason",
    ],
    triage: [
        "document_summary",
        "query_array[].question",
        "query_array[].legal_relevance",
    ],
    debate: [
        "drafter.factual_summary",
        "drafter.application[].facts_supporting",
        "drafter.remedies[].basis",
        "drafter.overall_assessment",
        "critic.attacks[].weakness",
        "critic.attacks[].legal_basis",
        "critic.factual_gaps[].missing_fact",
        "critic.factual_gaps[].why_it_matters",
        "critic.procedural_risks[].risk",
        "critic.procedural_risks[].consequence",
        "critic.overall_vulnerability_assessment",
        "judge.synthesis",
        "judge.score_breakdown.legal_test_completeness.reasoning",
        "judge.score_breakdown.evidential_sufficiency.reasoning",
        "judge.score_breakdown.procedural_compliance.reasoning",
        "judge.score_breakdown.era_2025_awareness.reasoning",
        "judge.score_breakdown.authority_quality.reasoning",
        "judge.key_vulnerabilities[]",
        "judge.evidentiary_requirements[]",
        "judge.procedural_recommendations[]",
    ],
};

// ─── Path helpers ────────────────────────────────────────────────────────────
//
// Paths use dotted segments, optionally followed by `[]` to mean "iterate
// every element of this array". A concrete path (no `[]`) addresses a single
// leaf. Expanding a template against a payload yields zero or more concrete
// paths whose leaves are the strings we want to refine.

type Json =
    | string
    | number
    | boolean
    | null
    | Json[]
    | { [k: string]: Json };

interface PathStep {
    key: string;
    iterate: boolean;
}

function parsePath(path: string): PathStep[] {
    return path.split(".").map((seg) => {
        if (seg.endsWith("[]")) {
            return { key: seg.slice(0, -2), iterate: true };
        }
        return { key: seg, iterate: false };
    });
}

function isPlainObject(v: unknown): v is { [k: string]: Json } {
    return typeof v === "object" && v !== null && !Array.isArray(v);
}

/**
 * Expand a template path (which may contain `[]` segments) against a payload
 * and return the list of concrete leaf paths whose value is a non-empty
 * string. Concrete paths use numeric segments for array indices, e.g.
 * `claims.0.reasoning`.
 */
function expandPath(payload: unknown, path: string): string[] {
    const steps = parsePath(path);
    const results: string[] = [];

    const walk = (
        node: unknown,
        stepIdx: number,
        crumbs: string[]
    ): void => {
        if (stepIdx === steps.length) {
            if (typeof node === "string") {
                results.push(crumbs.join("."));
            }
            return;
        }
        const step = steps[stepIdx];

        // Special-case: a template like `procedural_notes[]` — the parsed
        // segments are [{key:"procedural_notes",iterate:true}] and after we
        // descend into the named key we then iterate the array.
        if (!isPlainObject(node)) return;
        const next = node[step.key];
        if (next === undefined) return;

        const nextCrumbs = [...crumbs, step.key];

        if (step.iterate) {
            if (!Array.isArray(next)) return;
            for (let i = 0; i < next.length; i++) {
                walk(next[i], stepIdx + 1, [...nextCrumbs, String(i)]);
            }
        } else {
            walk(next, stepIdx + 1, nextCrumbs);
        }
    };

    walk(payload, 0, []);
    return results;
}

/**
 * Read the leaf value at a concrete dotted path (numeric segments for array
 * indices). Returns undefined if any segment is missing.
 */
export function getByPath(obj: unknown, path: string): unknown {
    const parts = path.split(".");
    let cur: unknown = obj;
    for (const p of parts) {
        if (cur === null || cur === undefined) return undefined;
        if (Array.isArray(cur)) {
            const idx = Number(p);
            if (!Number.isInteger(idx)) return undefined;
            cur = cur[idx];
        } else if (isPlainObject(cur)) {
            cur = cur[p];
        } else {
            return undefined;
        }
    }
    return cur;
}

/**
 * Set the leaf value at a concrete dotted path (numeric segments for array
 * indices). Mutates `obj` in place. Returns true on success, false if the
 * parent path is missing or of the wrong shape.
 */
export function setByPath(obj: unknown, path: string, value: unknown): boolean {
    const parts = path.split(".");
    let cur: unknown = obj;
    for (let i = 0; i < parts.length - 1; i++) {
        const p = parts[i];
        if (Array.isArray(cur)) {
            const idx = Number(p);
            if (!Number.isInteger(idx)) return false;
            cur = cur[idx];
        } else if (isPlainObject(cur)) {
            cur = cur[p];
        } else {
            return false;
        }
        if (cur === null || cur === undefined) return false;
    }
    const last = parts[parts.length - 1];
    if (Array.isArray(cur)) {
        const idx = Number(last);
        if (!Number.isInteger(idx)) return false;
        cur[idx] = value as Json;
        return true;
    }
    if (isPlainObject(cur)) {
        cur[last] = value as Json;
        return true;
    }
    return false;
}

// ─── Internal helpers ────────────────────────────────────────────────────────

function clone<T>(value: T): T {
    // structuredClone is available in Node ≥17 and in the Edge runtime.
    return structuredClone(value);
}

function collectProseFields(
    endpoint: RefineEndpoint,
    payload: unknown
): { [dotPath: string]: string } {
    const out: { [dotPath: string]: string } = {};
    const templates = ENDPOINT_PROSE_FIELDS[endpoint];
    for (const t of templates) {
        const concretePaths = expandPath(payload, t);
        for (const cp of concretePaths) {
            const v = getByPath(payload, cp);
            if (typeof v === "string" && v.length > 0) {
                out[cp] = v;
            }
        }
    }
    return out;
}

function sameKeys(
    a: { [k: string]: string },
    b: { [k: string]: string }
): boolean {
    const ak = Object.keys(a);
    const bk = Object.keys(b);
    if (ak.length !== bk.length) return false;
    const aSet = new Set(ak);
    for (const k of bk) if (!aSet.has(k)) return false;
    return true;
}

function spliceRefinedFields<T>(
    original: T,
    refined: { [dotPath: string]: string }
): { payload: T; changes: number } {
    const next = clone(original);
    let changes = 0;
    for (const [path, value] of Object.entries(refined)) {
        if (typeof value !== "string") continue;
        const prev = getByPath(next, path);
        if (typeof prev !== "string") continue;
        if (prev !== value) {
            if (setByPath(next, path, value)) {
                changes += 1;
            }
        }
    }
    return { payload: next, changes };
}

function parseClaudeJson(content: string): RefineResponse | null {
    // Claude sometimes wraps JSON in code fences; tolerate that.
    let text = content.trim();
    if (text.startsWith("```")) {
        text = text.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "");
    }
    try {
        const parsed = JSON.parse(text) as unknown;
        if (!isPlainObject(parsed)) return null;
        const refined = parsed.refined_fields;
        if (!isPlainObject(refined)) return null;
        for (const v of Object.values(refined)) {
            if (typeof v !== "string") return null;
        }
        const notes = typeof parsed.notes === "string" ? parsed.notes : "";
        return {
            refined_fields: refined as { [k: string]: string },
            notes,
        };
    } catch {
        return null;
    }
}

function isAgentProvider(): boolean {
    return process.env.LLM_PROVIDER === "agent";
}

function isDisabled(): boolean {
    return process.env.REFINEMENT_DISABLED === "1";
}

// ─── Public entry point ──────────────────────────────────────────────────────

/**
 * Refine the prose values inside `payload` for the given endpoint.
 *
 * Returns a `RefinedResult` whose `.payload` is either:
 *   - a deep-cloned payload with refined prose spliced into the allowlisted
 *     leaves (`refinement.applied === true`), or
 *   - the original payload, untouched, if refinement was disabled, failed,
 *     or produced no eligible prose (`refinement.applied === false`).
 *
 * Never throws — all failure modes are reported via the `refinement` envelope.
 */
export async function refineForUser<T>(
    endpoint: RefineEndpoint,
    payload: T
): Promise<RefinedResult<T>> {
    // 1) Hard kill-switch
    if (isDisabled()) {
        return {
            payload,
            refinement: { applied: false, reason: "disabled" },
        };
    }

    // 2) Extract eligible prose fields
    const proseFields = collectProseFields(endpoint, payload);
    if (Object.keys(proseFields).length === 0) {
        return {
            payload,
            refinement: {
                applied: false,
                reason: "empty_input",
                error: "no eligible prose fields found in payload",
            },
        };
    }

    // 3) Call Claude (or the offline stand-in)
    const userMessage = JSON.stringify({ endpoint, prose_fields: proseFields });

    let result;
    try {
        result = await callClaude({
            endpoint: "refine",
            system: LEGAL_WRITING_REFINEMENT_PROMPT_v1,
            userMessage,
            promptVersion: PROMPT_VERSIONS.REFINEMENT,
        });
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error("[refine] callClaude threw:", message);
        return {
            payload,
            refinement: {
                applied: false,
                reason: "llm_error",
                error: message,
            },
        };
    }

    if (!result) {
        return {
            payload,
            refinement: {
                applied: false,
                reason: "llm_error",
                error: "no LLM client available (ANTHROPIC_API_KEY unset and LLM_PROVIDER not 'agent')",
            },
        };
    }

    // 4) Parse the response
    const parsed = parseClaudeJson(result.content);
    if (!parsed) {
        console.error(
            "[refine] could not parse JSON from refinement response"
        );
        return {
            payload,
            refinement: {
                applied: false,
                reason: "llm_error",
                error: "refinement response was not valid JSON",
            },
        };
    }

    // 5) Validate shape — same keys in, same keys out
    if (!sameKeys(proseFields, parsed.refined_fields)) {
        console.error(
            "[refine] key set returned from refinement does not match input"
        );
        return {
            payload,
            refinement: {
                applied: false,
                reason: "shape_mismatch",
                error: "refined_fields key set does not match prose_fields",
            },
        };
    }

    // 6) Splice refined strings back into a clone of the payload
    const { payload: refinedPayload, changes } = spliceRefinedFields(
        payload,
        parsed.refined_fields
    );

    const source: "claude-sonnet" | "agent-stand-in" = isAgentProvider()
        ? "agent-stand-in"
        : "claude-sonnet";

    return {
        payload: refinedPayload,
        refinement: {
            applied: true,
            source,
            changes,
        },
    };
}
