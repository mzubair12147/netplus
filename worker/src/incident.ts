import { openIncident, resolveOpenIncident } from "./repository";

export const FAILURE_THRESHOLD = Number.parseInt(
    process.env.FAILURE_THRESHOLD || "3",
    10,
);

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
                reason ??
                "Monitor check failed without a specific reason provided.";
            await openIncident(monitorId, failureReason);
        }
        return;
    } else {
        if (previousFailures >= FAILURE_THRESHOLD) {
            await resolveOpenIncident(monitorId);
        }
        return;
    }
}
