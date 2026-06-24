import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data, error } = await supabase
        .from("alert_channels")
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
    const { type, destination } = body;

    if (!["email", "webhook"].includes(type)) {
        return NextResponse.json({ error: "Type must be 'email' or 'webhook'" }, { status: 400 });
    }
    if (!destination || typeof destination !== "string" || destination.trim().length === 0) {
        return NextResponse.json({ error: "Destination is required" }, { status: 400 });
    }
    if (type === "webhook") {
        try { new URL(destination); } catch {
            return NextResponse.json({ error: "Invalid webhook URL" }, { status: 400 });
        }
    }

    const { data, error } = await supabase
        .from("alert_channels")
        .insert({ user_id: user.id, type, destination: destination.trim() })
        .select()
        .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data, { status: 201 });
}
