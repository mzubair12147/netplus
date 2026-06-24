"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Activity, ArrowLeft, RefreshCw, AlertTriangle } from "lucide-react";

interface Props {
    error: Error & { digest?: string };
    reset: () => void;
}

export default function Error({ error, reset }: Props) {
    useEffect(() => {
        // Log to console so it's visible in prod debugging
        console.error("[NetPulse] Runtime error:", error);
    }, [error]);

    return (
        <div className="error-page">
            <div className="error-glow error-glow-500" />

            <div className="error-inner">
                {/* Logo */}
                <Link href="/" className="logo" style={{ marginBottom: 40, display: "inline-flex" }}>
                    <Activity size={18} color="var(--accent)" />
                    Net<span className="logo-dot">Pulse</span>
                </Link>

                {/* Icon */}
                <div className="error-icon-wrap">
                    <AlertTriangle size={28} color="var(--red)" />
                </div>

                {/* Code */}
                <div className="error-code" style={{ color: "var(--red)" }}>500</div>

                <div className="error-status-pill error-status-pill-red">
                    <span className="error-status-dot" style={{ background: "var(--red)" }} />
                    unexpected error
                </div>

                <h1 className="error-title">Something went wrong on our end</h1>
                <p className="error-desc">
                    An unexpected error occurred. Our systems are still running — this is likely a
                    one-time glitch. Try refreshing the page.
                </p>

                {/* Error details — only in dev */}
                {process.env.NODE_ENV === "development" && error.message && (
                    <div style={{
                        background: "var(--bg-elevated)",
                        border: "1px solid var(--red)",
                        borderRadius: 8,
                        padding: "12px 16px",
                        marginBottom: 28,
                        maxWidth: 480,
                        width: "100%",
                        textAlign: "left",
                    }}>
                        <div style={{ fontSize: "0.7rem", color: "var(--red)", fontWeight: 600, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                            Error details (dev only)
                        </div>
                        <code style={{ fontFamily: "monospace", fontSize: "0.78rem", color: "var(--text-secondary)", wordBreak: "break-word" }}>
                            {error.message}
                        </code>
                        {error.digest && (
                            <div style={{ marginTop: 6, fontSize: "0.72rem", color: "var(--text-muted)" }}>
                                Digest: {error.digest}
                            </div>
                        )}
                    </div>
                )}

                {/* Actions */}
                <div className="error-actions">
                    <button onClick={reset} className="btn btn-primary">
                        <RefreshCw size={14} />
                        Try again
                    </button>
                    <Link href="/dashboard" className="btn btn-ghost">
                        <ArrowLeft size={14} />
                        Back to Dashboard
                    </Link>
                </div>
            </div>
        </div>
    );
}
