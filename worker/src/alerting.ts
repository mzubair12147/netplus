import { supabase, RESEND_API_KEY } from "./config";

interface AlertPayload {
    type: "opened" | "resolved";
    monitorName: string;
    monitorUrl: string;
    cause?: string | null;
    startedAt: string;
    resolvedAt?: string | null;
    downtimeMinutes?: number;
}

function buildWebhookText(payload: AlertPayload): string {
    if (payload.type === "opened") {
        return `🔴 Monitor '${payload.monitorName}' is DOWN — cause: ${payload.cause ?? "unknown"} (started ${new Date(payload.startedAt).toUTCString()})`;
    }
    const duration =
        payload.downtimeMinutes !== undefined
            ? `${payload.downtimeMinutes} minute${payload.downtimeMinutes !== 1 ? "s" : ""}`
            : "unknown duration";
    return `✅ Monitor '${payload.monitorName}' has RECOVERED — was down for ${duration}`;
}

async function sendWebhook(
    destination: string,
    payload: AlertPayload,
): Promise<void> {
    const text = buildWebhookText(payload);
    const response = await fetch(destination, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
    });
    if (!response.ok) {
        throw new Error(
            `Webhook POST to ${destination} failed with status ${response.status}`,
        );
    }
}

async function sendEmail(
    destination: string,
    payload: AlertPayload,
): Promise<void> {
    if (!RESEND_API_KEY) {
        // Graceful stub — log instead of throwing so missing key doesn't break the flow
        console.warn(
            `[ALERT STUB] Email to ${destination}: ${buildWebhookText(payload)}`,
        );
        return;
    }

    const subject =
        payload.type === "opened"
            ? `🔴 Monitor '${payload.monitorName}' is DOWN`
            : `✅ Monitor '${payload.monitorName}' has RECOVERED`;

    const html =
        payload.type === "opened"
            ? `<h2>Monitor Down Alert</h2>
               <p><strong>Monitor:</strong> ${payload.monitorName}</p>
               <p><strong>URL:</strong> <a href="${payload.monitorUrl}">${payload.monitorUrl}</a></p>
               <p><strong>Cause:</strong> ${payload.cause ?? "Unknown"}</p>
               <p><strong>Started at:</strong> ${new Date(payload.startedAt).toUTCString()}</p>`
            : `<h2>Monitor Recovered</h2>
               <p><strong>Monitor:</strong> ${payload.monitorName}</p>
               <p><strong>URL:</strong> <a href="${payload.monitorUrl}">${payload.monitorUrl}</a></p>
               <p><strong>Downtime:</strong> ${payload.downtimeMinutes ?? "?"} minutes</p>`;

    const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
            Authorization: `Bearer ${RESEND_API_KEY}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            from: "NetPulse <alerts@netpulse.app>",
            to: [destination],
            subject,
            html,
        }),
    });

    if (!response.ok) {
        const body = await response.text();
        throw new Error(`Resend API error ${response.status}: ${body}`);
    }
}

/**
 * Fetches alert channels for the monitor's owner and fires all alerts concurrently.
 * Uses Promise.allSettled — a bad webhook URL won't block the email.
 */
export async function sendAlerts(
    monitorId: string,
    monitorName: string,
    monitorUrl: string,
    payload: AlertPayload,
): Promise<void> {
    // Get monitor's user_id to look up their alert channels
    const { data: monitorRow, error: monitorErr } = await supabase
        .from("monitors")
        .select("user_id")
        .eq("id", monitorId)
        .single();

    if (monitorErr || !monitorRow) {
        console.error(
            `[ALERT] Could not fetch user_id for monitor ${monitorId}:`,
            monitorErr?.message,
        );
        return;
    }

    const { data: channels, error: channelErr } = await supabase
        .from("alert_channels")
        .select("*")
        .eq("user_id", monitorRow.user_id)
        .eq("is_active", true);

    if (channelErr || !channels || channels.length === 0) {
        if (channelErr) {
            console.error("[ALERT] Failed to fetch alert channels:", channelErr.message);
        }
        return;
    }

    const tasks = channels.map(async (channel) => {
        try {
            if (channel.type === "email") {
                await sendEmail(channel.destination, payload);
            } else if (channel.type === "webhook") {
                await sendWebhook(channel.destination, payload);
            }
        } catch (err) {
            console.error(
                `[ALERT] Failed to send ${channel.type} alert to ${channel.destination}:`,
                err,
            );
        }
    });

    await Promise.allSettled(tasks);
}
