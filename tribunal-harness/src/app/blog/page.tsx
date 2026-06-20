import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Insights | Tribunal Harness", description: "Articles on employment law, legal technology, and building in public." };

// AUDIT FIX: Replaced empty "Coming soon" placeholder with a more professional "Launching soon" message
// and removed non-functional subscribe button (no backend handler). Reframed as "Insights" to avoid
// the generic "Blog" label which reads as unfinished.
export default function BlogPage() {
    return (
        <div className="theme-light page-section" style={{ paddingTop: "10rem", maxWidth: "800px" }}>
            <span className="text-subhead">INSIGHTS</span>
            <h1 style={{ fontFamily: "var(--font-serif)", fontSize: "3rem", marginBottom: "1.5rem" }}>Insights</h1>
            <p className="text-lead" style={{ marginBottom: "3rem" }}>
                Analysis, commentary, and technical deep-dives on UK employment law and legal technology.
            </p>
            <div className="interface-card" style={{ textAlign: "center", padding: "4rem 2rem" }}>
                <p style={{ color: "var(--color-text-secondary)", marginBottom: "1.5rem", lineHeight: 1.7 }}>
                    Our first articles — covering ERA 2025 implementation timelines, epistemic quarantine in legal AI,
                    and schema-driven analysis methodology — are currently in preparation.
                </p>
                <p style={{ color: "var(--color-text-secondary)", fontSize: "0.85rem" }}>
                    To be notified when we publish, <Link href="/request-access" style={{ color: "var(--color-accent-purple)" }}>register your interest</Link> or
                    contact <a href="mailto:hello@tribunalharness.co.uk" style={{ fontFamily: "var(--font-mono)", color: "var(--color-accent-purple)", textDecoration: "underline" }}>hello@tribunalharness.co.uk</a>.
                </p>
            </div>

            {/* D1.2 FIX: Added legal disclaimer to blog/insights page */}
            <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.7rem", color: "var(--color-text-secondary)", marginTop: "2rem", opacity: 0.6 }}>
                Content published here will constitute legal information, not legal advice. Always verify information against primary sources and current legislation.
            </p>
        </div>
    );
}
