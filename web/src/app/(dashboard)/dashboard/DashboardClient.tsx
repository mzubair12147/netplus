"use client";

import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Plus, Activity, RefreshCw, Search, ChevronDown } from "lucide-react";
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

const COOLDOWN_SEC = 30;
type SortKey = "name" | "status" | "uptime" | "created_at";

function uptimePct(logs: { status: string }[]) {
    if (!logs.length) return -1;
    return Math.round((logs.filter((l) => l.status === "up").length / logs.length) * 100);
}

export default function DashboardClient({ initialMonitors, pingMap, userId }: Props) {
    const [monitors, setMonitors] = useState<Monitor[]>(initialMonitors);
    const [realtimeOk, setRealtimeOk] = useState(false);
    const [cooldown, setCooldown] = useState(0);
    const [refreshing, setRefreshing] = useState(false);
    const [query, setQuery] = useState("");
    const [sortKey, setSortKey] = useState<SortKey>("created_at");
    const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
    const [showSort, setShowSort] = useState(false);
    const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);
    // Stable client instance — keeps Realtime WebSocket alive across renders
    const supabase = useRef(createClient()).current;

    // ── Realtime subscription ──
    useEffect(() => {
        const channel = supabase
            .channel(`monitor-status-${userId}`)
            .on(
                "postgres_changes",
                { event: "UPDATE", schema: "public", table: "monitors", filter: `user_id=eq.${userId}` },
                (payload) => {
                    setMonitors((prev) =>
                        prev.map((m) => m.id === payload.new.id ? { ...m, ...(payload.new as Monitor) } : m),
                    );
                },
            )
            .on(
                "postgres_changes",
                { event: "INSERT", schema: "public", table: "monitors", filter: `user_id=eq.${userId}` },
                (payload) => { setMonitors((prev) => [payload.new as Monitor, ...prev]); },
            )
            .on(
                "postgres_changes",
                { event: "DELETE", schema: "public", table: "monitors" },
                (payload) => { setMonitors((prev) => prev.filter((m) => m.id !== payload.old.id)); },
            )
            .subscribe((status) => {
                setRealtimeOk(status === "SUBSCRIBED");
            });

        return () => { supabase.removeChannel(channel); };
    }, [userId]); // eslint-disable-line react-hooks/exhaustive-deps

    // ── Manual refresh with cooldown ──
    const startCooldown = useCallback(() => {
        setCooldown(COOLDOWN_SEC);
        if (cooldownRef.current) clearInterval(cooldownRef.current);
        cooldownRef.current = setInterval(() => {
            setCooldown((s) => {
                if (s <= 1) { clearInterval(cooldownRef.current!); return 0; }
                return s - 1;
            });
        }, 1000);
    }, []);

    const handleRefresh = useCallback(async () => {
        if (cooldown > 0 || refreshing) return;
        setRefreshing(true);
        const { data } = await supabase
            .from("monitors")
            .select("*")
            .eq("user_id", userId)
            .order("created_at", { ascending: false });
        if (data) setMonitors(data);
        setRefreshing(false);
        startCooldown();
    }, [cooldown, refreshing, supabase, userId, startCooldown]);

    useEffect(() => () => { if (cooldownRef.current) clearInterval(cooldownRef.current); }, []);

    // ── Filter + Sort ──
    const displayed = useMemo(() => {
        let list = monitors;

        // Search
        if (query.trim()) {
            const q = query.toLowerCase();
            list = list.filter((m) =>
                m.name.toLowerCase().includes(q) || m.url.toLowerCase().includes(q),
            );
        }

        // Sort
        list = [...list].sort((a, b) => {
            let va: string | number = 0;
            let vb: string | number = 0;
            if (sortKey === "name") { va = a.name.toLowerCase(); vb = b.name.toLowerCase(); }
            else if (sortKey === "status") { va = a.current_status; vb = b.current_status; }
            else if (sortKey === "uptime") { va = uptimePct(pingMap[a.id] ?? []); vb = uptimePct(pingMap[b.id] ?? []); }
            else { va = a.created_at; vb = b.created_at; }

            if (va < vb) return sortDir === "asc" ? -1 : 1;
            if (va > vb) return sortDir === "asc" ? 1 : -1;
            return 0;
        });

        return list;
    }, [monitors, query, sortKey, sortDir, pingMap]);

    const totalUp = monitors.filter((m) => m.current_status === "up").length;
    const totalDown = monitors.filter((m) => m.current_status === "down").length;
    const cooldownPct = cooldown > 0 ? `${((COOLDOWN_SEC - cooldown) / COOLDOWN_SEC) * 100}%` : "0%";

    useEffect(() => {
        if (totalDown > 0) {
            document.title = `⚠️ ${totalDown} Down · Dashboard · NetPulse`;
        } else {
            document.title = "Dashboard · NetPulse";
        }
    }, [totalDown]);

    const sortLabels: Record<SortKey, string> = {
        created_at: "Date added",
        name: "Name",
        status: "Status",
        uptime: "Uptime %",
    };

    function toggleSort(key: SortKey) {
        if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
        else { setSortKey(key); setSortDir("desc"); }
        setShowSort(false);
    }

    return (
        <>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Dashboard</h1>
                    <p className="page-subtitle">
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                            {realtimeOk
                                ? <><span className="live-dot" /> Live updates active</>
                                : <><span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--text-muted)", display: "inline-block" }} /> Connecting…</>}
                        </span>
                    </p>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                    <button
                        className="btn btn-ghost btn-refresh-cooldown"
                        style={{ "--cooldown-pct": cooldownPct } as React.CSSProperties}
                        onClick={handleRefresh}
                        disabled={cooldown > 0 || refreshing}
                        title={cooldown > 0 ? `Wait ${cooldown}s before refreshing again` : "Refresh monitors"}
                    >
                        <RefreshCw size={13} className={refreshing ? "animate-spin" : ""} />
                        {cooldown > 0 ? `${cooldown}s` : "Refresh"}
                    </button>
                    <Link href="/monitors/new" className="btn btn-primary">
                        <Plus size={14} />
                        New Monitor
                    </Link>
                </div>
            </div>

            {monitors.length > 0 && (
                <>
                    {/* Metrics */}
                    <div className="metrics-grid" style={{ marginBottom: 24 }}>
                        <div className="metric-card">
                            <div className="metric-label">Total</div>
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
                            <div className="metric-label">Paused</div>
                            <div className="metric-value" style={{ color: "var(--text-secondary)", fontSize: "1.5rem" }}>
                                {monitors.filter((m) => !m.is_active).length}
                            </div>
                        </div>
                    </div>

                    {/* Search + Sort toolbar */}
                    <div style={{ display: "flex", gap: 8, marginBottom: 16, alignItems: "center" }}>
                        <div className="input-group" style={{ flex: 1, maxWidth: 320 }}>
                            <span className="input-icon"><Search size={13} /></span>
                            <input
                                type="search"
                                className="form-input"
                                placeholder="Search by name or URL…"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                style={{ height: 36, fontSize: "0.8rem" }}
                            />
                        </div>

                        {/* Sort dropdown */}
                        <div style={{ position: "relative" }}>
                            <button
                                className="btn btn-ghost btn-sm"
                                onClick={() => setShowSort((v) => !v)}
                                style={{ gap: 6 }}
                            >
                                Sort: {sortLabels[sortKey]}
                                <ChevronDown size={12} />
                            </button>
                            {showSort && (
                                <div style={{
                                    position: "absolute",
                                    right: 0,
                                    top: "calc(100% + 6px)",
                                    background: "var(--bg-elevated)",
                                    border: "1px solid var(--border)",
                                    borderRadius: 8,
                                    overflow: "hidden",
                                    zIndex: 50,
                                    minWidth: 160,
                                    boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
                                }}>
                                    {(Object.keys(sortLabels) as SortKey[]).map((k) => (
                                        <button
                                            key={k}
                                            onClick={() => toggleSort(k)}
                                            style={{
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "space-between",
                                                width: "100%",
                                                padding: "9px 14px",
                                                background: sortKey === k ? "var(--accent-glow)" : "transparent",
                                                border: "none",
                                                color: sortKey === k ? "var(--accent)" : "var(--text-secondary)",
                                                fontSize: "0.8rem",
                                                cursor: "pointer",
                                                textAlign: "left",
                                                fontFamily: "inherit",
                                            }}
                                        >
                                            {sortLabels[k]}
                                            {sortKey === k && <span>{sortDir === "asc" ? "↑" : "↓"}</span>}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {query && (
                            <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                                {displayed.length} of {monitors.length}
                            </span>
                        )}
                    </div>
                </>
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
            ) : displayed.length === 0 ? (
                <div className="empty-state">
                    <Search size={32} color="var(--text-muted)" style={{ margin: "0 auto 12px" }} />
                    <h3>No monitors match &quot;{query}&quot;</h3>
                    <p>Try a different name or URL.</p>
                </div>
            ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {displayed.map((monitor) => (
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
