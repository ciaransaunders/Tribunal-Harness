# CLAUDE.md — Tribunal Harness
**Last updated: 18 February 2026**

> **⚠ Current state (June 2026):** This master spec is largely historical and in
> places out of date. The active app is `tribunal-harness/tribunal-harness/` —
> read its `CLAUDE.md` first. Since this spec: all 10 claim schemas are
> implemented; mobile nav, Trust dropdown and the light theme are done; ESLint is
> configured and 193 Vitest tests pass; `/api/debate` is a working 3-agent engine.
> **Case law is now looked up _live_ from TNA Find Case Law (no RAG corpus)** —
> see `tribunal-harness/docs/live-case-law.md`. **Convert any source PDF to
> Markdown before reasoning over it** (see "PDF → Markdown" in the inner CLAUDE.md).
> **`LLM_PROVIDER=agent` + `npm run smoke`** in the inner app runs a hermetic end-to-end smoke test with no API key (agent stand-in at `src/lib/llm/agent-provider.ts`).
> The `_AGENT_BRIEFINGS/` docs (2 Mar 2026) are stale — trust the code.

---

## Project Identity

Tribunal Harness is a UK employment tribunal legal intelligence engine for litigants-in-person
(LiPs). It closes the information asymmetry between unrepresented claimants and respondents
with solicitors. The founder is a qualified lawyer (LLM in Legal Practice with Distinction) and
an active litigant-in-person with direct experience of every gap this tool addresses.

This is not a chatbot. It is a schema-driven legal analysis engine with four architectural
pillars: Inverse Chatbot, Epistemic Quarantine, Durable State Machine, and Adversarial
Shadow-Opponent.

**Commercial positioning:** ERA 2025 readiness tool — the most significant overhaul of UK
employment law in decades. Most practitioners and competing tools have not yet integrated
these changes. This window is real but perishable (12–18 months).

**Regulatory posture:** This tool provides legal information, not legal advice. Every
user-facing output must carry a persistent disclaimer. SRA Regulatory Response Unit
engagement is planned for Q2 2026 — document this in a public-facing "Regulatory Approach"
page when it occurs.

---

## Current Build State (as of 18 February 2026)

**Status: Build-Passing / Design-Aligned / Compliance-Ready**

The application has been transformed from prototype to an enterprise-grade legal product.
Key completed work:

### Design System — COMPLETED
- **Global theme:** "Noir" palette. Pure Black (`#000000`) backgrounds, Purple (`#8B5CF6`)
  accents, Cream (`#E8E3D5`) footer. This supersedes the old `#0A0A0A` near-black and
  `#7B6BF5` purple values — do NOT regress to these.
- **Typography:** Playfair Display for serif headlines, Outfit/Satoshi family for body text,
  monospace for technical/code elements. Pattern per section: PURPLE UPPERCASE LABEL →
  Serif Headline → Body text → Optional illustration.
- **NavBar and Footer:** Uniform across all 27 pages.
- **Hero illustration:** Geometric wireframe illustration deployed on Case Law DB page
  (replacing placeholder text).
- **WCAG AA:** Verified for all new colour pairings.
- **Important:** Institutional/marketing pages (About, Pricing, How It Works, Documentation)
  must use a LIGHT theme. The Noir/dark aesthetic is reserved for the analysis workspace.
  If you find any institutional page still rendering with a dark background, this is a regression.

### Regulatory & Trust Signals — COMPLETED
- **Compliance badges:** The fabricated ISO 42001, ISO 27001, and SOC Type 2 badges have
  been REMOVED. Do not re-add them. The current signals are "UK GDPR Aligned" and
  "Epistemic Honesty" — these are accurate and appropriate.
- **Legal disclaimer:** LSA 2007-compliant "Information vs. Advice" disclaimers are
  implemented on every public-facing page.
- **GDPR consent gate:** Article 9 explicit consent gate for special category data is on the
  analysis input form.
- **Legal infrastructure:** Privacy, Terms, Security, and Ethics pages are deployed.

### ERA 2025 — COMPLETED
- **Single source of truth:** All ERA 2025 logic is centralised in `src/lib/constants.ts`.
  Never hardcode ERA 2025 dates in business logic. If you find a commencement date
  hardcoded outside `constants.ts`, move it immediately.
