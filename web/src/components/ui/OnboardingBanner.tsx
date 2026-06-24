"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { X, Globe, Bell, Share2, ArrowRight } from "lucide-react";

const STORAGE_KEY = "netpulse_onboarding_dismissed";

const STEPS = [
    {
        icon: <Globe size={20} color="var(--accent)" />,
        title: "Add your first monitor",
        desc: "Paste any HTTP or HTTPS URL. NetPulse will check it on your chosen interval and alert you the moment it goes down.",
        cta: { label: "Create a monitor", href: "/monitors/new" },
    },
    {
        icon: <Bell size={20} color="var(--yellow)" />,
        title: "Set up alert channels",
        desc: "Add an email or Slack/Discord webhook so you're notified instantly when an incident opens or resolves.",
        cta: { label: "Go to Settings", href: "/settings" },
    },
    {
        icon: <Share2 size={20} color="var(--green)" />,
        title: "Share your status page",
        desc: "Your public status page is live at /status/you — share it with users so they can check uptime themselves.",
        cta: { label: "View status page", href: "/settings" },
    },
];

export default function OnboardingBanner() {
    const [step, setStep] = useState(0);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        // Only show if not previously dismissed
        const dismissed = typeof window !== "undefined"
            ? localStorage.getItem(STORAGE_KEY)
            : "true";
        if (!dismissed) setVisible(true);
    }, []);

    function dismiss() {
        localStorage.setItem(STORAGE_KEY, "1");
        setVisible(false);
    }

    if (!visible) return null;

    const current = STEPS[step]!;
    const isLast = step === STEPS.length - 1;

    return (
        <div
            style={{
                background: "linear-gradient(135deg, rgba(99,102,241,0.08) 0%, rgba(99,102,241,0.04) 100%)",
                border: "1px solid rgba(99,102,241,0.2)",
                borderRadius: 12,
                padding: "20px 24px",
                marginBottom: 24,
                position: "relative",
            }}
        >
            {/* Dismiss */}
            <button
                onClick={dismiss}
                style={{ position: "absolute", top: 14, right: 14, background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: 4, lineHeight: 1 }}
                title="Dismiss"
            >
                <X size={15} />
            </button>

            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, background: "var(--accent-glow)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    {current.icon}
                </div>
                <div>
                    <div style={{ fontSize: "0.68rem", fontWeight: 600, color: "var(--accent)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 2 }}>
                        Getting started · Step {step + 1} of {STEPS.length}
                    </div>
                    <div style={{ fontWeight: 600, fontSize: "0.9375rem" }}>{current.title}</div>
                </div>
            </div>

            <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem", marginBottom: 18, lineHeight: 1.6, maxWidth: 540 }}>
                {current.desc}
            </p>

            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <Link href={current.cta.href} className="btn btn-primary btn-sm">
                    {current.cta.label}
                    <ArrowRight size={13} />
                </Link>

                {!isLast && (
                    <button className="btn btn-ghost btn-sm" onClick={() => setStep((s) => s + 1)}>
                        Next tip →
                    </button>
                )}

                <button onClick={dismiss} style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", fontSize: "0.78rem", padding: "4px 8px" }}>
                    Skip setup guide
                </button>
            </div>

            {/* Step dots */}
            <div style={{ display: "flex", gap: 6, marginTop: 16 }}>
                {STEPS.map((_, i) => (
                    <button
                        key={i}
                        onClick={() => setStep(i)}
                        style={{
                            width: i === step ? 20 : 6,
                            height: 6,
                            borderRadius: 3,
                            background: i === step ? "var(--accent)" : "var(--border)",
                            border: "none",
                            cursor: "pointer",
                            transition: "all 0.2s",
                            padding: 0,
                        }}
                    />
                ))}
            </div>
        </div>
    );
}
