"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { User, Mail, Lock, ArrowRight, CheckCircle2 } from "lucide-react";

export default function SignupPage() {
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [done, setDone] = useState<"email" | "auto" | null>(null);
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        setError(null);

        if (fullName.trim().length < 2) {
            setError("Please enter your full name.");
            setLoading(false);
            return;
        }
        if (password.length < 8) {
            setError("Password must be at least 8 characters.");
            setLoading(false);
            return;
        }

        const supabase = createClient();
        const { data, error: signupError } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: { full_name: fullName.trim() },
            },
        });

        if (signupError) {
            setError(signupError.message);
            setLoading(false);
            return;
        }

        // Supabase returns a session immediately if email confirm is disabled
        if (data.session) {
            setDone("auto");
            // Small delay so user sees the success state, then redirect
            setTimeout(() => { window.location.href = "/dashboard"; }, 1200);
        } else {
            setDone("email");
        }
        setLoading(false);
    }

    if (done === "auto") {
        return (
            <div className="auth-wrapper">
                <div className="auth-box" style={{ textAlign: "center" }}>
                    <div style={{ width: 52, height: 52, borderRadius: "50%", background: "var(--green-bg)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
                        <CheckCircle2 size={26} color="var(--green)" />
                    </div>
                    <h1 style={{ fontSize: "1.25rem", marginBottom: 8 }}>You&apos;re in, {fullName.split(" ")[0]}!</h1>
                    <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>Taking you to your dashboard…</p>
                </div>
            </div>
        );
    }

    if (done === "email") {
        return (
            <div className="auth-wrapper">
                <div className="auth-box" style={{ textAlign: "center" }}>
                    <div style={{ width: 52, height: 52, borderRadius: "50%", background: "var(--blue-bg)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
                        <Mail size={26} color="var(--blue)" />
                    </div>
                    <h1 style={{ fontSize: "1.25rem", marginBottom: 8 }}>Check your inbox</h1>
                    <p style={{ color: "var(--text-muted)", fontSize: "0.875rem", marginBottom: 20 }}>
                        We sent a confirmation link to <strong style={{ color: "var(--text-primary)" }}>{email}</strong>.
                        Click it to activate your account, then sign in.
                    </p>
                    <Link href="/login" className="btn btn-ghost" style={{ justifyContent: "center", width: "100%" }}>
                        Go to login
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="auth-wrapper">
            <div className="auth-box auth-box-wide">
                <div className="auth-logo">
                    <span className="logo" style={{ justifyContent: "center", fontSize: "1.4rem" }}>
                        Net<span className="logo-dot">Pulse</span>
                    </span>
                </div>
                <h1 className="auth-title">Create your account</h1>
                <p className="auth-subtitle">Monitor your APIs and get alerted before your users do</p>

                {error && (
                    <div className="alert alert-error" style={{ marginBottom: 20 }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    {/* Full name */}
                    <div className="form-group">
                        <label className="form-label" htmlFor="full-name">Full name</label>
                        <div className="input-group">
                            <span className="input-icon"><User size={14} /></span>
                            <input
                                id="full-name"
                                type="text"
                                className="form-input"
                                placeholder="Jane Smith"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                required
                                autoComplete="name"
                                autoFocus
                            />
                        </div>
                    </div>

                    {/* Email */}
                    <div className="form-group">
                        <label className="form-label" htmlFor="email">Work email</label>
                        <div className="input-group">
                            <span className="input-icon"><Mail size={14} /></span>
                            <input
                                id="email"
                                type="email"
                                className="form-input"
                                placeholder="you@company.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                autoComplete="email"
                            />
                        </div>
                    </div>

                    {/* Password */}
                    <div className="form-group">
                        <label className="form-label" htmlFor="password">Password</label>
                        <div className="input-group">
                            <span className="input-icon"><Lock size={14} /></span>
                            <input
                                id="password"
                                type="password"
                                className="form-input"
                                placeholder="At least 8 characters"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                autoComplete="new-password"
                            />
                        </div>
                        {/* Inline strength hint */}
                        {password.length > 0 && (
                            <span className="form-hint" style={{ color: password.length >= 8 ? "var(--green)" : "var(--text-muted)" }}>
                                {password.length >= 8 ? "✓ Strong enough" : `${8 - password.length} more characters needed`}
                            </span>
                        )}
                    </div>

                    <button
                        id="signup-submit"
                        type="submit"
                        className="btn btn-primary btn-lg"
                        disabled={loading}
                        style={{ width: "100%", justifyContent: "center", marginTop: 6 }}
                    >
                        {loading
                            ? <><span className="spinner" style={{ width: 16, height: 16 }} /> Creating account…</>
                            : <><ArrowRight size={16} /> Create account</>}
                    </button>
                </form>

                <div className="divider" />

                <p style={{ textAlign: "center", color: "var(--text-muted)", fontSize: "0.875rem" }}>
                    Already have an account?{" "}
                    <Link href="/login" style={{ color: "var(--accent)", textDecoration: "none", fontWeight: 500 }}>
                        Sign in
                    </Link>
                </p>
            </div>
        </div>
    );
}
