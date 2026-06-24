import { checkMonitor } from "./checker";
import {
    insertPingLog,
    updateMonitorState,
    getDueMonitors,
} from "./repository";
import { handleIncidentState } from "./incident";
import type { Monitor, MonitorStatus } from "./types";

export async function processMonitor(monitor: Monitor): Promise<void> {
    const checkResult = await checkMonitor({
        url: monitor.url,
        expectedStatus: monitor.expected_status,
        timeoutMs: monitor.timeout_ms,
        monitorType: monitor.monitor_type ?? "http",
        keyword: monitor.keyword ?? null,
    });

    await insertPingLog({
        monitor_id: monitor.id,
        status: checkResult.status,
        checked_at: new Date().toISOString(),
        error_message: checkResult.errorMessage,
        http_status_code: checkResult.httpStatusCode,
        latency_ms: checkResult.latencyMs,
    });

    const previousFailures = monitor.consecutive_failures;
    const newFailures = checkResult.status === "up" ? 0 : previousFailures + 1;

    const nextCheckAt = new Date(
        Date.now() + monitor.check_interval_seconds * 1000,
    ).toISOString();
    const currentStatus = checkResult.status === "up" ? "up" : "down";

    await updateMonitorState({
        monitorId: monitor.id,
        current_status: currentStatus,
        consecutive_failures: newFailures,
        next_check_at: nextCheckAt,
    });

    const reason = checkResult.errorMessage;

    await handleIncidentState(
        monitor.id,
        checkResult.status === "up",
        reason,
        previousFailures,
    );
}

export async function runTick(): Promise<void> {
    const dueMonitors = await getDueMonitors();

    if (!dueMonitors || dueMonitors.length === 0) {
        return;
    }

    const results = await Promise.allSettled(
        dueMonitors.map((monitor) =>
            processMonitor({
                ...monitor,
                current_status: monitor.current_status as MonitorStatus,
            }),
        ),
    );

    results.forEach((result, index) => {
        if (result.status === "rejected") {
            const failedMonitorId = dueMonitors[index]?.id;
            console.error(
                `[TICK ERROR] Internal failure while processing monitor ${failedMonitorId}:`,
                result.reason,
            );
        }
    });
}