- **New schemas:** Fire & Rehire and Zero-Hours Rights schemas have been added.
- **Dynamic tracker:** The ERA 2025 Implementation Tracker auto-updates across
  "How It Works" and Documentation pages from the central constant.

### Core Engineering — COMPLETED
- **Deadline calculator:** Built and unit-tested. Handles the 3-month/6-month regime
  change, UK bank holidays, and ACAS Early Conciliation extensions.
- **Build:** Next.js project builds with zero linting errors.

### Known Open Items (next sprint)
- **Case Law DB backend:** The UI is built but connected to static/hardcoded data.
  Must be wired to a real search index or backend. This is HIGH priority.
- **Managed API layer:** The BYOK (Bring Your Own Key) model must be replaced as
  the DEFAULT with a managed API layer where all data flows through the Tribunal Harness
  backend. Tribunal Harness holds the Anthropic API key, executes a DPA with Anthropic,
  and issues a DPA to users/institutions. BYOK may remain as an advanced/developer mode
  only. Until this is done, no enterprise or legal aid pilot is possible. This is CRITICAL.
- **Mobile navigation:** NavBar must render a functional hamburger menu at viewports
  below 900px. Currently no mobile navigation exists — a large portion of LiP users
  access from mobile.
- **Trust NavBar dropdown:** Add a "Trust" dropdown to the NavBar containing: Security,
  Ethics, Methodology. These are currently footer-only and invisible to institutional buyers.

---

## Architecture — Four Pillars

### Pillar 1: Inverse Chatbot (Dynamic Schema Generation)

The user never sees a chat interface. The system generates targeted UI components based
on gap analysis of what facts are still unknown for the legal test.

**Flow:**
1. Document uploaded (PDF/DOCX/TXT) or facts entered via narrative input
2. Parser extracts text (`pdf-parse` for PDF, `mammoth` for DOCX)
3. Triage Agent receives: extracted text + current claim schema state
4. Agent compares facts against the JSON schema for the relevant legal test
5. Agent identifies null fields and generates a query array:
   `[{field_id, question, ui_component, options}]`
6. Frontend renders 1–2 specific form components (date picker, radio, dropdown)
7. User responds → schema updates → next gap analysis cycle

**Claim Type Schemas (10 total):**
| Schema | Statute | ERA 2025 Changes |
|--------|---------|-----------------|
| Unfair Dismissal | ERA 1996 s98 | Qualifying period 2yr→6mo (Jan 2027), uncapped awards, fire-and-rehire auto-unfair |
| Direct Discrimination | EA 2010 s13 | — |
| Indirect Discrimination | EA 2010 s19 | — |
| Harassment | EA 2010 s26 | "All reasonable steps" standard, third-party liability, NDAs voided (Oct 2026) |
| Victimisation | EA 2010 s27 | — |
| Failure to Make Reasonable Adjustments | EA 2010 ss20-21 | — |
| Whistleblowing | ERA Part IVA | Sexual harassment as qualifying disclosure (Apr 2026) |
| Wrongful Dismissal | Common law | — |
| Fire and Rehire *(new)* | ERA 2025 | Automatically unfair from Jan 2027 unless severe financial distress |
| Zero-Hours Rights *(new)* | ERA 2025 | Guaranteed hours, shift notice, cancellation payment (2027 TBC) |

---

### Pillar 2: Epistemic Quarantine (Strict RAG with Validation Gates)

The LLM's parametric memory (training data) is treated as untrusted. All factual claims must
be grounded in the curated, verified vector database. Ungrounded claims are stripped before
reaching the user. This is the single strongest technical differentiator against competitors.

**Vector DB tiers:**
- Tier 1 (binding): Supreme Court + CoA employment judgments
- Tier 2 (persuasive): Key EAT decisions
- Tier 3 (statutory): ERA 1996, EA 2010, ERA 2025, ET Rules 2024 (in force 6 Jan 2025,
  replacing 2013 rules), EAT Practice Direction 2024 (in force 1 Feb 2025), ACAS Code
- Tier 4 (practice): Presidential Guidance, Judicial College guidance

