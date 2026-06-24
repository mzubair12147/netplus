import Link from "next/link";
import { formatDate, uptimePercent } from "@/lib/utils";
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

export default function MonitorCard({ monitor, pingLogs }: Props) {
    const uptime = uptimePercent(pingLogs);
    const statusClass = monitor.is_active ? monitor.current_status : "pending";

    return (
        <Link
            href={`/monitors/${monitor.id}`}
            style={{ textDecoration: "none" }}
        >
            <div
                className="card"
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 16,
                    padding: "16px 20px",
                    cursor: "pointer",
                }}
            >
                {/* Status pill */}
                <span className={`status-pill status-${statusClass}`}>
                    {monitor.is_active ? monitor.current_status : "paused"}
                </span>

                {/* Name + URL */}
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: "0.9375rem", color: "var(--text-primary)", marginBottom: 2 }}>
                        {monitor.name}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 4, color: "var(--text-muted)", fontSize: "0.8rem" }}>
                        <ExternalLink size={10} />
                        <span className="mono" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {monitor.url}
                        </span>
                    </div>
                </div>

                {/* 24hr uptime */}
                <div style={{ textAlign: "right", minWidth: 80 }}>
                    <div style={{ fontWeight: 700, fontSize: "1rem", color: uptime >= 99 ? "var(--green)" : uptime >= 95 ? "var(--yellow)" : "var(--red)" }}>
                        {pingLogs.length > 0 ? `${uptime}%` : "—"}
                    </div>
                    <div style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>24hr uptime</div>
                </div>

                {/* Interval */}
                <div style={{ textAlign: "right", minWidth: 80 }}>
                    <div style={{ fontWeight: 500, fontSize: "0.875rem", color: "var(--text-secondary)" }}>
                        {monitor.check_interval_seconds >= 3600
                            ? `${monitor.check_interval_seconds / 3600}h`
                            : `${monitor.check_interval_seconds}s`}
                    </div>
                    <div style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>interval</div>
                </div>

                {/* Next check */}
                <div style={{ textAlign: "right", minWidth: 120, display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
                    <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                        {formatDate(monitor.next_check_at)}
                    </div>
                    <div style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>next check</div>
                </div>

                <ChevronRight size={16} color="var(--text-muted)" />
            </div>
        </Link>
    );
}
