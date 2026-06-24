interface PingLog {
    checked_at: string;
    status: string;
}

interface Props {
    logs: PingLog[];
    days?: number;
}

export default function UptimeBar({ logs, days = 90 }: Props) {
    // Build a map of date → status (any down = down, any up = up, nothing = no-data)
    const dayMap = new Map<string, "up" | "down" | "no-data">();

    // Initialize all days
    for (let i = days - 1; i >= 0; i--) {
        const d = new Date(Date.now() - i * 86400000);
        const key = d.toISOString().slice(0, 10)!;
        dayMap.set(key, "no-data");
    }

    for (const log of logs) {
        const key = log.checked_at.slice(0, 10)!;
        if (!dayMap.has(key)) continue;
        const current = dayMap.get(key);
        if (current === "down") continue; // once down, stays down for that day
        dayMap.set(key, log.status === "up" ? "up" : "down");
    }

    const segments = Array.from(dayMap.entries());
    const upDays = segments.filter(([, s]) => s === "up").length;
    const totalKnown = segments.filter(([, s]) => s !== "no-data").length;
    const uptimePct = totalKnown > 0 ? Math.round((upDays / totalKnown) * 1000) / 10 : null;

    return (
        <div>
            <div className="uptime-bar-track" title={uptimePct !== null ? `${uptimePct}% uptime` : "No data"}>
                {segments.map(([date, status]) => (
                    <div
                        key={date}
                        className={`uptime-bar-segment ${status}`}
                        title={`${date}: ${status}`}
                    />
                ))}
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{days} days ago</span>
                {uptimePct !== null && (
                    <span style={{ fontSize: "0.75rem", fontWeight: 600, color: uptimePct >= 99 ? "var(--green)" : uptimePct >= 95 ? "var(--yellow)" : "var(--red)" }}>
                        {uptimePct}% uptime
                    </span>
                )}
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Today</span>
            </div>
        </div>
    );
}