**Validation gate:** Every factual claim requires a citation key mapping to a verified vector
chunk. Output states:
- `VERIFIED` (green): citation found and chunk confirms the claim
- `CHECK` (amber): citation found but confidence below threshold
- `QUARANTINED` (red): no citation found — claim stripped from user-facing output
- `PASS` (no indicator): non-factual content, no citation required

**Do NOT** present unverified claims with any trust indicator other than QUARANTINED.
Erring toward caution is a feature, not a limitation.

---

### Pillar 3: Durable State Machine (Async Event-Driven Workflows)

Legal proceedings take months or years. The system must maintain state across arbitrary
time gaps and survive process restarts.

**FSM states (in order):**
`PRE_ACTION → ACAS_EC → ET1_FILED → ET3_RECEIVED → CASE_MANAGED →
DISCLOSURE → WITNESS_STATEMENTS → BUNDLE_PREP → HEARING → JUDGMENT →
EAT_APPEAL → EAT_SIFT → EAT_RULE3_10 → EAT_FULL_HEARING →
COA_PERMISSION → COA_HEARING`

**Tech:** Temporal.io for durable execution, PostgreSQL (JSONB) for state storage.

---

### Pillar 4: Adversarial Shadow-Opponent (Multi-Agent Debate)

Three agents stress-test every argument before the user sees it.

| Agent | Colour | Temp | Role |
|-------|--------|------|------|
| Drafter | Blue | 0.3 | Claimant's advocate — builds strongest case |
| Critic | Red | 0.7 | Simulates opposing counsel — attacks every weakness |
| Judge | Neutral | 0.1 | Scores on rubric (≥70 to pass), summarises result |

**Debate loop:** Draft → Attack → Revise → Score (max 3 iterations per argument).
**Key constraint:** The Critic must never fabricate weaknesses. It must work from the actual
facts and law in the vector DB, not from parametric memory.

---

## Employment Rights Act 2025 — Full Integration Reference

Royal Assent: 18 December 2025. Phased commencement by Statutory Instrument.
All dates must be stored in `src/lib/constants.ts`. Dates marked TBC must be flagged in
the UI as "exact commencement date to be confirmed by Statutory Instrument."

### Commencement Schedule

**Already in force (by Feb 2026):**
- Industrial action notice period: 14 → 10 days
- Ballot mandates: 6 → 12 months
- Dismissal for industrial action: automatically unfair (no 12-week limit)

**April 2026:**
- SSP from day 1, lower earnings limit removed
- Paternity leave + unpaid parental leave: day-one rights
- Collective redundancy protective award: 90 → 180 days
- Sexual harassment → qualifying disclosure under whistleblowing (Part IVA ERA 1996)
- Fair Work Agency launches (7 April 2026)

**October 2026:**
- **ET claim time limit: 3 months → 6 months** ← HIGHEST IMPACT. Exact SI date TBC.
- Employer duty for harassment: "reasonable steps" → "all reasonable steps"
- Third-party harassment liability (employers liable for harassment by third parties)
- NDAs voided for harassment/discrimination (cannot prevent protected disclosures)
- Employer must inform workers of union rights

**January 2027:**
- Unfair dismissal qualifying period: 2 years → 6 months
- Compensatory award cap removed entirely
- Fire and rehire: automatically unfair unless severe financial distress defence applies
- Fire and replace: automatically unfair

**2027 (dates TBC by SI):**
- Zero-hours contract protections: guaranteed hours, shift notice, cancellation pay
- Enhanced maternity dismissal protection (6+ months post-return)
- Flexible working: stronger default right
- Aggregate redundancy threshold (whole organisation, not establishment)

### Deadline Calculator Logic (CRITICAL)

This is the single most critical integration. Errors here are a legal safety failure.

