import { createClient as createRawClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import UptimeBar from "@/components/charts/UptimeBar";
import type { Metadata } from "next";

interface Props { params: Promise<{ userId: string }> }

export const revalidate = 60;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { userId } = await params;
    const supabase = createRawClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { persistSession: false } },
    );
    // Get company name from user metadata via admin API
    const { data: userData } = await supabase.auth.admin.getUserById(userId);
    const companyName = (userData?.user?.user_metadata?.company_name as string | undefined)?.trim();
    const desc = (userData?.user?.user_metadata?.status_page_desc as string | undefined)?.trim();

    const title = companyName ? `${companyName} Status` : "Service Status";
    const description = desc ?? `Real-time uptime status — powered by NetPulse`;

    return {
        title,
        description,
        openGraph: {
            title,
            description,
            type: "website",
        },
        twitter: {
            card: "summary_large_image",
            title,
            description,
        },
    };
}

export default async function StatusPage({ params }: Props) {
    const { userId } = await params;

    const supabase = createRawClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { persistSession: false } },
    );

    // Fetch user metadata (company name + description)
    const { data: userData } = await supabase.auth.admin.getUserById(userId);
    const meta = userData?.user?.user_metadata ?? {};
    const companyName = (meta.company_name as string | undefined)?.trim() || null;
    const statusDesc = (meta.status_page_desc as string | undefined)?.trim() || null;

    const { data: monitors } = await supabase
        .from("monitors")
        .select("id, name, url, current_status, is_active")
        .eq("user_id", userId)
        .eq("is_active", true)
        .order("created_at", { ascending: true });

    const since90 = new Date(Date.now() - 90 * 86400000).toISOString();
    const monitorIds = (monitors ?? []).map((m) => m.id);
    let logsMap: Record<string, { checked_at: string; status: string }[]> = {};

    if (monitorIds.length > 0) {
        const { data: logs } = await supabase
            .from("ping_logs")
            .select("monitor_id, checked_at, status")
            .in("monitor_id", monitorIds)
            .gte("checked_at", since90)
            .order("checked_at", { ascending: true });

        for (const log of logs ?? []) {
            if (!logsMap[log.monitor_id]) logsMap[log.monitor_id] = [];
            logsMap[log.monitor_id]!.push({ checked_at: log.checked_at, status: log.status });
        }
    }

    const allUp = (monitors ?? []).every((m) => m.current_status === "up");
    const anyDown = (monitors ?? []).some((m) => m.current_status === "down");

    return (
        <div style={{ minHeight: "100vh", background: "var(--bg-base)", padding: "0 0 80px" }}>
            {/* Header */}
            <div style={{ borderBottom: "1px solid var(--border)", padding: "20px 0", marginBottom: 48, background: "var(--bg-surface)" }}>
                <div className="container" style={{ maxWidth: 780 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                        <span className="logo" style={{ fontSize: "1.1rem" }}>
                            Net<span className="logo-dot">Pulse</span>
                        </span>
                        {companyName && (
                            <>
                                <span style={{ color: "var(--border)", fontSize: "1.2rem" }}>|</span>
                                <span style={{ fontWeight: 700, fontSize: "1rem", color: "var(--text-primary)" }}>{companyName}</span>
                            </>
                        )}
                        <span style={{ color: "var(--text-muted)", fontSize: "0.875rem", marginLeft: companyName ? 0 : 4 }}>Status</span>
                    </div>
                    {statusDesc && (
                        <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem", marginTop: 8, marginLeft: 0 }}>
                            {statusDesc}
                        </p>
                    )}
                </div>
            </div>

            <div className="container" style={{ maxWidth: 780 }}>
                {/* Overall status banner */}
                <div style={{
                    padding: "18px 24px",
                    borderRadius: "var(--radius-lg)",
                    background: anyDown ? "var(--red-bg)" : "var(--green-bg)",
                    border: `1px solid ${anyDown ? "var(--red)" : "var(--green)"}`,
                    marginBottom: 40,
                    display: "flex",
                    alignItems: "center",
                    gap: 14,
                }}>
                    <div style={{ width: 12, height: 12, borderRadius: "50%", background: anyDown ? "var(--red)" : "var(--green)", flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: "1.125rem", color: anyDown ? "var(--red)" : "var(--green)" }}>
                            {anyDown ? "Degraded Performance" : allUp ? "All Systems Operational" : "Monitoring Active"}
                        </div>
                        <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: 2 }}>
                            Last updated: {new Date().toUTCString()}
                        </div>
                    </div>
                </div>

                {/* Monitor list */}
                {!monitors || monitors.length === 0 ? (
                    <div className="empty-state">
                        <h3>No monitors found</h3>
                        <p>This status page has no active monitors configured.</p>
                    </div>
                ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                        {monitors.map((monitor) => {
                            const logs = logsMap[monitor.id] ?? [];
                            const upLogs = logs.filter((l) => l.status === "up").length;
                            const uptimePct = logs.length > 0 ? Math.round((upLogs / logs.length) * 100) : null;
                            return (
                                <div key={monitor.id} className="card" style={{ padding: "20px 24px" }}>
                                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16, gap: 12 }}>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ fontWeight: 600, fontSize: "1rem", marginBottom: 4 }}>{monitor.name}</div>
                                            <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }} className="mono">
                                                {monitor.url}
                                            </div>
                                        </div>
                                        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                                            <span className={`status-pill status-${monitor.current_status}`}>{monitor.current_status}</span>
                                            {uptimePct !== null && (
                                                <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>{uptimePct}% · 90 days</span>
                                            )}
                                        </div>
                                    </div>
                                    <UptimeBar logs={logs} days={90} />
                                </div>
                            );
                        })}
                    </div>
                )}

                <div style={{ textAlign: "center", marginTop: 56, color: "var(--text-muted)", fontSize: "0.78rem" }}>
                    Powered by <span style={{ color: "var(--accent)", fontWeight: 600 }}>NetPulse</span>
                </div>
            </div>
        </div>
    );
}
