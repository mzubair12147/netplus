"use client";

import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from "recharts";

interface PingLog {
    checked_at: string;
    latency_ms: number | null;
    status: string;
}

interface Props {
    logs: PingLog[];
}

export default function LatencyChart({ logs }: Props) {
    // Aggregate to hourly averages
    const hourlyMap = new Map<string, { sum: number; count: number }>();

    for (const log of logs) {
        if (log.latency_ms === null || log.status !== "up") continue;
        const date = new Date(log.checked_at);
        const key = `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:00`;
        const existing = hourlyMap.get(key) ?? { sum: 0, count: 0 };
        hourlyMap.set(key, { sum: existing.sum + log.latency_ms, count: existing.count + 1 });
    }

    const data = Array.from(hourlyMap.entries()).map(([hour, { sum, count }]) => ({
        hour,
        latency: Math.round(sum / count),
    }));

    if (data.length === 0) {
        return (
            <div style={{ height: 200, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", fontSize: "0.875rem" }}>
                No latency data available
            </div>
        );
    }

    return (
        <ResponsiveContainer width="100%" height={200}>
            <LineChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis
                    dataKey="hour"
                    tick={{ fontSize: 11, fill: "var(--text-muted)" }}
                    tickLine={false}
                    axisLine={false}
                />
                <YAxis
                    tick={{ fontSize: 11, fill: "var(--text-muted)" }}
                    tickLine={false}
                    axisLine={false}
                    unit="ms"
                />
                <Tooltip
                    contentStyle={{
                        background: "var(--bg-elevated)",
                        border: "1px solid var(--border)",
                        borderRadius: 6,
                        color: "var(--text-primary)",
                        fontSize: 12,
                    }}
                    formatter={(val) => {
                        if (val === undefined || val === null) return ["-", "Avg latency"];
                        return [`${val}ms`, "Avg latency"];
                    }}
                />
                <Line
                    type="monotone"
                    dataKey="latency"
                    stroke="var(--accent)"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4, fill: "var(--accent)" }}
                />
            </LineChart>
        </ResponsiveContainer>
    );
}
