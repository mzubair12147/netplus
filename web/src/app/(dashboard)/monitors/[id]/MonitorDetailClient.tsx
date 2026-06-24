"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ExternalLink, Edit2, Trash2, Pause, Play } from "lucide-react";
import LatencyChart from "@/components/charts/LatencyChart";
import UptimeBar from "@/components/charts/UptimeBar";
import { formatDate, formatDuration, uptimePercent } from "@/lib/utils";

type Monitor = {
    id: string; name: string; url: string; current_status: string;
    consecutive_failures: number; check_interval_seconds: number;
    timeout_ms: number; expected_status: number;
    is_active: boolean; next_check_at: string; created_at: string;
};
type PingLog = { id: number; checked_at: string; status: string; latency_ms: number | null; http_status_code: number | null; error_message: string | null; };
type Incident = { id: string; started_at: string; resolved_at: string | null; cause: string | null; };

interface Props {
    monitor: Monitor;
    pingLogs: PingLog[];
    allLogs: { checked_at: string; status: string }[];
    incidents: Incident[];
}

export default function MonitorDetailClient({ monitor: initialMonitor, pingLogs, allLogs, incidents }: Props) {
    const router = useRouter();
    const [monitor, setMonitor] = useState(initialMonitor);
    const [deleting, setDeleting] = useState(false);
    const [toggling, setToggling] = useState(false);

    const uptime24 = uptimePercent(pingLogs.map((l) => ({ status: l.status })));
    const last24Logs = pingLogs.filter((l) => new Date(l.checked_at) > new Date(Date.now() - 86400000));
    const uptime7 = uptimePercent(allLogs.filter((l) => new Date(l.checked_at) > new Date(Date.now() - 7 * 86400000)).map((l) => ({ status: l.status })));

    async function handleDelete() {
        if (!confirm(`Delete monitor "${monitor.name}"? This cannot be undone.`)) return;
        setDeleting(true);
        await fetch(`/api/monitors/${monitor.id}`, { method: "DELETE" });
        router.push("/dashboard");
        router.refresh();
    }

    async function handleToggle() {
        setToggling(true);
        const res = await fetch(`/api/monitors/${monitor.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ is_active: !monitor.is_active }),
        });
        if (res.ok) {
            const updated = await res.json();
            setMonitor(updated);
        }
        setToggling(false);
    }

    const openIncident = incidents.find((i) => !i.resolved_at);

    return (
        <>
            {/* Back + header */}
            <div style={{ marginBottom: 24 }}>
                <Link href="/dashboard" style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "var(--text-muted)", fontSize: "0.875rem", textDecoration: "none", marginBottom: 16 }}>
                    <ArrowLeft size={14} /> Back to Dashboard
                </Link>

                <div className="page-header" style={{ marginBottom: 0 }}>
                    <div>
                        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
                            <h1 className="page-title" style={{ marginBottom: 0 }}>{monitor.name}</h1>
                            <span className={`status-pill status-${monitor.is_active ? monitor.current_status : "pending"}`}>
                                {monitor.is_active ? monitor.current_status : "paused"}
                            </span>
                        </div>
                        <a href={monitor.url} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 4, color: "var(--text-muted)", fontSize: "0.8rem", textDecoration: "none" }}>
                            <ExternalLink size={11} />
                            <span className="mono">{monitor.url}</span>
                        </a>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                        <button onClick={handleToggle} disabled={toggling} className="btn btn-ghost btn-sm">
                            {monitor.is_active ? <><Pause size={13} /> Pause</> : <><Play size={13} /> Resume</>}
                        </button>
                        <Link href={`/monitors/${monitor.id}/edit`} className="btn btn-ghost btn-sm">
                            <Edit2 size={13} /> Edit
                        </Link>
                        <button onClick={handleDelete} disabled={deleting} className="btn btn-danger btn-sm">
                            <Trash2 size={13} /> {deleting ? "Deleting…" : "Delete"}
                        </button>
                    </div>
                </div>
            </div>

            {/* Incident banner */}
            {openIncident && (
                <div className="alert alert-error" style={{ marginBottom: 20, display: "flex", justifyContent: "space-between" }}>
                    <span>🔴 Ongoing incident since {formatDate(openIncident.started_at)} — {openIncident.cause}</span>
                    <span style={{ fontSize: "0.8rem", opacity: 0.8 }}>Duration: {formatDuration(openIncident.started_at)}</span>
                </div>
            )}

            {/* Metrics */}
            <div className="metrics-grid" style={{ marginBottom: 24 }}>
                <div className="metric-card">
                    <div className="metric-label">24hr uptime</div>
                    <div className="metric-value" style={{ color: uptime24 >= 99 ? "var(--green)" : uptime24 >= 95 ? "var(--yellow)" : "var(--red)" }}>
                        {last24Logs.length > 0 ? `${uptime24}%` : "—"}
                    </div>
                </div>
                <div className="metric-card">
                    <div className="metric-label">7-day uptime</div>
                    <div className="metric-value">{uptime7 > 0 ? `${uptime7}%` : "—"}</div>
                </div>
                <div className="metric-card">
                    <div className="metric-label">Check interval</div>
                    <div className="metric-value" style={{ fontSize: "1.25rem" }}>
                        {monitor.check_interval_seconds >= 60 ? `${monitor.check_interval_seconds / 60}m` : `${monitor.check_interval_seconds}s`}
                    </div>
                </div>
                <div className="metric-card">
                    <div className="metric-label">Timeout</div>
                    <div className="metric-value" style={{ fontSize: "1.25rem" }}>{monitor.timeout_ms / 1000}s</div>
                </div>
                <div className="metric-card">
                    <div className="metric-label">Expected status</div>
                    <div className="metric-value" style={{ fontSize: "1.25rem" }}>{monitor.expected_status}</div>
                </div>
            </div>

            {/* 90-day uptime bar */}
            <div className="card" style={{ marginBottom: 20 }}>
                <h2 style={{ marginBottom: 16, fontSize: "0.875rem", fontWeight: 600, color: "var(--text-secondary)" }}>90-DAY UPTIME</h2>
                <UptimeBar logs={allLogs} days={90} />
            </div>

            {/* Latency chart */}
            <div className="card" style={{ marginBottom: 20 }}>
                <h2 style={{ marginBottom: 16, fontSize: "0.875rem", fontWeight: 600, color: "var(--text-secondary)" }}>RESPONSE TIME (last 24hr, hourly avg)</h2>
                <LatencyChart logs={pingLogs.map((l) => ({ checked_at: l.checked_at, latency_ms: l.latency_ms, status: l.status }))} />
            </div>

            {/* Recent ping log */}
            <div style={{ marginBottom: 20 }}>
                <h2 style={{ marginBottom: 12, fontSize: "0.875rem", fontWeight: 600, color: "var(--text-secondary)" }}>RECENT CHECKS</h2>
                <div className="table-wrapper">
                    <table>
                        <thead>
                            <tr>
                                <th>Time</th>
                                <th>Status</th>
                                <th>HTTP Code</th>
                                <th>Latency</th>
                                <th>Error</th>
                            </tr>
                        </thead>
                        <tbody>
                            {pingLogs.slice(0, 50).map((log) => (
                                <tr key={log.id}>
                                    <td style={{ fontFamily: "var(--font-mono)", fontSize: "0.8rem" }}>{formatDate(log.checked_at)}</td>
                                    <td><span className={`status-pill status-${log.status}`}>{log.status}</span></td>
                                    <td style={{ color: "var(--text-muted)" }}>{log.http_status_code ?? "—"}</td>
                                    <td style={{ color: "var(--text-muted)" }}>{log.latency_ms !== null ? `${log.latency_ms}ms` : "—"}</td>
                                    <td style={{ color: "var(--red)", fontSize: "0.8rem", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{log.error_message ?? "—"}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Incidents */}
            <div>
                <h2 style={{ marginBottom: 12, fontSize: "0.875rem", fontWeight: 600, color: "var(--text-secondary)" }}>INCIDENTS</h2>
                {incidents.length === 0 ? (
                    <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>No incidents recorded 🎉</p>
                ) : (
                    <div className="table-wrapper">
                        <table>
                            <thead>
                                <tr>
                                    <th>Started</th>
                                    <th>Resolved</th>
                                    <th>Duration</th>
                                    <th>Cause</th>
                                </tr>
                            </thead>
                            <tbody>
                                {incidents.map((inc) => (
                                    <tr key={inc.id}>
                                        <td>{formatDate(inc.started_at)}</td>
                                        <td>{inc.resolved_at ? formatDate(inc.resolved_at) : <span className="badge badge-red">Ongoing</span>}</td>
                                        <td>{formatDuration(inc.started_at, inc.resolved_at)}</td>
                                        <td style={{ fontSize: "0.8rem", maxWidth: 240, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{inc.cause ?? "—"}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </>
    );
}
