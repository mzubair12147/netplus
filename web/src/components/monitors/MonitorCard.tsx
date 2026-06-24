import Link from "next/link";
import { uptimePercent } from "@/lib/utils";
import { ExternalLink, ChevronRight } from "lucide-react";

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
    monitor: Monitor;
    pingLogs: { status: string }[];
}

/** Inline 24-bar sparkline — each bar = 1 ping, colored by status */
function Sparkline({ logs }: { logs: { status: string }[] }) {
    // Show last 24 pings, or pad with grey if fewer
    const recent = logs.slice(0, 24).reverse();
    const bars = Array.from({ length: 24 }, (_, i) => recent[i] ?? null);

    return (
        <div style={{ display: "flex", alignItems: "flex-end", gap: 2, height: 22 }} title="Last 24 checks">
            {bars.map((log, i) => {
                const color = log === null
                    ? "var(--border)"
                    : log.status === "up"
                    ? "var(--green)"
                    : log.status === "pending"
                    ? "var(--yellow)"
                    : "var(--red)";
                // Vary bar height slightly for visual texture
                const h = log === null ? 10 : log.status === "up" ? 18 : 22;
                return (
                    <div
                        key={i}
                        style={{
                            width: 4,
                            height: h,
                            borderRadius: 2,
                            background: color,
                            opacity: log === null ? 0.3 : 0.9,
                            transition: "opacity 0.15s",
                            flexShrink: 0,
                        }}
                    />
                );
            })}
        </div>
    );
}

export default function MonitorCard({ monitor, pingLogs }: Props) {
    const uptime = uptimePercent(pingLogs);
    const statusClass = monitor.is_active ? monitor.current_status : "pending";
    const uptimeColor = uptime >= 99 ? "var(--green)" : uptime >= 95 ? "var(--yellow)" : "var(--red)";

    const intervalLabel = monitor.check_interval_seconds >= 3600
        ? `${monitor.check_interval_seconds / 3600}h`
        : monitor.check_interval_seconds >= 60
        ? `${monitor.check_interval_seconds / 60}m`
        : `${monitor.check_interval_seconds}s`;

    return (
        <Link href={`/monitors/${monitor.id}`} style={{ textDecoration: "none" }}>
            <div
                className="card"
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 16,
                    padding: "14px 20px",
                    cursor: "pointer",
                    transition: "border-color 0.15s, box-shadow 0.15s",
                }}
            >
                {/* Status pill */}
                <span className={`status-pill status-${statusClass}`} style={{ minWidth: 70, justifyContent: "center" }}>
                    {monitor.is_active ? monitor.current_status : "paused"}
                </span>

                {/* Name + URL */}
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: "0.9375rem", color: "var(--text-primary)", marginBottom: 2 }}>
                        {monitor.name}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 4, color: "var(--text-muted)", fontSize: "0.78rem" }}>
                        <ExternalLink size={10} />
                        <span className="mono" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {monitor.url}
                        </span>
                    </div>
                </div>

                {/* Sparkline */}
                <div style={{ flexShrink: 0 }}>
                    <Sparkline logs={pingLogs} />
                </div>

                {/* 24hr uptime */}
                <div style={{ textAlign: "right", minWidth: 72, flexShrink: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: "1rem", color: pingLogs.length > 0 ? uptimeColor : "var(--text-muted)" }}>
                        {pingLogs.length > 0 ? `${uptime}%` : "—"}
                    </div>
                    <div style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>24hr uptime</div>
                </div>

                {/* Interval */}
                <div style={{ textAlign: "right", minWidth: 48, flexShrink: 0 }}>
                    <div style={{ fontWeight: 500, fontSize: "0.875rem", color: "var(--text-secondary)" }}>
                        {intervalLabel}
                    </div>
                    <div style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>every</div>
                </div>

                <ChevronRight size={16} color="var(--text-muted)" />
            </div>
        </Link>
    );
}
