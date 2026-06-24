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

    return <SettingsClient initialChannels={channels ?? []} userId={user!.id} userEmail={user!.email ?? ""} />;
}
