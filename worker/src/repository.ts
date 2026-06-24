import { supabase } from "./config";
import type { Database } from "../../types/database.types";
import type { UpdateMonitorState } from "./types";

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

export async function getMonitorForAlert(monitorId: string) {
    const { data, error } = await supabase
        .from("monitors")
        .select("id, name, url, user_id")
        .eq("id", monitorId)
        .single();

    if (error) {
        console.error(`[DB] Could not fetch monitor ${monitorId} for alert:`, error.message);
        return null;
    }
    return data;
}

export async function getOpenIncident(monitorId: string) {
    const { data, error } = await supabase
        .from("incidents")
        .select("started_at")
        .eq("monitor_id", monitorId)
        .is("resolved_at", null)
        .order("started_at", { ascending: false })
        .limit(1)
        .single();

    if (error) return null;
    return data;
}
