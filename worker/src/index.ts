import { runTick } from "./scheduler";

const TICK_INTERVAL_MS = Number.parseInt(
    process.env.TICK_INTERVAL_MS || "60000",
    10,
);

async function start() {
    console.log(`[SYSTEM] Starting uptime monitor worker...`);
    console.log(`[SYSTEM] Tick interval set to ${TICK_INTERVAL_MS}ms.`);

    try {
        await runTick();
    } catch (error) {
        console.error("[CRITICAL] Initial startup tick failed:", error);
    }

    setInterval(async () => {
        try {
            await runTick();
        } catch (error) {
            console.error(
                "[CRITICAL] Unhandled exception during scheduled tick:",
                error,
            );
        }
    }, TICK_INTERVAL_MS);
}

start();
