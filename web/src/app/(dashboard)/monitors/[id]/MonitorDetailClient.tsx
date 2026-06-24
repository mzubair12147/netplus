"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ExternalLink, Edit2, Trash2, Pause, Play, Download } from "lucide-react";
import LatencyChart from "@/components/charts/LatencyChart";
import UptimeBar from "@/components/charts/UptimeBar";
import DataTable, { Column } from "@/components/ui/DataTable";
import Modal from "@/components/ui/Modal";
import { useToast } from "@/components/ui/ToastProvider";
import { formatDate, formatDuration, uptimePercent, downloadCsv } from "@/lib/utils";

type Monitor = {
    id: string; name: string; url: string; current_status: string;
    consecutive_failures: number; check_interval_seconds: number;
    timeout_ms: number; expected_status: number;
    is_active: boolean; next_check_at: string; created_at: string;
};
type PingLog = {
    id: number; checked_at: string; status: string;
    latency_ms: number | null; http_status_code: number | null; error_message: string | null;
};
type Incident = {
    id: string; started_at: string; resolved_at: string | null; cause: string | null;
};

interface Props {
    monitor: Monitor;
    pingLogs: PingLog[];
    allLogs: { checked_at: string; status: string }[];
    incidents: Incident[];
}

// ── Ping Log columns ──
const pingColumns: Column<PingLog>[] = [
    {
        key: "checked_at", label: "Time", sortable: true,
        render: (r) => <span className="mono" style={{ fontSize: "0.78rem" }}>{formatDate(r.checked_at)}</span>,
    },
    {
        key: "status", label: "Status", sortable: true,
        render: (r) => <span className={`status-pill status-${r.status}`}>{r.status}</span>,
    },
    {
        key: "http_status_code", label: "HTTP", sortable: true,
        render: (r) => <span style={{ color: "var(--text-muted)" }}>{r.http_status_code ?? "—"}</span>,
    },
    {
        key: "latency_ms", label: "Latency", sortable: true,
        sortValue: (r) => r.latency_ms ?? -1,
        render: (r) => (
            <span style={{ color: r.latency_ms !== null && r.latency_ms > 1000 ? "var(--yellow)" : "var(--text-muted)" }}>
                {r.latency_ms !== null ? `${r.latency_ms}ms` : "—"}
            </span>
        ),
    },
    {
        key: "error_message", label: "Error",
        render: (r) => (
            <span style={{ color: "var(--red)", fontSize: "0.78rem", maxWidth: 220, display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {r.error_message ?? "—"}
            </span>
        ),
    },
];

// ── Incident columns ──
const incidentColumns: Column<Incident>[] = [
    {
        key: "started_at", label: "Started", sortable: true,
        render: (r) => <span style={{ fontSize: "0.8rem" }}>{formatDate(r.started_at)}</span>,
    },
    {
        key: "resolved_at", label: "Resolved", sortable: true,
        render: (r) => r.resolved_at
            ? <span style={{ fontSize: "0.8rem" }}>{formatDate(r.resolved_at)}</span>
            : <span className="badge badge-red">Ongoing</span>,
    },
    {
        key: "id", label: "Duration",
        sortValue: (r) => {
            const start = new Date(r.started_at).getTime();
            const end = r.resolved_at ? new Date(r.resolved_at).getTime() : Date.now();
            return end - start;
        },
        sortable: true,
        render: (r) => <span style={{ color: "var(--text-muted)" }}>{formatDuration(r.started_at, r.resolved_at)}</span>,
    },
    {
        key: "cause", label: "Cause",
        render: (r) => (
            <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", maxWidth: 240, display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {r.cause ?? "—"}
            </span>
        ),
    },
];

export default function MonitorDetailClient({ monitor: initialMonitor, pingLogs, allLogs, incidents }: Props) {
    const router = useRouter();
    const { toast } = useToast();
    const [monitor, setMonitor] = useState(initialMonitor);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [toggling, setToggling] = useState(false);

    const uptime24 = uptimePercent(pingLogs.map((l) => ({ status: l.status })));
    const uptime7 = uptimePercent(
        allLogs.filter((l) => new Date(l.checked_at) > new Date(Date.now() - 7 * 86400000)).map((l) => ({ status: l.status })),
    );
    const openIncident = incidents.find((i) => !i.resolved_at);

    async function handleDelete() {
        setDeleting(true);
        const res = await fetch(`/api/monitors/${monitor.id}`, { method: "DELETE" });
        if (res.ok) {
            toast(`"${monitor.name}" deleted`, "success");
            router.push("/dashboard");
            router.refresh();
        } else {
            toast("Failed to delete monitor", "error");
            setDeleting(false);
            setDeleteOpen(false);
        }
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
            toast(updated.is_active ? "Monitor resumed" : "Monitor paused", "info");
        } else {
            toast("Failed to update monitor", "error");
        }
        setToggling(false);
    }

    function handleDownloadPingLogs() {
        const headers = ["Time", "Status", "HTTP Code", "Latency (ms)", "Error"];
        const rows = pingLogs.map(l => [
            new Date(l.checked_at).toISOString(),
            l.status,
            l.http_status_code,
            l.latency_ms,
            l.error_message
        ]);
        downloadCsv(`ping_logs_${monitor.id}.csv`, headers, rows);
    }

    function handleDownloadIncidents() {
        const headers = ["Started At", "Resolved At", "Duration (ms)", "Cause"];
        const rows = incidents.map(i => {
            const start = new Date(i.started_at).getTime();
            const end = i.resolved_at ? new Date(i.resolved_at).getTime() : Date.now();
            return [
                new Date(i.started_at).toISOString(),
                i.resolved_at ? new Date(i.resolved_at).toISOString() : "",
                end - start,
                i.cause
            ];
        });
        downloadCsv(`incidents_${monitor.id}.csv`, headers, rows);
    }

    return (
        <>
            {/* Delete confirmation modal */}
            <Modal
                open={deleteOpen}
                onClose={() => setDeleteOpen(false)}
                onConfirm={handleDelete}
                loading={deleting}
                title="Delete monitor"
                confirmLabel="Yes, delete it"
                confirmVariant="danger"
                body={
                    <>
                        This will permanently delete <strong>{monitor.name}</strong> and all its ping logs and incident history. This action cannot be undone.
                    </>
                }
            />

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
                        <button onClick={() => setDeleteOpen(true)} className="btn btn-danger btn-sm">
                            <Trash2 size={13} /> Delete
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
                        {pingLogs.length > 0 ? `${uptime24}%` : "—"}
                    </div>
                </div>
                <div className="metric-card">
                    <div className="metric-label">7-day uptime</div>
                    <div className="metric-value">{uptime7 > 0 ? `${uptime7}%` : "—"}</div>
                </div>
                <div className="metric-card">
                    <div className="metric-label">Interval</div>
                    <div className="metric-value" style={{ fontSize: "1.25rem" }}>
                        {monitor.check_interval_seconds >= 60 ? `${monitor.check_interval_seconds / 60}m` : `${monitor.check_interval_seconds}s`}
                    </div>
                </div>
                <div className="metric-card">
                    <div className="metric-label">Timeout</div>
                    <div className="metric-value" style={{ fontSize: "1.25rem" }}>{monitor.timeout_ms / 1000}s</div>
                </div>
                <div className="metric-card">
                    <div className="metric-label">Expected</div>
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
                <h2 style={{ marginBottom: 16, fontSize: "0.875rem", fontWeight: 600, color: "var(--text-secondary)" }}>RESPONSE TIME — last 24hr</h2>
                <LatencyChart logs={pingLogs.map((l) => ({ checked_at: l.checked_at, latency_ms: l.latency_ms, status: l.status, http_status_code: l.http_status_code }))} />
            </div>

            {/* Recent checks — DataTable */}
            <div style={{ marginBottom: 20 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                    <h2 style={{ margin: 0, fontSize: "0.875rem", fontWeight: 600, color: "var(--text-secondary)" }}>RECENT CHECKS</h2>
                    {pingLogs.length > 0 && (
                        <button className="btn btn-ghost btn-sm" onClick={handleDownloadPingLogs}>
                            <Download size={13} /> Export CSV
                        </button>
                    )}
                </div>
                <DataTable<PingLog>
                    columns={pingColumns}
                    data={pingLogs}
                    pageSize={25}
                    searchKeys={["status", "error_message"]}
                    searchPlaceholder="Filter by status or error…"
                    rowKey={(r) => r.id}
                    emptyMessage="No ping logs yet — wait for the worker to run"
                />
            </div>

            {/* Incidents — DataTable */}
            <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                    <h2 style={{ margin: 0, fontSize: "0.875rem", fontWeight: 600, color: "var(--text-secondary)" }}>INCIDENTS</h2>
                    {incidents.length > 0 && (
                        <button className="btn btn-ghost btn-sm" onClick={handleDownloadIncidents}>
                            <Download size={13} /> Export CSV
                        </button>
                    )}
                </div>
                <DataTable<Incident>
                    columns={incidentColumns}
                    data={incidents}
                    pageSize={10}
                    rowKey={(r) => r.id}
                    emptyMessage="No incidents recorded 🎉"
                />
            </div>
        </>
    );
}
