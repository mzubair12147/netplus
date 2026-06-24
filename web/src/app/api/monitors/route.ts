import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

export async function GET() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data, error } = await supabase
        .from("monitors")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
}

export async function POST(request: Request) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { name, url, expected_status, check_interval_seconds, timeout_ms, monitor_type, keyword } = body;

    // Validation
    if (!name || typeof name !== "string" || name.trim().length === 0) {
        return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }
    try { new URL(url); } catch {
        return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
    }
    const interval = Number(check_interval_seconds);
    if (!interval || interval < 30 || interval > 86400) {
        return NextResponse.json({ error: "Interval must be between 30 and 86400 seconds" }, { status: 400 });
    }
    const type = monitor_type === "keyword" ? "keyword" : "http";
    if (type === "keyword" && (!keyword || typeof keyword !== "string" || keyword.trim().length === 0)) {
        return NextResponse.json({ error: "Keyword is required for keyword monitors" }, { status: 400 });
    }

    const serviceClient = await createServiceClient();
    const { data, error } = await serviceClient
        .from("monitors")
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .insert({
            user_id: user.id,
            name: name.trim(),
            url,
            expected_status: Number(expected_status) || 200,
            check_interval_seconds: interval,
            timeout_ms: Number(timeout_ms) || 10000,
            next_check_at: new Date().toISOString(),
            monitor_type: type,
            keyword: type === "keyword" ? keyword.trim() : null,
        } as any)
        .select()
        .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data, { status: 201 });
}
