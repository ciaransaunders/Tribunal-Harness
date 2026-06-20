"use client";

import type { AnalyseResponse } from "@/schemas/types";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Timeline, type TimelineStage } from "@/components/analysis/Timeline";
import { Scale, FileText, Calendar } from "lucide-react";
import { motion } from "framer-motion";

interface AnalysisResultsPanelProps {
    results: Partial<AnalyseResponse> & { error?: string };
    timelineStages: TimelineStage[];
}

export function AnalysisResultsPanel({ results, timelineStages }: AnalysisResultsPanelProps) {
    if (results.error) {
        return (
            <div style={{ position: "relative", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Card variant="wireframe" style={{ borderColor: "rgba(239, 68, 68, 0.3)" }}>
                    <h3 style={{ color: "var(--color-error-coral)", marginBottom: "0.5rem" }}>Analysis couldn&apos;t finish</h3>
                    <p style={{ color: "var(--color-text-secondary)", fontSize: "0.9rem", lineHeight: 1.6 }}>{results.error}</p>
                </Card>
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ width: "100%", overflowY: "auto", maxHeight: "80vh", paddingRight: "1rem" }}
        >
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "2rem" }}>
                <div style={{ padding: "0.5rem", background: "rgba(255,255,255,0.05)", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.1)" }}>
                    <Scale style={{ color: "var(--color-accent-purple)", width: 20, height: 20 }} />
                </div>
                <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "1.75rem", margin: 0 }}>Analysis Results</h2>
            </div>

            {/* Claims Section */}
            {(results.claims?.length ?? 0) > 0 && (
                <div style={{ marginBottom: "2.5rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
                        <FileText size={16} color="var(--color-text-secondary)" />
                        <h3 className="text-subhead" style={{ margin: 0 }}>Identified Claims</h3>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                        {results.claims?.map((claim, i) => (
                            <Card key={i} variant="solid" style={{ transition: "all 0.2s" }} className="hover:border-[var(--color-accent-purple)]/50">
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "1rem" }}>
                                    <h4 style={{ fontSize: "1.1rem", fontWeight: 600, margin: 0 }}>{claim.claim_type}</h4>
                                    <Badge variant={
                                        claim.strength === "strong" ? "verified" :
                                            claim.strength === "moderate" ? "warning" : "unverified"
                                    }>
                                        {claim.strength}
                                    </Badge>
                                </div>
                                <p style={{ fontSize: "0.9rem", color: "var(--color-text-secondary)", marginBottom: "1rem", lineHeight: 1.6 }}>{claim.summary}</p>

                                <div style={{ background: "rgba(0,0,0,0.2)", padding: "0.75rem", borderRadius: "6px" }}>
                                    <p style={{ fontSize: "0.65rem", fontFamily: "var(--font-mono)", textTransform: "uppercase", color: "var(--color-text-muted)", marginBottom: "0.5rem" }}>Elements to Prove</p>
                                    <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                                        {claim.elements.map((el, j) => (
                                            <li key={j} style={{ display: "flex", gap: "0.5rem", fontSize: "0.85rem" }}>
                                                <span style={{ color: el.met ? "#2dd4bf" : "#ef4444", flexShrink: 0 }}>{el.met ? "✓" : "✗"}</span>
                                                <span style={{ color: "var(--color-text-secondary)" }}>{el.element}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </Card>
                        ))}
                    </div>
                </div>
            )}

            {/* Quarantine/Authorities Section */}
            {(results.authorities?.length ?? 0) > 0 && (
                <div style={{ marginBottom: "2.5rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
                        <Scale size={16} color="var(--color-text-secondary)" />
                        <h3 className="text-subhead" style={{ margin: 0 }}>Legal Authorities & Epistemic Quarantine</h3>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                        {results.authorities?.map((auth, i) => (
                            <Card key={i} variant="wireframe" style={{
                                borderLeftWidth: "3px",
                                borderLeftColor: auth.trust_level === "VERIFIED" ? "#10b981" :
                                    auth.trust_level === "CHECK" ? "#f59e0b" : "#ef4444",
                                padding: "1rem"
                            }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "0.5rem" }}>
                                    <div>
                                        <h4 style={{ fontSize: "1rem", fontWeight: 600, margin: 0 }}>{auth.matched_case || auth.name}</h4>
                                        <p style={{ fontSize: "0.75rem", fontFamily: "var(--font-mono)", color: "var(--color-text-muted)", marginTop: "0.25rem", margin: 0 }}>{auth.citation}</p>
                                    </div>
                                    <Badge variant={
                                        auth.trust_level === "VERIFIED" ? "verified" :
                                            auth.trust_level === "CHECK" ? "warning" : "quarantined"
                                    }>
                                        {auth.trust_level || "UNKNOWN"}
                                    </Badge>
                                </div>
                                <p style={{ fontSize: "0.85rem", color: "var(--color-text-secondary)", margin: 0 }}>{auth.validation_reason}</p>
                            </Card>
                        ))}
                    </div>
                </div>
            )}

            {/* ERA 2025 Flags */}
            {(results.era_2025_flags?.length ?? 0) > 0 && (
                <div style={{ marginBottom: "2.5rem" }}>
                    <h3 className="text-subhead" style={{ marginBottom: "1rem" }}>ERA 2025 Compliance</h3>
                    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                        {results.era_2025_flags?.map((flag, i) => (
                            <div key={i} style={{ padding: "1rem", borderLeft: "2px solid var(--color-accent-purple)", background: "rgba(139,92,246,0.05)", borderRadius: "0 8px 8px 0" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                                    <span style={{ fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.1em", color: "var(--color-accent-purple)" }}>
                                        {flag.status === "in_force" ? "IN FORCE" : "UPCOMING"}
                                    </span>
                                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.7rem", opacity: 0.7 }}>{flag.commencement_date}</span>
                                </div>
                                <p style={{ fontSize: "0.9rem", fontWeight: 600, margin: "0 0 0.25rem 0" }}>{flag.provision}</p>
                                <p style={{ fontSize: "0.85rem", color: "var(--color-text-secondary)", margin: 0 }}>{flag.reason}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Timeline Procedural Roadmap */}
            {timelineStages.length > 0 && (
                <div style={{ marginBottom: "2.5rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
                        <Calendar size={16} color="var(--color-text-secondary)" />
                        <h3 className="text-subhead" style={{ margin: 0 }}>Procedural Roadmap</h3>
                    </div>
                    <Timeline stages={timelineStages} />
                </div>
            )}
        </motion.div>
    );
}
