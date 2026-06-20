/**
 * Agent Stand-In LLM Provider — Tribunal Harness
 *
 * WHY THIS EXISTS
 * ---------------
 * The managed-API / provider decision for the LLM layer has not been made yet
 * (see the "Open Design Decisions" in the master spec: BYOK vs managed key, and
 * which model vendor). Until that is selected — and an ANTHROPIC_API_KEY is wired
 * — the AI routes (/api/analyse, /api/triage, /api/debate) degrade and cannot
 * produce a full report. That makes a true end-to-end smoke run impossible.
 *
 * This module is a deterministic, OFFLINE agent that *stands in* for the
 * unselected LLM API. When `LLM_PROVIDER=agent`, callClaude() routes here instead
 * of the Anthropic SDK. It returns well-formed, schema-conformant JSON for every
 * endpoint, derived from the real claim schemas (src/schemas) and the ERA 2025
 * single source of truth (src/lib/constants). It is the seam an LLM coding agent
 * — or a future real provider — slots into.
 *
 * HERMETICITY (legal-safety critical)
 * -----------------------------------
 * /api/analyse independently re-verifies every cited authority. A *curated*
 * VERIFIED short-circuits with NO network call (see citation-validator.ts). So
 * the authorities synthesised here cite ONLY curated short-names whose leading
 * token(s) match the known-good list in verified-authorities.ts. This keeps the
 * smoke run fully offline and never falsely "verifies" an invented citation.
 *
 * This file produces legal INFORMATION, not legal advice (LSA 2007). It is a
 * fixture/stand-in, not a substitute for a real model's judgement.
 */

import { getSchema } from "@/schemas";
import { ERA_2025, formatCommencementDate } from "@/lib/constants";

/** Pseudo "model" id surfaced in debug metadata so reports show the stand-in clearly. */
export const AGENT_STAND_IN_MODEL = "agent-stand-in";

export interface AgentProviderRequest {
    /** Endpoint config key, e.g. 'analyse' | 'analyse_complex' | 'triage' | 'drafter' | 'critic' | 'judge'. */
    endpoint: string;
    /** System prompt (unused by the stand-in but accepted for parity with the real provider). */
    system: string;
    /** The user message the route built — we parse claim type / facts out of it. */
    userMessage: string;
}

// ─── Curated, offline-verifiable authorities ─────────────────────────────────
// Each citation's leading token(s) exactly match a short-name in
// verified-authorities.ts, so validateCitationAuthoritative() returns VERIFIED
// from the curated DB without any live Find Case Law call. Do not add citations
// here that are not in the curated list — that would trigger a network lookup
// and break hermeticity.
const VERIFIED_CITES = {
    polkey: {
        name: "Polkey v AE Dayton Services Ltd",
        citation: "Polkey v AE Dayton Services Ltd [1987] ICR 142",
        principle:
            "A procedurally unfair dismissal is not saved by the argument that a fair procedure would have made no difference; that question goes to remedy (the 'Polkey reduction'), not liability.",
    },
    burchell: {
        name: "British Home Stores Ltd v Burchell",
        citation: "BHS v Burchell [1978] ICR 303",
        principle:
            "For a conduct dismissal the employer must genuinely believe in the misconduct, on reasonable grounds, after a reasonable investigation.",
    },
    iceland: {
        name: "Iceland Frozen Foods Ltd v Jones",
        citation: "Iceland Frozen Foods Ltd v Jones [1983] ICR 17",
        principle:
            "The tribunal must not substitute its own view; it asks whether dismissal fell within the band of reasonable responses open to a reasonable employer.",
    },
} as const;

// ─── Request parsing ─────────────────────────────────────────────────────────

/** Extract the claim type id from a route-built user message. Defaults to unfair_dismissal. */
export function extractClaimType(userMessage: string): string {
    const match = userMessage.match(/claim[_ ]?type:\s*([a-z][a-z_]*)/i);
    return match ? match[1].toLowerCase() : "unfair_dismissal";
}

/** Pull the free-text narrative / facts out of a route-built user message. */
function extractFacts(userMessage: string): string {
    const narrative = userMessage.match(/Narrative:\s*([\s\S]*?)(?:\n\n[A-Z][a-z]|$)/);
    if (narrative) return narrative[1].trim();
    const facts = userMessage.match(/Facts:\s*([\s\S]*?)(?:\n\n[A-Z][a-z]|$)/);
    if (facts) return facts[1].trim();
    return userMessage.trim();
}

