import { describe, it, expect } from "vitest";
import { getSchema, getAllSchemas } from "@/schemas";
import { CLAIM_TYPES } from "@/lib/constants";

// ---------------------------------------------------------------------------
// Schema Integrity Tests
// Asserts that every declared CLAIM_TYPE has a complete, well-formed schema
// in the registry, and that the registry boundary behaviour is correct.
// ---------------------------------------------------------------------------

describe("schema registry integrity", () => {
    it("exposes exactly 10 schemas", () => {
        expect(getAllSchemas().length).toBe(10);
    });

    it("returns null for an unknown claim type", () => {
        expect(getSchema("made_up")).toBeNull();
    });

    // Every declared claim type must resolve to a non-null, complete schema.
    for (const ct of CLAIM_TYPES) {
        describe(`schema for ${ct.id}`, () => {
            it("resolves to a non-null schema", () => {
                expect(getSchema(ct.id)).not.toBeNull();
            });

            it("has an id matching the claim type id", () => {
                const schema = getSchema(ct.id);
                expect(schema).not.toBeNull();
                expect(schema?.id).toBe(ct.id);
            });

            it("has a non-empty statute", () => {
                const schema = getSchema(ct.id);
                expect(typeof schema?.statute).toBe("string");
                expect((schema?.statute ?? "").length).toBeGreaterThan(0);
            });

            it("has at least one legalTest step", () => {
                const schema = getSchema(ct.id);
                expect(Array.isArray(schema?.legalTest)).toBe(true);
                expect((schema?.legalTest ?? []).length).toBeGreaterThan(0);
            });

            it("has at least one key authority", () => {
                const schema = getSchema(ct.id);
                expect(Array.isArray(schema?.keyAuthorities)).toBe(true);
                expect((schema?.keyAuthorities ?? []).length).toBeGreaterThan(0);
            });

            it("has unique field ids", () => {
                const schema = getSchema(ct.id);
                const fieldIds = (schema?.fields ?? []).map((f) => f.id);
                expect(new Set(fieldIds).size).toBe(fieldIds.length);
            });
        });
    }
});
