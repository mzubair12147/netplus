import { createClient } from "@/lib/supabase/server";
import SettingsClient from "./SettingsClient";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const { data: channels } = await supabase
        .from("alert_channels")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: apiKeys } = await (supabase as any)
        .from("api_keys")
        .select("id, name, key_prefix, last_used_at, created_at")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });

    const meta = user!.user_metadata ?? {};

    return (
        <SettingsClient
            initialChannels={channels ?? []}
            initialApiKeys={apiKeys ?? []}
            userId={user!.id}
            userEmail={user!.email ?? ""}
            initialCompanyName={(meta.company_name as string | undefined) ?? ""}
            initialStatusDesc={(meta.status_page_desc as string | undefined) ?? ""}
            fullName={(meta.full_name as string | undefined) ?? ""}
        />
    );
}
