# CLAUDE.md — Tribunal Harness

> **Last updated:** 20 February 2026

## Project Identity

**Tribunal Harness** is a UK employment tribunal legal intelligence engine for litigants-in-person (LiPs). It provides schema-driven case analysis, deadline calculation, and procedural guidance — legal *information*, not legal *advice*.

**Author:** Qualified lawyer (LLM with Distinction), active litigant-in-person.
**Mission:** Close the information asymmetry between unrepresented claimants and respondents with solicitors.

> **Build state (June 2026):** All 10 claim schemas are implemented (one file each). `/api/debate` is a working 3-agent engine. ESLint is configured; 193 Vitest tests pass. Case law is looked up **live** from TNA Find Case Law — no RAG corpus (see `docs/live-case-law.md`). Status reports: `IMPROVEMENT-LOG.md`, `TESTING_READINESS.md`. ⚠ The `../_AGENT_BRIEFINGS/` docs (2 Mar 2026) are **stale** — trust the code over them.

---

## Architecture

```
tribunal-harness/
├── src/
│   ├── app/                         # Next.js 15 App Router (Turbopack)
│   │   ├── page.tsx                 # Homepage — analysis workspace ("use client")
│   │   ├── layout.tsx               # Root layout (Playfair Display + Inter fonts)
│   │   ├── globals.css              # Design system tokens + .theme-light class
│   │   ├── error.tsx                # Page-level error boundary
│   │   ├── global-error.tsx         # Fatal root-level error boundary
│   │   ├── sitemap.ts               # Dynamic sitemap (17 public routes)
│   │   │
│   │   ├── api/                     # API Routes
│   │   │   ├── analyse/route.ts     # POST — Main AI analysis (Claude Sonnet 4)
│   │   │   ├── triage/route.ts      # POST — Document triage (Claude Sonnet 4)
│   │   │   ├── deadlines/route.ts   # POST — Deadline calculator (no LLM)
│   │   │   ├── schema/[claimType]/  # GET  — Schema for a claim type (no LLM)
│   │   │   ├── case-law/search/     # GET  — Case law search, 20 seed cases (no LLM)
│   │   │   ├── era-2025/tracker/    # GET  — ERA 2025 tracker data (no LLM)
│   │   │   ├── request-access/      # POST — Lead capture → data/access-requests.jsonl
│   │   │   ├── debate/route.ts      # POST — STUB returns 202 (Phase 3)
│   │   │   ├── roadmap/[caseId]/    # GET  — Static procedural roadmap (Phase 4)
│   │   │   └── webhook/route.ts     # POST — HMAC-SHA256 verified (Phase 4)
│   │   │
│   │   ├── analysis-engine/         # Analysis Engine feature page
│   │   ├── case-law-db/             # Case Law Database search UI
│   │   ├── era-2025/                # ERA 2025 commencement tracker
│   │   ├── how-it-works/            # How It Works page
│   │   ├── methodology/             # Technical methodology
│   │   ├── pricing/                 # Pricing page
│   │   ├── product/                 # Product/architecture page
│   │   ├── schema-builder/          # Schema builder page
│   │   ├── request-access/          # Access request form
│   │   ├── about/                   # About page
│   │   ├── blog/                    # Blog page
│   │   ├── contact/                 # Contact page
│   │   ├── documentation/           # Documentation hub
│   │   ├── ethics/                  # Ethics page
│   │   ├── privacy/                 # Privacy policy (UK GDPR compliant)
│   │   ├── security/                # Security & compliance page
│   │   ├── terms/                   # Terms of use
│   │   │
│   │   ├── analysis/                # Redirect → /analysis-engine
│   │   ├── case-law/                # Redirect → /case-law-db
│   │   └── docs/                    # Redirect → /documentation
│   │
│   ├── components/layout/
│   │   ├── NavBar.tsx               # Sticky nav (hamburger mobile + Trust dropdown)
│   │   └── Footer.tsx               # Cream-themed footer with legal disclaimer
│   │
│   ├── schemas/                     # Claim type schemas (all 10 implemented, one file each)
│   │   ├── index.ts                 # Schema registry — getSchema(claimType)
│   │   ├── types.ts                 # TS interfaces (incl. ValidatedAuthority)
│   │   ├── unfair-dismissal.ts
│   │   ├── direct-discrimination.ts
│   │   ├── indirect-discrimination.ts
│   │   ├── victimisation.ts
│   │   ├── harassment.ts
│   │   ├── reasonable-adjustments.ts
│   │   ├── wrongful-dismissal.ts
│   │   ├── whistleblowing.ts
│   │   ├── fire-and-rehire.ts
│   │   └── zero-hours-rights.ts
│   │
│   ├── services/
│   │   ├── deadline-calculator.ts      # ERA 2025 dual-regime deadline logic
│   │   ├── deadline-calculator.test.ts # 18 unit tests
│   │   └── api-routes.test.ts          # API route integration tests
│   │
│   └── lib/
│       └── constants.ts             # ⚠ SINGLE SOURCE OF TRUTH for ERA 2025 dates,
│                                    #   claim types, FSM states, time limit config
│
├── data/                            # Runtime data (gitignored, contains PII)
│   └── access-requests.jsonl        # Lead capture file
│
├── public/
│   ├── robots.txt                   # SEO
│   └── images/                      # (emptied — SVGs are inline now)
│
├── .env.local                       # Environment variables (not committed)
├── .gitignore                       # Ignores node_modules, .next, data/, .env*
├── .vscode/settings.json            # Suppresses @theme CSS lint warning
├── CLAUDE.md                        # ← This file
├── HANDOFF.md                       # Developer handoff guide
├── package.json                     # Next.js 15, React 19, Tailwind 4, Vitest
└── tsconfig.json                    # TypeScript strict mode
```

