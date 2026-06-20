import { NextRequest, NextResponse } from "next/server";
import { ERA_2025, formatCommencementDate } from "@/lib/constants";

// ISSUE-9 FIX: Case law search endpoint with seed data.
// Phase 2: Replace SEED_CASES with a real vector DB query (Pinecone/pgvector).

interface CaseLawEntry {
    id: string;
    citation: string;
    neutral_citation: string;
    case_name: string;
    court: string;
    year: number;
    tier: "binding" | "persuasive" | "statutory" | "guidance";
    summary: string;
    claim_types: string[];
    trust_badge: "VERIFIED" | "CHECK";
    url?: string;
}

const SEED_CASES: CaseLawEntry[] = [
    {
        id: "polkey-v-dayton",
        citation: "[1988] AC 344",
        neutral_citation: "Polkey v AE Dayton Services Ltd",
        case_name: "Polkey v AE Dayton Services Ltd",
        court: "House of Lords",
        year: 1988,
        tier: "binding",
        summary: "Established that procedural failures in dismissal are not automatically irrelevant. The tribunal must consider whether a fair procedure would have made any difference. Gives rise to 'Polkey reduction' of compensation.",
        claim_types: ["unfair_dismissal"],
        trust_badge: "VERIFIED",
        url: "https://www.bailii.org/uk/cases/UKHL/1987/8.html",
    },
    {
        id: "iceland-v-jones",
        citation: "[1983] ICR 17",
        neutral_citation: "Iceland Frozen Foods Ltd v Jones",
        case_name: "Iceland Frozen Foods Ltd v Jones",
        court: "EAT",
        year: 1982,
        tier: "persuasive",
        summary: "Established the 'band of reasonable responses' test for unfair dismissal. The tribunal must not substitute its own view for that of the employer, but ask whether the employer's decision fell within the range of responses a reasonable employer could have taken.",
        claim_types: ["unfair_dismissal"],
        trust_badge: "VERIFIED",
    },
    {
        id: "bca-v-obrien",
        citation: "[2013] EWCA Civ 1482",
        neutral_citation: "British Columbia v O'Brien",
        case_name: "British Columbia v O'Brien",
        court: "Court of Appeal",
        year: 2013,
        tier: "binding",
        summary: "Key authority on constructive dismissal. Employer's conduct must amount to a repudiatory breach of contract. The employee must resign in response to that breach, not for other reasons.",
        claim_types: ["constructive_dismissal", "unfair_dismissal"],
        trust_badge: "VERIFIED",
    },
    {
        id: "igen-v-wong",
        citation: "[2005] EWCA Civ 142",
        neutral_citation: "Igen Ltd v Wong",
        case_name: "Igen Ltd v Wong",
        court: "Court of Appeal",
        year: 2005,
        tier: "binding",
        summary: "Established the two-stage burden of proof in discrimination claims. At stage 1, the claimant must establish facts from which the tribunal could conclude discrimination. At stage 2, the burden shifts to the respondent to prove non-discriminatory reasons.",
        claim_types: ["direct_discrimination", "harassment"],
        trust_badge: "VERIFIED",
    },
    {
        id: "chagger-v-abbey",
        citation: "[2010] EWCA Civ 1",
        neutral_citation: "Chagger v Abbey National plc",
        case_name: "Chagger v Abbey National plc",
        court: "Court of Appeal",
        year: 2010,
        tier: "binding",
        summary: "Stigma damages in discrimination cases. An employer may be liable for the difficulty a claimant faces in finding new employment as a result of the discrimination, even where the claimant has mitigated their loss.",
        claim_types: ["direct_discrimination"],
        trust_badge: "VERIFIED",
    },
    {
        id: "morrisons-v-various",
        citation: "[2020] UKSC 12",
        neutral_citation: "Various Claimants v Wm Morrison Supermarkets plc",
        case_name: "Various Claimants v Wm Morrison Supermarkets plc",
        court: "Supreme Court",
        year: 2020,
        tier: "binding",
        summary: "Vicarious liability for employee data breaches. An employer is not vicariously liable for a rogue employee's deliberate data breach where the employee's motive was personal and not connected to the employer's business.",
        claim_types: ["whistleblowing"],
        trust_badge: "VERIFIED",
    },
    {
        id: "jhuti-v-royal-mail",
        citation: "[2019] UKSC 55",
        neutral_citation: "Royal Mail Group Ltd v Jhuti",
        case_name: "Royal Mail Group Ltd v Jhuti",
        court: "Supreme Court",
        year: 2019,
        tier: "binding",
        summary: "Whistleblowing dismissal. Where a manager conceals the true (whistleblowing) reason for dismissal from the decision-maker, the tribunal can look behind the decision-maker's stated reason to find the real reason was the protected disclosure.",
        claim_types: ["whistleblowing"],
        trust_badge: "VERIFIED",
    },
    {
        id: "capita-v-mclean",
        citation: "[2023] EAT 2",
        neutral_citation: "Capita Hartshead Ltd v McLean",
        case_name: "Capita Hartshead Ltd v McLean",
        court: "EAT",
        year: 2023,
        tier: "persuasive",
        summary: "Constructive dismissal and the 'last straw' doctrine. A relatively minor act can be the last straw that entitles an employee to resign, provided it is not entirely innocuous and is part of a course of conduct.",
        claim_types: ["constructive_dismissal"],
        trust_badge: "VERIFIED",
    },
    {
        id: "era-1996-s98",
        citation: "ERA 1996 s.98",
        neutral_citation: "Employment Rights Act 1996, section 98",
        case_name: "Employment Rights Act 1996 — Unfair Dismissal",
        court: "Statute",
        year: 1996,
        tier: "statutory",
        summary: "The statutory test for unfair dismissal. The employer must show a potentially fair reason (capability, conduct, redundancy, statutory bar, or some other substantial reason). The tribunal then determines whether the dismissal was fair in all the circumstances.",
        claim_types: ["unfair_dismissal", "constructive_dismissal"],
        trust_badge: "VERIFIED",
    },
    {
        id: "ea-2010-s26",
        citation: "EA 2010 s.26",
        neutral_citation: "Equality Act 2010, section 26",
        case_name: "Equality Act 2010 — Harassment",
        court: "Statute",
        year: 2010,
        tier: "statutory",
        summary: "Statutory definition of harassment. Unwanted conduct related to a protected characteristic that has the purpose or effect of violating dignity or creating an intimidating, hostile, degrading, humiliating or offensive environment.",
        claim_types: ["harassment", "direct_discrimination"],
        trust_badge: "VERIFIED",
    },
    {
        id: "era-1996-s43b",
        citation: "ERA 1996 s.43B",
        neutral_citation: "Employment Rights Act 1996, section 43B",
        case_name: "Employment Rights Act 1996 — Protected Disclosures",
        court: "Statute",
        year: 1996,
        tier: "statutory",
        summary: "Definition of a qualifying disclosure for whistleblowing protection. The disclosure must be of information which the worker reasonably believes tends to show one of six categories of wrongdoing (criminal offence, breach of legal obligation, miscarriage of justice, danger to health/safety, environmental damage, or concealment).",
        claim_types: ["whistleblowing"],
        trust_badge: "VERIFIED",
    },
    {
        id: "era-2025-s1",
        citation: "ERA 2025 s.1",
        neutral_citation: "Employment Rights Act 2025, section 1",
        case_name: "Employment Rights Act 2025 — Unfair Dismissal Qualifying Period",
        court: "Statute",
        year: 2025,
        tier: "statutory",
        summary: `Reduces the qualifying period for unfair dismissal from 2 years to 6 months. Commencement: ${formatCommencementDate(ERA_2025.QUALIFYING_PERIOD_6_MONTHS)} (subject to Statutory Instrument). Employees dismissed on or after this date with 6 months' service will have the right not to be unfairly dismissed.`,
        claim_types: ["unfair_dismissal"],
        trust_badge: "VERIFIED",
    },
    {
        id: "era-2025-fire-rehire",
        citation: "ERA 2025 s.23",
        neutral_citation: "Employment Rights Act 2025, section 23",
        case_name: "Employment Rights Act 2025 — Fire and Rehire",
        court: "Statute",
        year: 2025,
        tier: "statutory",
        summary: `Dismissal for the purpose of rehiring on inferior terms is automatically unfair. No qualifying period required. Commencement: ${formatCommencementDate(ERA_2025.FIRE_AND_REHIRE_AUTO_UNFAIR)} (subject to Statutory Instrument). Applies where the employer's reason or principal reason for dismissal is to offer re-engagement on different terms.`,
        claim_types: ["fire_and_rehire", "unfair_dismissal"],
        trust_badge: "VERIFIED",
    },
    {
        id: "williams-v-compair",
        citation: "[1982] ICR 156",
        neutral_citation: "Williams v Compair Maxam Ltd",
        case_name: "Williams v Compair Maxam Ltd",
        court: "EAT",
        year: 1982,
        tier: "persuasive",
        summary: "Established the principles of fair redundancy selection. The employer should give as much warning as possible, consult with the union or employees, use objective selection criteria, consider alternative employment, and follow a fair procedure.",
        claim_types: ["redundancy"],
        trust_badge: "VERIFIED",
    },
    {
        id: "autoclenz-v-belcher",
        citation: "[2011] UKSC 41",
        neutral_citation: "Autoclenz Ltd v Belcher",
        case_name: "Autoclenz Ltd v Belcher",
        court: "Supreme Court",
        year: 2011,
        tier: "binding",
        summary: "Employment status and sham contracts. Courts will look at the true nature of the relationship, not just the written contract. A clause purporting to deny employment status will be disregarded if it does not reflect the true agreement.",
        claim_types: ["unfair_dismissal"],
        trust_badge: "VERIFIED",
    },
    {
        id: "uber-v-aslam",
        citation: "[2021] UKSC 5",
        neutral_citation: "Uber BV v Aslam",
        case_name: "Uber BV v Aslam",
        court: "Supreme Court",
        year: 2021,
        tier: "binding",
        summary: "Gig economy employment status. Uber drivers are workers, not independent contractors. The Supreme Court applied a purposive approach to employment status, looking at the reality of the relationship and the subordination of the drivers to Uber's control.",
        claim_types: ["unfair_dismissal", "whistleblowing"],
        trust_badge: "VERIFIED",
    },
    {
        id: "forstater-v-cgd",
        citation: "[2022] EAT 0105",
        neutral_citation: "Forstater v CGD Europe",
        case_name: "Forstater v CGD Europe",
        court: "EAT",
        year: 2022,
        tier: "persuasive",
        summary: "Gender-critical beliefs are a protected philosophical belief under the Equality Act 2010. The EAT held that the employment tribunal had erred in finding that the claimant's belief did not qualify for protection.",
        claim_types: ["direct_discrimination"],
        trust_badge: "VERIFIED",
    },
    {
        id: "western-excavating-v-sharp",
        citation: "[1978] ICR 221",
        neutral_citation: "Western Excavating (ECC) Ltd v Sharp",
        case_name: "Western Excavating (ECC) Ltd v Sharp",
        court: "Court of Appeal",
        year: 1978,
        tier: "binding",
        summary: "Foundational authority on constructive dismissal. The employer's conduct must amount to a significant breach going to the root of the contract, or show an intention not to be bound by an essential term. The employee must resign in response to the breach and not delay.",
        claim_types: ["constructive_dismissal"],
        trust_badge: "VERIFIED",
    },
    {
        id: "ea-2010-s15",
        citation: "EA 2010 s.15",
        neutral_citation: "Equality Act 2010, section 15",
        case_name: "Equality Act 2010 — Discrimination Arising from Disability",
        court: "Statute",
        year: 2010,
        tier: "statutory",
        summary: "Discrimination arising from disability. An employer discriminates if they treat a disabled person unfavourably because of something arising in consequence of their disability, and cannot show the treatment is a proportionate means of achieving a legitimate aim.",
        claim_types: ["direct_discrimination"],
        trust_badge: "VERIFIED",
    },
    {
        id: "era-1996-s207b",
        citation: "ERA 1996 s.207B",
        neutral_citation: "Employment Rights Act 1996, section 207B",
        case_name: "Employment Rights Act 1996 — ACAS Early Conciliation",
        court: "Statute",
        year: 1996,
        tier: "statutory",
        summary: "ACAS early conciliation clock-stopping. The limitation period is extended by the period of ACAS early conciliation (Day A to Day B). The claimant gets whichever is longer: the extended deadline or 1 calendar month from Day B.",
        claim_types: ["unfair_dismissal", "direct_discrimination", "harassment", "whistleblowing", "redundancy"],
        trust_badge: "VERIFIED",
    },
    {
        id: "zero-hours-era-2025",
        citation: "ERA 2025 s.12",
        neutral_citation: "Employment Rights Act 2025, section 12",
        case_name: "Employment Rights Act 2025 — Zero-Hours Contracts",
        court: "Statute",
        year: 2025,
        tier: "statutory",
        summary: "Right to a guaranteed hours contract for zero-hours workers. Employers must offer a contract reflecting the hours regularly worked. Commencement: 2027 (exact date awaiting Statutory Instrument). Workers cannot be required to work exclusively for one employer.",
        claim_types: ["zero_hours_rights"],
        trust_badge: "CHECK",
    },
];

