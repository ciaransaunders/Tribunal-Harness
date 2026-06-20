# `scripts/`

Operational scripts for the Tribunal Harness app.

## `smoke-run.ts`

Single-process end-to-end smoke harness. Imports every important API route handler in-process (no HTTP server) with `LLM_PROVIDER=agent`, so the offline agent stand-in (`src/lib/llm/agent-provider.ts`) supplies deterministic, schema-conformant responses for the three LLM-backed routes (`/api/analyse`, `/api/triage`, `/api/debate`).

### Run

```bash
npm run smoke
# or
LLM_PROVIDER=agent npx tsx scripts/smoke-run.ts
```

### Sections covered

1. `schema_lookup` — `GET /api/schema/unfair_dismissal`
2. `triage` — `POST /api/triage` (multipart, synthetic `.txt`)
3. `analyse` — `POST /api/analyse`
4. `deadlines` — `POST /api/deadlines`
5. `case_law_search` — `GET /api/case-law/search?q=burchell` (falls back to `q=polkey` if empty)
6. `era_2025_tracker` — `GET /api/era-2025/tracker`
7. `debate` — `POST /api/debate`

### Output

- `smoke-report.json` — machine-readable, full response bodies
- `smoke-report.md` — human-readable, one H2 per section

Both are gitignored. Exit code is `0` on full PASS, `1` otherwise.

### Hermeticity

The agent stand-in only emits citations whose leading tokens match `verified-authorities.ts`. `/api/analyse` re-verifies citations via the curated short-circuit (no Find Case Law network call required), keeping the run fully offline.
