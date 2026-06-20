import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Contact | Tribunal Harness", description: "Get in touch with the Tribunal Harness team." };

export default function ContactPage() {
    return (
        <div className="theme-light page-section" style={{ paddingTop: "10rem", maxWidth: "700px" }}>
            <span className="text-subhead">REACH OUT</span>
            <h1 style={{ fontFamily: "var(--font-serif)", fontSize: "3rem", marginBottom: "1.5rem" }}>Contact</h1>
            <p className="text-lead" style={{ marginBottom: "3rem" }}>
                Questions, feedback, partnership enquiries, or legal aid verification requests.
            </p>

            <div className="interface-card" style={{ marginBottom: "2rem" }}>
                <div style={{ display: "grid", gap: "1.5rem" }}>
                    <div>
                        <h4 style={{ fontFamily: "var(--font-sans)", fontWeight: 600, marginBottom: "0.5rem" }}>General Enquiries</h4>
                        {/* D6.6 FIX: email addresses are now clickable mailto: links */}
                        <a href="mailto:hello@tribunalharness.co.uk" style={{ fontFamily: "var(--font-mono)", fontSize: "0.85rem", color: "var(--color-accent-purple)", textDecoration: "underline" }}>
                            hello@tribunalharness.co.uk
                        </a>
                    </div>
                    <div>
                        <h4 style={{ fontFamily: "var(--font-sans)", fontWeight: 600, marginBottom: "0.5rem" }}>Legal Aid Verification</h4>
                        <a href="mailto:legalaid@tribunalharness.co.uk" style={{ fontFamily: "var(--font-mono)", fontSize: "0.85rem", color: "var(--color-accent-purple)", textDecoration: "underline" }}>
                            legalaid@tribunalharness.co.uk
                        </a>
                    </div>
                    <div>
                        <h4 style={{ fontFamily: "var(--font-sans)", fontWeight: 600, marginBottom: "0.5rem" }}>Data Protection</h4>
                        <a href="mailto:dpo@tribunalharness.co.uk" style={{ fontFamily: "var(--font-mono)", fontSize: "0.85rem", color: "var(--color-accent-purple)", textDecoration: "underline" }}>
                            dpo@tribunalharness.co.uk
                        </a>
                        <Link href="/privacy" style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)", textDecoration: "underline", display: "block", marginTop: "0.25rem" }}>View Privacy Policy</Link>
                    </div>
                    <div>
                        <h4 style={{ fontFamily: "var(--font-sans)", fontWeight: 600, marginBottom: "0.5rem" }}>Technical / API</h4>
                        <a href="mailto:dev@tribunalharness.co.uk" style={{ fontFamily: "var(--font-mono)", fontSize: "0.85rem", color: "var(--color-accent-purple)", textDecoration: "underline" }}>
                            dev@tribunalharness.co.uk
                        </a>
                    </div>
                </div>
            </div>

            <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "var(--color-text-secondary)", textAlign: "center", marginBottom: "1.5rem" }}>
                We aim to respond within 48 hours. For urgent deadline queries, please state your ET1 deadline in the subject line.
            </p>

            {/* D1.1 FIX: Added legal disclaimer to contact page */}
            <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.7rem", color: "var(--color-text-secondary)", textAlign: "center", opacity: 0.6 }}>
                Tribunal Harness provides legal information, not legal advice. Contact us for product enquiries only — we cannot provide legal advice or case-specific guidance.
                See our <Link href="/terms" style={{ color: "var(--color-accent-purple)", textDecoration: "underline" }}>Terms of Use</Link> and <Link href="/privacy" style={{ color: "var(--color-accent-purple)", textDecoration: "underline" }}>Privacy Policy</Link>.
            </p>
        </div>
    );
}
