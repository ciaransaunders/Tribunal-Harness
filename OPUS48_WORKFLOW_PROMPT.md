# Claude Opus 4.8 — Dynamic Workflow Prompt
## Tribunal Harness: Autonomous Improvement Run

---

```
SUGGESTED SETTINGS
  Model:        claude-opus-4-8
  Effort:       /effort high  (xhigh for the schema + analysis passes)
  Parallelism:  Dynamic workflow — dispatch parallel subagents per phase
  Permissions:  default (prompt before any destructive git action)
  Autonomy:     /goal "npm run build exits 0, npm test exits 0, npm run lint exits 0,
                       and every item on the improvement checklist is resolved or
                       explicitly deferred with a written reason"
```

---

## Preamble — Read This First

You are operating on **Tribunal Harness**, a UK employment tribunal legal intelligence engine for litigants-in-person. It is a Next.js 15 / React 19 / TypeScript strict / Tailwind 4 / Vitest application.

**The actual Next.js app root is `tribunal-harness/tribunal-harness/` (the inner directory).** All `npm` commands must be run from there. Do not run them from the outer `tribunal-harness/` directory.

This is a legal product. Domain rules are non-negotiable — read and enforce them throughout:

1. **LSA 2007:** Every user-facing page must carry the disclaimer *"This tool provides legal information, not legal advice. It does not create a solicitor-client relationship."* Do not remove it from any page.
2. **ERA 2025 dates:** ALL commencement dates live in `src/lib/constants.ts`. If you find a date hardcoded anywhere else, move it — never leave it in situ.
3. **GDPR consent gate:** The `hasConsented` gate on the homepage analysis form must not be removed.
4. **Trust indicators:** AI output must tag legal propositions as `VERIFIED`, `CHECK`, or `QUARANTINED`. Do not invent a fourth category.
5. **No fabricated compliance badges.** Only `UK GDPR Aligned` and `Epistemic Honesty` are accurate signals. Do not add ISO or SOC badges.

---

## Goal

Comprehensively improve Tribunal Harness across correctness, completeness, type safety, test coverage, and legal compliance — in any dimension you judge worthwhile — while leaving the build, tests, and lint clean throughout.

**Done means:** `npm run build` exits 0 with no type errors, `npm test` exits 0 with all tests passing, `npm run lint` exits 0, and every item on the improvement checklist below is either implemented or explicitly deferred in a written `IMPROVEMENT-LOG.md` with a reason.

---

## Scope

**May edit (any file under):**
```
tribunal-harness/tribunal-harness/src/
tribunal-harness/tribunal-harness/IMPROVEMENT-LOG.md   ← create/update this
```

**May read (but not edit):**
```
tribunal-harness/tribunal-harness/CLAUDE.md
tribunal-harness/tribunal-harness/HANDOFF.md
tribunal-harness/tribunal-harness/package.json
tribunal-harness/tribunal-harness/tsconfig.json
tribunal-harness/tribunal-harness/next.config.ts
tribunal-harness/tribunal-harness/tailwind.config.*
tribunal-harness/tribunal-harness/postcss.config.*
```

**Must not touch:**
```
tribunal-harness/tribunal-harness/.env.local        ← never read or write secrets
tribunal-harness/tribunal-harness/data/             ← PII, gitignored
tribunal-harness/CLAUDE.md                          ← outer project doc, informational only
Any file outside tribunal-harness/tribunal-harness/
```

**Hard off-limits changes (stop and ask first):**
- Removing the GDPR consent gate from the analysis form
- Removing legal disclaimers from any page
- Changing a commencement date in `constants.ts` without citing a published Statutory Instrument
- Adding a new LLM provider (Anthropic is the only permitted provider)
- Adding `any` types or `@ts-ignore` suppression
- Force-pushing or amending git history

---

## Context — Architecture Orientation

Before dispatching subagents, read these files in order:

