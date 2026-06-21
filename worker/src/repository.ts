// import { createClient } from "@supabase/supabase-js";
// import type { Monitor, UpdateMonitorState } from "./types";
// import type { Database } from "../../types/database.types";

// const SUPABASE_URL = process.env.SUPABASE_URL;
// const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
//     process.exit(1);
// }

// const supabase = createClient<Database>(
//     SUPABASE_URL,
//     SUPABASE_SERVICE_ROLE_KEY,
// );

// export async function getDueMonitors() {
//     try {
//         const now = new Date().toISOString();
//         const { data, error } = await supabase
//             .from("monitors")
//             .select("*")
//             .eq("is_active", true)
//             .lte("next_check_at", now);

//         if (error) {
//             console.error(
//                 "[DB ERROR] Could not fetch due monitors:",
//                 error.message,
//             );

//             throw new Error(`Failed to fetch monitors: ${error.message}`);
//         }

//         return data ?? [];
//     } catch (e) {
//         console.error(
//             "[CRITICAL] Worker crashed while getting monitors Supabase:",
//             e,
//         );
//         throw e;
//     }
// }

// export async function insertPingLog(
//     pingLog: Database["public"]["Tables"]["ping_logs"]["Insert"],
// ) {
//     try {
//         const { error } = await supabase.from("ping_logs").insert({
//             ...pingLog,
//         });

//         if (error) {
//             console.error(
//                 "[DB ERROR] Failed to Insert Ping Log into Supabase",
//                 error.message,
//             );

//             throw new Error(`Failed to Insert PingLog: ${error.message}`);
//         }
//     } catch (error) {
//         console.error("[CRITICAL] Worker crashed while insert Ping Log", error);
//         throw error;
//     }
// }

// export async function updateMonitorState({
//     monitorId,
//     check_interval_seconds,
//     consecutive_failures,
//     next_check_at,
// }: UpdateMonitorState) {
//     try {
//         const { data, error } = await supabase
//             .from("monitors")
//             .update({
//                 check_interval_seconds,
//                 consecutive_failures,
//                 next_check_at,
//             })
//             .eq("id", monitorId)
//             .select("*");

//         if (error) {
//             console.error(
//                 "[DB ERROR] Failed to Update Monitor in supabase",
//                 error.message,
//             );

//             throw new Error(`Failed to update monitor state: ${error.message}`);
//         }

//         return data;
//     } catch (error) {
//         console.error(
//             "[CRITICAL] Worker crashed while updating monitor state",
//             error,
//         );
//         throw error;
//     }
// }

// export async function openIncident(monitorId: string, cause: string) {
//     try {
//         const { data, error } = await supabase.from("incidents").insert({
//             monitor_id: monitorId,
//             cause: cause,
//         });

//         if (error) {
//             console.error(
//                 `[DB ERROR] Failed to open incident for monitor Id: ${monitorId}`,
//                 error.message,
//             );

//             throw new Error(`Failed to Open Incident: ${error.message}`);
//         }

//         return data;
//     } catch (error) {
//         console.error(
//             "[CRITICAL] Worker crashed while Opening incident",
//             error,
//         );
//         throw error;
//     }
// }

// export async function resolveOpenIncident(monitorId: string) {
//     try {
//         const now = new Date().toISOString();
//         const { data, error } = await supabase
//             .from("incidents")
//             .update({ resolved_at: now })
//             .eq("monitor_id", monitorId)
//             .is("resolved_at", null);

//         if (error) {
//             console.error(
//                 "[DB ERROR] Failed to resolve open incident at supabase",
//                 error.message,
//             );

//             throw new Error(
//                 `Failed to resolve open incidents: ${error.message}`,
//             );
//         }

//         return data;
//     } catch (error) {
//         console.error(
//             "[CRITICAL] Worker crashed while resolving open incidents",
//             error,
//         );
//         throw error;
//     }
// }

import { createClient } from "@supabase/supabase-js";
import type { Database } from "../../types/database.types";
import type { UpdateMonitorState } from "./types";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error("Missing Supabase environment variables.");
    process.exit(1);
}

const supabase = createClient<Database>(
    SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY,
);

/**
 * DRY Wrapper: Executes a Supabase query and standardizes all error handling.
 */
async function executeDbQuery<T>(
    promise: PromiseLike<{ data: T | null; error: any }>,
    actionName: string,
) {
    try {
        const { data, error } = await promise;

        if (error) {
            console.error(`[DB ERROR] Failed to ${actionName}:`, error.message);
            throw new Error(
                `Database error during ${actionName}: ${error.message}`,
            );
        }

        return data;
    } catch (error) {
        // Prevent double-logging if we just threw the error above
        if (
            error instanceof Error &&
            error.message.startsWith("Database error")
        ) {
            throw error;
        }
        console.error(
            `[CRITICAL] Worker crashed while attempting to ${actionName}:`,
            error,
        );
        throw error;
    }
}

export async function getDueMonitors() {
    const now = new Date().toISOString();
    const data = await executeDbQuery(
        supabase
            .from("monitors")
            .select("*")
            .eq("is_active", true)
            .lte("next_check_at", now),
        "fetch due monitors",
    );
    return data ?? [];
}

export async function insertPingLog(
    pingLog: Database["public"]["Tables"]["ping_logs"]["Insert"],
) {
    return executeDbQuery(
        supabase.from("ping_logs").insert(pingLog),
        "insert ping log",
    );
}

export async function updateMonitorState({
    monitorId,
    current_status,
    consecutive_failures,
    next_check_at,
}: UpdateMonitorState) {
    return executeDbQuery(
        supabase
            .from("monitors")
            .update({
                current_status,
                consecutive_failures,
                next_check_at,
            })
            .eq("id", monitorId),
        `update state for monitor ${monitorId}`,
    );
}

export async function openIncident(monitorId: string, cause: string) {
    return executeDbQuery(
        supabase.from("incidents").insert({
            monitor_id: monitorId,
            cause: cause,
        }),
        `open incident for monitor ${monitorId}`,
    );
}

export async function resolveOpenIncident(monitorId: string) {
    const now = new Date().toISOString();
    return executeDbQuery(
        supabase
            .from("incidents")
            .update({ resolved_at: now })
            .eq("monitor_id", monitorId)
            .is("resolved_at", null),
        `resolve incident for monitor ${monitorId}`,
    );
}
