export interface Env {
    SUPABASE_URL: string;
    SUPABASE_SERVICE_ROLE_KEY: string;
}

export interface WorkerContext {
    env: Env;
    fetch: typeof fetch;
}

export interface CheckResult {}

// monitor table types
export type MonitorStatus = "up" | "down" | "pending";

export interface Monitor {
    id: string;
    user_id: string;
    name: string;
    url: string;
    expected_status: number;
    check_interval_seconds: number;
    timeout_ms: number;
    is_active: boolean;
    next_check_at: string;
    current_status: MonitorStatus;
    consecutive_failures: number;
    created_at: string;
}

export interface UpdateMonitorState {
    monitorId: string;
    consecutive_failures: number;
    current_status: MonitorStatus;
    next_check_at: string;
    // check_interval_seconds: number;
}

// Optional: Types for inserting or updating records (omitting auto-generated fields)
export type InsertMonitor = Omit<Monitor, "id" | "created_at"> &
    Partial<
        Pick<
            Monitor,
            | "id"
            | "created_at"
            | "expected_status"
            | "check_interval_seconds"
            | "timeout_ms"
            | "is_active"
            | "next_check_at"
            | "current_status"
            | "consecutive_failures"
        >
    >;

export type UpdateMonitor = Partial<Omit<Monitor, "id" | "created_at">>;
