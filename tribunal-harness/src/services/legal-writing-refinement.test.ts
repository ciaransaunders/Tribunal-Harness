/**
 * Legal-Writing Refinement Service — Unit Tests
 *
 * Covers:
 *   a) getByPath / setByPath round-trip for simple and array dotted paths.
 *   b) refineForUser under LLM_PROVIDER=agent — pass-through synth from the
 *      agent stand-in: applied:true, source:'agent-stand-in', prose preserved.
 *   c) refineForUser with REFINEMENT_DISABLED=1 — applied:false, reason:
 *      'disabled', and the payload is returned unchanged (same reference).
 *   d) refineForUser('debate', ...) under agent mode — all three prose fields
 *      (drafter.overall_assessment, critic.overall_vulnerability_assessment,
 *      judge.synthesis) are preserved and applied is true.
 *
 * Env vars (LLM_PROVIDER, REFINEMENT_DISABLED) are isolated per test via
 * vi.stubEnv / vi.unstubAllEnvs.
 */

import {
    describe,
    it,
    expect,
    beforeEach,
    afterEach,
    vi,
} from "vitest";
import {
    getByPath,
    setByPath,
    refineForUser,
} from "@/services/legal-writing-refinement";

// ─── Env isolation ──────────────────────────────────────────────────────────

beforeEach(() => {
    // Default: refinement enabled, agent stand-in active (no network calls).
    vi.stubEnv("LLM_PROVIDER", "agent");
    vi.stubEnv("REFINEMENT_DISABLED", "");
    // Make sure no real Anthropic key sneaks in during the test environment.
    vi.stubEnv("ANTHROPIC_API_KEY", "");
});

afterEach(() => {
    vi.unstubAllEnvs();
});

// ─── (a) Path helpers round-trip ────────────────────────────────────────────

describe("getByPath / setByPath", () => {
    it("round-trips a simple top-level string path ('document_summary')", () => {
        const payload = { document_summary: "before" } as Record<string, unknown>;

        expect(getByPath(payload, "document_summary")).toBe("before");

        const ok = setByPath(payload, "document_summary", "after");
        expect(ok).toBe(true);
        expect(getByPath(payload, "document_summary")).toBe("after");
    });

    it("round-trips an array-element path ('claims.0.reasoning')", () => {
        const payload = {
            claims: [
                { reasoning: "first reason" },
                { reasoning: "second reason" },
            ],
        };

        expect(getByPath(payload, "claims.0.reasoning")).toBe("first reason");
        expect(getByPath(payload, "claims.1.reasoning")).toBe("second reason");

        const ok = setByPath(payload, "claims.1.reasoning", "second reason — polished");
        expect(ok).toBe(true);
        expect(getByPath(payload, "claims.1.reasoning")).toBe(
            "second reason — polished"
        );
        // Untouched siblings are preserved.
        expect(getByPath(payload, "claims.0.reasoning")).toBe("first reason");
    });

    it("getByPath returns undefined for missing intermediate segments", () => {
        const payload = { claims: [{ reasoning: "x" }] };
        expect(getByPath(payload, "claims.0.missing")).toBeUndefined();
        expect(getByPath(payload, "claims.5.reasoning")).toBeUndefined();
        expect(getByPath(payload, "absent.path")).toBeUndefined();
    });
});

// ─── (b) refineForUser — analyse, agent stand-in, pass-through ──────────────

describe("refineForUser — analyse (agent stand-in)", () => {
    it("returns applied:true, source:'agent-stand-in', prose preserved", async () => {
        const payload = {
            claims: [
                {
                    reasoning:
                        "The claimant has continuous service and a procedurally flawed dismissal.",
                },
            ],
            authorities: [
                {
                    principle:
                        "Procedural fairness is required regardless of substantive merits.",
                },
            ],
            statutory_provisions: [
                { relevance: "s98(4) ERA 1996 governs the reasonableness test." },
            ],
            procedural_notes: [
                "Commence ACAS Early Conciliation before issuing an ET1.",
            ],
            era_2025_flags: [
                { reason: "Time-limit regime shifts from 3 to 6 months in Oct 2026." },
            ],
        };

        const result = await refineForUser("analyse", payload);

        expect(result.refinement.applied).toBe(true);
        expect(result.refinement.source).toBe("agent-stand-in");

        // The agent stand-in returns prose verbatim — every refined leaf must
        // equal the input leaf.
        expect(getByPath(result.payload, "claims.0.reasoning")).toBe(
            payload.claims[0].reasoning
        );
        expect(getByPath(result.payload, "authorities.0.principle")).toBe(
            payload.authorities[0].principle
        );
        expect(getByPath(result.payload, "statutory_provisions.0.relevance")).toBe(
            payload.statutory_provisions[0].relevance
        );
        expect(getByPath(result.payload, "procedural_notes.0")).toBe(
            payload.procedural_notes[0]
        );
        expect(getByPath(result.payload, "era_2025_flags.0.reason")).toBe(
            payload.era_2025_flags[0].reason
        );
    });
});

// ─── (c) refineForUser — REFINEMENT_DISABLED kill-switch ────────────────────

describe("refineForUser — REFINEMENT_DISABLED=1", () => {
    it("returns applied:false, reason:'disabled', and the SAME payload object (no mutation)", async () => {
        vi.stubEnv("REFINEMENT_DISABLED", "1");

        const payload = {
            claims: [{ reasoning: "untouched reasoning" }],
        };

        const result = await refineForUser("analyse", payload);

        expect(result.refinement.applied).toBe(false);
        expect(result.refinement.reason).toBe("disabled");

        // The disabled path returns the original payload by reference — no clone,
        // no mutation.
        expect(result.payload).toBe(payload);
        expect(result.payload.claims[0].reasoning).toBe("untouched reasoning");
    });
});

// ─── (d) refineForUser — debate, three-agent prose preserved ────────────────

describe("refineForUser — debate (agent stand-in)", () => {
    it("preserves drafter / critic / judge prose and reports applied:true", async () => {
        const payload = {
            drafter: {
                overall_assessment:
                    "The claim is viable on procedural unfairness and likely automatically unfair under s100 ERA 1996.",
            },
            critic: {
                overall_vulnerability_assessment:
                    "The dismissal-for-misconduct framing risks a Polkey reduction; the H&S link must be evidenced.",
            },
            judge: {
                synthesis:
                    "Score 76: viable. Procedural and statutory grounds are strong; quantum and ACAS posture require firming up.",
            },
        };

        const result = await refineForUser("debate", payload);

        expect(result.refinement.applied).toBe(true);
        expect(result.refinement.source).toBe("agent-stand-in");

        // All three top-level prose fields preserved verbatim by the
        // pass-through stand-in.
        expect(getByPath(result.payload, "drafter.overall_assessment")).toBe(
            payload.drafter.overall_assessment
        );
        expect(
            getByPath(result.payload, "critic.overall_vulnerability_assessment")
        ).toBe(payload.critic.overall_vulnerability_assessment);
        expect(getByPath(result.payload, "judge.synthesis")).toBe(
            payload.judge.synthesis
        );
    });
});
