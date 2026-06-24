"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertTriangle, Download } from "lucide-react";
import { formatDate, formatDuration, downloadCsv } from "@/lib/utils";
import DataTable, { Column } from "@/components/ui/DataTable";

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

    function handleDownloadIncidents() {
        const headers = ["Monitor", "Started At", "Resolved At", "Duration (ms)", "Cause"];
        const rows = incidents.map(i => {
            const start = new Date(i.started_at).getTime();
            const end = i.resolved_at ? new Date(i.resolved_at).getTime() : Date.now();
            return [
                monitorNames[i.monitor_id] ?? i.monitor_id,
                new Date(i.started_at).toISOString(),
                i.resolved_at ? new Date(i.resolved_at).toISOString() : "",
                end - start,
                i.cause
            ];
        });
        downloadCsv(`all_incidents.csv`, headers, rows);
    }

    const columns: Column<Incident>[] = [
        {
            key: "monitor_id", label: "Monitor", sortable: true,
            sortValue: (r) => monitorNames[r.monitor_id] ?? "",
            render: (r) => (
                <Link href={`/monitors/${r.monitor_id}`} style={{ color: "var(--accent)", textDecoration: "none", fontWeight: 500 }}>
                    {monitorNames[r.monitor_id] ?? "Unknown"}
                </Link>
            ),
        },
        {
            key: "resolved_at", label: "Status", sortable: true,
            render: (r) => r.resolved_at
                ? <span className="badge badge-green">Resolved</span>
                : <span className="badge badge-red">Ongoing</span>,
        },
        {
            key: "started_at", label: "Started", sortable: true,
            render: (r) => <span style={{ fontSize: "0.8rem" }}>{formatDate(r.started_at)}</span>,
        },
        {
            key: "resolved_at", label: "Resolved", sortable: false,
            render: (r) => (
                <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                    {r.resolved_at ? formatDate(r.resolved_at) : "—"}
                </span>
            ),
        },
        {
            key: "id", label: "Duration", sortable: true,
            sortValue: (r) => {
                const s = new Date(r.started_at).getTime();
                const e = r.resolved_at ? new Date(r.resolved_at).getTime() : Date.now();
                return e - s;
            },
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

    const toolbarFilters = (
        <>
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
                className="datatable-filter"
                value={selectedMonitor}
                onChange={(e) => setSelectedMonitor(e.target.value)}
            >
                <option value="all">All monitors</option>
                {monitorOptions.map(([id, name]) => (
                    <option key={id} value={id}>{name}</option>
                ))}
            </select>
        </>
    );

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
                <div style={{ display: "flex", gap: 8 }}>
                    {incidents.length > 0 && (
                        <button className="btn btn-ghost" onClick={handleDownloadIncidents}>
                            <Download size={14} /> Export CSV
                        </button>
                    )}
                </div>
            </div>

            {incidents.length === 0 ? (
                <div className="empty-state">
                    <AlertTriangle size={36} color="var(--text-muted)" style={{ margin: "0 auto 16px" }} />
                    <h3>No incidents recorded</h3>
                    <p>Your monitors have been running without incidents. 🎉</p>
                </div>
            ) : (
                <DataTable<Incident>
                    columns={columns}
                    data={filtered}
                    pageSize={25}
                    searchKeys={["cause"]}
                    searchPlaceholder="Search by cause…"
                    toolbarExtra={toolbarFilters}
                    rowKey={(r) => r.id}
                    emptyMessage="No incidents match the current filter"
                />
            )}
        </>
    );
}
