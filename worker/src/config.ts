import { createClient } from "@supabase/supabase-js";
import type { Database } from "../../types/database.types";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error(
        "[FATAL] Missing required environment variables: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY",
    );
    process.exit(1);
}

export const supabase = createClient<Database>(
    SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY,
    {
        auth: {
            persistSession: false,
            detectSessionInUrl: false,
        },
    },
);

export const TICK_INTERVAL_MS = parseInt(
    process.env.TICK_INTERVAL_MS ?? "60000",
    10,
);

export const FAILURE_THRESHOLD = parseInt(
    process.env.FAILURE_THRESHOLD ?? "3",
    10,
);

export const RESEND_API_KEY = process.env.RESEND_API_KEY ?? null;