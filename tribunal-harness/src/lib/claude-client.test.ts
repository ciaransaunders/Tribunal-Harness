/**
 * Unit tests for the LLM_PROVIDER=agent wiring in claude-client.ts.
 *
 * These tests exercise the env-driven provider selector without making any
 * network calls. The agent stand-in is fully deterministic and offline, so
 * we can assert exactly what the contract returns.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { callClaude, isClientAvailable } from "./claude-client";

describe("claude-client — LLM_PROVIDER=agent wiring", () => {
    beforeEach(() => {
        // Start every test from a known-clean env so behaviour is deterministic.
        vi.unstubAllEnvs();
        vi.stubEnv("LLM_PROVIDER", "");
        vi.stubEnv("ANTHROPIC_API_KEY", "");
    });

    afterEach(() => {
        vi.unstubAllEnvs();
    });

    it("isClientAvailable() returns true when LLM_PROVIDER=agent even without an API key", () => {
        vi.stubEnv("LLM_PROVIDER", "agent");
        vi.stubEnv("ANTHROPIC_API_KEY", "");

        expect(isClientAvailable()).toBe(true);
    });

    it("callClaude() returns an agent stand-in response shaped to the analyse prompt contract", async () => {
        vi.stubEnv("LLM_PROVIDER", "agent");
        vi.stubEnv("ANTHROPIC_API_KEY", "");

        const result = await callClaude({
            endpoint: "analyse",
            system: "sys",
            userMessage: "claim_type: unfair_dismissal",
            promptVersion: "v2",
        });

        expect(result).not.toBeNull();
        if (result === null) return; // type narrowing

        // Debug metadata identifies the stand-in clearly.
        expect(result.debug.model).toBe("agent-stand-in");
        expect(result.debug.endpoint_config).toBe("analyse");
        expect(result.debug.prompt_version).toBe("v2");
        expect(result.debug.cost_estimate.cost_gbp).toBeGreaterThanOrEqual(0);

        // Usage tokens are estimated, not zero.
        expect(result.usage.input_tokens).toBeGreaterThan(0);
        expect(result.usage.output_tokens).toBeGreaterThan(0);

        // Content parses to JSON containing every top-level key from the
        // ANALYSE_PROMPT_v2 contract.
        const parsed: unknown = JSON.parse(result.content);
        expect(parsed).toBeTypeOf("object");
        expect(parsed).not.toBeNull();

        const obj = parsed as Record<string, unknown>;
        expect(obj).toHaveProperty("claims");
        expect(obj).toHaveProperty("authorities");
        expect(obj).toHaveProperty("statutory_provisions");
        expect(obj).toHaveProperty("procedural_notes");
        expect(obj).toHaveProperty("era_2025_flags");

        expect(Array.isArray(obj.claims)).toBe(true);
        expect(Array.isArray(obj.authorities)).toBe(true);
        expect(Array.isArray(obj.statutory_provisions)).toBe(true);
        expect(Array.isArray(obj.procedural_notes)).toBe(true);
        expect(Array.isArray(obj.era_2025_flags)).toBe(true);
    });

    it("without LLM_PROVIDER and without ANTHROPIC_API_KEY: isClientAvailable=false and callClaude returns null", async () => {
        vi.stubEnv("LLM_PROVIDER", "");
        vi.stubEnv("ANTHROPIC_API_KEY", "");

        expect(isClientAvailable()).toBe(false);

        const result = await callClaude({
            endpoint: "analyse",
            system: "sys",
            userMessage: "claim_type: unfair_dismissal",
            promptVersion: "v2",
        });
        expect(result).toBeNull();
    });
});
