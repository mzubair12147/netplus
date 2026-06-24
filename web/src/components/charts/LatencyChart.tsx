"use client";

import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, ReferenceLine, Dot,
} from "recharts";

interface PingLog {
    checked_at: string;
    latency_ms: number | null;
    status: string;
    http_status_code?: number | null;
}

interface Props {
    logs: PingLog[];
}

const HOURLY_THRESHOLD = 48; // below this use per-check points

function fmt(ts: string): string {
    const d = new Date(ts);
    const h = d.getHours().toString().padStart(2, "0");
    const m = d.getMinutes().toString().padStart(2, "0");
    return `${h}:${m}`;
}

function fmtHour(ts: string): string {
    const d = new Date(ts);
    return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:00`;
}

// Custom dot — red when status is not "up"
function StatusDot(props: any) {
    const { cx, cy, payload } = props;
    if (!payload) return null;
    const color = payload.status === "up" ? "var(--green)" : "var(--red)";
    return <circle cx={cx} cy={cy} r={3} fill={color} strokeWidth={0} />;
}

export default function LatencyChart({ logs }: Props) {
    const validLogs = logs.filter((l) => l.latency_ms !== null);

    if (validLogs.length === 0) {
        return (
            <div style={{ height: 200, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", fontSize: "0.875rem" }}>
                No latency data yet — the worker hasn&apos;t run for this monitor.
            </div>
        );
    }

    const usePerCheck = validLogs.length < HOURLY_THRESHOLD;

    // ── Per-check mode: raw data points ──
    if (usePerCheck) {
        const data = [...validLogs]
            .sort((a, b) => new Date(a.checked_at).getTime() - new Date(b.checked_at).getTime())
            .map((l) => ({
                time: fmt(l.checked_at),
                ts: l.checked_at,
                latency: l.latency_ms!,
                status: l.status,
                http: l.http_status_code ?? null,
            }));

        const avgLatency = Math.round(data.reduce((s, d) => s + d.latency, 0) / data.length);

        return (
            <div>
                <div style={{ display: "flex", gap: 16, marginBottom: 10, fontSize: "0.78rem", color: "var(--text-muted)" }}>
                    <span>avg <strong style={{ color: "var(--text-primary)" }}>{avgLatency}ms</strong></span>
                    <span>p99 <strong style={{ color: "var(--text-primary)" }}>{Math.max(...data.map((d) => d.latency))}ms</strong></span>
                    <span style={{ marginLeft: "auto" }}>{data.length} check{data.length !== 1 ? "s" : ""}</span>
                </div>
                <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                        <XAxis
                            dataKey="time"
                            tick={{ fontSize: 10, fill: "var(--text-muted)" }}
                            tickLine={false}
                            axisLine={false}
                            interval="preserveStartEnd"
                        />
                        <YAxis
                            tick={{ fontSize: 11, fill: "var(--text-muted)" }}
                            tickLine={false}
                            axisLine={false}
                            unit="ms"
                        />
                        <ReferenceLine y={avgLatency} stroke="var(--accent)" strokeDasharray="4 4" strokeOpacity={0.4} />
                        <Tooltip
                            contentStyle={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 6, color: "var(--text-primary)", fontSize: 12 }}
                            formatter={(val: any, _name: any, props: any) => {
                                const row = props.payload;
                                const lines: [React.ReactNode, string][] = [
                                    [<strong key="lat">{val}ms</strong>, "Latency"],
                                ];
                                if (row?.status) lines.push([row.status, "Status"]);
                                if (row?.http) lines.push([String(row.http), "HTTP"]);
                                return lines;
                            }}
                            labelFormatter={(label, payload) => {
                                const ts = payload?.[0]?.payload?.ts;
                                return ts ? new Date(ts).toLocaleString() : label;
                            }}
                        />
                        <Line
                            type="monotone"
                            dataKey="latency"
                            stroke="var(--accent)"
                            strokeWidth={2}
                            dot={<StatusDot />}
                            activeDot={{ r: 5, fill: "var(--accent)" }}
                        />
                    </LineChart>
                </ResponsiveContainer>
                <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginTop: 4 }}>
                    🟢 green dot = up · 🔴 red dot = down/error · dashed line = avg
                </div>
            </div>
        );
    }

    // ── Hourly aggregate mode ──
    const hourlyMap = new Map<string, { sum: number; count: number; badCount: number }>();
    for (const log of validLogs) {
        const key = fmtHour(log.checked_at);
        const existing = hourlyMap.get(key) ?? { sum: 0, count: 0, badCount: 0 };
        hourlyMap.set(key, {
            sum: existing.sum + log.latency_ms!,
            count: existing.count + 1,
            badCount: existing.badCount + (log.status !== "up" ? 1 : 0),
        });
    }

    const data = Array.from(hourlyMap.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([hour, { sum, count, badCount }]) => ({
            hour,
            latency: Math.round(sum / count),
            errorRate: Math.round((badCount / count) * 100),
        }));

    const avgLatency = Math.round(data.reduce((s, d) => s + d.latency, 0) / data.length);

    return (
        <div>
            <div style={{ display: "flex", gap: 16, marginBottom: 10, fontSize: "0.78rem", color: "var(--text-muted)" }}>
                <span>avg <strong style={{ color: "var(--text-primary)" }}>{avgLatency}ms</strong></span>
                <span>p99 <strong style={{ color: "var(--text-primary)" }}>{Math.max(...data.map((d) => d.latency))}ms</strong></span>
                <span style={{ marginLeft: "auto" }}>hourly avg · {validLogs.length} checks</span>
            </div>
            <ResponsiveContainer width="100%" height={200}>
                <LineChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis
                        dataKey="hour"
                        tick={{ fontSize: 10, fill: "var(--text-muted)" }}
                        tickLine={false}
                        axisLine={false}
                        interval="preserveStartEnd"
                    />
                    <YAxis
                        tick={{ fontSize: 11, fill: "var(--text-muted)" }}
                        tickLine={false}
                        axisLine={false}
                        unit="ms"
                    />
                    <ReferenceLine y={avgLatency} stroke="var(--accent)" strokeDasharray="4 4" strokeOpacity={0.4} />
                    <Tooltip
                        contentStyle={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 6, color: "var(--text-primary)", fontSize: 12 }}
                        formatter={(val: any, name: any) => {
                            if (val === undefined || val === null) return ["—", name];
                            return name === "latency" ? [`${val}ms`, "Avg latency"] : [`${val}%`, "Error rate"];
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
        </div>
    );
}
