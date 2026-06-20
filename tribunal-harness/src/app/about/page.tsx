import type { Metadata } from "next";

export const metadata: Metadata = { title: "About | Tribunal Harness", description: "Closing the information asymmetry between litigants-in-person and represented parties." };

export default function AboutPage() {
    return (
        <div className="theme-light page-section" style={{ paddingTop: "10rem", maxWidth: "800px" }}>
            <span className="text-subhead">MISSION</span>
            <h1 style={{ fontFamily: "var(--font-serif)", fontSize: "3rem", marginBottom: "1.5rem" }}>Closing the information gap.</h1>
            <div style={{ color: "var(--color-text-secondary)", lineHeight: 1.9, fontSize: "1.05rem" }}>
                <p style={{ marginBottom: "1.5rem" }}>
                    UK employment tribunals are designed to be accessible to litigants-in-person. In practice,
                    the information asymmetry between an unrepresented claimant and a respondent with solicitors
                    is enormous. In the author&apos;s experience, a LiP can spend 40+ hours of manual research just to understand whether
                    they have a viable claim.
                </p>
                <p style={{ marginBottom: "1.5rem" }}>
                    Tribunal Harness was built by a qualified lawyer (LLM with Distinction) and active
                    litigant-in-person with direct experience of every gap this tool addresses. The thesis is
                    simple: the bottleneck for LiPs is not AI intelligence — it&apos;s infrastructure.
                </p>
                <p style={{ marginBottom: "1.5rem" }}>
                    LiPs don&apos;t need a chatbot. They need structured analysis that tells them which legal tests
                    apply, what facts they need to prove, what authorities support them, and what procedural steps
                    come next. They need to know what they don&apos;t know — and that&apos;s what the schema-driven
                    approach delivers.
                </p>
                <p>
                    The Employment Rights Act 2025 represents the most significant overhaul of UK employment law
                    in decades. Tribunal Harness was built to be ERA 2025-ready from day one — not retrofitted
                    after the changes take effect.
                </p>
            </div>

            <div style={{ marginTop: "4rem", padding: "2rem", border: "1px solid var(--color-border-subtle)", borderRadius: "var(--radius-card)" }}>
                <h3 style={{ fontFamily: "var(--font-serif)", fontSize: "1.5rem", marginBottom: "1rem" }}>Principles</h3>
                <ul style={{ listStyle: "none", color: "var(--color-text-secondary)", lineHeight: 2.2, fontSize: "0.9rem" }}>
                    <li>→ Legal information, not legal advice</li>
                    <li>→ Epistemic honesty over confident-sounding guesses</li>
                    <li>→ Schema-driven analysis over free-form chat</li>
                    <li>→ Verified citations or nothing</li>
                    <li>→ The infrastructure thesis: the bottleneck is tooling, not intelligence</li>
                </ul>
            </div>

            {/* AUDIT FIX D1: Added legal information disclaimer */}
            <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.7rem", color: "var(--color-text-secondary)", marginTop: "3rem", textAlign: "center", opacity: 0.6 }}>
                This tool provides legal information, not legal advice. The author is not practising as a solicitor or barrister via this platform.
            </p>
        </div>
    );
}
