import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database.types";

type MonitorUpdate = Database["public"]["Tables"]["monitors"]["Update"];

interface Params { params: Promise<{ id: string }> }

export async function GET(_req: Request, { params }: Params) {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: monitor, error } = await supabase
        .from("monitors")
        .select("*")
        .eq("id", id)
        .eq("user_id", user.id)
        .single();

    if (error || !monitor) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const { data: pingLogs } = await supabase
        .from("ping_logs")
        .select("*")
        .eq("monitor_id", id)
        .order("checked_at", { ascending: false })
        .limit(100);

    const { data: incidents } = await supabase
        .from("incidents")
        .select("*")
        .eq("monitor_id", id)
        .order("started_at", { ascending: false })
        .limit(20);

    return NextResponse.json({ monitor, pingLogs: pingLogs ?? [], incidents: incidents ?? [] });
}

export async function PATCH(request: Request, { params }: Params) {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: existing } = await supabase
        .from("monitors")
        .select("id")
        .eq("id", id)
        .eq("user_id", user.id)
        .single();
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const body = await request.json();
    const update: MonitorUpdate = {};
    const allowed = ["name", "url", "expected_status", "check_interval_seconds", "timeout_ms", "is_active"] as const;
    for (const field of allowed) {
        if (field in body) {
            (update as Record<string, unknown>)[field] = body[field];
        }
    }

    const serviceClient = await createServiceClient();
    const { data, error } = await serviceClient
        .from("monitors")
        .update(update)
        .eq("id", id)
        .select()
        .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
}

export async function DELETE(_req: Request, { params }: Params) {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: existing } = await supabase
        .from("monitors")
        .select("id")
        .eq("id", id)
        .eq("user_id", user.id)
        .single();
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const serviceClient = await createServiceClient();
    const { error } = await serviceClient.from("monitors").delete().eq("id", id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
}
