import { createClient } from "@/lib/supabase/server";
import DashboardClient from "./DashboardClient";
import OnboardingBanner from "@/components/ui/OnboardingBanner";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const { data: monitors } = await supabase
        .from("monitors")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });

    // Fetch last 24hr ping logs for each monitor to compute uptime %
    const monitorIds = (monitors ?? []).map((m) => m.id);
    let pingMap: Record<string, { status: string }[]> = {};

    if (monitorIds.length > 0) {
        const since = new Date(Date.now() - 86400000).toISOString();
        const { data: logs } = await supabase
            .from("ping_logs")
            .select("monitor_id, status")
            .in("monitor_id", monitorIds)
            .gte("checked_at", since);

        for (const log of logs ?? []) {
            if (!pingMap[log.monitor_id]) pingMap[log.monitor_id] = [];
            pingMap[log.monitor_id]!.push({ status: log.status });
        }
    }

    const isNewUser = (monitors ?? []).length === 0;

    return (
        <>
            {isNewUser && <OnboardingBanner />}
            <DashboardClient
                initialMonitors={monitors ?? []}
                pingMap={pingMap}
                userId={user!.id}
            />
        </>
    );
}
