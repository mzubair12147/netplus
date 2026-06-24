import { openIncident, resolveOpenIncident, getMonitorForAlert, getOpenIncident } from "./repository";
import { sendAlerts } from "./alerting";
import { FAILURE_THRESHOLD } from "./config";

export async function handleIncidentState(
    monitorId: string,
    isSuccess: boolean,
    reason: string | null,
    previousFailures: number,
): Promise<void> {
    if (!isSuccess) {
        const newFailures = previousFailures + 1;

        if (
            previousFailures < FAILURE_THRESHOLD &&
            newFailures >= FAILURE_THRESHOLD
        ) {
            const failureReason =
                reason ?? "Monitor check failed without a specific reason provided.";
            await openIncident(monitorId, failureReason);

            // Fire alerts async — don't await so it doesn't block the tick
            const monitor = await getMonitorForAlert(monitorId);
            if (monitor) {
                sendAlerts(monitorId, monitor.name, monitor.url, {
                    type: "opened",
                    monitorName: monitor.name,
                    monitorUrl: monitor.url,
                    cause: failureReason,
                    startedAt: new Date().toISOString(),
                }).catch((err) =>
                    console.error(`[ALERT] sendAlerts failed for monitor ${monitorId}:`, err),
                );
            }
        }
        return;
    } else {
        if (previousFailures >= FAILURE_THRESHOLD) {
            const openIncidentRow = await getOpenIncident(monitorId);
            await resolveOpenIncident(monitorId);

            // Calculate downtime and fire recovery alerts
            const monitor = await getMonitorForAlert(monitorId);
            if (monitor) {
                let downtimeMinutes: number | undefined;
                if (openIncidentRow?.started_at) {
                    downtimeMinutes = Math.round(
                        (Date.now() - new Date(openIncidentRow.started_at).getTime()) / 60000,
                    );
                }
                sendAlerts(monitorId, monitor.name, monitor.url, {
                    type: "resolved",
                    monitorName: monitor.name,
                    monitorUrl: monitor.url,
                    startedAt: openIncidentRow?.started_at ?? new Date().toISOString(),
                    resolvedAt: new Date().toISOString(),
                    downtimeMinutes,
                }).catch((err) =>
                    console.error(`[ALERT] sendAlerts failed for monitor ${monitorId}:`, err),
                );
            }
        }
        return;
    }
}