1. `src/lib/constants.ts` — ERA 2025 dates, claim types, FSM states (single source of truth)
2. `src/schemas/index.ts` — schema registry, which claim types have implementations
3. `src/schemas/types.ts` — `ClaimSchema` interface all schemas must satisfy
4. `src/services/deadline-calculator.ts` + `deadline-calculator.test.ts` — the pattern for service + co-located tests
5. `src/app/globals.css` — design tokens, `.theme-light`, Liquid Glass utilities
6. `src/components/layout/NavBar.tsx` + `Footer.tsx` — shared layout
7. `src/app/page.tsx` — homepage (the analysis workspace)

---

## Improvement Checklist — Work Through This

Run a **survey subagent** first to catalogue the current state of each item. Then dispatch **parallel implementation subagents** for items that are independent. Reconvene for a final **verification subagent** that runs the full build + test + lint suite and confirms every item is resolved or explicitly deferred.

### Priority 1 — Completeness (implement these)

**P1-A: Four missing claim type schemas**

The following are declared in `CLAIM_TYPES` in `constants.ts` but have no schema file:
- `indirect_discrimination`
- `victimisation`
- `wrongful_dismissal`
- `zero_hours_rights`

For each, you must:
1. Create `src/schemas/<claim-type>.ts` implementing the `ClaimSchema` interface from `src/schemas/types.ts`
2. Model the schema on the existing ones (e.g. `unfair-dismissal.ts`, `harassment.ts`) — follow the same structure exactly
3. Add the import and `case` entry in `src/schemas/index.ts`
4. For `zero_hours_rights`: set `era2025: true` and add an `era2025Changes` array referencing the ERA 2025 commencement date from `constants.ts` — mark it as `"AWAITING SI"` because the exact date is TBC
5. Add an integration test in `src/services/api-routes.test.ts` for each new schema (follow the existing test pattern)
6. Verify `npm run build` and `npm test` pass after each schema addition

Legal content to encode in each schema (use these exactly — do not invent law):

**Indirect Discrimination (EA 2010 s19)**
- Statute: `Employment Act 2010, s.19`
- Test: Claimant shares a protected characteristic → employer applies a provision, criterion or practice (PCP) → PCP puts persons sharing that characteristic at a particular disadvantage → PCP puts the claimant at that disadvantage → employer cannot show the PCP is a proportionate means of achieving a legitimate aim
- Key cases: `Homer v Chief Constable of West Yorkshire [2012] ICR 704`; `Essop v Home Office [2017] ICR 640`
- Qualifying period: None
- Protected characteristics: age, disability, gender reassignment, marriage/civil partnership, pregnancy/maternity, race, religion/belief, sex, sexual orientation

**Victimisation (EA 2010 s27)**
- Statute: `Employment Act 2010, s.27`
- Test: Claimant did a protected act (or employer believed claimant did/may do a protected act) → employer subjected claimant to a detriment → because of the protected act
- Protected acts: bringing proceedings under EA 2010, giving evidence or information in connection with such proceedings, making an allegation that a person has contravened EA 2010, doing anything else under or by reference to EA 2010
- Key cases: `Chief Constable of Greater Manchester v Bailey [2017] EWCA Civ 425`
- Qualifying period: None

**Wrongful Dismissal (Common law)**
- Statute: `Common law; Employment Rights Act 1996 s.86` (statutory minimum notice)
- Test: Dismissal without notice (or inadequate notice) not justified by gross misconduct → claimant suffered loss as a result
- Remedy: Contractual damages = salary for unexpired notice period (capped at contractual or statutory minimum, whichever is longer)
- Key cases: `General Billposting Co Ltd v Atkinson [1909] AC 118`; `Reda v Flag Ltd [2002] UKPC 38`
- Key distinction from unfair dismissal: no qualifying period; no tribunal cap; can include pension and benefit losses; time limit is 6 years (contract) not 3/6 months; can be brought in County Court
- Qualifying period: None

