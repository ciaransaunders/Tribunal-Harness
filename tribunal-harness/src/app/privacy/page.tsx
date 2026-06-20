import type { Metadata } from "next";
import Link from "next/link";

// AUDIT FIX: Created Privacy Policy page with Article 13 UK GDPR notice
export const metadata: Metadata = {
    title: "Privacy Policy | Tribunal Harness",
    description: "How Tribunal Harness collects, uses, and protects your personal data under UK GDPR.",
};

export default function PrivacyPolicyPage() {
    return (
        <div className="page-section" style={{ paddingTop: "10rem", maxWidth: "800px" }}>
            <span className="text-subhead">LEGAL</span>
            <h1 style={{ fontFamily: "var(--font-serif)", fontSize: "3rem", marginBottom: "1.5rem" }}>Privacy Policy</h1>
            <p style={{ color: "var(--color-text-secondary)", marginBottom: "3rem", fontSize: "0.85rem" }}>
                Last updated: 16 February 2026
            </p>

            <div style={{ color: "var(--color-text-secondary)", lineHeight: 1.9, fontSize: "0.95rem" }}>
                <section style={{ marginBottom: "3rem" }}>
                    <h2 style={{ fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: "1.2rem", color: "var(--color-text-primary)", marginBottom: "1rem" }}>1. Data Controller</h2>
                    <p>
                        Tribunal Harness is operated as a sole trader venture. For the purposes of the UK General Data Protection Regulation
                        (UK GDPR) and the Data Protection Act 2018, the data controller is Tribunal Harness.
                    </p>
                    <p style={{ marginTop: "0.75rem" }}>
                        Data protection contact: <Link href="mailto:dpo@tribunalharness.co.uk" style={{ color: "var(--color-accent-purple)" }}>dpo@tribunalharness.co.uk</Link>
                    </p>
                </section>

                <section style={{ marginBottom: "3rem" }}>
                    <h2 style={{ fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: "1.2rem", color: "var(--color-text-primary)", marginBottom: "1rem" }}>2. Data We Collect</h2>
                    <p style={{ marginBottom: "1rem" }}>We collect the following categories of personal data:</p>
                    <ul style={{ listStyle: "none", lineHeight: 2.2 }}>
                        <li>• <strong>Interest registration data</strong>: name, email address, user type, and any description you provide when requesting access</li>
                        <li>• <strong>Case analysis data</strong>: claim type selections, dates, and narrative text you enter for analysis</li>
                        <li>• <strong>Uploaded documents</strong>: files you upload for triage (parsed in-memory and not retained after the session)</li>
                        <li>• <strong>Technical data</strong>: IP address, browser type, and access logs (collected automatically)</li>
                    </ul>
                </section>

                <section style={{ marginBottom: "3rem" }}>
                    <h2 style={{ fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: "1.2rem", color: "var(--color-text-primary)", marginBottom: "1rem" }}>3. Special Category Data</h2>
                    <div style={{ padding: "1.5rem", border: "1px solid var(--color-error-coral)", borderRadius: "var(--radius-card)", background: "rgba(232,93,93,0.03)", marginBottom: "1rem" }}>
                        <p>
                            Employment tribunal claims may involve <strong>special category data</strong> under Article 9 UK GDPR, including
                            health information (disability discrimination, reasonable adjustments), trade union membership (industrial action claims),
                            racial or ethnic origin, sexual orientation, or religious beliefs.
                        </p>
                        <p style={{ marginTop: "0.75rem" }}>
                            We process special category data only where you have provided it voluntarily for the purpose of receiving
                            legal information about your employment situation. Our lawful basis for this processing is your
                            <strong> explicit consent</strong> (Article 9(2)(a) UK GDPR), given when you submit case details for analysis.
                            You may withdraw consent at any time by contacting <Link href="mailto:dpo@tribunalharness.co.uk" style={{ color: "var(--color-accent-purple)" }}>dpo@tribunalharness.co.uk</Link>.
                        </p>
                    </div>
                </section>

                <section style={{ marginBottom: "3rem" }}>
                    <h2 style={{ fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: "1.2rem", color: "var(--color-text-primary)", marginBottom: "1rem" }}>4. How We Use Your Data</h2>
                    <ul style={{ listStyle: "none", lineHeight: 2.2 }}>
                        <li>• <strong>To provide analysis</strong>: case data is processed to generate structured legal information (lawful basis: consent, Art. 6(1)(a))</li>
                        <li>• <strong>To manage access requests</strong>: registration data is used to notify you of product availability (lawful basis: consent, Art. 6(1)(a))</li>
                        <li>• <strong>To improve the service</strong>: anonymised, aggregated usage patterns may be used for product improvement (lawful basis: legitimate interests, Art. 6(1)(f))</li>
                    </ul>
                </section>

                <section style={{ marginBottom: "3rem" }}>
                    <h2 style={{ fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: "1.2rem", color: "var(--color-text-primary)", marginBottom: "1rem" }}>5. Managed Proxy Architecture & Third-Party Data Processing</h2>
                    <div style={{ padding: "1.5rem", border: "1px solid var(--color-accent-purple)", borderRadius: "var(--radius-card)", background: "rgba(123,107,245,0.03)", marginBottom: "1rem" }}>
                        <p>
                            When you submit case details for analysis, your narrative text and claim information are sent to
                            <strong> Anthropic</strong> (Anthropic PBC, San Francisco, USA) via their API for AI-assisted processing.
                        </p>
                        <p style={{ marginTop: "0.75rem" }}>
                            This constitutes an international data transfer outside the UK. We rely on Anthropic&apos;s commitment
                            to data protection safeguards, including their adherence to the UK International Data Transfer Agreement (IDTA).
                            Anthropic&apos;s commercial API terms state that user inputs are not used for model training.
                        </p>
                        <p style={{ marginTop: "0.75rem" }}>
                            No other third-party processors receive your personal data.
                        </p>
                    </div>
                </section>

                <section style={{ marginBottom: "3rem" }}>
                    <h2 style={{ fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: "1.2rem", color: "var(--color-text-primary)", marginBottom: "1rem" }}>6. Data Retention</h2>
                    <ul style={{ listStyle: "none", lineHeight: 2.2 }}>
                        <li>• <strong>Uploaded documents</strong>: parsed in-memory during the session, then discarded. Not retained.</li>
                        <li>• <strong>Analysis results</strong>: retained for session continuity only. Deleted when the session ends.</li>
                        <li>• <strong>Access request data</strong>: retained until product launch or for a maximum of 12 months, whichever is sooner.</li>
                        <li>• <strong>Technical logs</strong>: retained for a maximum of 30 days for security monitoring purposes.</li>
                    </ul>
                </section>

                <section style={{ marginBottom: "3rem" }}>
                    <h2 style={{ fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: "1.2rem", color: "var(--color-text-primary)", marginBottom: "1rem" }}>7. Your Rights</h2>
                    <p style={{ marginBottom: "1rem" }}>Under UK GDPR, you have the right to:</p>
                    <ul style={{ listStyle: "none", lineHeight: 2.2 }}>
                        <li>• Access your personal data (Art. 15)</li>
                        <li>• Rectify inaccurate data (Art. 16)</li>
                        <li>• Request erasure (&ldquo;right to be forgotten&rdquo;) (Art. 17)</li>
                        <li>• Restrict processing (Art. 18)</li>
                        <li>• Data portability (Art. 20)</li>
                        <li>• Object to processing based on legitimate interests (Art. 21)</li>
                        <li>• Withdraw consent at any time (Art. 7(3))</li>
                    </ul>
                    <p style={{ marginTop: "1rem" }}>
                        To exercise any of these rights, contact <Link href="mailto:dpo@tribunalharness.co.uk" style={{ color: "var(--color-accent-purple)" }}>dpo@tribunalharness.co.uk</Link>.
                        We will respond within one calendar month.
                    </p>
                </section>

                <section style={{ marginBottom: "3rem" }}>
                    <h2 style={{ fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: "1.2rem", color: "var(--color-text-primary)", marginBottom: "1rem" }}>8. Automated Decision-Making</h2>
                    <p>
                        The analysis engine uses AI to identify applicable legal tests and surface relevant authorities.
                        This constitutes AI-assisted information provision, not automated decision-making with legal or similarly
                        significant effects under Article 22 UK GDPR. The tool does not make decisions about your legal rights —
                        it provides structured information to support your own decision-making. You are always free to disregard
                        the tool&apos;s output and seek independent legal advice.
                    </p>
                </section>

                <section style={{ marginBottom: "3rem" }}>
                    <h2 style={{ fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: "1.2rem", color: "var(--color-text-primary)", marginBottom: "1rem" }}>9. Complaints</h2>
                    <p>
                        If you are not satisfied with how we handle your data, you have the right to lodge a complaint with
                        the Information Commissioner&apos;s Office (ICO):
                    </p>
                    <p style={{ marginTop: "0.75rem", fontFamily: "var(--font-mono)", fontSize: "0.8rem" }}>
                        Information Commissioner&apos;s Office<br />
                        Wycliffe House, Water Lane, Wilmslow, Cheshire SK9 5AF<br />
                        <Link href="https://ico.org.uk/make-a-complaint/" style={{ color: "var(--color-accent-purple)" }}>ico.org.uk/make-a-complaint</Link>
                    </p>
                </section>

                {/* P1-C: LSA 2007 legal-information disclaimer */}
                <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.7rem", color: "var(--color-text-secondary)", marginTop: "3rem", textAlign: "center", opacity: 0.6 }}>
                    This tool provides legal information, not legal advice. It does not create a solicitor-client relationship.
                </p>
            </div>
        </div>
    );
}
