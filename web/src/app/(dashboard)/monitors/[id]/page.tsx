import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import MonitorDetailClient from "./MonitorDetailClient";
import type { Metadata } from "next";

interface Props { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { id } = await params;
    const supabase = await createClient();
    const { data } = await supabase.from("monitors").select("name").eq("id", id).single();
    return { title: data?.name ?? "Monitor Detail" };
}

export default async function MonitorDetailPage({ params }: Props) {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const { data: monitor } = await supabase
        .from("monitors")
        .select("*")
        .eq("id", id)
        .eq("user_id", user!.id)
        .single();

    if (!monitor) notFound();

    // Last 100 ping logs
    const { data: pingLogs } = await supabase
        .from("ping_logs")
        .select("*")
        .eq("monitor_id", id)
        .order("checked_at", { ascending: false })
        .limit(100);

    // 90 days of logs for uptime bar
    const since90 = new Date(Date.now() - 90 * 86400000).toISOString();
    const { data: allLogs } = await supabase
        .from("ping_logs")
        .select("checked_at, status")
        .eq("monitor_id", id)
        .gte("checked_at", since90)
        .order("checked_at", { ascending: true });

    // Incidents
    const { data: incidents } = await supabase
        .from("incidents")
        .select("*")
        .eq("monitor_id", id)
        .order("started_at", { ascending: false })
        .limit(20);

    return (
        <MonitorDetailClient
            monitor={monitor}
            pingLogs={pingLogs ?? []}
            allLogs={allLogs ?? []}
            incidents={incidents ?? []}
        />
    );
}
