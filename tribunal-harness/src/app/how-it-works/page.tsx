import type { Metadata } from "next";
import Link from "next/link";
import { ERA_2025_TRACKER } from "@/lib/constants";

export const metadata: Metadata = {
    title: "How It Works | Tribunal Harness",
    description: "Step-by-step walkthrough of how Tribunal Harness analyses employment tribunal claims.",
};

const STEPS = [
    { num: "01", title: "Describe Your Situation", desc: "Upload documents (dismissal letter, contract, grievance correspondence) or write a narrative. The system accepts PDF, DOCX, and TXT." },
    { num: "02", title: "System Identifies Claims", desc: "The triage agent maps your facts against 10 claim type schemas — including two new ERA 2025 claim types. It identifies which legal tests are met and which facts are missing." },
    { num: "03", title: "Verified Research", desc: "Every legal proposition is checked against our curated vector database. Trust indicators show what is VERIFIED (green), needs CHECKING (amber), or is QUARANTINED (red)." },
    { num: "04", title: "Procedural Roadmap", desc: "See your full procedural journey from pre-action through to the Court of Appeal. Key deadlines are calculated automatically — with ERA 2025 time limit changes applied." },
];

export default function HowItWorksPage() {
    return (
        <div className="theme-light" style={{ paddingTop: "10rem" }}>
            <div className="page-section">
                <span className="text-subhead">PROCESS</span>
                <h1 style={{ fontFamily: "var(--font-serif)", fontSize: "3rem", marginBottom: "1.5rem" }}>Four steps to structured analysis.</h1>
                <p className="text-lead" style={{ marginBottom: "4rem" }}>
                    From raw facts to structured legal information, efficiently.
                </p>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem" }}>
                    {STEPS.map((step) => (
                        <div key={step.num} className="interface-card">
                            <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", opacity: 0.4 }}>{step.num}</span>
                            <h3 style={{ fontFamily: "var(--font-serif)", fontSize: "1.5rem", margin: "1rem 0 0.75rem" }}>{step.title}</h3>
                            <p style={{ color: "var(--color-text-secondary)", fontSize: "0.9rem", lineHeight: 1.7 }}>{step.desc}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* ERA 2025 Section */}
            <div className="page-section" style={{ borderTop: "1px solid var(--color-border-subtle)" }}>
                <span className="text-subhead">ERA 2025</span>
                <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "2.5rem", marginBottom: "1.5rem" }}>Built for the new employment law landscape.</h2>
                <p style={{ color: "var(--color-text-secondary)", marginBottom: "3rem", maxWidth: "700px", lineHeight: 1.8 }}>
                    The Employment Rights Act 2025 is the most significant overhaul of UK employment law in decades.
                    Tribunal Harness is already updated for every change — from the extended time limits to the new
                    fire-and-rehire protections.
                </p>

                {/* ERA 2025 featured provisions — derived from ERA_2025_TRACKER (single source of truth) */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1.5rem" }}>
                    {ERA_2025_TRACKER
                        .filter((e) => ["INDUSTRIAL_ACTION_DISMISSAL", "SEXUAL_HARASSMENT_WHISTLEBLOWING", "ET_TIME_LIMIT_6_MONTHS", "HARASSMENT_ALL_REASONABLE_STEPS", "QUALIFYING_PERIOD_6_MONTHS", "FIRE_AND_REHIRE_AUTO_UNFAIR"].includes(e.key))
                        .map((item, i) => (
                            <div key={i} style={{ padding: "1.5rem", border: "1px solid var(--color-border-subtle)", borderRadius: "var(--radius-card)" }}>
                                <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.7rem", color: item.status === "in_force" ? "#2dd4bf" : "var(--color-accent-purple)", fontWeight: 600 }}>
                                    {item.status === "in_force" ? "IN FORCE" : item.commencement.toUpperCase()}
                                </span>
                                <h4 style={{ fontFamily: "var(--font-sans)", fontSize: "0.95rem", fontWeight: 600, margin: "0.75rem 0 0.5rem" }}>{item.provision}</h4>
                                <p style={{ color: "var(--color-text-secondary)", fontSize: "0.8rem", lineHeight: 1.6 }}>{item.new_position}</p>
                            </div>
                        ))}
                </div>

                <div style={{ marginTop: "2rem", textAlign: "center" }}>
                    <Link href="/documentation" style={{ color: "var(--color-accent-purple)", fontSize: "0.85rem", fontWeight: 500 }}>
                        View full ERA 2025 Implementation Tracker →
                    </Link>
                </div>

                {/* AUDIT FIX: Added legal information disclaimer */}
                <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.7rem", color: "var(--color-text-secondary)", marginTop: "3rem", textAlign: "center", opacity: 0.6 }}>
                    This tool provides legal information, not legal advice. All outputs should be independently verified before reliance.
                </p>
            </div>
        </div>
    );
}
