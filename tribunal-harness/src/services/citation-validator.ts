/**
 * Citation Validator — Phase 2a Epistemic Quarantine
 *
 * Validates Claude's cited authorities against the verified-authorities
 * known-good list. This is the first step toward real epistemic quarantine:
 * instead of trusting Claude's self-reported trust levels, we independently
 * verify each citation against ground truth.
 *
 * Trust levels:
 * - VERIFIED: Exact match on case name in verified database
 * - CHECK: Partial match (case name found but citation may differ)
 * - QUARANTINED: No match found — citation cannot be verified
 */

import {
    findAuthorityByShortName,
    findAuthorityByPartialMatch,
    type VerifiedAuthority,
} from "@/lib/verified-authorities";
import { verifyCitation } from "@/services/find-case-law";

export type TrustLevel = "VERIFIED" | "CHECK" | "QUARANTINED";

export interface CitationValidationResult {
    /** The original citation string from Claude */
    originalCitation: string;
    /** Assigned trust level */
    trustLevel: TrustLevel;
    /** The matched verified authority, if any */
    matchedAuthority?: VerifiedAuthority;
    /** Explanation of the validation result */
    reason: string;
}

/**
 * Validate a single citation string against the verified authorities database.
 *
 * Matching strategy:
 * 1. Extract the case short name from the citation string
 * 2. Try exact match against verified authority short names
 * 3. Try partial match against full names
 * 4. If no match, mark as QUARANTINED
 */
export function validateCitation(citation: string): CitationValidationResult {
    if (!citation || citation.trim().length === 0) {
        return {
            originalCitation: citation,
            trustLevel: "QUARANTINED",
            reason: "Empty citation string",
        };
    }

    const trimmed = citation.trim();

    // Strategy 1: Extract likely case name and try exact short name match
    // Common patterns: "Polkey v AE Dayton Services Ltd [1987] UKHL 8"
    // or "BHS v Burchell [1978]"
    const words = trimmed.split(/\s+/);
    const firstWord = words[0];

    // Try the first word as a short name (e.g. "Polkey", "Shamoon", "Homer")
    const exactMatch = findAuthorityByShortName(firstWord);
    if (exactMatch) {
        return {
            originalCitation: trimmed,
            trustLevel: "VERIFIED",
            matchedAuthority: exactMatch,
            reason: `Exact match: ${exactMatch.fullName} ${exactMatch.neutralCitation}`,
        };
    }

    // Try multi-word short names (e.g. "BHS v Burchell", "Iceland Frozen Foods")
    // Check if the citation starts with any known short name
    const shortNamePatterns = [
        words.slice(0, 4).join(" "),
        words.slice(0, 3).join(" "),
        words.slice(0, 2).join(" "),
    ];

    for (const pattern of shortNamePatterns) {
        const match = findAuthorityByShortName(pattern);
        if (match) {
            return {
                originalCitation: trimmed,
                trustLevel: "VERIFIED",
                matchedAuthority: match,
                reason: `Exact match: ${match.fullName} ${match.neutralCitation}`,
            };
        }
    }

    // Strategy 2: Try partial match against the full citation text
    const partialMatch = findAuthorityByPartialMatch(trimmed);
    if (partialMatch) {
        // Check if the neutral citation also appears (stronger match)
        if (trimmed.includes(partialMatch.neutralCitation)) {
            return {
                originalCitation: trimmed,
                trustLevel: "VERIFIED",
                matchedAuthority: partialMatch,
                reason: `Full match: case name and neutral citation both verified — ${partialMatch.fullName}`,
            };
        }
        // Case name found but citation may differ — mark as CHECK
        return {
            originalCitation: trimmed,
            trustLevel: "CHECK",
            matchedAuthority: partialMatch,
            reason: `Case name matches ${partialMatch.fullName}, but citation not independently verified. Manual check recommended.`,
        };
    }

    // Strategy 3: No match at all
    return {
        originalCitation: trimmed,
        trustLevel: "QUARANTINED",
        reason:
            "Citation not found in verified authorities database. May be valid but cannot be independently verified.",
    };
}

/**
 * Validate an array of authority citations from Claude's analysis output.
 * Returns validation results for each, plus aggregate statistics.
 */
export function validateAllCitations(
    authorities: Array<{ citation: string;[key: string]: unknown }>
): {
    results: CitationValidationResult[];
    summary: {
        total: number;
        verified: number;
        check: number;
        quarantined: number;
        verifiedPercentage: number;
    };
} {
    const results = authorities.map((auth) => validateCitation(auth.citation));

    const verified = results.filter((r) => r.trustLevel === "VERIFIED").length;
    const check = results.filter((r) => r.trustLevel === "CHECK").length;
    const quarantined = results.filter(
        (r) => r.trustLevel === "QUARANTINED"
    ).length;
    const total = results.length;

    return {
        results,
        summary: {
            total,
            verified,
            check,
            quarantined,
            verifiedPercentage:
                total > 0 ? Math.round((verified / total) * 100) : 0,
        },
    };
}

