# Live case-law lookup (no RAG corpus needed)

> Added 20 June 2026. Pattern ported from the `uk-legal-mcp` project.

## Why

The Phase-2 plan called for a vector DB / RAG corpus (Supabase pgvector + an
embedding pipeline) — blocked on an account and an embedding-model decision.
Instead we now **look case law up live** from the authoritative free source, so
the engine can find and verify authorities on demand without a big pre-built
index.

## Source

**The National Archives — Find Case Law** (`caselaw.nationalarchives.gov.uk`).
Free, no API key, ~1,000 requests / 5 min per IP. Coverage is roughly **2003
onward**; older landmark authorities stay in the curated
`src/lib/verified-authorities.ts` list.

## What exists

| Piece | File | Purpose |
|---|---|---|
| Live client | `src/services/find-case-law.ts` | `searchCaseLaw()` + `verifyCitation()` against TNA; structured envelope; timeout; cache |
| Double-check | `src/services/citation-validator.ts` → `validateCitationAuthoritative()` | curated list first, then live verify; upgrades to VERIFIED only on an exact neutral-citation match |
| Analyse wiring | `src/app/api/analyse/route.ts` | every AI-cited authority is double-checked live; `verification_source` + `source_url` attached |
| Live search API | `GET /api/case-law/find?q=…&court=eat&limit=10` | live search, returns the structured envelope |

## Design rules (kept from uk-legal-mcp)

- **Structured envelope** `{status, results, detail}` — `ok | empty | not_found | upstream_timeout | upstream_unavailable | error`. Surface `status`; never confabulate when it isn't `ok`.
- **Exact vs candidate** — VERIFIED only on an exact neutral-citation match; a name-only hit is CHECK ("nearby candidate").
- **Never falsely verify** — if TNA is unreachable, the verdict is QUARANTINED/`source: unavailable`, and the analyse pipeline falls back to the curated verdict rather than trusting the AI.
- **Graceful degradation** — lookups never throw; `/api/analyse` cannot 500 on a case-law failure.
- **Curated list still runs first** — it is the only reliable source for pre-2003 landmark cases (Polkey, Western Excavating, etc.) and avoids a network call for them.

## Next step (designed, not yet built): let Claude search mid-analysis

The fullest "LLM finds the law" form is **Anthropic tool use**: register a
`search_uk_case_law` tool (backed by `searchCaseLaw`) on the `/api/analyse`
Claude call, run the tool-use loop, and let the model pull live authorities into
its own reasoning before answering. Deferred because it changes the analyse flow
to multi-turn and needs the API key to exercise — the current build already
finds (via `/api/case-law/find`) and double-checks (post-generation) live.

## Testing

- Offline (mocked `fetch`): `src/services/find-case-law.test.ts`, `src/app/api/case-law/find/route.test.ts`.
- Live smoke (real TNA): `RUN_LIVE_CASELAW=1 npx vitest run src/services/find-case-law.test.ts`.
