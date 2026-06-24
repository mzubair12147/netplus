"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function SignupPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setMessage(null);

        if (password.length < 6) {
            setError("Password must be at least 6 characters.");
            setLoading(false);
            return;
        }

        const supabase = createClient();
        const { error } = await supabase.auth.signUp({ email, password });

        if (error) {
            setError(error.message);
            setLoading(false);
        } else {
            setMessage("Check your email to confirm your account, then sign in.");
            setLoading(false);
        }
    }

    return (
        <div className="auth-wrapper">
            <div className="auth-box">
                <div className="auth-logo">
                    <span className="logo" style={{ justifyContent: "center", fontSize: "1.4rem" }}>
                        Net<span className="logo-dot">Pulse</span>
                    </span>
                </div>
                <h1 className="auth-title">Create account</h1>
                <p className="auth-subtitle">Start monitoring your APIs in minutes</p>

                {error && <div className="alert alert-error" style={{ marginBottom: 20 }}>{error}</div>}
                {message && <div className="alert alert-success" style={{ marginBottom: 20 }}>{message}</div>}

                <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    <div className="form-group">
                        <label className="form-label" htmlFor="email">Email address</label>
                        <input
                            id="email"
                            type="email"
                            className="form-input"
                            placeholder="you@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            autoComplete="email"
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label" htmlFor="password">Password</label>
                        <input
                            id="password"
                            type="password"
                            className="form-input"
                            placeholder="Min. 6 characters"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            autoComplete="new-password"
                        />
                    </div>

                    <button
                        id="signup-submit"
                        type="submit"
                        className="btn btn-primary btn-lg"
                        disabled={loading}
                        style={{ width: "100%", justifyContent: "center", marginTop: 8 }}
                    >
                        {loading ? <><span className="spinner" style={{ width: 16, height: 16 }} /> Creating account…</> : "Create account"}
                    </button>
                </form>

                <div className="divider" />

                <p style={{ textAlign: "center", color: "var(--text-muted)", fontSize: "0.875rem" }}>
                    Already have an account?{" "}
                    <Link href="/login" style={{ color: "var(--accent)", textDecoration: "none" }}>
                        Sign in
                    </Link>
                </p>
            </div>
        </div>
    );
}
