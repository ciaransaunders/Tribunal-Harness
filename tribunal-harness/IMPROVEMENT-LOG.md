# IMPROVEMENT-LOG.md

> Autonomous improvement run — Tribunal Harness
> Date: 20 June 2026 · Branch: `improvement-run-2026-06-20` · Model: Claude Opus 4.8

This log records the outcome of every item on the improvement checklist: whether
it was **implemented**, **already correct**, or **deferred** (with a reason).

## Definition of Done — status

| Command (run from `tribunal-harness/tribunal-harness/`) | Result |
|---|---|
| `npm run build` | ✅ exits 0, no type errors |
| `npm test` | ✅ exits 0 — **65 tests pass** (was 61; +4 new) |
| `npm run lint` | ✅ exits 0 — **no ESLint warnings or errors** |

Verified additionally by an adversarial verification pass (6 independent
read-only agents) and a live preview check (dev server) of the visual changes.

---

## Baseline findings (before any change)

Reconnaissance showed the prompt's premise was partly **stale** — much of the
checklist was already done:

- **All 10 claim schemas already existed and were legally accurate.** The four
  "missing" ones (`indirect_discrimination`, `victimisation`, `wrongful_dismissal`,
  `zero_hours_rights`) were implemented and wired, just *grouped* inside other
  files. Their citations were already correct (`EA 2010 s19/s27`, `Common Law`,
  `ERA 2025`).
- **P2-C (citation validator) was already wired** into `/api/analyse`.
- **`npm run lint` was actually broken** — there was *no ESLint config at all*;
  `next lint` dropped into an interactive setup prompt and only "passed" when its
  stdin was a non-TTY. This was fixed (see Decisions).

---

## Checklist outcomes