/** Detect plausible claim types from raw document text (used by triage, which has no explicit type). */
function detectClaimTypes(text: string): string[] {
    const t = text.toLowerCase();
    const types: string[] = [];
    if (/dismiss|terminat|sacked|let go|gross misconduct/.test(t)) types.push("unfair_dismissal");
    if (/safety|whistle|disclosure|protected|raised concerns|wrongdoing/.test(t)) types.push("whistleblowing");
    if (/discriminat|pregnan|race|disab|religion|sex|age/.test(t)) types.push("direct_discrimination");
    if (/harass|offensive|hostile|intimidat/.test(t)) types.push("harassment");
    if (/resign|constructive|breach of contract/.test(t)) types.push("wrongful_dismissal");
    return types.length > 0 ? Array.from(new Set(types)) : ["unfair_dismissal"];
}

// ─── Synthesisers (one per endpoint contract in src/agents/prompts.ts) ────────

function synthAnalyse(claimType: string) {
    const schema = getSchema(claimType);
    const label = schema?.label ?? "Unfair Dismissal";
    const statute = schema?.statute ?? "ERA 1996 s98";
    const legalTest =
        schema?.legalTest && schema.legalTest.length > 0
            ? schema.legalTest
            : [
                  "The claimant was an employee with the requisite qualifying service",
                  "The claimant was dismissed within the meaning of s95 ERA 1996",
                  "The employer cannot show a potentially fair reason under s98(1)-(2)",
                  "The dismissal was not fair in all the circumstances under s98(4)",
              ];

    return {
        claims: [
            {
                type: claimType,
                strength: "MODERATE" as const,
                reasoning: `On the facts provided there is a viable ${label.toLowerCase()} claim. The absence of any investigation meeting before a 'gross misconduct' dismissal is a strong indicator of procedural unfairness under s98(4). Strength is MODERATE rather than STRONG because the merits turn on disputed facts (the reason for dismissal and what investigation, if any, occurred) that require evidence to resolve.`,
                legal_test_elements: legalTest.map((element, i) => ({
                    element,
                    satisfied: i < 2,
                    evidence:
                        i < 2
                            ? "Supported by the narrative facts (employment relationship and dismissal are not in dispute)."
                            : "Fact-dependent — requires disclosure of the investigation record and the employer's stated reason.",
                })),
            },
        ],
        authorities: [
            { ...VERIFIED_CITES.burchell, trust_level: "VERIFIED" as const },
            { ...VERIFIED_CITES.iceland, trust_level: "VERIFIED" as const },
            { ...VERIFIED_CITES.polkey, trust_level: "VERIFIED" as const },
        ],
        statutory_provisions: [
            {
                statute: statute.split(" ").slice(0, 2).join(" ") || "ERA 1996",
                section: statute.replace(/^[A-Za-z0-9]+\s[0-9]+\s?/, "") || "s98",
                relevance: `Primary statutory test for ${label.toLowerCase()}: reason for dismissal and overall fairness.`,
            },
            {
                statute: "ERA 1996",
                section: "s207B",
                relevance:
                    "ACAS Early Conciliation clock-stop: the limitation period is extended by the Day A → Day B period (or one month from Day B, whichever is longer).",
            },
        ],
        procedural_notes: [
            "Time limit (act before October 2026): three months less one day from the effective date of termination.",
            "ACAS Early Conciliation is mandatory before an ET1 can be presented; obtain the EC certificate first.",
            "Request written reasons for dismissal under s92 ERA 1996 if not already provided.",
        ],
        era_2025_flags: [
            {
                provision: "Unfair dismissal qualifying period reduced to 6 months",
                applies: false,
                reason:
                    "The effective date of termination is before the commencement date, so the 2-year qualifying period regime still applies on these facts.",
                commencement_date: formatCommencementDate(ERA_2025.QUALIFYING_PERIOD_6_MONTHS),
                status: "upcoming" as const,
            },
            {
                provision: "ET time limit extended to 6 months less one day",
                applies: false,
                reason:
                    "The act complained of pre-dates commencement; the three-months-less-one-day limit applies. Exact commencement date to be confirmed by Statutory Instrument.",
                commencement_date: formatCommencementDate(ERA_2025.ET_TIME_LIMIT_6_MONTHS),
                status: "upcoming" as const,
            },
        ],
    };
}