---

## LLM Dependencies

The project uses **one LLM provider**:

| Route | Model | Purpose |
|-------|-------|---------|
| `/api/analyse` | `claude-sonnet-4-20250514` | Schema-driven legal analysis: identifies claims, assesses strength, surfaces statutes and authorities, flags ERA 2025 provisions |
| `/api/triage` | `claude-sonnet-4-20250514` | Document triage: parses uploaded PDF/DOCX/TXT, identifies claim types, key dates, and missing info |

Both routes **degrade gracefully** without `ANTHROPIC_API_KEY` — they return schema data and extracted text without AI analysis.

**Offline agent stand-in.** Set `LLM_PROVIDER=agent` to route every `callClaude()` to `src/lib/llm/agent-provider.ts` (deterministic, schema-conformant JSON, debug.model=`agent-stand-in`). Used by `npm run smoke`; lets the full pipeline (including `/api/debate`) run with no API key. Hermeticity invariant: the stand-in must only emit citations whose leading short-name lives in `src/lib/verified-authorities.ts` (Polkey, BHS v Burchell, Iceland Frozen Foods, etc.) — otherwise `citation-validator` falls through to a live Find Case Law fetch.

**Legal-writing refinement.** Every LLM response from /api/analyse, /api/triage, /api/debate is post-processed by `refineForUser()` in `src/services/legal-writing-refinement.ts`, which calls Claude with `LEGAL_WRITING_REFINEMENT_PROMPT_v1` — a combined editor prompt distilled from the /legal-writing-quality and /persuasive-legal-writing skills. The refinement preserves the JSON schema and only polishes the prose values (claim reasoning, judge synthesis, procedural notes, etc.). It runs even in the offline agent stand-in (pass-through synth, recorded as `refinement.source: 'agent-stand-in'` in the response). Disable with `REFINEMENT_DISABLED=1`.

**No other LLM providers are used.** There are no OpenAI, Google, Mistral, or other API calls.

---

## Domain Rules — READ BEFORE EDITING

### Legal Services Act 2007
This product provides **legal information, not legal advice**. Every page must include the disclaimer: *"This tool provides legal information, not legal advice. It does not create a solicitor-client relationship."*

Never add features that:
- File documents on behalf of users
- Make submissions to tribunals
- Provide case-specific strategic advice framed as definitive

### UK GDPR / Data Protection Act 2018
- Special category data (health, race, religion, sexual orientation) is processed under Article 9(2)(a) — explicit consent
- The consent gate on the homepage (`hasConsented` state) must remain before any analysis submission
- Data controller contact: `dpo@tribunalharness.co.uk`
- ICO registration required before public launch
- The `data/` directory contains PII and is gitignored

### Employment Rights Act 2025 (ERA 2025)
**All ERA 2025 dates live in `src/lib/constants.ts`. Never hardcode dates elsewhere.**