| Item | Status | Files changed / notes |
|---|---|---|
| **P1-A** Four "missing" schemas | ✅ Implemented (refactor + tests) | Schemas already existed & were correct; **split into dedicated files** per house convention: `schemas/indirect-discrimination.ts`, `victimisation.ts`, `wrongful-dismissal.ts`, `zero-hours-rights.ts`; updated `schemas/index.ts`. Added integration tests for `indirect_discrimination`, `victimisation`, `wrongful_dismissal` + a **registry-completeness test** (every `CLAIM_TYPE` resolves) in `services/api-routes.test.ts`. |
| **P1-A item 4** `zero_hours_rights` ERA flag | ✅ Already correct | `CLAIM_TYPES.zero_hours_rights.era2025 = true` (constants.ts); schema has `era2025Changes` + a field-level `era2025` annotation with `status: "awaiting_si"`. Note: the `ClaimSchema` interface has **no top-level `era2025` boolean**, so adding one (as the prompt's wording suggested) would break strict mode — the correct mechanism (`era2025Changes` + annotation) was already used. |
| **P1-B** ERA 2025 date audit | ✅ Implemented | Eliminated hardcoded ERA dates outside `constants.ts`. Biggest fix: `api/era-2025/tracker/route.ts` hand-duplicated the entire `ERA_2025_TRACKER` (16 dates) — now **derives** from the constant, layering only API-specific `tool_status`/`notes`. Also interpolated dates in `api/case-law/search/route.ts`, `api/roadmap/[caseId]/route.ts`, and schema prose (`harassment`, `unfair-dismissal`, `whistleblowing`, `fire-and-rehire`). Added `formatCommencementDate` / `formatCommencementMonth` helpers to `constants.ts`. Reworded `deadline-calculator.ts` JSDoc. |
| **P1-C** Legal disclaimer audit | ✅ Implemented | LSA 2007 was **already satisfied site-wide** — the global `<Footer/>` (rendered once in `layout.tsx`) carries the disclaimer on every route. Added a **visible inline** disclaimer (house style) to pages lacking one: `/` (persistent, on the analysis workspace), `case-law-db`, `request-access`, `privacy`, `schema-builder`. `pricing` already had a valid variant — left unaltered per the "don't alter pages that have it" rule. |
| **P2-A** TypeScript `any` audit | ✅ Implemented | All **3** production `any` uses removed: `api/analyse/route.ts` (→ `Authority`), `components/analysis/AnalysisResultsPanel.tsx` (→ inferred `ValidatedAuthority`), `lib/claude-client.ts` (→ `Anthropic.MessageCreateParamsNonStreaming`). Added `ValidatedAuthority` type to `schemas/types.ts`. Removed 2 `eslint-disable` suppressions. No `any`/`@ts-ignore` remain. |
| **P2-B** Unused imports / dead code | ✅ Implemented | Removed unused `et1DeadlineStr` (`api/roadmap/route.ts`) — the only lint warning. Removed 10 redundant schema `export default` statements (registry uses named imports only). |
| **P2-C** Citation validator wiring | ✅ Already correct | `validateAllCitations()` is already called in `api/analyse/route.ts` after the Claude response, overriding self-reported trust. No change needed; `citation-validator.test.ts` (16 tests) already covers it. |
| **P3-A** Light theme on institutional pages | ✅ Implemented | Applied `.theme-light` to the outermost wrapper of `about`, `pricing`, `how-it-works`, `documentation`, `blog`, `contact`. Verified live: background renders `#F8F7F4` (cream) with dark text. Dark workspace pages left untouched. |
| **P3-B** Glass system compliance | ✅ Implemented | One real violation: the `Card` `glass` variant carried a hard Tailwind `border`. Replaced with `ring-1 ring-white/10` (`components/ui/Card.tsx`). Verified live: `border-width: 0`, ring renders as a 1px box-shadow. The named `.glass-*` CSS classes were already compliant. |
| **P4-A** Schema registry completeness | ✅ Already correct + guarded | `schemas/index.ts` already maps all 10 `CLAIM_TYPES`. Added an automated registry-completeness test so a future gap fails CI rather than returning `undefined`. (The 501-stub fallback was unnecessary — there is no gap.) |
| **P4-B** This log | ✅ Implemented | `IMPROVEMENT-LOG.md` (this file). |

---

## Decisions & deviations (surfaced to the founder)

1. **"Employment Act 2010" → Equality Act 2010.** The prompt's P1-A text labelled
   indirect discrimination and victimisation as "Employment Act 2010, s.19/s.27".
   That Act does not exist for these provisions — they are the **Equality Act
   2010** (`EA 2010 s19` / `s27`). The hard constraint *"encode accurately — the
   correct statute"* overrides *"use these exactly"*. The existing code was already
   correct; kept correct. (Independently confirmed by the legal-accuracy verifiers.)

2. **ESLint configured (scope exception, founder-approved).** `npm run lint` could
   not pass because the project had **no ESLint config**. Fixing it required a file
   at the app root (`eslint.config.mjs`), outside the stated `src/`-only edit scope.
   The founder approved this exception. The flat config extends
   `next/core-web-vitals` + `next/typescript`; it surfaced the real `any`/dead-code
   findings, which were then fixed. No new npm dependency was required
   (`@eslint/eslintrc`, `eslint-config-next` were already installed).

3. **Schemas split into dedicated files (founder-approved).** The four grouped
   schemas were already correct, but the prompt + house convention call for one
   file per claim type. Split + tested; legal content unchanged.

4. **No false date precision.** ERA dates whose exact commencement day is still
   *awaiting a Statutory Instrument* (the October 2026 cohort: ET time limit,
   "all reasonable steps", third-party harassment, NDAs) are rendered with a
   **month-only** formatter (`formatCommencementMonth` → "October 2026"), never a
   full date — so the tool never asserts a precise day the SI has not confirmed.
   Confirmed dates (1 January 2027) use `formatCommencementDate`.

5. **Zero-hours reference period softened.** The adversarial pass flagged that the
   schema asserted a fixed "12-week reference period" as settled fact, whereas that
   period is itself to be set by SI. Softened to "reference period (length to be
   confirmed by Statutory Instrument)" — consistent with the project's epistemic-
   honesty principle.

---

## Deferred items (with reasons)

| Item | Reason |
|---|---|
| Next.js "inferred workspace root" warning (dual `package-lock.json`) | This is a **Next.js build-tooling** warning, *not* an ESLint warning, so it does not affect the "zero ESLint warnings" criterion or build/test/lint exit codes. Silencing it requires editing `next.config.ts` (read-only per scope) or removing the outer Vite prototype's lockfile (outside `tribunal-harness/tribunal-harness/`, off-limits). Left for the founder. |
| Unused exported types/consts (`DeadlineResponse`, `TriageResponse`, `RequestAccessData`, `QUALIFYING_PERIOD_CONFIG`, `ClaimTypeId`, `FSMState`, `getAllSchemas`) | Retained public-API surface / future use. Not flagged by lint. Removing risks breaking intended API. |
| Legacy `*_PROMPT_v1` exports in `agents/prompts.ts` | **Intentionally** retained for A/B comparison per `CLAUDE.md`. Not lint-flagged. |
| API tracker dropped the "trade union ballot mandates" entry | The route now derives from the canonical `ERA_2025_TRACKER`, which does not include that provision. Aligning the API to the single source of truth is the intended behaviour; re-adding it would mean changing the constant (a product decision + affects the UI tracker). |

## New dependencies

**None.** All work used existing packages and native TypeScript/`Intl`.
