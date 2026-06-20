"use client";

import { useState, useCallback } from "react";

interface CaseLawResult {
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

const TIER_COLORS: Record<string, string> = {
    binding: "#2dd4bf",
    persuasive: "#8B5CF6",
    statutory: "#fbbf24",
    guidance: "#A0A0A0",
};

const TIER_LABELS: Record<string, string> = {
    binding: "BINDING",
    persuasive: "PERSUASIVE",
    statutory: "STATUTORY",
    guidance: "GUIDANCE",
};

export default function CaseLawDBPage() {
    const [query, setQuery] = useState("");
    const [claimType, setClaimType] = useState("");
    const [results, setResults] = useState<CaseLawResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);
    const [error, setError] = useState("");

    const handleSearch = useCallback(async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!query.trim() && !claimType) return;

        setLoading(true);
        setError("");
        setSearched(true);

        try {
            const params = new URLSearchParams();
            if (query.trim()) params.set("q", query.trim());
            if (claimType) params.set("claim_type", claimType);
            params.set("limit", "10");

            const res = await fetch(`/api/case-law/search?${params}`);
            const data = await res.json();

            if (!res.ok) {
                setError(data.error || "Search failed.");
                setResults([]);
            } else {
                setResults(data.results || []);
            }
        } catch {
            setError("Network error. Please try again.");
            setResults([]);
        } finally {
            setLoading(false);
        }
    }, [query, claimType]);

    return (
        <div style={{ paddingTop: "10rem" }}>
            <div className="page-section">
                {/* Hero */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4rem", alignItems: "center", marginBottom: "4rem" }}>
                    <div>
                        <span className="text-subhead">KNOWLEDGE BASE</span>
                        <h1 style={{ fontFamily: "var(--font-serif)", fontSize: "3rem", marginBottom: "1.5rem" }}>Case Law Database</h1>
                        <p className="text-lead">
                            A curated, tiered database of employment law authorities. Every case is verified against
                            official reports before it enters the system.
                        </p>
                    </div>
                    <div className="fade-in">
                        <svg viewBox="0 0 400 300" style={{ width: "100%", height: "auto", borderRadius: "var(--radius-card)", border: "1px solid var(--color-border-subtle)", background: "rgba(0,0,0,0.2)" }}>
                            {/* Central DB node */}
                            <path d="M150 150 A50 15 0 1 0 250 150 A50 15 0 1 0 150 150 Z" fill="rgba(45,212,191,0.05)" stroke="#2dd4bf" strokeWidth="1.5" />
                            <path d="M150 165 A50 15 0 1 0 250 165" fill="none" stroke="rgba(45,212,191,0.5)" strokeWidth="1" />
                            <path d="M150 180 A50 15 0 1 0 250 180" fill="none" stroke="rgba(45,212,191,0.5)" strokeWidth="1" />
                            <path d="M150 195 A50 15 0 1 0 250 195" fill="none" stroke="rgba(45,212,191,0.5)" strokeWidth="1" />
                            <path d="M150 150 L150 195" fill="none" stroke="#2dd4bf" strokeWidth="1.5" />
                            <path d="M250 150 L250 195" fill="none" stroke="#2dd4bf" strokeWidth="1.5" />

                            {/* Floating hierarchy nodes */}
                            <path d="M200 60 L140 100 L260 100 Z" fill="rgba(139,92,246,0.1)" stroke="var(--color-accent-purple)" strokeWidth="1.5" />
                            <line x1="160" y1="100" x2="160" y2="105" stroke="var(--color-accent-purple)" strokeWidth="1" />
                            <line x1="200" y1="100" x2="200" y2="105" stroke="var(--color-accent-purple)" strokeWidth="1" />
                            <line x1="240" y1="100" x2="240" y2="105" stroke="var(--color-accent-purple)" strokeWidth="1" />

                            {/* Connection lines */}
                            <path d="M200 105 L200 135" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" strokeDasharray="4 4" fill="none" />

                            {/* Peripheral square nodes */}
                            <rect x="70" y="160" width="40" height="40" rx="4" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
                            <path d="M110 180 L150 180" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
                            <rect x="290" y="160" width="40" height="40" rx="4" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
                            <path d="M250 180 L290 180" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />

                            {/* Abstract glowing data points */}
                            <circle cx="200" cy="150" r="3" fill="#fbbf24" style={{ filter: "drop-shadow(0 0 4px #fbbf24)" }} />
                            <circle cx="160" cy="90" r="2" fill="var(--color-accent-purple)" />
                            <circle cx="240" cy="90" r="2" fill="var(--color-accent-purple)" />
                        </svg>
                    </div>
                </div>

                {/* Tier legend */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1.5rem", marginBottom: "3rem" }}>
                    {[
                        { tier: "Tier 1", label: "Supreme Court / CoA", desc: "Binding authorities", badge: "BINDING", color: "#2dd4bf" },
                        { tier: "Tier 2", label: "EAT", desc: "Persuasive authorities", badge: "PERSUASIVE", color: "var(--color-accent-purple)" },
                        { tier: "Tier 3", label: "Statutes", desc: "ERA 1996, EA 2010, ERA 2025", badge: "STATUTORY", color: "#fbbf24" },
                        { tier: "Tier 4", label: "Practice", desc: "Presidential Guidance, Practice Directions", badge: "GUIDANCE", color: "var(--color-text-secondary)" },
                    ].map((t) => (
                        <div key={t.tier} className="interface-card" style={{ textAlign: "center" }}>
                            <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.7rem", color: t.color, fontWeight: 600 }}>{t.tier}</span>
                            <h3 style={{ fontFamily: "var(--font-serif)", fontSize: "1.5rem", margin: "0.75rem 0 0.5rem" }}>{t.label}</h3>
                            <p style={{ fontSize: "0.8rem", color: "var(--color-text-secondary)", marginBottom: "1rem" }}>{t.desc}</p>
                            <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", fontWeight: 700, color: t.color, padding: "2px 8px", border: `1px solid ${t.color}`, borderRadius: "4px", opacity: 0.8 }}>{t.badge}</span>
                        </div>
                    ))}
                </div>

                {/* Search */}
                <div className="interface-card" style={{ marginBottom: "2rem" }}>
                    <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "1.75rem", marginBottom: "1.5rem" }}>Search Cases</h2>
                    <form onSubmit={handleSearch} style={{ display: "grid", gridTemplateColumns: "1fr auto auto", gap: "1rem", alignItems: "end" }}>
                        <div className="input-group" style={{ margin: 0 }}>
                            <label className="input-label">Search query</label>
                            <input
                                className="input-field"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="e.g. constructive dismissal, Polkey, band of reasonable responses..."
                            />
                        </div>
                        <div className="input-group" style={{ margin: 0 }}>
                            <label className="input-label">Claim type</label>
                            <select className="input-field" value={claimType} onChange={(e) => setClaimType(e.target.value)}>
                                <option value="">All types</option>
                                <option value="unfair_dismissal">Unfair Dismissal</option>
                                <option value="constructive_dismissal">Constructive Dismissal</option>
                                <option value="direct_discrimination">Discrimination</option>
                                <option value="harassment">Harassment</option>
                                <option value="whistleblowing">Whistleblowing</option>
                                <option value="redundancy">Redundancy</option>
                                <option value="fire_and_rehire">Fire &amp; Rehire</option>
                                <option value="zero_hours_rights">Zero-Hours Rights</option>
                            </select>
                        </div>
                        <button type="submit" className="btn-primary" disabled={loading} style={{ padding: "0.75rem 1.5rem", whiteSpace: "nowrap" }}>
                            {loading ? "Searching..." : "Search"}
                        </button>
                    </form>
                </div>

                {/* Results */}
                {error && (
                    <div style={{ padding: "1rem", border: "1px solid var(--color-error-coral)", borderRadius: "var(--radius-card)", marginBottom: "1.5rem", color: "var(--color-error-coral)", fontSize: "0.85rem" }}>
                        {error}
                    </div>
                )}

                {searched && !loading && results.length === 0 && !error && (
                    <div className="interface-card" style={{ textAlign: "center", padding: "3rem" }}>
                        <p style={{ color: "var(--color-text-secondary)", fontFamily: "var(--font-mono)", fontSize: "0.85rem" }}>
                            No cases found for your search. Try different terms or remove the claim type filter.
                        </p>
                    </div>
                )}

                {results.length > 0 && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                        <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.7rem", color: "var(--color-text-secondary)", marginBottom: "0.5rem" }}>
                            {results.length} result{results.length !== 1 ? "s" : ""} — seed data v1
                        </p>
                        {results.map((c) => (
                            <div key={c.id} className="interface-card" style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: "1.5rem", alignItems: "start" }}>
                                <div>
                                    <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", marginBottom: "0.5rem", flexWrap: "wrap" }}>
                                        <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", fontWeight: 700, color: TIER_COLORS[c.tier] || "#A0A0A0", padding: "2px 6px", border: `1px solid ${TIER_COLORS[c.tier] || "#A0A0A0"}`, borderRadius: "4px" }}>
                                            {TIER_LABELS[c.tier] || c.tier.toUpperCase()}
                                        </span>
                                        <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.65rem", padding: "2px 6px", borderRadius: "4px", background: c.trust_badge === "VERIFIED" ? "rgba(45,212,191,0.1)" : "rgba(251,191,36,0.1)", color: c.trust_badge === "VERIFIED" ? "#2dd4bf" : "#fbbf24" }}>
                                            {c.trust_badge}
                                        </span>
                                        <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.7rem", color: "var(--color-text-secondary)" }}>{c.citation}</span>
                                    </div>
                                    <h3 style={{ fontFamily: "var(--font-serif)", fontSize: "1.2rem", marginBottom: "0.5rem" }}>{c.case_name}</h3>
                                    <p style={{ fontSize: "0.8rem", color: "var(--color-text-secondary)", lineHeight: 1.6, marginBottom: "0.75rem" }}>{c.summary}</p>
                                    <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                                        {c.claim_types.map((ct) => (
                                            <span key={ct} style={{ fontFamily: "var(--font-mono)", fontSize: "0.65rem", padding: "2px 6px", background: "rgba(139,92,246,0.08)", color: "var(--color-accent-purple)", borderRadius: "4px" }}>
                                                {ct.replace(/_/g, " ")}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                                <div style={{ textAlign: "right", flexShrink: 0 }}>
                                    <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.7rem", color: "var(--color-text-secondary)", marginBottom: "0.5rem" }}>{c.court}</p>
                                    <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.7rem", color: "var(--color-text-secondary)" }}>{c.year}</p>
                                    {c.url && (
                                        <a href={c.url} target="_blank" rel="noopener noreferrer" style={{ display: "block", marginTop: "0.75rem", fontSize: "0.7rem", color: "var(--color-accent-purple)", textDecoration: "underline" }}>
                                            BAILII →
                                        </a>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {!searched && (
                    <div className="interface-card" style={{ textAlign: "center", padding: "3rem 2rem" }}>
                        <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.85rem", color: "var(--color-text-secondary)" }}>
                            Search by case name, citation, or keyword — or filter by claim type.
                        </p>
                    </div>
                )}

                <div style={{ marginTop: "3rem", padding: "1rem", borderTop: "1px solid var(--color-border-subtle)", textAlign: "center" }}>
                    <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.7rem", color: "var(--color-text-secondary)", opacity: 0.6 }}>
                        This tool provides legal information, not legal advice. It does not create a solicitor-client relationship. The case law database is for research purposes only — case status and binding authority can change. Seek professional advice for litigation.
                    </p>
                </div>
            </div>
        </div>
    );
}
