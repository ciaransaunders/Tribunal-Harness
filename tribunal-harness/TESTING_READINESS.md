# TESTING READINESS — Tribunal Harness

> Prepared: 20 June 2026 · Branch: `improvement-run-2026-06-20` (not pushed)
> Verdict: **READY for a guided/manual testing phase** of the Phase 1 + Phase 2-frontend product. Cloud-dependent features (accounts, RAG) are out of scope and listed below.

---

## 1. TL;DR

- The agent briefings in `_AGENT_BRIEFINGS/` are dated **2 March 2026 and are stale**. A 5-agent audit confirmed almost every "to build" item is **already built** (mobile nav, Trust dropdown, light theme, citation trust indicators, the 3-agent debate engine, all 11 API routes).
- This run **hardened the app for testing**: +112 automated tests (65 → **177**), fixed a real keyboard-accessibility bug, and made analysis errors human-readable.
- **Green across the board:** `npm run build` ✅ · `npm test` (177) ✅ · `npm run lint` ✅.
- What's **not** ready is everything needing a **Supabase account or a founder design decision** (persistence, auth, vector DB / RAG). Those are listed in §6 — they cannot be built autonomously.

---

## 2. What works today (verified)

| Area | State |
|---|---|
| 27 pages, routing, nav (desktop + **mobile hamburger**) | ✅ |
| **Trust dropdown** (Security/Ethics/Methodology) — now keyboard + touch operable | ✅ |
| **Light theme** on institutional pages (verified cream `#F8F7F4`) | ✅ |
| Analysis flow: input → analysing spinner → results, with **plain-language errors** | ✅ |
| All 10 claim schemas (correct statutes incl. EA 2010 s19/s27) | ✅ |
| Deadline calculator (dual regime, ACAS, bank holidays) | ✅ tested |
| Citation validator (epistemic quarantine) wired into `/api/analyse` | ✅ |
| Trust indicators VERIFIED / CHECK / QUARANTINED in analysis UI | ✅ |
| 3-agent debate engine (`/api/debate`) | ✅ implemented (needs API key to run) |
| Webhook HMAC verification, all other API routes | ✅ |
| ERA 2025 dates centralised; TBC dates flagged; LSA disclaimer site-wide; GDPR consent gate | ✅ |
| Graceful degradation with no `ANTHROPIC_API_KEY` (analyse/triage return schema data) | ✅ |

---

## 3. How to run locally

```bash
cd tribunal-harness/tribunal-harness     # the inner app dir — IMPORTANT
npm install
cp .env.example .env.local               # optional: add ANTHROPIC_API_KEY for live AI

npm run dev                              # http://localhost:3000
# or, to mirror CI before testing:
npm run build && npm test && npm run lint
```

- **Without an API key:** the app runs fully; `/api/analyse` and `/api/triage` return the schema/legal-test data with a clear "AI analysis requires a key" message (no crashes). Good enough to test every page, nav, deadline calculator, case-law search, and the consent/disclaimer flows.
- **With an API key:** the live AI analysis, triage, and debate engine become testable. Watch spend — see §6 (rate limiting is not yet hardened).

---

## 4. Manual QA script (synthetic data only — never use a real case)

Work top to bottom; each takes ~1 min.

1. **Mobile nav** — narrow the window < 768px (or DevTools device mode). Hamburger appears → opens overlay with nav links, Trust section, CTA. Each link closes the menu.
2. **Trust dropdown (keyboard)** — Tab to the "Trust" button, press Enter/Space → dropdown opens; Escape closes it; Tab through Security/Ethics/Methodology.
3. **Light theme** — visit /about, /pricing, /how-it-works, /documentation, /blog, /contact → cream background, dark text. Visit /analysis-engine, /case-law-db, /era-2025 → dark (correct).
4. **Disclaimer + consent** — on the homepage, the analysis form has a consent checkbox; the Run button stays disabled until it's ticked. A "legal information, not legal advice" disclaimer is visible.
5. **Analysis (degraded, no key)** — pick a claim type, paste a synthetic narrative (below), tick consent, Run → results panel shows the legal test + statute; no crash.
6. **Analysis error UX** — stop the dev server mid-request (or disable network) → you get the calm plain-English message, not a raw error string.
7. **Deadline calculator** — use the synthetic date tuples below; confirm the regime flips at the Oct-2026 boundary.
8. **Case law search** — /case-law-db, search "Polkey" / filter by claim type → results with trust badges.
9. **ERA 2025 tracker** — /era-2025 → provisions with commencement + status (TBC ones flagged).