**Zero-Hours Rights (ERA 2025)**
- Statute: `Employment Rights Act 2025` (commencement: 2027, awaiting Statutory Instrument)
- Rights: Right to guaranteed hours after qualifying reference period; right to reasonable notice of shifts; right to cancellation payment if shift cancelled without adequate notice
- Status: `AWAITING SI` — do not present any specific dates as confirmed
- era2025: true

---

**P1-B: ERA 2025 date audit**

Dispatch a read-only Explore subagent to grep the entire `src/` tree for hardcoded date strings matching the ERA 2025 commencement schedule (e.g. `"2026-10"`, `"2027-01"`, `"January 2027"`, `"October 2026"`, `"6 April"`, `"Apr 2026"`, `"Jan 2027"`, `"Oct 2026"`, `new Date("2026"`, `new Date("2027"`). For every match found outside `constants.ts` and outside test files: move the date to `constants.ts` as a named constant and replace the hardcoded value with an import.

---

**P1-C: Legal disclaimer audit**

Dispatch a read-only subagent to scan every `src/app/**/page.tsx` file and check whether the disclaimer string `"legal information, not legal advice"` (case-insensitive) appears. Produce a list of pages missing the disclaimer. Then, for each missing page: add the disclaimer in the page footer area as a `<p className="text-sm text-gray-500">` element, consistent with how other pages do it. Do not alter any page that already has the disclaimer.

---

### Priority 2 — Type Safety & Quality

**P2-A: TypeScript any audit**

Run: `grep -rn "any" src/ --include="*.ts" --include="*.tsx" | grep -v "//.*any" | grep -v "\.test\."` to find non-suppressed `any` usages in production code. For each: replace with the correct type. If the correct type genuinely cannot be determined from context (e.g. an external library with no types), use `unknown` and add a type guard — not `any`. Do not touch test files.

**P2-B: Unused imports / dead code**

Run `npm run build` and capture any TypeScript warnings about unused variables or imports. Fix them. Do not suppress with `// eslint-disable`.

**P2-C: Citation validator wiring check**

Read `src/services/citation-validator.ts` and `src/services/citation-validator.test.ts`. Check whether the validator is actually called from `src/app/api/analyse/route.ts`. If it is not wired up, wire it: after the Claude API response is received, pass the output through `validateCitations()` before returning it to the client. If the function signature does not match what `analyse/route.ts` needs, update the validator's interface — do not create a wrapper that bypasses it. Add or update a test in `citation-validator.test.ts` to cover the wiring.

---

### Priority 3 — Design Compliance

**P3-A: Light theme audit on institutional pages**

The following pages must use `.theme-light` (cream background, dark text). Check each — if the page wraps its content in a dark-background class but should be light, apply `.theme-light` to the outermost wrapper `<div>`:
- `/about`
- `/pricing`
- `/how-it-works`
- `/documentation`
- `/blog`
- `/contact`

Dark-theme pages (do not touch): `/analysis`, `/analysis-engine`, `/case-law-db`, `/era-2025`, `/schema-builder`.

**P3-B: Glass system compliance**

Grep for any component that sets a hard `border:` CSS property (not `border-radius`) on an element that also has `.glass-thin`, `.glass-medium`, or `.glass-thick`. Per the design system rules in `HANDOFF.md`, glass elements must not have hard borders — depth comes from `inset` box-shadow only. Remove offending `border` declarations and replace with `ring-1 ring-white/10` (Tailwind utility) if a subtle edge is needed.

---

### Priority 4 — Documentation & Hygiene

**P4-A: Schema registry completeness check**

After P1-A is complete, verify `src/schemas/index.ts` has an entry for all 10 claim types declared in `CLAIM_TYPES` in `constants.ts`. If any are missing, add a stub that throws a clear `Error("Schema not yet implemented: <type>")` so the API route returns a 501 rather than a silent undefined.

**P4-B: Update IMPROVEMENT-LOG.md**

