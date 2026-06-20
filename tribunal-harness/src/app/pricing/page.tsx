import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Pricing | Tribunal Harness", description: "Transparent pricing for litigants-in-person and legal professionals." };

export default function PricingPage() {
    return (
        <div className="theme-light" style={{ paddingTop: "10rem" }}>
            <div className="page-section" style={{ textAlign: "center", maxWidth: "900px", margin: "0 auto" }}>
                <span className="text-subhead">PRICING</span>
                <h1 style={{ fontFamily: "var(--font-serif)", fontSize: "3rem", marginBottom: "1.5rem" }}>Transparent. Fair. Accessible.</h1>
                <p className="text-lead" style={{ margin: "0 auto 4rem" }}>
                    Access to justice shouldn&apos;t be gated by price. Our pricing is designed to make
                    structured legal analysis accessible to everyone, with special rates for litigants-in-person.
                </p>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1.5rem", textAlign: "left" }}>
                    {[
                        { name: "LiP Access", price: "Free", period: "during beta", features: ["10 claim analyses per month", "All 10 claim type schemas", "Deadline calculator", "ERA 2025 tracker", "Basic document triage"], highlight: false },
                        { name: "Professional", price: "£49", period: "/month", features: ["Unlimited analyses", "Adversarial Risk Analysis", "Advanced document triage", "Case law database search", "Custom Strategy Schemas", "Priority support"], highlight: true },
                        { name: "Legal Aid", price: "£0", period: "always free", features: ["Unlimited analyses", "Full feature access", "For verified legal aid providers", "Supporting access to justice", "Contact us to verify"], highlight: false },
                    ].map((tier) => (
                        <div key={tier.name} style={{ padding: "2rem", border: `1px solid ${tier.highlight ? "var(--color-accent-purple)" : "var(--color-border-subtle)"}`, borderRadius: "var(--radius-card)", background: tier.highlight ? "rgba(123,107,245,0.03)" : "transparent" }}>
                            <h3 style={{ fontFamily: "var(--font-sans)", fontWeight: 600, marginBottom: "0.75rem" }}>{tier.name}</h3>
                            <div style={{ marginBottom: "1.5rem" }}>
                                <span style={{ fontFamily: "var(--font-serif)", fontSize: "2.5rem" }}>{tier.price}</span>
                                <span style={{ color: "var(--color-text-secondary)", fontSize: "0.85rem" }}> {tier.period}</span>
                            </div>
                            <ul style={{ listStyle: "none", fontSize: "0.85rem", color: "var(--color-text-secondary)", lineHeight: 2.2 }}>
                                {tier.features.map((f) => <li key={f}>✓ {f}</li>)}
                            </ul>
                            <Link href="/request-access" className="btn-primary" style={{ display: "block", textAlign: "center", marginTop: "1.5rem" }}>
                                {tier.highlight ? "Get Started" : "Request Access"}
                            </Link>
                        </div>
                    ))}
                </div>

                <p style={{ marginTop: "3rem", fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "var(--color-text-secondary)" }}>
                    All plans include ERA 2025 updates at no additional cost. See our <Link href="/privacy" style={{ color: "var(--color-accent-purple)" }}>Privacy Policy</Link> for data handling details.
                </p>
            </div>

            {/* AUDIT FIX D1: Added legal information disclaimer */}
            <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.7rem", color: "var(--color-text-secondary)", marginTop: "4rem", textAlign: "center", opacity: 0.6 }}>
                Tribunal Harness provides legal information tools, not legal advice or representation. Subscriptions do not create a solicitor-client relationship.
            </p>
        </div>
    );
}
