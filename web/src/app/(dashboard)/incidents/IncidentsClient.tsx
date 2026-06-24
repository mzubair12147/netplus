"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { formatDate, formatDuration } from "@/lib/utils";

interface Incident {
    id: string;
    monitor_id: string;
    started_at: string;
    resolved_at: string | null;
    cause: string | null;
}

interface Props {
    incidents: Incident[];
    monitorNames: Record<string, string>;
}

type Filter = "all" | "open" | "resolved";

export default function IncidentsClient({ incidents, monitorNames }: Props) {
    const [filter, setFilter] = useState<Filter>("all");
    const [selectedMonitor, setSelectedMonitor] = useState<string>("all");

    const monitorOptions = Object.entries(monitorNames);

    const filtered = incidents.filter((inc) => {
        if (filter === "open" && inc.resolved_at) return false;
        if (filter === "resolved" && !inc.resolved_at) return false;
        if (selectedMonitor !== "all" && inc.monitor_id !== selectedMonitor) return false;
        return true;
    });

    const openCount = incidents.filter((i) => !i.resolved_at).length;

    return (
        <>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Incidents</h1>
                    <p className="page-subtitle">
                        {openCount > 0
                            ? <span style={{ color: "var(--red)" }}>🔴 {openCount} ongoing incident{openCount !== 1 ? "s" : ""}</span>
                            : "✅ All systems operational"}
                    </p>
                </div>
            </div>

            {/* Filters */}
            <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
                {(["all", "open", "resolved"] as Filter[]).map((f) => (
                    <button
                        key={f}
                        className={`btn btn-sm ${filter === f ? "btn-primary" : "btn-ghost"}`}
                        onClick={() => setFilter(f)}
                    >
                        {f.charAt(0).toUpperCase() + f.slice(1)}
                    </button>
                ))}
                <select
                    className="form-input form-select"
                    style={{ width: "auto", padding: "5px 32px 5px 10px", fontSize: "0.8rem" }}
                    value={selectedMonitor}
                    onChange={(e) => setSelectedMonitor(e.target.value)}
                >
                    <option value="all">All monitors</option>
                    {monitorOptions.map(([id, name]) => (
                        <option key={id} value={id}>{name}</option>
                    ))}
                </select>
            </div>

            {filtered.length === 0 ? (
                <div className="empty-state">
                    <AlertTriangle size={36} color="var(--text-muted)" style={{ margin: "0 auto 16px" }} />
                    <h3>No incidents found</h3>
                    <p>
                        {filter !== "all"
                            ? "Try changing the filter."
                            : "Your monitors have been running without incidents."}
                    </p>
                </div>
            ) : (
                <div className="table-wrapper">
                    <table>
                        <thead>
                            <tr>
                                <th>Monitor</th>
                                <th>Status</th>
                                <th>Started</th>
                                <th>Resolved</th>
                                <th>Duration</th>
                                <th>Cause</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((inc) => (
                                <tr key={inc.id}>
                                    <td>
                                        <Link href={`/monitors/${inc.monitor_id}`} style={{ color: "var(--accent)", textDecoration: "none" }}>
                                            {monitorNames[inc.monitor_id] ?? "Unknown"}
                                        </Link>
                                    </td>
                                    <td>
                                        {inc.resolved_at
                                            ? <span className="badge badge-green">Resolved</span>
                                            : <span className="badge badge-red">Ongoing</span>}
                                    </td>
                                    <td style={{ fontSize: "0.8rem" }}>{formatDate(inc.started_at)}</td>
                                    <td style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                                        {inc.resolved_at ? formatDate(inc.resolved_at) : "—"}
                                    </td>
                                    <td style={{ color: "var(--text-muted)" }}>{formatDuration(inc.started_at, inc.resolved_at)}</td>
                                    <td style={{ fontSize: "0.8rem", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "var(--text-muted)" }}>
                                        {inc.cause ?? "—"}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </>
    );
}
