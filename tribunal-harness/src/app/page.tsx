"use client";

import { useState, useCallback } from "react";
import type { AnalyseResponse } from "@/schemas/types";
import { ClaimInputPanel } from "@/components/analysis/ClaimInputPanel";
import { AnalysisResultsPanel } from "@/components/analysis/AnalysisResultsPanel";
import { TimelineStage } from "@/components/analysis/Timeline";
import { Button } from "@/components/ui/Button";
import { motion, AnimatePresence } from "framer-motion";

type AnalysisResults = Partial<AnalyseResponse> & { error?: string };

export default function HomePage() {
    const [stage, setStage] = useState<"input" | "analyzing" | "results">("input");
    const [results, setResults] = useState<AnalysisResults | null>(null);
    const [timeline, setTimeline] = useState<TimelineStage[]>([]);

    const handleAnalyse = async (payload: { claimType: string; dateOfLastAct: string; narrative: string; hasConsented: boolean }) => {
        setStage("analyzing");
        try {
            const res = await fetch("/api/analyse", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    claim_type: payload.claimType,
                    schema_fields: {},
                    narrative_text: payload.narrative,
                    key_dates: { date_of_last_act: payload.dateOfLastAct },
                    mode: "narrative",
                }),
            });
            const data = await res.json();
            setResults(data);

            // Fetch procedural roadmap from the API
            const roadmapRes = await fetch("/api/roadmap", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    claimType: payload.claimType,
                    dateOfLastAct: payload.dateOfLastAct,
                }),
            });
            const roadmapData = await roadmapRes.json();
            setTimeline(roadmapData);

            setStage("results");
        } catch (err) {
            setResults({ error: String(err) });
            setStage("results");
        }
    };

    const handleDrop = useCallback(async (file: File) => {
        setStage("analyzing");
        const formData = new FormData();
        formData.append("document", file);
        try {
            const res = await fetch("/api/triage", { method: "POST", body: formData });
            const data = await res.json();
            setResults(data);

            // Use current date for timeline if no date parsed from triage
            const roadmapRes = await fetch("/api/roadmap", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    dateOfLastAct: new Date().toISOString(),
                }),
            });
            const roadmapData = await roadmapRes.json();
            setTimeline(roadmapData);

            setStage("results");
        } catch (err) {
            setResults({ error: String(err) });
            setStage("results");
        }
    }, []);

    return (
        <div style={{ minHeight: "100vh", position: "relative", overflow: "hidden", paddingTop: "8rem" }}>
            <div style={{ position: "absolute", top: "-20%", right: "-10%", width: "800px", height: "800px", background: "radial-gradient(circle, rgba(139, 92, 246, 0.05) 0%, transparent 70%)", pointerEvents: "none" }} />

            <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 2rem", minHeight: "60vh" }}>
                <AnimatePresence mode="wait">
                    {stage === "input" && (
                        <motion.div
                            key="input"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.3 }}
                        >
                            <ClaimInputPanel onAnalyse={handleAnalyse} onDrop={handleDrop} isAnalysing={false} />
                        </motion.div>
                    )}

                    {stage === "analyzing" && (
                        <motion.div
                            key="analyzing"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 1.05 }}
                            transition={{ duration: 0.3 }}
                            style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "40vh" }}
                        >
                            <div style={{ position: "relative", width: 80, height: 80, marginBottom: "2rem" }}>
                                <div style={{ position: "absolute", inset: 0, borderTop: "2px solid var(--color-accent-purple)", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
                                <div style={{ position: "absolute", inset: 8, borderRight: "2px solid rgba(255,255,255,0.2)", borderRadius: "50%", animation: "spin 1.5s linear infinite reverse" }} />
                                <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                    <div style={{ width: 12, height: 12, background: "var(--color-accent-purple)", borderRadius: "50%", animation: "pulse 2s ease-in-out infinite" }} />
                                </div>
                            </div>
                            <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "1.5rem", marginBottom: "0.5rem" }}>Analysing Case Elements</h2>
                            <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.85rem", color: "var(--color-text-secondary)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Running statutory & precedent checks</p>
                        </motion.div>
                    )}

                    {stage === "results" && results && (
                        <motion.div
                            key="results"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4 }}
                        >
                            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "2rem" }}>
                                <Button variant="outline" size="sm" onClick={() => { setStage("input"); setResults(null); }}>
                                    New Analysis
                                </Button>
                            </div>
                            <AnalysisResultsPanel results={results} timelineStages={timeline} />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Trust Signals Section */}
            {stage === "input" && (
                <motion.section
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="page-section" style={{ borderTop: "1px solid var(--color-border-subtle)", marginTop: "4rem" }}
                >
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "2rem", maxWidth: "1400px", margin: "0 auto", padding: "0 2rem" }}>
                        {[
                            { title: "UK GDPR Aligned", desc: "Data processed lawfully under UK GDPR and Data Protection Act 2018. Privacy notice and data handling details available." },
                            { title: "Epistemic Quarantine", desc: "Every legal proposition verified against curated authorities. Ungrounded claims stripped, not flagged." },
                            { title: "Open Reasoning", desc: "All analysis steps visible. Trust indicators (VERIFIED / CHECK / QUARANTINED) show confidence level for each proposition." },
                            { title: "ERA 2025 Current", desc: "All ten claim type schemas updated for Employment Rights Act 2025 provisions. Commencement tracker maintained." },
                        ].map((item, i) => (
                            <div key={i} style={{ padding: "2rem", border: "1px solid var(--color-border-subtle)", borderRadius: "var(--radius-card)", background: "rgba(255,255,255,0.02)" }}>
                                <h4 style={{ fontFamily: "var(--font-sans)", fontSize: "0.85rem", fontWeight: 700, marginBottom: "0.5rem", color: "white" }}>{item.title}</h4>
                                <p style={{ fontSize: "0.8rem", color: "var(--color-text-secondary)", lineHeight: 1.6 }}>{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </motion.section>
            )}

            {/* P1-C: persistent LSA 2007 disclaimer on the analysis workspace (shown in every stage) */}
            <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.7rem", color: "var(--color-text-secondary)", textAlign: "center", opacity: 0.6, padding: "2rem 1rem", maxWidth: "800px", margin: "0 auto" }}>
                This tool provides legal information, not legal advice. It does not create a solicitor-client relationship.
            </p>
        </div>
    );
}
