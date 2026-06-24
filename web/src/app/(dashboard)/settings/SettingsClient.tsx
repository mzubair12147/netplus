"use client";

import { useState } from "react";
import { Trash2, Bell, Copy, Check, Key, Plus, Eye, EyeOff, Globe, AlertTriangle } from "lucide-react";
import { formatDate } from "@/lib/utils";
import Modal from "@/components/ui/Modal";
import { useToast } from "@/components/ui/ToastProvider";
import { createClient } from "@/lib/supabase/client";

type Channel = { id: string; type: string; destination: string; is_active: boolean; created_at: string; };
type ApiKey = { id: string; name: string; key_prefix: string; last_used_at: string | null; created_at: string; };

interface Props {
    initialChannels: Channel[];
    initialApiKeys: ApiKey[];
    userId: string;
    userEmail: string;
    initialCompanyName: string;
    initialStatusDesc: string;
    fullName: string;
}

export default function SettingsClient({
    initialChannels, initialApiKeys, userId, userEmail,
    initialCompanyName, initialStatusDesc, fullName,
}: Props) {
    const { toast } = useToast();

    // ── Alert channels ──
    const [channels, setChannels] = useState<Channel[]>(initialChannels);
    const [chType, setChType] = useState<"email" | "webhook">("email");
    const [destination, setDestination] = useState("");
    const [chError, setChError] = useState<string | null>(null);
    const [chSaving, setChSaving] = useState(false);
    const [deleteChannel, setDeleteChannel] = useState<Channel | null>(null);
    const [deletingCh, setDeletingCh] = useState(false);

    // ── Status page customization ──
    const [companyName, setCompanyName] = useState(initialCompanyName);
    const [statusDesc, setStatusDesc] = useState(initialStatusDesc);
    const [copied, setCopied] = useState(false);
    const [savingMeta, setSavingMeta] = useState(false);
    const statusPageUrl = typeof window !== "undefined" ? `${window.location.origin}/status/${userId}` : `/status/${userId}`;

    // ── API keys ──
    const [apiKeys, setApiKeys] = useState<ApiKey[]>(initialApiKeys);
    const [newKeyName, setNewKeyName] = useState("");
    const [addingKey, setAddingKey] = useState(false);
    const [revealedKey, setRevealedKey] = useState<string | null>(null);
    const [revealVisible, setRevealVisible] = useState(false);
    const [revokeKey, setRevokeKey] = useState<ApiKey | null>(null);
    const [revokingKey, setRevokingKey] = useState(false);

    // ─── Alert channel handlers ───────────────────────────────────────────────
    async function handleAddChannel(e: React.FormEvent) {
        e.preventDefault();
        setChSaving(true); setChError(null);
        const res = await fetch("/api/alert-channels", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ type: chType, destination }),
        });
        const data = await res.json();
        if (!res.ok) { setChError(data.error); toast(data.error ?? "Failed to add channel", "error"); }
        else { setChannels((p) => [data, ...p]); setDestination(""); toast(`${chType === "email" ? "Email" : "Webhook"} channel added`, "success"); }
        setChSaving(false);
    }

    async function confirmDeleteChannel() {
        if (!deleteChannel) return;
        setDeletingCh(true);
        const res = await fetch(`/api/alert-channels/${deleteChannel.id}`, { method: "DELETE" });
        if (res.ok) { setChannels((p) => p.filter((c) => c.id !== deleteChannel.id)); toast("Channel deleted", "success"); }
        else toast("Failed to delete channel", "error");
        setDeletingCh(false); setDeleteChannel(null);
    }

    async function handleToggleChannel(ch: Channel) {
        const res = await fetch(`/api/alert-channels/${ch.id}`, {
            method: "PATCH", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ is_active: !ch.is_active }),
        });
        if (res.ok) {
            const updated = await res.json();
            setChannels((p) => p.map((c) => c.id === ch.id ? updated : c));
            toast(updated.is_active ? "Channel enabled" : "Channel paused", "info");
        } else toast("Failed to update channel", "error");
    }

    // ─── Status page customization ────────────────────────────────────────────
    async function handleSaveMeta(e: React.FormEvent) {
        e.preventDefault();
        setSavingMeta(true);
        const supabase = createClient();
        const { error } = await supabase.auth.updateUser({
            data: { company_name: companyName.trim(), status_page_desc: statusDesc.trim() },
        });
        if (error) toast(error.message, "error");
        else toast("Status page settings saved", "success");
        setSavingMeta(false);
    }

    async function copyStatusUrl() {
        await navigator.clipboard.writeText(statusPageUrl);
        setCopied(true); toast("URL copied!", "success");
        setTimeout(() => setCopied(false), 2000);
    }

    // ─── API key handlers ─────────────────────────────────────────────────────
    async function handleAddKey(e: React.FormEvent) {
        e.preventDefault();
        if (!newKeyName.trim()) return;
        setAddingKey(true);
        const res = await fetch("/api/keys", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: newKeyName.trim() }),
        });
        const data = await res.json();
        if (!res.ok) { toast(data.error ?? "Failed to generate key", "error"); }
        else {
            const { raw_key, ...keyMeta } = data;
            setApiKeys((p) => [keyMeta, ...p]);
            setRevealedKey(raw_key);
            setRevealVisible(true);
            setNewKeyName("");
            toast("API key created — copy it now, it won't be shown again", "info");
        }
        setAddingKey(false);
    }

    async function confirmRevokeKey() {
        if (!revokeKey) return;
        setRevokingKey(true);
        const res = await fetch(`/api/keys/${revokeKey.id}`, { method: "DELETE" });
        if (res.ok) { setApiKeys((p) => p.filter((k) => k.id !== revokeKey.id)); toast("API key revoked", "success"); }
        else toast("Failed to revoke key", "error");
        setRevokingKey(false); setRevokeKey(null);
    }

    function maskDest(dest: string, type: string) {
        if (type === "email") {
            const [l, d] = dest.split("@");
            return l && d ? `${l.slice(0, 2)}****@${d}` : dest;
        }
        try { return `${new URL(dest).hostname}/****`; } catch { return "****"; }
    }

    return (
        <>
            {/* Modals */}
            <Modal open={!!deleteChannel} onClose={() => setDeleteChannel(null)} onConfirm={confirmDeleteChannel} loading={deletingCh}
                title="Delete alert channel" confirmLabel="Delete" confirmVariant="danger"
                body={<>Remove <strong>{deleteChannel?.type} → {deleteChannel ? maskDest(deleteChannel.destination, deleteChannel.type) : ""}</strong>? You won&apos;t receive alerts on this channel anymore.</>} />
            <Modal open={!!revokeKey} onClose={() => setRevokeKey(null)} onConfirm={confirmRevokeKey} loading={revokingKey}
                title="Revoke API key" confirmLabel="Revoke" confirmVariant="danger"
                body={<>Revoking <strong>{revokeKey?.name}</strong> will immediately break any integrations using it. This cannot be undone.</>} />

            <div className="page-header">
                <div>
                    <h1 className="page-title">Settings</h1>
                    <p className="page-subtitle">Alert channels, status page, and API access</p>
                </div>
            </div>

            {/* ── Status Page Customization ── */}
            <div className="card" style={{ marginBottom: 24 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                    <Globe size={16} color="var(--accent)" />
                    <h2 style={{ fontSize: "1rem", margin: 0 }}>Public Status Page</h2>
                </div>
                <p style={{ fontSize: "0.875rem", color: "var(--text-muted)", marginBottom: 20 }}>
                    Customise what your visitors see. Share the link below — no login required.
                </p>

                {/* URL row */}
                <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 20 }}>
                    <code style={{ flex: 1, background: "var(--bg-elevated)", padding: "9px 12px", borderRadius: 6, fontSize: "0.8rem", color: "var(--text-secondary)", border: "1px solid var(--border)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {statusPageUrl}
                    </code>
                    <button className="btn btn-ghost btn-sm" onClick={copyStatusUrl}>
                        {copied ? <><Check size={12} /> Copied!</> : <><Copy size={12} /> Copy</>}
                    </button>
                    <a href={`/status/${userId}`} target="_blank" className="btn btn-ghost btn-sm">View</a>
                </div>

                {/* Meta edit form */}
                <form onSubmit={handleSaveMeta} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    <div className="form-group">
                        <label className="form-label" htmlFor="company-name">Company / project name</label>
                        <input id="company-name" type="text" className="form-input" placeholder="Acme Corp" value={companyName}
                            onChange={(e) => setCompanyName(e.target.value)} maxLength={60} />
                        <span className="form-hint">Displayed in the status page header instead of &quot;NetPulse Status&quot;</span>
                    </div>
                    <div className="form-group">
                        <label className="form-label" htmlFor="status-desc">Description</label>
                        <input id="status-desc" type="text" className="form-input" placeholder="Real-time status for Acme services" value={statusDesc}
                            onChange={(e) => setStatusDesc(e.target.value)} maxLength={120} />
                    </div>
                    <button type="submit" className="btn btn-primary btn-sm" disabled={savingMeta} style={{ alignSelf: "flex-start" }}>
                        {savingMeta ? <><span className="spinner" style={{ width: 12, height: 12 }} /> Saving…</> : "Save settings"}
                    </button>
                </form>
            </div>

            {/* ── Alert Channels ── */}
            <div className="card" style={{ marginBottom: 24 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                    <Bell size={16} color="var(--yellow)" />
                    <h2 style={{ fontSize: "1rem", margin: 0 }}>Alert Channels</h2>
                </div>
                <p style={{ fontSize: "0.875rem", color: "var(--text-muted)", marginBottom: 20 }}>
                    Notified when an incident opens or resolves.
                </p>
                <form onSubmit={handleAddChannel} style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
                    <select className="form-input form-select" value={chType} onChange={(e) => setChType(e.target.value as "email" | "webhook")} style={{ width: 140 }}>
                        <option value="email">Email</option>
                        <option value="webhook">Webhook</option>
                    </select>
                    <input type={chType === "email" ? "email" : "url"} className="form-input" placeholder={chType === "email" ? "you@example.com" : "https://hooks.slack.com/..."} value={destination} onChange={(e) => setDestination(e.target.value)} required style={{ flex: 1, minWidth: 200 }} />
                    <button type="submit" className="btn btn-primary" disabled={chSaving}>
                        {chSaving ? <><span className="spinner" style={{ width: 13, height: 13 }} /> Adding…</> : <><Plus size={13} /> Add</>}
                    </button>
                </form>
                {chError && <div className="alert alert-error" style={{ marginBottom: 16 }}>{chError}</div>}
                {channels.length === 0 ? (
                    <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>No alert channels configured.</p>
                ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {channels.map((ch) => (
                            <div key={ch.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", background: "var(--bg-elevated)", borderRadius: 8, border: "1px solid var(--border)" }}>
                                <span className={`badge ${ch.type === "email" ? "badge-blue" : "badge-yellow"}`}>{ch.type}</span>
                                <span className="mono" style={{ flex: 1, fontSize: "0.82rem", color: "var(--text-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{maskDest(ch.destination, ch.type)}</span>
                                <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>{formatDate(ch.created_at)}</span>
                                <button className={`btn btn-sm ${ch.is_active ? "btn-ghost" : "btn-primary"}`} onClick={() => handleToggleChannel(ch)} style={{ minWidth: 60 }}>{ch.is_active ? "Pause" : "Enable"}</button>
                                <button className="btn btn-danger btn-sm" onClick={() => setDeleteChannel(ch)} title="Delete"><Trash2 size={13} /></button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* ── API Keys ── */}
            <div className="card" style={{ marginBottom: 24 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                    <Key size={16} color="var(--accent)" />
                    <h2 style={{ fontSize: "1rem", margin: 0 }}>API Keys</h2>
                </div>
                <p style={{ fontSize: "0.875rem", color: "var(--text-muted)", marginBottom: 20 }}>
                    Use API keys to manage monitors programmatically (CI/CD, scripts, Postman).
                    Keys are hashed and cannot be retrieved after creation.
                </p>

                {/* Revealed key banner */}
                {revealedKey && (
                    <div style={{ background: "var(--yellow-bg)", border: "1px solid var(--yellow)", borderRadius: 8, padding: "14px 16px", marginBottom: 20 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                            <AlertTriangle size={14} color="var(--yellow)" />
                            <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--yellow)" }}>Copy this key now — it will never be shown again</span>
                        </div>
                        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                            <code style={{ flex: 1, fontFamily: "monospace", fontSize: "0.82rem", color: "var(--text-primary)", background: "var(--bg-elevated)", padding: "8px 12px", borderRadius: 6, border: "1px solid var(--border)", letterSpacing: "0.03em" }}>
                                {revealVisible ? revealedKey : revealedKey.replace(/./g, "•")}
                            </code>
                            <button className="btn btn-ghost btn-sm" onClick={() => setRevealVisible((v) => !v)} title={revealVisible ? "Hide" : "Show"}>
                                {revealVisible ? <EyeOff size={13} /> : <Eye size={13} />}
                            </button>
                            <button className="btn btn-primary btn-sm" onClick={async () => { await navigator.clipboard.writeText(revealedKey); toast("Key copied!", "success"); }}>
                                <Copy size={13} /> Copy
                            </button>
                            <button className="btn btn-ghost btn-sm" onClick={() => setRevealedKey(null)} title="Dismiss">✕</button>
                        </div>
                    </div>
                )}

                {/* Generate form */}
                <form onSubmit={handleAddKey} style={{ display: "flex", gap: 10, marginBottom: 20 }}>
                    <input type="text" className="form-input" placeholder="Key name, e.g. CI Pipeline" value={newKeyName} onChange={(e) => setNewKeyName(e.target.value)} required style={{ flex: 1 }} maxLength={60} />
                    <button type="submit" className="btn btn-primary" disabled={addingKey}>
                        {addingKey ? <><span className="spinner" style={{ width: 13, height: 13 }} /> Generating…</> : <><Key size={13} /> Generate</>}
                    </button>
                </form>

                {apiKeys.length === 0 ? (
                    <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>No API keys yet.</p>
                ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {apiKeys.map((k) => (
                            <div key={k.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", background: "var(--bg-elevated)", borderRadius: 8, border: "1px solid var(--border)" }}>
                                <Key size={13} color="var(--text-muted)" />
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontWeight: 600, fontSize: "0.85rem" }}>{k.name}</div>
                                    <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontFamily: "monospace" }}>{k.key_prefix}••••••••••••••••••••••••••••••••••••••••</div>
                                </div>
                                <div style={{ textAlign: "right", fontSize: "0.72rem", color: "var(--text-muted)", flexShrink: 0 }}>
                                    <div>Created {formatDate(k.created_at)}</div>
                                    <div>{k.last_used_at ? `Last used ${formatDate(k.last_used_at)}` : "Never used"}</div>
                                </div>
                                <button className="btn btn-danger btn-sm" onClick={() => setRevokeKey(k)} title="Revoke key"><Trash2 size={13} /></button>
                            </div>
                        ))}
                    </div>
                )}

                <div style={{ marginTop: 16, padding: "12px 14px", background: "var(--bg-elevated)", borderRadius: 8, border: "1px solid var(--border)", fontSize: "0.8rem", color: "var(--text-muted)" }}>
                    <strong style={{ color: "var(--text-secondary)" }}>Using the API:</strong>{" "}
                    Add <code style={{ fontFamily: "monospace", color: "var(--accent)" }}>Authorization: Bearer &lt;your-key&gt;</code> header to any{" "}
                    <code style={{ fontFamily: "monospace" }}>GET/POST/PATCH/DELETE</code> request to <code style={{ fontFamily: "monospace" }}>/api/monitors</code>
                </div>
            </div>

            {/* ── Account ── */}
            <div className="card">
                <h2 style={{ fontSize: "1rem", marginBottom: 16 }}>Account</h2>
                <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                    <div style={{ width: 36, height: 36, borderRadius: "50%", background: "linear-gradient(135deg, var(--accent), #7c3aed)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "0.875rem", color: "#fff" }}>
                        {(fullName || userEmail).charAt(0).toUpperCase()}
                    </div>
                    <div>
                        {fullName && <div style={{ fontWeight: 600, fontSize: "0.9rem" }}>{fullName}</div>}
                        <div style={{ color: "var(--text-muted)", fontSize: "0.82rem" }}>{userEmail}</div>
                    </div>
                </div>
            </div>
        </>
    );
}
