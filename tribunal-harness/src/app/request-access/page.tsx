"use client";

import { useState } from "react";
import Link from "next/link";

export default function RequestAccessPage() {
    const [form, setForm] = useState({ name: "", email: "", user_type: "lip", description: "" });
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        try {
            const res = await fetch("/api/request-access", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form),
            });
            const data = await res.json();
            if (data.success) setSubmitted(true);
            else setError(data.error || "Something went wrong.");
        } catch {
            setError("Network error. Please try again.");
        }
    };

    if (submitted) {
        return (
            <div className="page-section" style={{ paddingTop: "10rem", maxWidth: "600px", textAlign: "center" }}>
                <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>✓</div>
                <h1 style={{ fontFamily: "var(--font-serif)", fontSize: "2.5rem", marginBottom: "1rem" }}>Thank you.</h1>
                <p className="text-lead" style={{ margin: "0 auto" }}>
                    We&apos;ll be in touch when Tribunal Harness launches. You&apos;ll be among the first to know.
                </p>
            </div>
        );
    }

    return (
        <div className="page-section" style={{ paddingTop: "10rem", maxWidth: "600px" }}>
            <span className="text-subhead">EARLY ACCESS</span>
            <h1 style={{ fontFamily: "var(--font-serif)", fontSize: "3rem", marginBottom: "1.5rem" }}>Request Access</h1>
            <p className="text-lead" style={{ marginBottom: "3rem" }}>
                Tribunal Harness is currently in development. Register your interest to be notified when it launches.
            </p>

            <form onSubmit={handleSubmit} className="interface-card">
                <div className="input-group">
                    <label className="input-label">Name</label>
                    <input className="input-field" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                </div>
                <div className="input-group">
                    <label className="input-label">Email</label>
                    <input className="input-field" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                </div>
                <div className="input-group">
                    <label className="input-label">I am a...</label>
                    <select className="input-field" value={form.user_type} onChange={(e) => setForm({ ...form, user_type: e.target.value })}>
                        <option value="lip">Litigant-in-Person</option>
                        <option value="solicitor">Solicitor</option>
                        <option value="legal_aid">Legal Aid Provider</option>
                        <option value="researcher">Researcher</option>
                        <option value="other">Other</option>
                    </select>
                </div>
                <div className="input-group">
                    <label className="input-label">Tell us about your situation (optional)</label>
                    <textarea className="input-field" rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} style={{ resize: "vertical" }} />
                </div>
                <div className="input-group" style={{ display: "flex", gap: "0.75rem", alignItems: "start", marginTop: "1.5rem" }}>
                    <input type="checkbox" required id="privacy_consent" style={{ marginTop: "0.25rem" }} />
                    <label htmlFor="privacy_consent" style={{ fontSize: "0.8rem", color: "var(--color-text-secondary)", lineHeight: 1.5 }}>
                        {/* D1.3 FIX: Consent now covers both Privacy Policy and Terms of Use */}
                        I agree to the <Link href="/privacy" style={{ color: "var(--color-accent-purple)", textDecoration: "underline" }}>Privacy Policy</Link> and <Link href="/terms" style={{ color: "var(--color-accent-purple)", textDecoration: "underline" }}>Terms of Use</Link>, and consent to my data being processed to manage this access request.
                    </label>
                </div>
                {error && <p style={{ color: "var(--color-error-coral)", fontSize: "0.85rem", marginBottom: "1rem" }}>{error}</p>}
                <button type="submit" className="btn-primary">Submit Request</button>
            </form>

            {/* P1-C: LSA 2007 legal-information disclaimer */}
            <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.7rem", color: "var(--color-text-secondary)", marginTop: "2rem", textAlign: "center", opacity: 0.6 }}>
                This tool provides legal information, not legal advice. It does not create a solicitor-client relationship.
            </p>
        </div>
    );
}