function synthTriage(text: string) {
    const detected = detectClaimTypes(text);
    return {
        updated_fields: {
            edt: "2026-03-03",
            employment_start_date: "2022-01-10",
            dismissal_reason: "gross misconduct",
        },
        query_array: [
            {
                field_id: "investigation_held",
                question: "Was an investigation meeting or disciplinary hearing held before your dismissal?",
                ui_component: "radio" as const,
                options: ["Yes", "No", "Not sure"],
                legal_relevance:
                    "Absence of a fair procedure (investigation, hearing, appeal) is central to fairness under s98(4) ERA 1996.",
            },
            {
                field_id: "acas_ec_started",
                question: "Have you started ACAS Early Conciliation, and if so on what date?",
                ui_component: "date" as const,
                options: null,
                legal_relevance:
                    "ACAS EC is mandatory before presenting an ET1 and stops the limitation clock between Day A and Day B.",
            },
        ],
        document_summary:
            "Synthetic narrative: a warehouse employee with approximately four years' service was dismissed on 3 March 2026 for 'gross misconduct' shortly after raising written health and safety concerns. The narrative states no investigation meeting was held, raising both ordinary unfair dismissal (procedure) and a potential protected-disclosure dimension.",
        potential_claim_types: detected,
        extracted_dates: {
            edt: "2026-03-03",
            last_act: "2026-03-03",
            acas_day_a: null,
            acas_day_b: null,
            employment_start: "2022-01-10",
        },
    };
}

function synthDrafter(claimType: string) {
    return {
        factual_summary:
            "The claimant, a warehouse employee of around four years' standing, was summarily dismissed on 3 March 2026 for alleged 'gross misconduct' shortly after raising written health and safety concerns. No investigation meeting or disciplinary hearing was held before the decision.",
        legal_framework: [
            { element: "Reasonable investigation", authority: VERIFIED_CITES.burchell.name, citation: VERIFIED_CITES.burchell.citation },
            { element: "Band of reasonable responses", authority: VERIFIED_CITES.iceland.name, citation: VERIFIED_CITES.iceland.citation },
            { element: "Effect of procedural defects", authority: VERIFIED_CITES.polkey.name, citation: VERIFIED_CITES.polkey.citation },
        ],
        application: [
            {
                element: "Reasonable investigation (Burchell)",
                facts_supporting:
                    "No investigation meeting was held, so the employer cannot show it formed its belief in misconduct on reasonable grounds after a reasonable investigation.",
                strength: "STRONG" as const,
            },
            {
                element: "Fair procedure / Polkey",
                facts_supporting:
                    "The complete absence of a hearing or appeal points to a procedurally unfair dismissal; any 'would have dismissed anyway' argument goes to a Polkey reduction in remedy, not liability.",
                strength: "STRONG" as const,
            },
            {
                element: "Reason for dismissal",
                facts_supporting:
                    "Dismissal closely following protected health-and-safety concerns raises a question over the true reason, which is fact-sensitive and to be tested in evidence.",
                strength: "MODERATE" as const,
            },
        ],
        remedies: [
            { type: "Basic award", basis: "s119 ERA 1996 — calculated on age, length of service and a week's pay." },
            { type: "Compensatory award", basis: "s123 ERA 1996 — loss flowing from the dismissal, subject to the statutory cap for a pre-2027 EDT and to any Polkey reduction." },
            { type: "Reinstatement / re-engagement", basis: "ss113-116 ERA 1996 — available but rarely ordered; the claimant should indicate preference." },
        ],
        overall_assessment: `The ${claimType.replace(/_/g, " ")} claim is arguable and, on procedure, strong. The principal exposure is evidential — establishing the true reason for dismissal and rebutting any band-of-reasonable-responses defence.`,
    };
}

function synthCritic(claimType: string) {
    return {
        attacks: [
            {
                weakness: "Qualifying service and reason may be contested; gross misconduct, if proven, is a potentially fair conduct reason.",
                legal_basis: "s98(1)-(2) ERA 1996; band of reasonable responses",
                citation: VERIFIED_CITES.iceland.citation,
                severity: "SIGNIFICANT" as const,
            },
            {
                weakness: "Even if the procedure was flawed, compensation may be heavily reduced if dismissal was inevitable on the facts.",
                legal_basis: "Polkey reduction to the compensatory award",
                citation: VERIFIED_CITES.polkey.citation,
                severity: "SIGNIFICANT" as const,
            },
        ],
        factual_gaps: [
            {
                missing_fact: "Whether any investigation, hearing or appeal occurred at all (the narrative asserts none, but the employer's records are not before us).",
                why_it_matters: "Determines whether the Burchell reasonable-investigation limb is breached.",
            },
            {
                missing_fact: "The precise content and audience of the health and safety concerns raised.",
                why_it_matters: "Goes to whether there is a qualifying protected disclosure capable of making the dismissal automatically unfair.",
            },
        ],
        procedural_risks: [
            {
                risk: "Time limit: three months less one day from the EDT (pre-October-2026 regime).",
                consequence: "A late ET1 is liable to be struck out unless it was not reasonably practicable to present in time.",
            },
            {
                risk: "ACAS Early Conciliation not yet shown as commenced.",
                consequence: "An ET1 presented without a valid EC certificate will be rejected.",
            },
        ],
        overall_vulnerability_assessment:
            `The ${claimType.replace(/_/g, " ")} claim's procedural footing is solid but its value is exposed to a Polkey reduction and to a conduct-reason defence. The protected-disclosure angle is promising but presently under-evidenced.`,
    };
}

