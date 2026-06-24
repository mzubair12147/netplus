"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Plus, Activity } from "lucide-react";
import MonitorCard from "@/components/monitors/MonitorCard";

type Monitor = {
    id: string;
    name: string;
    url: string;
    current_status: string;
    consecutive_failures: number;
    check_interval_seconds: number;
    is_active: boolean;
    next_check_at: string;
    created_at: string;
};

interface Props {
    initialMonitors: Monitor[];
    pingMap: Record<string, { status: string }[]>;
    userId: string;
}

export default function DashboardClient({ initialMonitors, pingMap, userId }: Props) {
    const [monitors, setMonitors] = useState<Monitor[]>(initialMonitors);
    const supabase = createClient();

    useEffect(() => {
        const channel = supabase
            .channel("monitor-status")
            .on(
                "postgres_changes",
                {
                    event: "UPDATE",
                    schema: "public",
                    table: "monitors",
                    filter: `user_id=eq.${userId}`,
                },
                (payload) => {
                    setMonitors((prev) =>
                        prev.map((m) =>
                            m.id === payload.new.id
                                ? { ...m, ...(payload.new as Monitor) }
                                : m,
                        ),
                    );
                },
            )
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: "monitors",
                    filter: `user_id=eq.${userId}`,
                },
                (payload) => {
                    setMonitors((prev) => [payload.new as Monitor, ...prev]);
                },
            )
            .on(
                "postgres_changes",
                {
                    event: "DELETE",
                    schema: "public",
                    table: "monitors",
                },
                (payload) => {
                    setMonitors((prev) => prev.filter((m) => m.id !== payload.old.id));
                },
            )
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [userId, supabase]);

    const totalUp = monitors.filter((m) => m.current_status === "up").length;
    const totalDown = monitors.filter((m) => m.current_status === "down").length;

    return (
        <>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Dashboard</h1>
                    <p className="page-subtitle">
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                            <span className="live-dot" />
                            Live updates enabled
                        </span>
                    </p>
                </div>
                <Link href="/monitors/new" className="btn btn-primary">
                    <Plus size={14} />
                    New Monitor
                </Link>
            </div>

            {monitors.length > 0 && (
                <div className="metrics-grid" style={{ marginBottom: 28 }}>
                    <div className="metric-card">
                        <div className="metric-label">Total Monitors</div>
                        <div className="metric-value">{monitors.length}</div>
                    </div>
                    <div className="metric-card">
                        <div className="metric-label">Operational</div>
                        <div className="metric-value" style={{ color: "var(--green)" }}>{totalUp}</div>
                    </div>
                    <div className="metric-card">
                        <div className="metric-label">Down</div>
                        <div className="metric-value" style={{ color: totalDown > 0 ? "var(--red)" : "var(--text-primary)" }}>
                            {totalDown}
                        </div>
                    </div>
                    <div className="metric-card">
                        <div className="metric-label">Pending</div>
                        <div className="metric-value" style={{ color: "var(--text-secondary)" }}>
                            {monitors.filter((m) => m.current_status === "pending").length}
                        </div>
                    </div>
                </div>
            )}

            {monitors.length === 0 ? (
                <div className="empty-state">
                    <Activity size={40} color="var(--text-muted)" style={{ margin: "0 auto 16px" }} />
                    <h3>No monitors yet</h3>
                    <p>Add your first monitor to start tracking uptime.</p>
                    <Link href="/monitors/new" className="btn btn-primary">
                        <Plus size={14} />
                        Create Monitor
                    </Link>
                </div>
            ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {monitors.map((monitor) => (
                        <MonitorCard
                            key={monitor.id}
                            monitor={monitor}
                            pingLogs={pingMap[monitor.id] ?? []}
                        />
                    ))}
                </div>
            )}
        </>
    );
}