```
function calculateDeadline(actDate: Date, claimType: ClaimType): DeadlineResult {
  const etTimeLimit = actDate >= ERA_2025_TIME_LIMIT_COMMENCEMENT
    ? SIX_MONTHS_LESS_ONE_DAY   // post Oct 2026
    : THREE_MONTHS_LESS_ONE_DAY // pre Oct 2026

  let deadline = addPeriod(actDate, etTimeLimit)

  // ACAS Early Conciliation clock-stop
  // Day A: EC notification sent → clock stops
  // Day B: EC certificate issued → clock restarts
  // If original deadline falls during or after EC period:
  //   claimant gets remainder of original period OR 1 month from Day B, whichever longer
  if (acasNotificationDate) {
    deadline = applyACASExtension(deadline, acasNotificationDate, acasCertificateDate)
  }

  // Bank holiday adjustment: if deadline falls on bank holiday, advance to next working day
  deadline = adjustForBankHoliday(deadline, ENGLAND_WALES_BANK_HOLIDAYS)

  return { deadline, regime: actDate >= ERA_2025_TIME_LIMIT_COMMENCEMENT ? 'post' : 'pre', tbc: ERA_2025_TIME_LIMIT_TBC }
}
```

**Every transitional edge case must have a unit test.** Especially: acts straddling the
commencement date, ongoing acts, ACAS period crossing the commencement date.

---

## Site Map — All 27 Pages

### NavBar Routes
| Route | Page | Status |
|-------|------|--------|
| `/` | Home | Built |
| `/product` | Product | Built |
| `/how-it-works` | How It Works | Built |
| `/security` | Security | Built |
| `/documentation` | Documentation / Roadmap | Built |
| `/about` | About | Built |
| `/blog` | Blog | Built |
| `/request-access` | Request Access | Built |

**Planned NavBar addition:** "Trust" dropdown containing Security, Ethics, Methodology.
Until this is added, these pages are buried in the footer and invisible to institutional buyers.

### Footer Routes
| Route | Page | Status |
|-------|------|--------|
| `/analysis` | Analysis Engine | Built |
| `/case-law` | Case Law DB | Built (static data — backend pending) |
| `/schema-builder` | Schema Builder | Built |
| `/pricing` | Pricing | Built |
| `/methodology` | Methodology | Built |
| `/ethics` | Ethics | Built |
| `/privacy` | Privacy Policy | Built |
| `/terms` | Terms of Service | Built |
| `/contact` | Contact | Built |
| `/era-2025` | ERA 2025 Tracker | Built |

### Additional Pages
| Route | Page | Status |
|-------|------|--------|
| `/docs` | Documentation (alias) | Check for duplication |

### API Routes
| Route | Method | Status |
|-------|--------|--------|
| `/api/analyse` | POST | Built |
| `/api/triage` | POST | Built |
| `/api/schema/[claimType]` | GET | Built |
| `/api/deadlines` | POST | Built + tested |
| `/api/roadmap/[caseId]` | GET | Built |
| `/api/era-2025/tracker` | GET | Built |
| `/api/request-access` | POST | Built |
| `/api/debate` | POST | **STUB — not yet implemented** |
| `/api/webhook` | POST | **STUB — not yet implemented** |

---

## Claude Model Configuration

**Single source of truth:** `src/lib/claude-config.ts`

Tribunal Harness uses a hub-and-spoke model routing strategy. Each API endpoint
routes to the optimal Claude model for its task. All model identifiers, effort
levels, thinking budgets, and token limits are centralised in the config file.

### Model Routing Table

| Endpoint | Model | Effort | Thinking Budget | Temp | Rationale |
|----------|-------|--------|-----------------|------|-----------|
| `/api/triage` | Haiku | `low` | Disabled | 0.3 | Near-frontier at 1/3 cost, 2x speed — ideal for extraction |
| `/api/analyse` (standard) | Sonnet | `medium` | 10K tokens | 0.3 | Balanced cost/intelligence for most analysis |
| `/api/analyse` (complex) | Opus | `high` | 20K tokens | 0.3 | Frontier reasoning for multi-document or novel law |
| `/api/debate` — Drafter | Sonnet | `medium` | 8K tokens | 0.3 | Good drafting quality, controlled cost |
| `/api/debate` — Critic | Opus | `high` | 15K tokens | 0.7 | Deep reasoning to find genuine weaknesses |
| `/api/debate` — Judge | Opus | `medium` | 10K tokens | 0.1 | Maximum consistency in scoring |

### Prompt Versions

All prompts live in `src/agents/prompts.ts`. Current production versions:
- `ANALYSE_PROMPT_v2` — anti-hallucination, confidence bands, structured JSON
- `TRIAGE_PROMPT_v2` — structured extraction, date heuristics
- `DRAFTER_PROMPT_v2` — citation-only constraint, ERA 2025 awareness
- `CRITIC_PROMPT_v2` — anti-fabrication directive, severity ratings
- `JUDGE_PROMPT_v2` — 100-point scoring rubric with 5 criteria, ≥70 to pass

