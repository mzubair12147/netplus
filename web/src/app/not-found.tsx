import Link from "next/link";
import { Activity, ArrowLeft, Home } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "404 — Page Not Found · NetPulse",
    description: "The page you're looking for doesn't exist.",
};

export default function NotFound() {
    return (
        <div className="error-page">
            <div className="error-glow error-glow-404" />

            <div className="error-inner">
                {/* Logo */}
                <Link href="/" className="logo" style={{ marginBottom: 40, display: "inline-flex" }}>
                    <Activity size={18} color="var(--accent)" />
                    Net<span className="logo-dot">Pulse</span>
                </Link>

                {/* Code */}
                <div className="error-code">404</div>

                {/* Status pill — mirrors the monitor status pill style */}
                <div className="error-status-pill">
                    <span className="error-status-dot" />
                    page not found
                </div>

                <h1 className="error-title">You&apos;ve gone off the map</h1>
                <p className="error-desc">
                    The page you&apos;re looking for doesn&apos;t exist, was moved, or maybe the URL has a typo.
                    Either way, our monitors checked and it&apos;s definitely not here.
                </p>

                {/* Actions */}
                <div className="error-actions">
                    <Link href="/dashboard" className="btn btn-primary">
                        <Home size={14} />
                        Go to Dashboard
                    </Link>
                    <Link href="/" className="btn btn-ghost">
                        <ArrowLeft size={14} />
                        Back to Home
                    </Link>
                </div>

                {/* Uptime bar decoration — purely visual */}
                <div className="error-uptime-bar">
                    {Array.from({ length: 90 }, (_, i) => (
                        <div
                            key={i}
                            className="error-bar-segment"
                            style={{
                                background: i === 89
                                    ? "var(--red)"       // last one is "down" (this page)
                                    : i > 85
                                    ? "var(--border)"    // recent unknowns
                                    : "var(--green)",
                                opacity: i === 89 ? 1 : i > 85 ? 0.4 : 0.6,
                            }}
                        />
                    ))}
                </div>
                <p className="error-bar-label">90-day uptime of this page: 0%</p>
            </div>
        </div>
    );
}
