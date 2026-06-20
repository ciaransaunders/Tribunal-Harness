# Tribunal Harness — Next.js App

The current production build of Tribunal Harness: a UK employment tribunal legal intelligence engine for litigants-in-person (LiPs). This Next.js application provides schema-driven analysis across all major employment tribunal claim types, incorporating ERA 2025 legislative changes, a built-in deadline calculator, live case-law verification, and a 3-agent adversarial debate engine.

**Important:** This tool provides legal information, not legal advice. Every user-facing output carries a persistent, non-dismissible disclaimer in accordance with the Legal Services Act 2007.

## Tech Stack

- **Framework:** Next.js 15.1.0 (App Router, Turbopack), TypeScript strict mode
- **UI:** React 19, Tailwind CSS 4, Framer Motion
- **AI:** Anthropic SDK — hub-and-spoke LLM routing (Haiku → triage, Sonnet → analysis, Opus → critic/judge). All LLM routes degrade gracefully without an API key.
- **Document parsing:** `mammoth` (DOCX), `pdf-parse` (PDF)
- **Icons:** `lucide-react`
- **Testing:** Vitest (unit/integration) — 215 tests; hermetic end-to-end smoke harness; ESLint

## Project Structure

```
tribunal-harness/
├── src/
│   ├── agents/             # LLM system prompts as typed constants with rationale comments
│   ├── app/                # Next.js App Router — pages and API routes
│   │   └── api/            # analyse, triage, debate, deadlines, schema/[claimType],
│   │                       #   case-law/{find,judgment,search}, era-2025/tracker,
│   │                       #   request-access, roadmap, webhook
│   ├── components/         # React components (NavBar, Footer, …)
│   ├── lib/
│   │   ├── constants.ts    # Single source of truth for all ERA 2025 commencement dates
│   │   ├── claude-client.ts / claude-config.ts   # LLM client + model routing
│   │   ├── verified-authorities.ts               # curated pre-2003 landmark citations
│   │   └── llm/            # offline agent stand-in (LLM_PROVIDER=agent)
│   ├── schemas/            # 10 claim type schemas as TypeScript interfaces
│   ├── services/           # deadline-calculator, find-case-law, citation-validator,
│   │                       #   legal-writing-refinement, pdf-to-markdown
│   └── types/              # Shared TypeScript types
├── scripts/smoke-run.ts    # end-to-end smoke harness
├── docs/                   # live-case-law.md, enterprise-audit.md
├── package.json
└── vitest.config.ts
```

## How to Run

```bash
npm install
npm run dev      # Start dev server with Turbopack
npm run build    # Production build
npm run start    # Serve production build
npm test         # Run Vitest (215 tests)
npm run lint     # ESLint
npm run smoke    # Hermetic end-to-end run (LLM_PROVIDER=agent, no API key needed)
```

### LLM configuration

Both `/api/analyse` and `/api/triage` (and the debate engine) call Claude via the Anthropic SDK. To run with a real key, set `ANTHROPIC_API_KEY` in `.env.local` (see `.env.example`). To run hermetically with **no key**, set `LLM_PROVIDER=agent` — every `callClaude()` is routed to a deterministic, schema-conformant stand-in in `src/lib/llm/agent-provider.ts`. `npm run smoke` uses this mode and writes `smoke-report.{json,md}`.

## Key Architectural Notes

- All ERA 2025 commencement dates are centralised in `src/lib/constants.ts`. Never hardcode dates elsewhere.
- Agent system prompts live in `src/agents/` with inline rationale comments — do not strip them.
- The deadline calculator handles the 3-month/6-month regime change, UK bank holidays, and ACAS Early Conciliation extensions.
- Case law is looked up and verified **live** from TNA Find Case Law (no RAG corpus). `/api/analyse` marks an authority `VERIFIED` only on an exact neutral-citation match, and never falsely verifies if upstream is down. See `docs/live-case-law.md`.
- Every legal proposition in AI output carries a trust level (`VERIFIED` / `CHECK` / `QUARANTINED`); quarantined claims are stripped before reaching the user.
- England & Wales jurisdiction only unless the user explicitly selects otherwise.
- BYOK mode is experimental/developer only — a managed API layer is required before institutional use.

## Status

In active development — core engine, live case-law lookup, deadline calculator, ERA 2025 schemas, the 3-agent debate engine, the Noir design system, and compliance infrastructure are implemented and covered by 215 passing tests. Open items: a managed API layer to replace BYOK as the default data flow, and the durable Temporal.io state machine (Phase 4).
