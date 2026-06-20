# Tribunal Harness

[![CI](https://github.com/ciaransaunders/Tribunal-Harness/actions/workflows/ci.yml/badge.svg)](https://github.com/ciaransaunders/Tribunal-Harness/actions/workflows/ci.yml)

A UK employment tribunal legal intelligence engine for litigants-in-person (LiPs). Tribunal Harness addresses the information asymmetry between unrepresented claimants and respondents with legal representation, providing schema-driven legal analysis across the full range of employment tribunal claim types.

This is not a chatbot. The core architecture is built on four pillars: **Inverse Chatbot** (dynamic schema-driven UI instead of free chat), **Epistemic Quarantine** (every legal proposition carries a trust level; ungrounded claims are stripped), **Durable State Machine** (long-running case state), and **Adversarial Shadow-Opponent** (a Drafter/Critic/Judge debate that stress-tests arguments before the user sees them).

**Important:** This tool provides legal information, not legal advice. Every user-facing output carries a persistent disclaimer in accordance with the Legal Services Act 2007.

## What's implemented

- **10 claim-type schemas** (one file each) — unfair dismissal, direct/indirect discrimination, harassment, victimisation, reasonable adjustments, whistleblowing, wrongful dismissal, fire & rehire, zero-hours rights.
- **ERA 2025 awareness** — all commencement dates centralised in `src/lib/constants.ts`; a live tracker drives the UI.
- **Deadline calculator** — handles the 3-month/6-month time-limit regime change, UK bank holidays, and ACAS Early Conciliation extensions.
- **Live case-law lookup** — authorities are retrieved and verified **live** from [TNA Find Case Law](https://caselaw.nationalarchives.gov.uk) (free, no key), not a pre-built RAG corpus. `/api/analyse` double-checks every AI-cited authority and marks it `VERIFIED` only on an exact neutral-citation match, falling back to a curated list of pre-2003 landmarks. See [`tribunal-harness/docs/live-case-law.md`](tribunal-harness/docs/live-case-law.md).
- **3-agent debate engine** (`/api/debate`) — Drafter → Critic → Judge, scored on a 100-point rubric.
- **Legal-writing refinement** — LLM responses are post-processed to polish prose while preserving the JSON schema.
- **Compliance infrastructure** — UK GDPR Article 9 explicit-consent gate, LSA 2007 disclaimers on every page.
- **PDF → Markdown** — source PDFs are converted to clean Markdown before any LLM reasons over them.

## Tech Stack

The repository contains two layers. The **`tribunal-harness/` Next.js app is the current production build**; the root-level Vite project is an earlier prototype kept for reference.

**Current build (`tribunal-harness/`):**
- Framework: Next.js 15.1.0 (App Router, Turbopack), TypeScript strict mode
- UI: React 19, Tailwind CSS 4, Framer Motion, `lucide-react`
- AI: Anthropic SDK (`@anthropic-ai/sdk`) — hub-and-spoke routing (Haiku → triage, Sonnet → analysis, Opus → critic/judge). All LLM routes degrade gracefully without an API key.
- Document parsing: `mammoth` (DOCX), `pdf-parse` (PDF)
- Testing: Vitest (unit/integration); a hermetic end-to-end smoke harness; ESLint

**Earlier prototype (root `src/` — Vite/React 18, JSX).**

## How to Run

```bash
cd tribunal-harness
npm install
npm run dev          # dev server (Turbopack) → http://localhost:3000
```

```bash
npm run build        # production build (must pass with 0 errors)
npm test             # Vitest — 215 tests
npm run lint         # ESLint
npm run smoke        # hermetic end-to-end run, no API key required (see below)
```

### Offline / no-API-key mode

Set `LLM_PROVIDER=agent` to route every LLM call to a deterministic, schema-conformant stand-in (`src/lib/llm/agent-provider.ts`). `npm run smoke` uses this to invoke every API route in-process and write `smoke-report.{json,md}` — letting the full pipeline (including the debate engine) run with no Anthropic key. With a real key, set `ANTHROPIC_API_KEY` in `tribunal-harness/.env.local` (see `.env.example`).

## Project Structure

```
tribunal-harness/                # repo root (Vite prototype lives here)
├── tribunal-harness/            # ← current build, Next.js App Router (primary)
│   ├── src/
│   │   ├── agents/              # LLM system prompts with rationale comments
│   │   ├── app/                 # pages + API routes (analyse, triage, debate,
│   │   │                        #   deadlines, case-law/{find,judgment,search}, …)
│   │   ├── components/          # React components
│   │   ├── lib/                 # constants.ts (ERA 2025 SSOT), claude-client/-config,
│   │   │                        #   verified-authorities, llm/ (agent stand-in)
│   │   ├── schemas/             # 10 claim-type schemas as TypeScript interfaces
│   │   ├── services/            # deadline-calculator, find-case-law, citation-validator,
│   │   │                        #   legal-writing-refinement, pdf-to-markdown
│   │   └── types/               # shared TypeScript types
│   ├── scripts/smoke-run.ts     # end-to-end smoke harness
│   ├── docs/                    # live-case-law.md, enterprise-audit.md
│   └── CLAUDE.md                # app-level context (read this first)
│
├── src/                         # earlier Vite/React prototype
├── corpus/authorities/          # case-law manifest (judgment PDFs are re-fetchable, gitignored)
├── Design/                      # UI design assets
└── CLAUDE.md                    # full project context and coding standards
```

## Status

In active development. The schema-driven analysis engine, deadline calculator, ERA 2025 tracker, live case-law lookup, 3-agent debate engine, Noir design system, and compliance infrastructure (GDPR, LSA 2007) are implemented and covered by 215 passing tests. Open items: a managed API layer to replace BYOK as the default data flow (required before institutional pilots), and the durable Temporal.io state machine (Phase 4).
