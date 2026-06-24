import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Activity, CheckCircle2, Bell, Globe, Zap, Shield, ArrowRight } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "NetPulse — Uptime Monitoring for Developers",
    description: "Know when your API goes down before your users do. Real-time uptime monitoring, instant alerts, and a beautiful public status page.",
};

export default async function LandingPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) redirect("/dashboard");

    return (
        <div className="landing-root">

            {/* ── NAV ── */}
            <nav className="landing-nav">
                <div className="landing-container landing-nav-inner">
                    <Link href="/" className="logo" style={{ fontSize: "1.15rem" }}>
                        <Activity size={18} color="var(--accent)" />
                        Net<span className="logo-dot">Pulse</span>
                    </Link>
                    <div className="landing-nav-links">
                        <a href="#features" className="landing-nav-link">Features</a>
                        <a href="#how-it-works" className="landing-nav-link">How it works</a>
                        <Link href="/login" className="btn btn-ghost btn-sm">Sign in</Link>
                        <Link href="/signup" className="btn btn-primary btn-sm">Get started free</Link>
                    </div>
                </div>
            </nav>

            {/* ── HERO ── */}
            <section className="landing-hero">
                <div className="landing-container">
                    <div className="landing-hero-badge">
                        <span className="live-dot" />
                        Real-time monitoring
                    </div>
                    <h1 className="landing-hero-title">
                        Know when your API goes down<br />
                        <span className="landing-hero-accent">before your users do</span>
                    </h1>
                    <p className="landing-hero-sub">
                        NetPulse checks your endpoints every 60 seconds, detects outages instantly,
                        and sends alerts to email or Slack. Share a live status page with your users.
                        Built by a developer, for developers.
                    </p>
                    <div className="landing-hero-cta">
                        <Link href="/signup" className="btn btn-primary landing-btn-lg">
                            Start monitoring free
                            <ArrowRight size={16} />
                        </Link>
                        <Link href="/login" className="btn btn-ghost landing-btn-lg">
                            Sign in
                        </Link>
                    </div>
                    <p className="landing-hero-note">No credit card required · Free forever for personal use</p>

                    {/* Dashboard preview */}
                    <div className="landing-hero-preview">
                        <div className="landing-preview-bar">
                            <span className="landing-preview-dot" style={{ background: "#ff5f57" }} />
                            <span className="landing-preview-dot" style={{ background: "#febc2e" }} />
                            <span className="landing-preview-dot" style={{ background: "#28c840" }} />
                            <span style={{ flex: 1, textAlign: "center", fontSize: "0.72rem", color: "var(--text-muted)" }}>netpulse.app/dashboard</span>
                        </div>
                        <div className="landing-preview-body">
                            {/* Simulated monitor list */}
                            {[
                                { name: "API Gateway", url: "api.example.com", status: "up", uptime: "99.98%", color: "var(--green)" },
                                { name: "Auth Service", url: "auth.example.com", status: "up", uptime: "100%", color: "var(--green)" },
                                { name: "Payments API", url: "pay.example.com", status: "down", uptime: "97.4%", color: "var(--red)" },
                                { name: "CDN Endpoint", url: "cdn.example.com", status: "up", uptime: "99.99%", color: "var(--green)" },
                            ].map((m) => (
                                <div key={m.name} className="landing-preview-row">
                                    <span className={`status-pill status-${m.status}`} style={{ fontSize: "0.65rem" }}>{m.status}</span>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: 600, fontSize: "0.8rem", color: "var(--text-primary)" }}>{m.name}</div>
                                        <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", fontFamily: "monospace" }}>{m.url}</div>
                                    </div>
                                    <div style={{ fontWeight: 700, fontSize: "0.85rem", color: m.color }}>{m.uptime}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* ── SOCIAL PROOF STRIP ── */}
            <div className="landing-strip">
                <div className="landing-container landing-strip-inner">
                    <div className="landing-stat"><strong>60s</strong><span>check interval</span></div>
                    <div className="landing-stat-divider" />
                    <div className="landing-stat"><strong>99.9%</strong><span>platform uptime</span></div>
                    <div className="landing-stat-divider" />
                    <div className="landing-stat"><strong>&lt; 5s</strong><span>alert delivery</span></div>
                    <div className="landing-stat-divider" />
                    <div className="landing-stat"><strong>90 days</strong><span>history kept</span></div>
                </div>
            </div>

            {/* ── FEATURES ── */}
            <section className="landing-section" id="features">
                <div className="landing-container">
                    <div className="landing-section-header">
                        <h2 className="landing-section-title">Everything you need, nothing you don&apos;t</h2>
                        <p className="landing-section-sub">Production-grade monitoring without the enterprise price tag.</p>
                    </div>
                    <div className="landing-features-grid">
                        {[
                            {
                                icon: <Zap size={20} color="var(--accent)" />,
                                bg: "var(--accent-glow)",
                                title: "Instant outage detection",
                                desc: "HTTP checks every 60 seconds with configurable timeouts. First failure is logged immediately — no waiting.",
                            },
                            {
                                icon: <Bell size={20} color="var(--yellow)" />,
                                bg: "var(--yellow-bg)",
                                title: "Multi-channel alerts",
                                desc: "Email via Resend and Slack/Discord webhooks. Configure as many channels as you need, silence them independently.",
                            },
                            {
                                icon: <Globe size={20} color="var(--green)" />,
                                bg: "var(--green-bg)",
                                title: "Public status page",
                                desc: "A shareable status page at /status/you — no login required. 90-day uptime bars, incident history, live status banner.",
                            },
                            {
                                icon: <Activity size={20} color="var(--blue)" />,
                                bg: "var(--blue-bg)",
                                title: "Latency tracking",
                                desc: "Response time charted over time. Spot performance regressions before they become outages.",
                            },
                            {
                                icon: <Shield size={20} color="var(--red)" />,
                                bg: "var(--red-bg)",
                                title: "Incident management",
                                desc: "Incidents open automatically on N consecutive failures and resolve when the monitor recovers. Full history kept.",
                            },
                            {
                                icon: <CheckCircle2 size={20} color="var(--accent)" />,
                                bg: "var(--accent-glow)",
                                title: "Live dashboard",
                                desc: "Supabase Realtime pushes status changes to your dashboard the moment the worker detects them. No polling needed.",
                            },
                        ].map((f) => (
                            <div key={f.title} className="landing-feature-card">
                                <div className="landing-feature-icon" style={{ background: f.bg }}>{f.icon}</div>
                                <h3 className="landing-feature-title">{f.title}</h3>
                                <p className="landing-feature-desc">{f.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── HOW IT WORKS ── */}
            <section className="landing-section landing-section-alt" id="how-it-works">
                <div className="landing-container">
                    <div className="landing-section-header">
                        <h2 className="landing-section-title">Up and running in 3 minutes</h2>
                        <p className="landing-section-sub">No agents to install. No infrastructure to manage.</p>
                    </div>
                    <div className="landing-steps">
                        {[
                            { n: "1", title: "Add a monitor", desc: "Paste a URL, pick an interval (30s – 24hr), set your expected HTTP status code. Done." },
                            { n: "2", title: "Worker pings your endpoint", desc: "A Node.js worker runs in the cloud, checks your endpoint on schedule, and writes results to Postgres." },
                            { n: "3", title: "Get alerted instantly", desc: "The moment a failure is detected, you get an email or webhook. The live dashboard updates in real time." },
                        ].map((s) => (
                            <div key={s.n} className="landing-step">
                                <div className="landing-step-num">{s.n}</div>
                                <div>
                                    <div className="landing-step-title">{s.title}</div>
                                    <div className="landing-step-desc">{s.desc}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── TECH STACK ── */}
            <section className="landing-section">
                <div className="landing-container" style={{ textAlign: "center" }}>
                    <p className="landing-stack-label">Built with</p>
                    <div className="landing-stack-chips">
                        {["Next.js 16", "TypeScript", "Supabase", "Postgres", "Recharts", "Resend", "Railway", "Vercel"].map((t) => (
                            <span key={t} className="landing-chip">{t}</span>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── CTA FOOTER ── */}
            <section className="landing-cta-section">
                <div className="landing-container" style={{ textAlign: "center" }}>
                    <h2 className="landing-cta-title">Start monitoring in 60 seconds</h2>
                    <p className="landing-cta-sub">Free to use. No credit card. No vendor lock-in.</p>
                    <Link href="/signup" className="btn btn-primary landing-btn-lg">
                        Create free account
                        <ArrowRight size={16} />
                    </Link>
                </div>
            </section>

            {/* ── FOOTER ── */}
            <footer className="landing-footer">
                <div className="landing-container landing-footer-inner">
                    <Link href="/" className="logo" style={{ fontSize: "0.95rem", opacity: 0.7 }}>
                        <Activity size={14} color="var(--accent)" />
                        Net<span className="logo-dot">Pulse</span>
                    </Link>
                    <p style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>
                        Open-source uptime monitoring · Built for developers
                    </p>
                    <div style={{ display: "flex", gap: 16 }}>
                        <Link href="/login" style={{ color: "var(--text-muted)", fontSize: "0.8rem", textDecoration: "none" }}>Sign in</Link>
                        <Link href="/signup" style={{ color: "var(--text-muted)", fontSize: "0.8rem", textDecoration: "none" }}>Sign up</Link>
                    </div>
                </div>
            </footer>

        </div>
    );
}