Create or append to `IMPROVEMENT-LOG.md` in the app root (`tribunal-harness/tribunal-harness/IMPROVEMENT-LOG.md`). For each checklist item above: log whether it was implemented, deferred, or already correct. For deferred items, state the specific reason. For implemented items, list the files changed. Format it as a markdown table.

---

## How to Verify (Definition of Done)

Run these three commands from `tribunal-harness/tribunal-harness/` and confirm all exit 0:

```bash
npm run build      # Zero type errors, zero build errors
npm test           # All Vitest tests pass (including new schema tests from P1-A)
npm run lint       # Zero ESLint warnings or errors
```

Additionally:
- `IMPROVEMENT-LOG.md` exists and covers every checklist item
- No hardcoded ERA 2025 dates exist outside `constants.ts` (run the grep from P1-B to verify)
- All newly created `.ts` files have no `any` types

If any check fails, fix it before marking the session done. Do not mark done with a failing build or test.

---

## Constraints Summary

- **TypeScript strict mode throughout.** No `any`, no `@ts-ignore`.
- **ERA 2025 dates: `constants.ts` only.** Never hardcode elsewhere.
- **Legal content: encode accurately.** Every schema must cite the correct statute and section. Do not invent case names.
- **No new LLM providers.** Anthropic only.
- **No new npm dependencies** without explicit justification in `IMPROVEMENT-LOG.md`. Prefer native TypeScript over adding a library.
- **Test every new API surface.** Every new schema gets an integration test.
- **Commit at logical checkpoints** (e.g. after each P1-A schema), not once at the end. Commit message format: `P[phase] [item]: <description>` e.g. `P1-A: add indirect-discrimination schema + integration test`.

**Stop and surface to the founder before:**
- Changing any ERA 2025 commencement date in `constants.ts`
- Removing or substantially rewriting the GDPR consent gate
- Adding a new API endpoint not listed in HANDOFF.md
- Any decision about the vector DB provider, auth model, or LLM routing that is marked as an Open Design Decision in the root `CLAUDE.md`

---

## Recommended Workflow (Dynamic Orchestration)

```
[ORCHESTRATOR — you, running at opus-4-8 / effort high]
  │
  ├─► [SURVEY subagent — Explore, read-only]
  │     Read all files in src/. Produce a structured report:
  │     - Which P1-P4 items are already done vs genuinely missing
  │     - Any `any` types found (file + line)
  │     - Any hardcoded ERA 2025 dates found (file + line)
  │     - Pages missing the disclaimer (list)
  │     - Glass violations found (list)
  │     Return: structured JSON-like report
  │
  ├─► [Parse survey. Discard items already done. Build task list.]
  │
  ├─► [PARALLEL — dispatch these independently]
  │     ├─► Schema subagent A: indirect-discrimination schema + test
  │     ├─► Schema subagent B: victimisation schema + test
  │     ├─► Schema subagent C: wrongful-dismissal schema + test
  │     ├─► Schema subagent D: zero-hours-rights schema + test
  │     └─► Audit subagent: disclaimer + light-theme + glass fixes
  │           (these are read-then-write, non-conflicting with schemas)
  │
  ├─► [SEQUENTIAL — after schema subagents complete]
  │     ├─► Wire citation validator (P2-C) — depends on schema registry being complete
  │     ├─► TypeScript any audit (P2-A) — run after all schema files exist
  │     └─► Update schemas/index.ts + constants completeness (P4-A)
  │
  ├─► [VERIFICATION subagent]
  │     Run: npm run build && npm test && npm run lint
  │     Report: pass/fail per command, list of any remaining errors
  │
  └─► [Write IMPROVEMENT-LOG.md (P4-B)]
        Document all items: implemented / deferred / already done
```

---

*Generated by Cowork on 2026-06-20. Project: Tribunal Harness v2.0. Target model: claude-opus-4-8.*
```
