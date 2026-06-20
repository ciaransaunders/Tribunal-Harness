"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const NAV_LINKS = [
    { href: "/how-it-works", label: "How It Works" },
    { href: "/analysis-engine", label: "Analysis" },
    { href: "/documentation", label: "Docs" },
    { href: "/pricing", label: "Pricing" },
    { href: "/about", label: "About" },
];

const TRUST_LINKS = [
    { href: "/security", label: "Security" },
    { href: "/ethics", label: "Ethics" },
    { href: "/methodology", label: "Methodology" },
];

export default function NavBar() {
    const pathname = usePathname();
    const [mobileOpen, setMobileOpen] = useState(false);
    const [trustOpen, setTrustOpen] = useState(false);

    return (
        <nav className="sticky top-4 z-50 mx-4 md:mx-auto max-w-7xl">
            <div className="glass-surface glass-thick flex items-center justify-between px-6 py-4">
                <Link href="/" className="font-serif text-2xl text-white hover:text-purple-400 transition-colors glass-text">
                    Tribunal Harness
                </Link>

                {/* Desktop nav */}
                <div className="hidden md:flex items-center gap-8">
                    {NAV_LINKS.map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={`text-sm font-medium transition-colors glass-text ${pathname === link.href ? "text-purple-400" : "text-gray-300 hover:text-purple-400"
                                }`}
                        >
                            {link.label}
                        </Link>
                    ))}

                    {/* Trust dropdown */}
                    <div
                        style={{ position: "relative" }}
                        onMouseEnter={() => setTrustOpen(true)}
                        onMouseLeave={() => setTrustOpen(false)}
                        onFocus={() => setTrustOpen(true)}
                        onBlur={(e) => {
                            // Close only when focus leaves the whole dropdown group
                            if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
                                setTrustOpen(false);
                            }
                        }}
                        onKeyDown={(e) => {
                            if (e.key === "Escape") {
                                setTrustOpen(false);
                            }
                        }}
                    >
                        <button
                            type="button"
                            className="text-sm font-medium transition-colors text-gray-300 hover:text-purple-400 glass-text"
                            style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}
                            aria-haspopup="true"
                            aria-expanded={trustOpen}
                            onClick={() => setTrustOpen((open) => !open)}
                        >
                            Trust
                            <svg width="10" height="6" viewBox="0 0 10 6" fill="currentColor" style={{ opacity: 0.8, transition: "transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)", transform: trustOpen ? "rotate(180deg)" : "rotate(0deg)" }}>
                                <path d="M0 0l5 6 5-6z" />
                            </svg>
                        </button>

                        {/* Dropdown - Liquid Glass expandable panel style */}
                        <div style={{
                            position: "absolute", top: "calc(100% + 12px)", left: "50%", transform: "translateX(-50%)",
                            minWidth: "160px", zIndex: 100,
                            opacity: trustOpen ? 1 : 0,
                            pointerEvents: trustOpen ? "auto" : "none",
                            transformOrigin: "top center",
                            scale: trustOpen ? "1" : "0.95",
                            transition: "all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)",
                        }} className="glass-surface glass-medium">
                            <div style={{ padding: "0.5rem", display: "flex", flexDirection: "column", gap: "2px" }}>
                                {TRUST_LINKS.map((link) => (
                                    <Link
                                        key={link.href}
                                        href={link.href}
                                        className="glass-text"
                                        style={{
                                            display: "block", padding: "0.6rem 0.75rem", fontSize: "0.85rem",
                                            color: pathname === link.href ? "var(--color-accent-purple)" : "rgba(255,255,255,0.8)",
                                            borderRadius: "8px", transition: "background 0.2s, color 0.2s"
                                        }}
                                        onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(139,92,246,0.15)"; e.currentTarget.style.color = "#fff"; }}
                                        onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = pathname === link.href ? "var(--color-accent-purple)" : "rgba(255,255,255,0.8)"; }}
                                    >
                                        {link.label}
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right side: Blog + CTA + hamburger */}
                <div className="flex items-center gap-6">
                    <Link href="/blog" className="hidden md:block text-gray-300 hover:text-purple-400 transition-colors text-sm font-medium glass-text">
                        Blog
                    </Link>
                    <Link href="/request-access" className="glass-button glass-thin hidden md:block" style={{ padding: "0.5rem 1.25rem", fontSize: "0.85rem", borderRadius: "8px", background: "rgba(139,92,246,0.2)" }}>
                        Request Access
                    </Link>

                    {/* Hamburger — mobile only */}
                    <button
                        className="md:hidden glass-button glass-thin"
                        onClick={() => setMobileOpen(!mobileOpen)}
                        aria-label={mobileOpen ? "Close menu" : "Open menu"}
                        style={{ padding: "6px 8px", color: "white", background: "rgba(255,255,255,0.05)" }}
                    >
                        {mobileOpen ? (
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.5))" }}>
                                <line x1="18" y1="6" x2="6" y2="18" />
                                <line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                        ) : (
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.5))" }}>
                                <line x1="4" y1="6" x2="20" y2="6" />
                                <line x1="4" y1="12" x2="20" y2="12" />
                                <line x1="4" y1="18" x2="20" y2="18" />
                            </svg>
                        )}
                    </button>
                </div>
            </div>

            {/* Mobile menu overlay - expanding glass panel */}
            <div style={{
                position: "absolute", top: "calc(100% + 12px)", left: "0", right: "0",
                display: mobileOpen ? "flex" : "none", flexDirection: "column",
                padding: "2rem 1.5rem", gap: "0",
                transformOrigin: "top center",
                animation: "pourDown 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)",
            }} className="glass-surface glass-thick md:hidden">
                <style>{`
                    @keyframes pourDown {
                        from { opacity: 0; transform: scaleY(0.9) translateY(-10px); }
                        to { opacity: 1; transform: scaleY(1) translateY(0); }
                    }
                `}</style>
                {NAV_LINKS.map((link) => (
                    <Link
                        key={link.href}
                        href={link.href}
                        onClick={() => setMobileOpen(false)}
                        className="glass-text"
                        style={{
                            padding: "1rem 0", fontSize: "1.1rem",
                            color: pathname === link.href ? "var(--color-accent-purple)" : "#fff",
                            borderBottom: "1px solid rgba(255,255,255,0.08)", display: "block"
                        }}
                    >
                        {link.label}
                    </Link>
                ))}

                {/* Trust section in mobile */}
                <div style={{ padding: "1rem 0", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                    <p className="glass-text" style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.15em", color: "rgba(255,255,255,0.5)", marginBottom: "0.75rem" }}>Trust Indicators</p>
                    {TRUST_LINKS.map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            onClick={() => setMobileOpen(false)}
                            className="glass-text"
                            style={{
                                display: "block", padding: "0.5rem 0", fontSize: "1rem",
                                color: pathname === link.href ? "var(--color-accent-purple)" : "rgba(255,255,255,0.8)"
                            }}
                        >
                            {link.label}
                        </Link>
                    ))}
                </div>

                <Link
                    href="/blog"
                    onClick={() => setMobileOpen(false)}
                    className="glass-text"
                    style={{
                        padding: "1rem 0", fontSize: "1.1rem",
                        color: "#fff", borderBottom: "1px solid rgba(255,255,255,0.08)", display: "block"
                    }}
                >
                    Blog
                </Link>

                <Link
                    href="/request-access"
                    onClick={() => setMobileOpen(false)}
                    className="glass-button glass-medium"
                    style={{ marginTop: "2.5rem", textAlign: "center", display: "block", padding: "1rem", background: "rgba(139,92,246,0.2)" }}
                >
                    Request Access
                </Link>
            </div>
        </nav>
    );
}