Legacy v1 prompts are preserved as deprecated exports for A/B comparison.

### Key Files

| File | Purpose |
|------|---------|
| `src/lib/claude-config.ts` | Model identifiers, routing table, effort defaults, cost estimation |
| `src/lib/claude-client.ts` | Singleton Anthropic client factory, `callClaude()` helper |
| `src/agents/prompts.ts` | All v2 system prompts with version constants |

---

## Tech Stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| Frontend | Next.js 14+ (App Router) + React + Tailwind | App Router only |
| LLM | Anthropic Claude API (multi-model) | Routing: Opus/Sonnet/Haiku per `src/lib/claude-config.ts` |
| Vector DB | Pinecone or Weaviate | **OPEN DECISION — do not implement without founder input** |
| Orchestration | Temporal.io | Phase 4 — not started |
| Database | PostgreSQL via Supabase | |
| Agent framework | LangGraph | Phase 3 — not started |
| Doc parsing | pdf-parse (PDF), mammoth (DOCX) | |
| Auth | Clerk or NextAuth | **OPEN DECISION** |
| Hosting | Vercel (frontend) + Railway/Fly.io (workers) | |
| Data processing | Managed API layer (replacing BYOK default) | **CRITICAL — must be built before enterprise pilots** |

---

## Build Phase Checklist

### Phase 1 — Foundation ✅ SUBSTANTIALLY COMPLETE

- [x] Migrate to Next.js 14+ (App Router)
- [x] Extract NavBar and Footer as shared components (uniform across 27 pages)
- [x] Implement all 10 claim type schemas with TypeScript interfaces
- [x] ERA 2025 constants file (`src/lib/constants.ts`) — single source of truth
- [x] Build `/api/analyse` endpoint with ERA 2025 awareness
- [x] Build `/api/triage` with PDF/DOCX/TXT parsing
- [x] Build `/api/deadlines` with dual-regime calculator (pre/post ERA 2025)
- [x] Build `/api/schema/[claimType]` endpoint
- [x] Build `/api/era-2025/tracker` endpoint
- [x] Build all 27 page destinations
- [x] Wire nav and footer links
- [x] Deadline calculator unit tests (regime change, bank holidays, ACAS EC)
- [x] Noir design system (Pure Black, Purple `#8B5CF6`, Cream `#E8E3D5`)
- [x] LSA 2007 disclaimer on all pages
- [x] GDPR Article 9 consent gate on analysis input
- [x] Remove fabricated compliance badges — replace with Security Roadmap
- [x] Deploy Privacy, Terms, Security, Ethics pages
- [x] ERA 2025 Implementation Tracker (auto-updating from `constants.ts`)
- [x] Fire & Rehire schema added
- [x] Zero-Hours Rights schema added

**Still to complete in Phase 1:**
- [ ] **CRITICAL:** Replace BYOK as default with managed API layer + DPA framework
- [ ] **HIGH:** Wire Case Law DB to real backend/search index (currently static data)
- [ ] **HIGH:** Implement mobile hamburger navigation (< 900px breakpoint)
- [ ] **MEDIUM:** Add "Trust" dropdown to NavBar (Security, Ethics, Methodology)
- [ ] **MEDIUM:** Light theme for institutional/marketing pages (About, Pricing, How It Works, Docs)
- [ ] **MEDIUM:** Add social proof to landing page (testimonials, advisory board, university name)
- [ ] **MEDIUM:** Add persistent legal disclaimer to every page rendering legal analysis output (not just About page)
- [ ] Citation trust indicators on analysis output (VERIFIED / CHECK / QUARANTINED / PASS)
- [ ] Procedural roadmap component (ET → EAT → CoA state visualisation)
- [ ] `/api/request-access` form wired and tested end-to-end