### Synthetic narratives (fake — safe to paste)
- **Unfair dismissal:** "I worked at a warehouse for 4 years. On 3 March 2026 I was dismissed for 'gross misconduct' after raising safety concerns. No investigation meeting was held."
- **Direct discrimination:** "I was passed over for promotion three times after telling my manager I was pregnant; a less experienced colleague got the role on 12 January 2026."
- **Harassment:** "A client repeatedly made offensive remarks about my religion in front of colleagues between September and November 2026; my employer took no steps."

### Synthetic deadline tuples (act date → expected regime)
- `2026-06-16` → pre-ERA-2025 (3 months less 1 day)
- `2027-03-01` → post-ERA-2025 (6 months less 1 day)
- With ACAS: Day A `2025-07-01`, Day B `2025-07-22` → extended deadline applied

---

## 5. Automated test coverage (177 tests, all passing)

| Suite | What it guards |
|---|---|
| deadline-calculator.test.ts | regime change, ACAS clock-stop, bank holidays, month-end clamp |
| citation-validator.test.ts | VERIFIED/CHECK/QUARANTINED + batch stats |
| api-routes.test.ts | /api/deadlines, /api/schema (+ registry completeness), /api/analyse degraded, case-law search |
| **constants.test.ts** *(new)* | ERA tracker key integrity, formatter output, CLAIM_TYPES shape |
| **verified-authorities.test.ts** *(new)* | no dup shortName, required fields, case-insensitive lookup |
| **schema-integrity.test.ts** *(new)* | all 10 schemas structurally valid |
| **era-2025/tracker/route.test.ts** *(new)* | output derives from constants (anti-drift) |
| **roadmap/route.test.ts** *(new)* | POST validation; GET 16-stage FSM order |
| **request-access/route.test.ts** *(new)* | field/email/user_type validation |
| **webhook/route.test.ts** *(new)* | HMAC-SHA256 verification |
| **debate/route.test.ts** *(new)* | validation + no-key branches |
| **triage/route.test.ts** *(new)* | multipart validation + degraded extraction |

**Not yet covered (needs new dev dependencies — your call):**
- **Component tests** (consent-gate disable logic, NavBar rendering) need `jsdom` + `@testing-library/react`.
- **E2E** (full browser flows) needs `@playwright/test` + browser binaries.
- Recommended setup is in §6.

---

## 6. Blocked — needs YOUR decision or an account (cannot be built autonomously)

| Item | Why blocked | What you need to decide / provide |
|---|---|---|
| Database / case persistence | External account | Create a Supabase project (London region); provide keys |
| Authentication | Founder decision + account | Auth model: individual LiPs only vs orgs (Open Q10) |
| Vector DB / RAG (Phase 2b) | Account + decision | Supabase pgvector + **embedding model choice** (Open Q2) |
| Case-law sourcing for corpus | Founder decision | BAILII scraping vs vLex/Lexis vs manual (Open Q1) |
| Legal authority expansion (more cases for indirect/victimisation/wrongful) | Legal review | New authorities are legal content → must be owner-reviewed before adding |
| Managed-API DPA framework doc | Legal/business | DPA wording with Anthropic; sub-processor disclosure |

---

## 7. Deferred — buildable later, safely skipped for this testing phase

| Item | Note |
|---|---|
| Rate-limit hardening on `/api/triage`, `/api/debate`, `/api/request-access` | Only `/api/analyse` has the in-memory limiter. Extract to a shared helper + apply. **Do this before opening live-key testing to untrusted users** to protect API spend. |
| Debate iterative loop (Draft→Attack→Revise→Score ×3) | Engine currently runs a single Drafter→Critic→Judge pass. Looping is pure orchestration but changes legal-reasoning output → owner review recommended. |
| `PASS` trust state | Validator/UI use VERIFIED/CHECK/QUARANTINED only; PASS (non-factual, no citation) is omitted. Defensible; add if wanted. |
| Component + E2E test infra | `jsdom`+`@testing-library/react` for component tests; `@playwright/test` for E2E. New dev deps — your approval. |
| Next.js dual-lockfile warning | Harmless build-tool warning (outer Vite prototype's `package-lock.json`). Fix needs `next.config.ts` `turbopack.root` or removing the outer lockfile — both outside this run's edit scope. |

---

## 8. Recommended path to "public testing"

1. Approve + merge this branch (build/test/lint green).
2. Decide the **embedding model** and **auth model** (the two decisions that unblock the most).
3. Stand up Supabase (London) → wire persistence + auth.
4. Harden rate limiting (above) before any untrusted live-key testing.
5. Add component/E2E test infra if you want browser-flow regression safety.
