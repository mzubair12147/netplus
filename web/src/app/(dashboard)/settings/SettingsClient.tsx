"use client";

import { useState } from "react";
import { Trash2, Bell, Copy, Check } from "lucide-react";
import { formatDate } from "@/lib/utils";

type Channel = {
    id: string; type: string; destination: string;
    is_active: boolean; created_at: string;
};

interface Props {
    initialChannels: Channel[];
    userId: string;
    userEmail: string;
}

export default function SettingsClient({ initialChannels, userId, userEmail }: Props) {
    const [channels, setChannels] = useState<Channel[]>(initialChannels);
    const [type, setType] = useState<"email" | "webhook">("email");
    const [destination, setDestination] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [copied, setCopied] = useState(false);

    const statusPageUrl = typeof window !== "undefined"
        ? `${window.location.origin}/status/${userId}`
        : `/status/${userId}`;

    async function handleAdd(e: React.FormEvent) {
        e.preventDefault();
        setSaving(true);
        setError(null);

        const res = await fetch("/api/alert-channels", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ type, destination }),
        });
        const data = await res.json();
        if (!res.ok) {
            setError(data.error);
        } else {
            setChannels((prev) => [data, ...prev]);
            setDestination("");
        }
        setSaving(false);
    }

    async function handleDelete(id: string) {
        await fetch(`/api/alert-channels/${id}`, { method: "DELETE" });
        setChannels((prev) => prev.filter((c) => c.id !== id));
    }

    async function handleToggle(channel: Channel) {
        const res = await fetch(`/api/alert-channels/${channel.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ is_active: !channel.is_active }),
        });
        if (res.ok) {
            const updated = await res.json();
            setChannels((prev) => prev.map((c) => c.id === channel.id ? updated : c));
        }
    }

    function maskDestination(dest: string, type: string): string {
        if (type === "email") {
            const [local, domain] = dest.split("@");
            if (!local || !domain) return dest;
            return `${local.slice(0, 2)}****@${domain}`;
        }
        try {
            const u = new URL(dest);
            return `${u.hostname}/****`;
        } catch { return "****"; }
    }

    async function copyStatusUrl() {
        await navigator.clipboard.writeText(statusPageUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }

    return (
        <>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Settings</h1>
                    <p className="page-subtitle">Manage alert channels and your public status page</p>
                </div>
            </div>

            {/* Public Status Page */}
            <div className="card" style={{ marginBottom: 24 }}>
                <h2 style={{ fontSize: "1rem", marginBottom: 4 }}>Public Status Page</h2>
                <p style={{ fontSize: "0.875rem", color: "var(--text-muted)", marginBottom: 16 }}>
                    Share this URL with your users to show real-time uptime status — no login required.
                </p>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <code style={{ flex: 1, background: "var(--bg-elevated)", padding: "9px 12px", borderRadius: 6, fontSize: "0.8rem", color: "var(--text-secondary)", border: "1px solid var(--border)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {statusPageUrl}
                    </code>
                    <button className="btn btn-ghost btn-sm" onClick={copyStatusUrl}>
                        {copied ? <><Check size={12} /> Copied!</> : <><Copy size={12} /> Copy</>}
                    </button>
                    <a href={`/status/${userId}`} target="_blank" className="btn btn-ghost btn-sm">
                        View
                    </a>
                </div>
            </div>

            {/* Alert Channels */}
            <div className="card" style={{ marginBottom: 24 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
                    <Bell size={16} color="var(--accent)" />
                    <h2 style={{ fontSize: "1rem", margin: 0 }}>Alert Channels</h2>
                </div>
                <p style={{ fontSize: "0.875rem", color: "var(--text-muted)", marginBottom: 20 }}>
                    You&apos;ll be notified on these channels when an incident opens or resolves.
                </p>

                {/* Add form */}
                <form onSubmit={handleAdd} style={{ display: "flex", gap: 10, marginBottom: 24, flexWrap: "wrap" }}>
                    <select
                        className="form-input form-select"
                        value={type}
                        onChange={(e) => setType(e.target.value as "email" | "webhook")}
                        style={{ width: 140 }}
                    >
                        <option value="email">Email</option>
                        <option value="webhook">Webhook</option>
                    </select>
                    <input
                        type={type === "email" ? "email" : "url"}
                        className="form-input"
                        placeholder={type === "email" ? "you@example.com" : "https://hooks.slack.com/..."}
                        value={destination}
                        onChange={(e) => setDestination(e.target.value)}
                        required
                        style={{ flex: 1, minWidth: 200 }}
                    />
                    <button type="submit" className="btn btn-primary" disabled={saving}>
                        {saving ? "Adding…" : "Add Channel"}
                    </button>
                </form>

                {error && <div className="alert alert-error" style={{ marginBottom: 16 }}>{error}</div>}

                {channels.length === 0 ? (
                    <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>No alert channels configured.</p>
                ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        {channels.map((ch) => (
                            <div
                                key={ch.id}
                                style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", background: "var(--bg-elevated)", borderRadius: 8, border: "1px solid var(--border)" }}
                            >
                                <span className={`badge ${ch.type === "email" ? "badge-blue" : "badge-yellow"}`}>{ch.type}</span>
                                <span className="mono" style={{ flex: 1, fontSize: "0.85rem", color: "var(--text-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                    {maskDestination(ch.destination, ch.type)}
                                </span>
                                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{formatDate(ch.created_at)}</span>
                                <button
                                    className={`btn btn-sm ${ch.is_active ? "btn-ghost" : "btn-primary"}`}
                                    onClick={() => handleToggle(ch)}
                                    style={{ minWidth: 60 }}
                                >
                                    {ch.is_active ? "Pause" : "Enable"}
                                </button>
                                <button
                                    className="btn btn-danger btn-sm"
                                    onClick={() => handleDelete(ch.id)}
                                    title="Delete channel"
                                >
                                    <Trash2 size={13} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Account */}
            <div className="card">
                <h2 style={{ fontSize: "1rem", marginBottom: 16 }}>Account</h2>
                <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                    <div style={{ width: 36, height: 36, borderRadius: "50%", background: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "0.875rem" }}>
                        {userEmail.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <div style={{ fontWeight: 500 }}>{userEmail}</div>
                        <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Your account email</div>
                    </div>
                </div>
            </div>
        </>
    );
}