### Phase 2 — Core Intelligence Infrastructure
- [ ] Set up vector DB with top 50+ UK employment authorities
- [ ] Ingest ERA 2025 statutory text, ET Rules 2024, EAT PD 2024
- [ ] Build ingestion pipeline (BAILII + legislation.gov.uk)
- [ ] Implement citation key system and validation gates (VERIFIED/CHECK/QUARANTINED/PASS)
- [ ] Connect inverse chatbot flow end-to-end (document → triage → dynamic form → updated schema)
- [ ] Case Law DB search wired to real vector DB query
- [ ] SRA RRU engagement documented in public-facing "Regulatory Approach" page

### Phase 3 — Adversarial Layer
- [ ] Write Drafter, Critic, Judge agent system prompts with design rationale comments
- [ ] Implement LangGraph debate orchestrator
- [ ] Build scoring rubric evaluation (≥70 to pass)
- [ ] Create debate log viewer UI component
- [ ] Wire `/api/debate` endpoint (currently stub)

### Phase 4 — Durable State
- [ ] Set up Temporal.io worker infrastructure
- [ ] Implement FSM state definitions and transitions (all 16 states)
- [ ] Build webhook receiver for tribunal correspondence (currently stub)
- [ ] Build state dashboard UI component
- [ ] Notification system for approaching deadlines
- [ ] Wire `/api/webhook` endpoint (currently stub)

---

## Domain Knowledge — Non-Negotiable Correctness

Errors in this section are critical failures. The tool must get UK employment law right.

### Time Limits (ERA 2025-Aware)

| Scenario | Rule |
|----------|------|
| Act pre-October 2026 | 3 months less 1 day from EDT/act date |
| Act post-October 2026 | 6 months less 1 day (ERA 2025 amendment) |
| ACAS EC clock-stop | Day A (notification) stops clock; Day B (certificate) restarts it. Claimant gets remainder of original period or 1 month from Day B, whichever is longer |
| Continuing acts (EA 2010) | Time runs from end of last act in series (s123(3)(a)) |
| Just and equitable extension | Tribunal discretion — discrimination claims only |
| Not reasonably practicable | Tribunal discretion — unfair dismissal claims only |

### Qualifying Period (ERA 2025-Aware)

| Period | Rule |
|--------|------|
| Pre-January 2027 | 2 years' continuous employment |
| Post-January 2027 | 6 months' continuous employment |
| Automatically unfair dismissal | No qualifying period required |

### Automatically Unfair Dismissal (Updated)

Pre-existing: Whistleblowing · Pregnancy/maternity · Trade union · Health & safety ·
Assertion of statutory right · TUPE
**NEW Feb 2026:** Industrial action participation (12-week limit removed)
**NEW Jan 2027:** Fire and rehire · Fire and replace

### Burden of Proof

- **Discrimination:** Two-stage test — Igen v Wong [2005] ICR 931, Madarassy v Nomura [2007]
  EWCA Civ 33. Stage 1: claimant establishes prima facie case. Stage 2: burden shifts.
- **Unfair dismissal:** Employer shows potentially fair reason (s98(1)-(2)), tribunal assesses
  reasonableness on balance of equity and merits (s98(4), band of reasonable responses).

### Procedural Rules (CURRENT — do not reference superseded rules)

- **ET Rules of Procedure 2024:** In force **6 January 2025**. Replaced the 2013 rules.
  Key changes: "shall" → "must", expanded tribunal staff powers (Rule 7), defect rectification
  date is date received not presented (Rules 14(4), 20), MyHMCTS replaces email filing for
  professional reps (Rule 16), judgment approval without signature (Rule 59).
- **EAT Practice Direction 2024:** In force **1 February 2025**. Replaced the 2023 PD.
  Includes MyHMCTS guidance. EAT Rules 1993 amended by Employment Appeal Tribunal
  (Amendment) Rules 2024.
- **Always cite 2024 rules. Never cite the 2013 ET Rules or the 2023 EAT PD.**

### Key Authorities (Must Be in Vector DB)

| Case | Citation | Principle |
|------|----------|-----------|
| Igen Ltd v Wong | [2005] ICR 931 | Burden of proof — discrimination |
| Polkey v AE Dayton Services | [1988] ICR 142 | Procedural fairness in dismissal |
| Western Excavating v Sharp | [1978] ICR 221 | Constructive dismissal test |
| Environment Agency v Rowan | [2008] ICR 218 | Reasonable adjustments |
| Madarassy v Nomura | [2007] EWCA Civ 33 | Two-stage discrimination test |
| Chesterton Global v Nurmohamed | [2017] ICR 920 | Public interest — whistleblowing |
| Vento v Chief Constable of West Yorkshire | [2003] ICR 318 | Injury to feelings bands |
| Cavendish Munro v Geduld | [2010] ICR 325 | Information vs allegation |