Key commencement dates (as of 20 Feb 2026):
- `INDUSTRIAL_ACTION_DISMISSAL`: 18 Feb 2026 — **IN FORCE**
- `SEXUAL_HARASSMENT_WHISTLEBLOWING`: 6 Apr 2026 — **IN FORCE**
- `ET_TIME_LIMIT_6_MONTHS`: Oct 2026 — **UPCOMING** (SI awaited)
- `QUALIFYING_PERIOD_6_MONTHS`: 1 Jan 2027 — **UPCOMING**
- `FIRE_AND_REHIRE_AUTO_UNFAIR`: 1 Jan 2027 — **UPCOMING**
- `ZERO_HOURS_PROTECTIONS`: 2027 — **AWAITING SI**

The `TIME_LIMIT_CONFIG.COMMENCEMENT_DATE` can be overridden via `ERA_2025_TIME_LIMIT_COMMENCEMENT` env var when the SI is confirmed.

### Trust Indicators
Every legal proposition in AI output must carry a trust level:
- `VERIFIED` — grounded in statute or cited case law
- `CHECK` — partially grounded, needs human verification
- `QUARANTINED` — ungrounded, stripped from output

---

## Build & Run

```bash
# Install
npm install

# Dev server (Turbopack)
npm run dev          # → http://localhost:3000

# Build (must pass with 0 errors)
npm run build

# Tests
npm test             # Vitest — deadline-calculator + API route tests

# Lint
npm run lint         # Next.js ESLint

# End-to-end smoke run — invokes every API route in-process via the agent stand-in,
# writes smoke-report.{json,md} (gitignored). Exits 0 iff every section is well-formed.
npm run smoke        # = LLM_PROVIDER=agent tsx scripts/smoke-run.ts
```

### Required Environment Variables

```bash
# .env.local
ANTHROPIC_API_KEY=sk-ant-...          # Required for AI analysis and triage
RESEND_API_KEY=re_...                  # Optional: email notifications for access requests
NOTIFY_EMAIL=hello@tribunalharness.co.uk  # Optional: where to send access request notifications
WEBHOOK_SECRET=...                     # Required for /api/webhook to accept requests
ERA_2025_TIME_LIMIT_COMMENCEMENT=...   # Optional: override Oct 2026 date when SI confirmed
LLM_PROVIDER=agent                     # Optional: route all LLM calls to the offline agent stand-in (no API key needed)
REFINEMENT_DISABLED=1                   # Optional: bypass the legal-writing refinement layer
```

---

## Design System

### Core Brand Tokens (in `globals.css` `@theme` block)
| Token | Value | Use |
|-------|-------|-----|
| `--color-bg-primary` | `#000000` | Dark page backgrounds |
| `--color-accent-purple` | `#8B5CF6` | Primary accent, CTAs, active links |
| `--color-text-primary` | `#E8E8E8` | Body copy |
| `--color-bg-cream` | `#E8E3D5` | Footer, light theme backgrounds |
| `--font-serif` | Playfair Display | Headlines |
| `--font-sans` | Inter | Body |
| `--font-mono` | JetBrains Mono | Code labels |

### Liquid Glass System (added Feb 2026)
The navigation bar and interactive menu elements use the **Liquid Glass** material system. All glass primitives are defined as CSS utility classes in `globals.css`.

**Do not apply glass to dense content (long text, data tables).** Glass is a material for *controls over content*, not for content itself.

| Class | Thickness | `backdrop-filter` | Use |
|-------|-----------|-------------------|-----|
| `.glass-surface` | Base | none | Base wrapper, sets no-border rule |
| `.glass-thin` | Thin | `blur(12px) saturate(140%)` | Buttons, pills |
| `.glass-medium` | Medium | `blur(20px) saturate(160%)` | Dropdowns, cards |
| `.glass-thick` | Thick | `blur(32px) saturate(180%)` | NavBar, mobile menu |

**Supporting utilities:**
- `.glass-text` — heavier weight (600+) + `text-shadow` for legibility on translucent surfaces
- `.glass-button` — elastic hover/active states using `cubic-bezier(0.34, 1.56, 0.64, 1)`

**Accessibility modes** (set `data-a11y` attribute on `<body>`):
- `reduced-transparency` — frosted/blurred glass, content barely visible behind
- `high-contrast` — near-opaque surface, strong ring border, no motion

**Never stack glass on glass** without one layer being more opaque than the other.

### Theme Modes
- **Dark (default):** Pure black + purple accent — analysis workspace pages
- **Light:** Apply `.theme-light` wrapper class on institutional pages (cream `#F8F7F4`)

---

## Coding Standards

