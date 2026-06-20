"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { CLAIM_TYPES } from "@/lib/constants";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

interface ClaimInputPanelProps {
    onAnalyse: (payload: {
        claimType: string;
        dateOfLastAct: string;
        narrative: string;
        hasConsented: boolean;
    }) => void;
    onDrop: (file: File) => void;
    isAnalysing: boolean;
}

export function ClaimInputPanel({ onAnalyse, onDrop, isAnalysing }: ClaimInputPanelProps) {
    const [claimType, setClaimType] = useState("unfair_dismissal");
    const [dateOfLastAct, setDateOfLastAct] = useState("");
    const [narrative, setNarrative] = useState("");
    const [isDragging, setIsDragging] = useState(false);
    const [hasConsented, setHasConsented] = useState(false);

    const handleDrop = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault();
            setIsDragging(false);
            const file = e.dataTransfer.files[0];
            if (file) {
                onDrop(file);
            }
        },
        [onDrop]
    );

    return (
        <div style={{ marginTop: "4rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "2rem" }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--color-accent-purple)" }} />
                <span className="text-subhead" style={{ marginBottom: 0, color: "var(--color-accent-purple)", fontSize: "0.7rem", letterSpacing: "0.2em" }}>SYSTEM OPERATIONAL</span>
            </div>

            <h1 className="text-hero">
                Legal work,<br />
                <span style={{ fontStyle: "italic", opacity: 0.8 }}>structured.</span>
            </h1>

            <p className="text-lead" style={{ marginBottom: "4rem", borderLeft: "1px solid var(--color-border-subtle)", paddingLeft: "2rem", marginLeft: "4px" }}>
                Schema-driven case analysis for UK employment tribunal litigants-in-person. Identify applicable legal tests, surface verified authorities, and calculate procedural deadlines — updated for ERA 2025.
            </p>

            <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.7rem", color: "var(--color-text-secondary)", marginBottom: "1rem", opacity: 0.7, paddingLeft: "2rem" }}>
                This tool provides legal information, not legal advice. It does not create a solicitor-client relationship. By using this tool, you agree to our{" "}
                <Link href="/privacy" style={{ color: "var(--color-accent-purple)", textDecoration: "underline" }}>Privacy Policy</Link> and{" "}
                <Link href="/terms" style={{ color: "var(--color-accent-purple)", textDecoration: "underline" }}>Terms of Use</Link>. Your data is processed in accordance with UK GDPR.{" "}
                <Link href="/security" style={{ color: "var(--color-accent-purple)", textDecoration: "underline" }}>Learn more</Link>.
            </p>

            <Card variant="glass" style={{ transform: "translateX(2rem)" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                    <div>
                        <label htmlFor="claim-type" style={{ display: "block", fontSize: "0.7rem", fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--color-text-muted)", marginBottom: "0.5rem" }}>
                            Claim Type
                        </label>
                        <select
                            id="claim-type"
                            value={claimType}
                            onChange={(e) => setClaimType(e.target.value)}
                            style={{
                                width: "100%", padding: "1rem", fontSize: "1.1rem", borderRadius: "var(--radius-card)",
                                background: "rgba(255,255,255,0.02)", border: "1px solid var(--color-border-subtle)",
                                color: "var(--color-text-primary)", outline: "none"
                            }}
                        >
                            {CLAIM_TYPES.map((ct) => (
                                <option key={ct.id} value={ct.id} style={{ color: "black" }}>
                                    {ct.label} {ct.era2025 ? "★" : ""}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label htmlFor="date-of-act" style={{ display: "block", fontSize: "0.7rem", fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--color-text-muted)", marginBottom: "0.5rem" }}>
                            Date of Act
                        </label>
                        <input
                            id="date-of-act"
                            type="date"
                            value={dateOfLastAct}
                            onChange={(e) => setDateOfLastAct(e.target.value)}
                            style={{
                                width: "100%", padding: "0.8rem", borderRadius: "var(--radius-card)",
                                background: "rgba(255,255,255,0.02)", border: "1px solid var(--color-border-subtle)",
                                color: "var(--color-text-primary)", outline: "none", colorScheme: "dark"
                            }}
                        />
                        <p style={{ fontSize: "0.65rem", color: "var(--color-text-secondary)", marginTop: "0.5rem" }}>
                            Determines whether ERA 2025 rules apply.
                        </p>
                    </div>

                    <div>
                        <label htmlFor="facts-narrative" style={{ display: "block", fontSize: "0.7rem", fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--color-text-muted)", marginBottom: "0.5rem" }}>
                            Facts
                        </label>
                        <textarea
                            id="facts-narrative"
                            rows={3}
                            placeholder="Describe what happened..."
                            value={narrative}
                            onChange={(e) => setNarrative(e.target.value)}
                            style={{
                                width: "100%", padding: "1rem", borderRadius: "var(--radius-card)",
                                background: "rgba(0,0,0,0.2)", border: "1px solid var(--color-border-subtle)",
                                color: "var(--color-text-primary)", outline: "none", resize: "none"
                            }}
                        />
                    </div>

                    <div style={{ padding: "0.75rem", background: "rgba(255,255,255,0.03)", borderRadius: "var(--radius-card)", border: "1px solid rgba(255,255,255,0.06)" }}>
                        <label style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start", cursor: "pointer" }}>
                            <input
                                type="checkbox"
                                checked={hasConsented}
                                onChange={(e) => setHasConsented(e.target.checked)}
                                style={{ marginTop: "2px", accentColor: "var(--color-accent-purple)", width: "14px", height: "14px", flexShrink: 0 }}
                            />
                            <span style={{ fontSize: "0.7rem", color: "var(--color-text-secondary)", lineHeight: 1.5 }}>
                                I understand this tool provides <strong>legal information, not legal advice</strong>. I consent to my case description being processed by Tribunal Harness and Anthropic in accordance with the{" "}
                                <Link href="/privacy" style={{ color: "var(--color-accent-purple)", textDecoration: "underline" }}>Privacy Policy</Link>{" "}and{" "}
                                <Link href="/terms" style={{ color: "var(--color-accent-purple)", textDecoration: "underline" }}>Terms of Use</Link>.
                            </span>
                        </label>
                    </div>

                    <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
                        <Button
                            onClick={() => onAnalyse({ claimType, dateOfLastAct, narrative, hasConsented })}
                            disabled={isAnalysing || !hasConsented}
                            isLoading={isAnalysing}
                            style={{ flexShrink: 0 }}
                        >
                            {isAnalysing ? "Analysing..." : "Run Analysis"}
                        </Button>
                        <div
                            style={{
                                flex: 1, padding: "0.8rem 1.5rem", borderRadius: "var(--radius-card)",
                                border: "1px dashed rgba(255,255,255,0.1)", textAlign: "center", cursor: "pointer",
                                color: "var(--color-text-secondary)", fontSize: "0.8rem", transition: "all 0.2s ease",
                                background: isDragging ? "rgba(255,255,255,0.05)" : "transparent"
                            }}
                            onDrop={handleDrop}
                            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                            onDragLeave={() => setIsDragging(false)}
                        >
                            {isDragging ? "Drop File" : "Upload Document (PDF/DOCX)"}
                        </div>
                    </div>
                </div>
            </Card>
        </div>
    );
}
