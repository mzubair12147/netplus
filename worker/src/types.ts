export type MonitorStatus = "up" | "down" | "pending";
export type CheckStatus = "up" | "down" | "timeout" | "error";

export interface CheckResult {
    status: CheckStatus;
    httpStatusCode: number | null;
    latencyMs: number;
    errorMessage: string | null;
}

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
    monitor_type: "http" | "keyword";
    keyword: string | null;
}

export interface UpdateMonitorState {
    monitorId: string;
    consecutive_failures: number;
    current_status: MonitorStatus;
    next_check_at: string;
}

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
