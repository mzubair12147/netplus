import { createClient } from "@/lib/supabase/server";
import IncidentsClient from "./IncidentsClient";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Incidents" };

export default async function IncidentsPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Get all monitor IDs for this user
    const { data: monitors } = await supabase
        .from("monitors")
        .select("id, name")
        .eq("user_id", user!.id);

    const monitorIds = (monitors ?? []).map((m) => m.id);
    const monitorNames: Record<string, string> = {};
    for (const m of monitors ?? []) monitorNames[m.id] = m.name;

    let incidents: any[] = [];
    if (monitorIds.length > 0) {
        const { data } = await supabase
            .from("incidents")
            .select("*")
            .in("monitor_id", monitorIds)
            .order("started_at", { ascending: false })
            .limit(100);
        incidents = data ?? [];
    }

    return <IncidentsClient incidents={incidents} monitorNames={monitorNames} />;
}
