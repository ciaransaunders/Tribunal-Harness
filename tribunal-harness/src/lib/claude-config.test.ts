import { describe, it, expect } from "vitest";
import { estimateCost, CLAUDE_MODELS } from "./claude-config";

describe("estimateCost", () => {
    it("should calculate OPUS costs correctly", () => {
        // Opus: input=15.0, output=75.0 per million
        // Let's use 10,000 input and 5,000 output tokens
        // Input cost: (10,000 / 1,000,000) * 15.0 = 0.15
        // Output cost: (5,000 / 1,000,000) * 75.0 = 0.375
        // Total USD: 0.525
        // Total GBP: 0.525 * 0.79 = 0.41475 (rounds to 0.4148)

        const result = estimateCost(CLAUDE_MODELS.OPUS, 10000, 5000);

        expect(result.model).toBe(CLAUDE_MODELS.OPUS);
        expect(result.input_tokens).toBe(10000);
        expect(result.output_tokens).toBe(5000);
        expect(result.cost_usd).toBe(0.525);
        expect(result.cost_gbp).toBe(0.4148);
    });

    it("should calculate SONNET costs correctly", () => {
        // Sonnet: input=3.0, output=15.0 per million
        // 1,000,000 input = 3.0 USD
        // 2,000,000 output = 30.0 USD
        // Total USD: 33.0
        // Total GBP: 33.0 * 0.79 = 26.07
        const result = estimateCost(CLAUDE_MODELS.SONNET, 1000000, 2000000);

        expect(result.cost_usd).toBe(33.0);
        expect(result.cost_gbp).toBe(26.07);
    });

    it("should calculate HAIKU costs correctly", () => {
        // Haiku: input=0.25, output=1.25 per million
        // 1,000,000 input = 0.25 USD
        // 1,000,000 output = 1.25 USD
        // Total USD: 1.50
        // Total GBP: 1.50 * 0.79 = 1.185 (rounds to 1.185)
        const result = estimateCost(CLAUDE_MODELS.HAIKU, 1000000, 1000000);

        expect(result.cost_usd).toBe(1.50);
        expect(result.cost_gbp).toBe(1.185);
    });

    it("should return zero costs when zero tokens are provided", () => {
        const result = estimateCost(CLAUDE_MODELS.SONNET, 0, 0);

        expect(result.cost_usd).toBe(0);
        expect(result.cost_gbp).toBe(0);
    });
});
