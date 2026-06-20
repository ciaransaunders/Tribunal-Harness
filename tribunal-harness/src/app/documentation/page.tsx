import type { Metadata } from "next";
import { ERA_2025_TRACKER, CLAIM_TYPES } from "@/lib/constants";

export const metadata: Metadata = {
    title: "Documentation | Tribunal Harness",
    description: "Architecture overview, claim types, trust indicators, and ERA 2025 Implementation Tracker.",
};

export default function DocumentationPage() {
    return (
        <div className="theme-light" style={{ paddingTop: "10rem" }}>
            <div className="page-section">
                <span className="text-subhead">REFERENCE</span>
                <h1 style={{ fontFamily: "var(--font-serif)", fontSize: "3rem", marginBottom: "1.5rem" }}>Documentation</h1>
                <p className="text-lead" style={{ marginBottom: "4rem" }}>
                    Architecture overview, supported claim types, and the ERA 2025 Implementation Tracker.
                </p>

                {/* Getting Started */}
                <div style={{ marginBottom: "4rem" }}>
                    <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "2rem", marginBottom: "1rem" }}>Getting Started</h2>
                    <div style={{ color: "var(--color-text-secondary)", lineHeight: 1.8 }}>
                        <p>1. Navigate to the main page and select your claim type from the dropdown — including ERA 2025 claim types marked with ★.</p>
                        <p>2. Enter the date of the last act complained of — the deadline calculator will apply the correct regime.</p>
                        <p>3. Confirm you have read the terms and consent to data processing.</p>
                        <p>4. Describe the facts of your case in the narrative field.</p>
                        <p>5. Click &quot;Run Analysis&quot; to generate a structured assessment, or upload a document for automatic triage.</p>
                        <p>6. Review the output — trust indicators show the verification status of each legal proposition.</p>
                    </div>
                </div>

                {/* Claim Types — imported from CLAIM_TYPES (single source of truth) */}
                <div style={{ marginBottom: "4rem" }}>
                    <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "2rem", marginBottom: "1.5rem" }}>Claim Types Supported</h2>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                        {CLAIM_TYPES.map((ct) => (
                            <div key={ct.id} style={{ padding: "1rem", border: "1px solid var(--color-border-subtle)", borderRadius: "6px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <div>
                                    <span style={{ fontWeight: 500 }}>{ct.label}</span>
                                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "var(--color-text-secondary)", marginLeft: "0.75rem" }}>{ct.statute}</span>
                                </div>
                                {ct.era2025 && <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.65rem", color: "var(--color-accent-purple)", fontWeight: 600 }}>ERA 2025</span>}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* ERA 2025 Tracker — imported from constants.ts (single source of truth) */}
            <div className="page-section" style={{ borderTop: "1px solid var(--color-border-subtle)" }}>
                <span className="text-subhead">LEGISLATIVE CHANGE</span>
                <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "2.5rem", marginBottom: "1.5rem" }}>ERA 2025 Implementation Tracker</h2>
                <p style={{ color: "var(--color-text-secondary)", marginBottom: "2rem", fontSize: "0.85rem" }}>
                    Provisions marked &quot;SI awaited&quot; have no confirmed commencement date. Do not rely on estimated dates for these provisions.
                </p>

                <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.8rem" }}>
                        <thead>
                            <tr style={{ borderBottom: "1px solid var(--color-border-subtle)" }}>
                                <th style={{ textAlign: "left", padding: "0.75rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", fontSize: "0.7rem", color: "var(--color-text-secondary)" }}>Provision</th>
                                <th style={{ textAlign: "left", padding: "0.75rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", fontSize: "0.7rem", color: "var(--color-text-secondary)" }}>Old Position</th>
                                <th style={{ textAlign: "left", padding: "0.75rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", fontSize: "0.7rem", color: "var(--color-text-secondary)" }}>New Position</th>
                                <th style={{ textAlign: "left", padding: "0.75rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", fontSize: "0.7rem", color: "var(--color-text-secondary)" }}>Commencement</th>
                                <th style={{ textAlign: "left", padding: "0.75rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", fontSize: "0.7rem", color: "var(--color-text-secondary)" }}>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {ERA_2025_TRACKER.map((row, i) => (
                                <tr key={i} style={{ borderBottom: "1px solid var(--color-border-subtle)" }}>
                                    <td style={{ padding: "0.75rem", fontWeight: 500 }}>{row.provision}</td>
                                    <td style={{ padding: "0.75rem", color: "var(--color-text-secondary)" }}>{row.old_position}</td>
                                    <td style={{ padding: "0.75rem", color: "var(--color-text-secondary)" }}>{row.new_position}</td>
                                    <td style={{ padding: "0.75rem", fontFamily: "var(--font-mono)", fontSize: "0.75rem" }}>{row.commencement}</td>
                                    <td style={{ padding: "0.75rem" }}>
                                        <span style={{
                                            fontFamily: "var(--font-mono)", fontSize: "0.65rem", fontWeight: 600, padding: "2px 6px", borderRadius: "4px",
                                            color: row.status === "in_force" ? "#2dd4bf" : row.status === "upcoming" ? "var(--color-accent-purple)" : "#fbbf24",
                                            background: row.status === "in_force" ? "rgba(45,212,191,0.1)" : row.status === "upcoming" ? "rgba(123,107,245,0.1)" : "rgba(251,191,36,0.1)",
                                        }}>
                                            {row.status === "in_force" ? "IN FORCE" : row.status === "upcoming" ? "UPCOMING" : "AWAITING SI"}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Legal disclaimer */}
            <div style={{ marginTop: "4rem", padding: "1rem", borderTop: "1px solid var(--color-border-subtle)", textAlign: "center" }}>
                <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.7rem", color: "var(--color-text-secondary)", opacity: 0.6 }}>
                    This tool provides legal information, not legal advice. Timelines and dates should be verified against official sources and current Statutory Instruments.
                </p>
            </div>
        </div>
    );
}
