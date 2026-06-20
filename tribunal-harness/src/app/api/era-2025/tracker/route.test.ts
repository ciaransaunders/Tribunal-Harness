import { describe, it, expect, beforeEach } from "vitest";
import { ERA_2025_TRACKER } from "@/lib/constants";

// ---------------------------------------------------------------------------
// GET /api/era-2025/tracker
// Asserts the route returns one change per canonical ERA_2025_TRACKER entry,
// each well-formed, and that the data is DERIVED from constants (the set of
// provisions and commencements matches the source of truth exactly), so no
// date drift between the API and the single source of truth is possible.
// ---------------------------------------------------------------------------

const VALID_STATUSES = ["in_force", "upcoming", "awaiting_si"] as const;

interface TrackerChange {
    provision: string;
    old_position: string;
    new_position: string;
    commencement: string;
    status: string;
    tool_status: string;
    notes: string;
}

describe("GET /api/era-2025/tracker", () => {
    let GET: () => Promise<Response>;

    beforeEach(async () => {
        const mod = await import("./route");
        GET = mod.GET;
    });

    it("returns { changes: [...] } with one entry per canonical tracker row", async () => {
        const res = await GET();
        expect(res.status).toBe(200);
        const json = (await res.json()) as { changes: TrackerChange[] };
        expect(Array.isArray(json.changes)).toBe(true);
        expect(json.changes.length).toBe(ERA_2025_TRACKER.length);
    });

    it("gives every change a non-empty provision, commencement and valid status", async () => {
        const res = await GET();
        const json = (await res.json()) as { changes: TrackerChange[] };
        for (const change of json.changes) {
            expect(change.provision.length).toBeGreaterThan(0);
            expect(change.commencement.length).toBeGreaterThan(0);
            expect(VALID_STATUSES).toContain(change.status as (typeof VALID_STATUSES)[number]);
        }
    });

    it("derives provisions from constants — no date drift possible", async () => {
        const res = await GET();
        const json = (await res.json()) as { changes: TrackerChange[] };

        // Provision set equals the canonical source of truth.
        const apiProvisions = new Set(json.changes.map((c) => c.provision));
        const constProvisions = new Set(ERA_2025_TRACKER.map((e) => e.provision));
        expect(apiProvisions).toEqual(constProvisions);

        // Each provision's commencement and status match the source row exactly,
        // proving dates are read from constants rather than duplicated.
        for (const entry of ERA_2025_TRACKER) {
            const match = json.changes.find((c) => c.provision === entry.provision);
            expect(match, `route should expose provision "${entry.provision}"`).toBeDefined();
            expect(match?.commencement).toBe(entry.commencement);
            expect(match?.status).toBe(entry.status);
        }
    });
});