function synthJudge(claimType: string) {
    const breakdown = {
        legal_test_completeness: { score: 21, max: 25, reasoning: "All s98 elements identified and addressed; minor gaps on qualifying-service evidence." },
        evidential_sufficiency: { score: 17, max: 25, reasoning: "Procedural unfairness is well-supported; the true reason for dismissal is under-evidenced." },
        procedural_compliance: { score: 15, max: 20, reasoning: "Correct time-limit regime and ACAS EC identified; EC certificate not yet obtained." },
        era_2025_awareness: { score: 13, max: 15, reasoning: "Correctly applies the pre-commencement regime to a March 2026 EDT and flags the upcoming changes." },
        authority_quality: { score: 13, max: 15, reasoning: "Authorities (Burchell, Iceland Frozen Foods, Polkey) are real, binding/persuasive and correctly applied." },
    };
    const score =
        breakdown.legal_test_completeness.score +
        breakdown.evidential_sufficiency.score +
        breakdown.procedural_compliance.score +
        breakdown.era_2025_awareness.score +
        breakdown.authority_quality.score;
    return {
        score,
        score_breakdown: breakdown,
        synthesis: `The ${claimType.replace(/_/g, " ")} claim is viable. The strongest ground is procedural unfairness (no investigation, contrary to Burchell), with the principal contest being the true reason for dismissal and the size of any Polkey reduction. On the rubric the argument scores ${score}/100 and crosses the 70-point viability threshold.`,
        key_vulnerabilities: [
            "A conduct-reason defence if the employer can evidence reasonable grounds and investigation.",
            "A Polkey reduction substantially cutting the compensatory award.",
            "The protected-disclosure angle is currently under-evidenced.",
        ],
        evidentiary_requirements: [
            "Disclosure of the investigation and disciplinary records (or proof none exist).",
            "Contemporaneous evidence of the health and safety concerns raised and to whom.",
            "Pay and continuity records to fix qualifying service and quantum.",
        ],
        procedural_recommendations: [
            "Commence ACAS Early Conciliation immediately and preserve the certificate.",
            "Calculate and diarise the three-months-less-one-day limit from the EDT.",
            "Request written reasons for dismissal under s92 ERA 1996.",
        ],
        viable: score >= 70,
    };
}

/**
 * Refinement stand-in: the route hands us `{ endpoint, prose_fields }`.
 * We return the prose verbatim under `refined_fields`, plus a fixed `notes`
 * string, so the smoke run can show the refinement layer ran end-to-end
 * without an online LLM. The wire-level shape matches what Claude would
 * produce against LEGAL_WRITING_REFINEMENT_PROMPT_v1.
 */
function synthRefine(userMessage: string): string {
    try {
        const parsed = JSON.parse(userMessage) as {
            endpoint?: string;
            prose_fields?: Record<string, string>;
        };
        const proseFields = parsed.prose_fields ?? {};
        return JSON.stringify({
            refined_fields: { ...proseFields },
            notes: "agent stand-in pass-through",
        });
    } catch {
        return JSON.stringify({
            refined_fields: {},
            notes: "agent stand-in pass-through (no parseable prose_fields)",
        });
    }
}

// ─── Public entry point ──────────────────────────────────────────────────────

/**
 * Generate a well-formed JSON response string for the given endpoint, exactly as
 * the corresponding prompt in src/agents/prompts.ts specifies. This is the value
 * callClaude() returns as `content` when LLM_PROVIDER=agent.
 */
export function generateAgentResponse(req: AgentProviderRequest): string {
    const { endpoint, userMessage } = req;

    switch (endpoint) {
        case "analyse":
        case "analyse_complex":
            return JSON.stringify(synthAnalyse(extractClaimType(userMessage)));
        case "triage":
            return JSON.stringify(synthTriage(extractFacts(userMessage)));
        case "drafter":
            return JSON.stringify(synthDrafter(extractClaimType(userMessage)));
        case "critic":
            return JSON.stringify(synthCritic(extractClaimType(userMessage)));
        case "judge":
            return JSON.stringify(synthJudge(extractClaimType(userMessage)));
        case "refine":
            return synthRefine(userMessage);
        default:
            // Unknown endpoint — return a minimal, valid, clearly-labelled envelope
            // rather than throwing, so the pipeline never crashes on a new route.
            return JSON.stringify({
                note: `agent stand-in has no synthesiser for endpoint '${endpoint}'`,
                claim_type: extractClaimType(userMessage),
            });
    }
}

/** Rough token estimate (~4 chars/token) for synthetic usage metrics in debug output. */
export function estimateTokens(text: string): number {
    return Math.max(1, Math.ceil(text.length / 4));
}
