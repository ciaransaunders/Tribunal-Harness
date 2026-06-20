"use client";

import { useState } from "react";

export default function SchemaBuilderPage() {
    const [fields, setFields] = useState<{ label: string; type: string; required: boolean }[]>([]);
    const [newLabel, setNewLabel] = useState("");
    const [newType, setNewType] = useState("text");

    const addField = () => {
        if (!newLabel) return;
        setFields([...fields, { label: newLabel, type: newType, required: false }]);
        setNewLabel(""); setNewType("text");
    };

    return (
        <div style={{ paddingTop: "10rem" }}>
            <div className="page-section">
                <span className="text-subhead">CUSTOM</span>
                <h1 style={{ fontFamily: "var(--font-serif)", fontSize: "3rem", marginBottom: "1.5rem" }}>Schema Builder</h1>
                <p className="text-lead" style={{ marginBottom: "3rem" }}>
                    Build custom claim schemas for claim types not yet in the system. Define fields, set types, and export as JSON for integration.
                </p>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem" }}>
                    <div className="interface-card">
                        <h3 style={{ fontFamily: "var(--font-serif)", fontSize: "1.5rem", marginBottom: "1.5rem" }}>Add Field</h3>
                        <div className="input-group">
                            <label className="input-label">Field Label</label>
                            <input className="input-field" value={newLabel} onChange={(e) => setNewLabel(e.target.value)} placeholder="e.g., Date of Notice" />
                        </div>
                        <div className="input-group">
                            <label className="input-label">Field Type</label>
                            <select className="input-field" value={newType} onChange={(e) => setNewType(e.target.value)}>
                                <option value="text">Text</option>
                                <option value="date">Date</option>
                                <option value="textarea">Text Area</option>
                                <option value="select">Select</option>
                                <option value="boolean">Yes/No</option>
                                <option value="number">Number</option>
                            </select>
                        </div>
                        <button className="btn-primary" onClick={addField}>Add Field</button>
                    </div>

                    <div className="interface-card">
                        <h3 style={{ fontFamily: "var(--font-serif)", fontSize: "1.5rem", marginBottom: "1.5rem" }}>Schema Preview ({fields.length} fields)</h3>
                        {fields.length === 0 ? (
                            <p style={{ color: "var(--color-text-secondary)", fontSize: "0.85rem" }}>No fields added yet.</p>
                        ) : (
                            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                                {fields.map((f, i) => (
                                    <div key={i} style={{ padding: "0.75rem", border: "1px solid var(--color-border-subtle)", borderRadius: "6px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                        <span>{f.label}</span>
                                        <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "var(--color-text-secondary)" }}>{f.type}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                        {fields.length > 0 && (
                            <pre style={{ marginTop: "1.5rem", padding: "1rem", background: "rgba(255,255,255,0.02)", borderRadius: "6px", fontSize: "0.75rem", fontFamily: "var(--font-mono)", overflow: "auto", maxHeight: "300px", color: "var(--color-text-secondary)" }}>
                                {JSON.stringify({ fields }, null, 2)}
                            </pre>
                        )}
                    </div>
                </div>

                {/* AUDIT FIX: Added disclaimer for user-created schemas */}
                <div style={{ marginTop: "2rem", padding: "1.5rem", border: "1px solid #fbbf24", borderRadius: "var(--radius-card)", background: "rgba(251,191,36,0.03)" }}>
                    <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "#fbbf24", fontWeight: 600, marginBottom: "0.5rem" }}>IMPORTANT</p>
                    <p style={{ fontSize: "0.85rem", color: "var(--color-text-secondary)", lineHeight: 1.7 }}>
                        Custom schemas are user-defined and are not verified against statute. They do not carry the same trust guarantees
                        as the built-in claim type schemas, which are curated and maintained by a qualified legal professional. Use custom
                        schemas for exploratory purposes only.
                    </p>
                </div>

                {/* P1-C: LSA 2007 legal-information disclaimer */}
                <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.7rem", color: "var(--color-text-secondary)", marginTop: "3rem", textAlign: "center", opacity: 0.6 }}>
                    This tool provides legal information, not legal advice. It does not create a solicitor-client relationship.
                </p>
            </div>
        </div>
    );
}