// ---------------------------------------------------------------------------
// Authoritative validation — Phase 2a (curated list) layered with a live
// double-check against The National Archives Find Case Law (see find-case-law.ts).
//
// Strategy (conservative, legal-safety first):
//  1. Check the curated known-good list first (fast, offline). It is the only
//     reliable source for pre-2003 landmark authorities that TNA does not index.
//     A curated VERIFIED short-circuits — no network call.
//  2. Otherwise double-check live against Find Case Law (the primary source).
//     A live exact neutral-citation match upgrades the result to VERIFIED.
//  3. If the upstream is unreachable, fall back to the curated result and say so
//     — never silently treat an unverifiable claim as verified.
// ---------------------------------------------------------------------------

export type CitationSource =
    | "verified_db"
    | "find_case_law"
    | "verified_db+find_case_law"
    | "unavailable";

export interface AuthoritativeValidation {
    originalCitation: string;
    trustLevel: TrustLevel;
    reason: string;
    source: CitationSource;
    /** Matched case short name (curated) or judgment title (live), if any. */
    matchedName?: string;
    matchedCitation?: string;
    /** Canonical Find Case Law judgment URL, when matched live. */
    url?: string;
}

function higherTrust(a: TrustLevel, b: TrustLevel): TrustLevel {
    const rank: Record<TrustLevel, number> = { QUARANTINED: 0, CHECK: 1, VERIFIED: 2 };
    return rank[a] >= rank[b] ? a : b;
}

/**
 * Validate one authority against the curated list AND, if needed, live Find
 * Case Law. Never throws — on any failure it degrades to the curated verdict.
 */
export async function validateCitationAuthoritative(authority: {
    citation: string;
    name?: string;
}): Promise<AuthoritativeValidation> {
    const stat = validateCitation(authority.citation);

    // Curated VERIFIED is authoritative on its own (covers old landmark cases).
    if (stat.trustLevel === "VERIFIED") {
        return {
            originalCitation: authority.citation,
            trustLevel: "VERIFIED",
            reason: stat.reason,
            source: "verified_db",
            matchedName: stat.matchedAuthority?.shortName,
            matchedCitation: stat.matchedAuthority?.neutralCitation,
        };
    }

    let live;
    try {
        live = await verifyCitation({ citation: authority.citation, caseName: authority.name });
    } catch {
        live = undefined;
    }

    // Upstream unreachable → fall back to the curated verdict, flagged.
    if (!live || live.source === "unavailable") {
        return {
            originalCitation: authority.citation,
            trustLevel: stat.trustLevel,
            reason: `${stat.reason} (Live Find Case Law check unavailable; based on curated database only.)`,
            source: "unavailable",
            matchedName: stat.matchedAuthority?.shortName,
            matchedCitation: stat.matchedAuthority?.neutralCitation,
        };
    }

    // Live exact match → VERIFIED.
    if (live.trustLevel === "VERIFIED") {
        return {
            originalCitation: authority.citation,
            trustLevel: "VERIFIED",
            reason: live.reason,
            source: "find_case_law",
            matchedName: live.matchedTitle ?? stat.matchedAuthority?.shortName,
            matchedCitation: live.matchedCitation,
            url: live.url,
        };
    }

    // Combine the two non-verified signals, taking the higher trust.
    const trustLevel = higherTrust(stat.trustLevel, live.trustLevel);
    const reason =
        live.trustLevel === "CHECK"
            ? live.reason
            : stat.trustLevel === "CHECK"
                ? stat.reason
                : live.reason;
    return {
        originalCitation: authority.citation,
        trustLevel,
        reason,
        source: "verified_db+find_case_law",
        matchedName: live.matchedTitle ?? stat.matchedAuthority?.shortName,
        matchedCitation: live.matchedCitation ?? stat.matchedAuthority?.neutralCitation,
        url: live.url,
    };
}

/**
 * Authoritative validation for an array of authorities (curated + live).
 * Runs the per-authority checks concurrently. Never throws.
 */
export async function validateAllCitationsAuthoritative(
    authorities: Array<{ citation: string; name?: string;[key: string]: unknown }>
): Promise<{
    results: AuthoritativeValidation[];
    summary: {
        total: number;
        verified: number;
        check: number;
        quarantined: number;
        verifiedPercentage: number;
        liveChecks: number;
    };
}> {
    const results = await Promise.all(
        authorities.map((a) => validateCitationAuthoritative({ citation: a.citation, name: a.name }))
    );
    const verified = results.filter((r) => r.trustLevel === "VERIFIED").length;
    const check = results.filter((r) => r.trustLevel === "CHECK").length;
    const quarantined = results.filter((r) => r.trustLevel === "QUARANTINED").length;
    const liveChecks = results.filter((r) => r.source !== "verified_db").length;
    const total = results.length;
    return {
        results,
        summary: {
            total,
            verified,
            check,
            quarantined,
            verifiedPercentage: total > 0 ? Math.round((verified / total) * 100) : 0,
            liveChecks,
        },
    };
}