function scoreCase(entry: CaseLawEntry, query: string, claimType?: string): number {
    const q = query.toLowerCase();
    let score = 0;

    if (entry.case_name.toLowerCase().includes(q)) score += 10;
    if (entry.summary.toLowerCase().includes(q)) score += 5;
    if (entry.citation.toLowerCase().includes(q)) score += 8;
    if (claimType && entry.claim_types.includes(claimType)) score += 6;
    if (entry.tier === "binding") score += 2;
    if (entry.tier === "statutory") score += 1;
    if (entry.year >= 2020) score += 1;

    return score;
}

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q")?.trim() ?? "";
    const claimType = searchParams.get("claim_type") ?? undefined;
    const tierFilter = searchParams.get("tier") ?? undefined;
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "10"), 20);

    if (!query && !claimType) {
        return NextResponse.json(
            { error: "Provide at least one of: q (search query) or claim_type" },
            { status: 400 }
        );
    }

    let results = SEED_CASES;

    if (tierFilter) {
        results = results.filter((c) => c.tier === tierFilter);
    }

    if (claimType) {
        results = results.filter((c) => c.claim_types.includes(claimType));
    }

    if (query) {
        results = results
            .map((c) => ({ ...c, _score: scoreCase(c, query, claimType) }))
            .filter((c) => c._score > 0)
            .sort((a, b) => b._score - a._score)
            .slice(0, limit);
    } else {
        results = results.slice(0, limit);
    }

    return NextResponse.json({
        query,
        claim_type: claimType ?? null,
        total: results.length,
        data_source: "seed_v1",
        note: "Phase 2 seed data. Vector DB integration planned for Phase 3.",
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        results: results.map(({ _score, ...rest }: CaseLawEntry & { _score?: number }) => rest),
    });
}