---

## Coding Standards

- **TypeScript strict mode** throughout. No `any` types.
- **Functional React components** with hooks. No class components.
- **Server Components** by default (Next.js App Router). Client Components only where
  interactivity requires it — mark explicitly with `'use client'`.
- **File structure:**
  - `src/schemas/` — all 10 claim type schemas as TypeScript interfaces
  - `src/agents/` — agent system prompts as template literal constants with rationale comments
  - `src/lib/constants.ts` — **all** ERA 2025 commencement dates. Single source of truth.
  - `src/lib/validation/` — validation gate logic
  - `src/services/` — service layer (deadline calculator, triage, vector queries)
  - `src/app/api/` — all API routes
  - `*.test.ts` — co-located with source file
- **Testing:** Vitest for unit/integration. Playwright for E2E.
- **ERA 2025 dates:** Never hardcode outside `constants.ts`. If you find one, move it.
- **Deadlines:** Every calculation must have a unit test with edge cases.
- **Agent prompts:** Every system prompt must have a comment block explaining design rationale.
- **New pages:** Follow section pattern: PURPLE UPPERCASE LABEL → Serif Headline →
  Body text → Optional illustration.
- **Secrets:** Environment variables in `.env.local` only. Never commit.
- **Commits:** Reference the pillar (P1/P2/P3/P4) and phase in commit message.

---

## Constraints (Hard Rules)

1. **Legal information, not legal advice.** Every user-facing analysis output must carry a
   persistent, non-dismissible disclaimer.
2. **No unverified citations.** Every factual claim must have a trust indicator. QUARANTINED
   claims must be stripped before reaching the user.
3. **Critic agents must not fabricate.** The Critic must work from actual facts and law
   in the vector DB only.
4. **Deadline conservatism.** If there is ambiguity, assume the shorter deadline and flag
   uncertainty. Never give false confidence on time limits.
5. **England & Wales jurisdiction only** unless the user explicitly selects otherwise.
6. **ERA 2025 TBC dates must be flagged** in the UI: "Exact commencement date to be
   confirmed by Statutory Instrument."
7. **No fabricated compliance claims.** Compliance signals must only describe what the
   product actually does today. The Security Roadmap shows future targets as planned
   timelines, not achieved certifications.
8. **BYOK must not be the default data flow.** Until the managed API layer is live, clearly
   label BYOK as an experimental/developer mode and do not promote it to institutional users.

---

## Open Design Decisions

Do not make unilateral choices on these. Flag them and wait for founder input.

| # | Decision | Options | Current status |
|---|----------|---------|---------------|
| 1 | Vector DB provider | Pinecone vs Weaviate | Undecided |
| 2 | Case law sourcing | BAILII scraping vs vLex/LexisNexis API vs manual curation | Undecided |
| 3 | Auth model | Individual LiPs only vs legal aid providers / small firms | Undecided |
| 4 | Open-source core engine | Yes vs No vs partial | Undecided |
| 5 | LLM routing | Hub-and-spoke: Haiku (triage), Sonnet (analysis/drafting), Opus (critic/judge/complex) | **RESOLVED** — see Claude Model Configuration section |
| 6 | TBC commencement dates | How prominently to flag uncertainty in the UI | Undecided |

---

## Session Startup Checklist

When beginning a new work session:

1. Read this file in full.
2. Read `src/lib/constants.ts` — confirm ERA 2025 dates are current.
3. Check for any open PRs or uncommitted changes.
4. Identify the current phase from the Build Phase Checklist above.
5. Pick the highest-severity unchecked item.
6. Implement it with tests.
7. Commit with a message referencing the pillar and phase (e.g., `P1 Phase1: implement managed API layer, replace BYOK default`).

Continue until the current phase checklist is complete or you hit an Open Design Decision.
When you hit an Open Design Decision, stop and surface it to the founder with a clear
recommendation and trade-off summary. Do not guess.