1. **TypeScript strict mode** — no `any`, no `@ts-ignore`
2. **ERA 2025 dates** — always import from `@/lib/constants`, never hardcode
3. **CSS variables** — use `var(--color-*)` tokens from `globals.css`, never raw hex in components
4. **Glass system** — use `.glass-thin/medium/thick` for nav and interactive UI elements; never add a hard `border` to a glass element
5. **Schemas** — all claim types must have a schema in `src/schemas/`. New claim types require: schema file, entry in `schemas/index.ts`, entry in `CLAIM_TYPES` in `constants.ts`
6. **Disclaimers** — every page must include the legal information disclaimer
7. **Consent** — any form that collects personal data must have an explicit consent checkbox
8. **Tests** — new API routes must have integration tests in `src/services/*.test.ts`
9. **SVG illustrations** — all diagrams are inline `<svg>` JSX, not external image files

---

## Phase Roadmap

| Phase | Status | Key Features |
|-------|--------|-------------|
| 1 | ✅ Complete | Schema-driven analysis, deadline calculator, 10 claim types, ERA 2025 tracker |
| 2 | ✅ Complete | Case law search (seed data), mobile nav, lead capture persistence, API tests, SVG illustrations |
| 3 | 📋 Planned | Adversarial debate engine (3-agent Drafter/Critic/Judge loop), managed API layer |
| 4 | 📋 Planned | Temporal.io state machine, webhook integration, durable case tracking |

---

## Case Law — Live Lookup (no RAG base)

Case law is retrieved and verified **live** from **TNA Find Case Law**
(`caselaw.nationalarchives.gov.uk`, free, no key, ~1,000 req/5 min), not from a
pre-built vector/RAG corpus. Full detail in `docs/live-case-law.md`.

- `src/services/find-case-law.ts` — `searchCaseLaw()`, `verifyCitation()`, `getJudgmentMarkdown()`; structured `{status}` envelope; graceful degradation (never throws).
- `GET /api/case-law/find?q=…&court=eat` — live search. (`/api/case-law/search` is the older curated seed data.)
- `/api/analyse` double-checks every AI-cited authority live; VERIFIED only on an **exact neutral-citation match**; falls back to the curated `verified-authorities.ts` list (the only reliable source for pre-2003 landmarks) and **never falsely verifies** if upstream is down.
- **Verify citations, never guess them.** Citation numbers are easy to get wrong — this repo's own seed list had several (see `corpus/authorities/MANIFEST.md`).
- Coverage is ~2003 onward; older landmark authorities live in `verified-authorities.ts`.

## PDF → Markdown Before Reasoning

**Always convert a PDF to Markdown / clean text before an LLM reasons over it** —
models reason far better over Markdown than raw PDF bytes.

- **In the product:** `src/services/pdf-to-markdown.ts` (`pdfBufferToMarkdown`, `fetchPdfAsMarkdown` — allowlisted legal domains only, SSRF-safe) converts fetched judgment/source PDFs via `pdf-parse`. `find-case-law.ts:getJudgmentMarkdown(slug)` returns a found judgment as Markdown. Prefer TNA `data.xml` / clean text where available; fall back to PDF.
- **In agent / dev sessions:** use the local `pdf-to-markdown` pipeline (binary at `~/.local/bin/pdf-to-markdown`; 3-branch fallback handles scanned and null-byte/SIGSEGV PDFs via `pypdf` + `cupsfilter`). Convert first, then reason.

## Known Stubs & Technical Debt

- `/api/debate` — **implemented**: 3-agent Drafter→Critic→Judge (single pass). Needs `ANTHROPIC_API_KEY`; no degraded mode.
- `/api/webhook` — requires `WEBHOOK_SECRET` env var. Phase 4.
- `/api/roadmap/[caseId]` — returns static roadmap template. Phase 4 (Temporal.io).
- Case Law DB — `/api/case-law/search` is curated seed data; `/api/case-law/find` is live (see Case Law above). A heavy vector DB / RAG corpus is intentionally avoided.
- All 10 claim schemas are implemented (one file per claim type in `src/schemas/`).
- `pdf-parse` and `mammoth` are runtime deps for `/api/triage` and the PDF→Markdown pipeline — server-side only.
- **Response-shape drifts** (smoke harness already normalises both): `/api/deadlines` returns `time_limit_regime: "pre_era_2025" | "post_era_2025"` and `original_deadline` (not `regime` / `deadline_date`); `/api/era-2025/tracker` returns `{ changes: [...] }` (not `{ tracker: [...] }`). Reconcile when the UI is wired through.

---
