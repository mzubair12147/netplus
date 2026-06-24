import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createHash, randomBytes } from "crypto";

/** Generate a secure API key: np_<32 random hex chars> */
function generateKey(): string {
    return `np_${randomBytes(24).toString("hex")}`;
}

function hashKey(key: string): string {
    return createHash("sha256").update(key).digest("hex");
}

// GET — list all API keys for the user (never return the raw key)
export async function GET() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
        .from("api_keys")
        .select("id, name, key_prefix, last_used_at, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data ?? []);
}

// POST — create a new API key; returns the raw key ONCE
export async function POST(request: Request) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const name = typeof body.name === "string" ? body.name.trim() : "";
    if (!name) return NextResponse.json({ error: "Key name is required" }, { status: 400 });

    // Enforce a reasonable limit
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { count } = await (supabase as any)
        .from("api_keys")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id);
    if ((count ?? 0) >= 10) {
        return NextResponse.json({ error: "Maximum of 10 API keys per account" }, { status: 400 });
    }

    const rawKey = generateKey();
    const hashed = hashKey(rawKey);
    const prefix = rawKey.slice(0, 10); // "np_" + 7 chars shown in UI

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
        .from("api_keys")
        .insert({ user_id: user.id, name, hashed_key: hashed, key_prefix: prefix })
        .select("id, name, key_prefix, created_at")
        .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Return the raw key ONCE — it will never be retrievable again
    return NextResponse.json({ ...data, raw_key: rawKey }, { status: 201 });
}
