import {
    getDueMonitors,
    insertPingLog,
    updateMonitorState,
    openIncident,
    resolveOpenIncident,
} from "../src/repository";

async function runTests() {
    // ⚠️ REPLACE THIS WITH A REAL MONITOR ID FROM YOUR SUPABASE TABLE
    const TEST_MONITOR_ID = "YOUR-UUID-GOES-HERE";

    console.log("--- Starting Repository Tests ---");

    try {
        console.log("\n1. Testing getDueMonitors...");
        const monitors = await getDueMonitors();
        console.log(`✅ Success! Found ${monitors.length} due monitors.`);

        console.log("\n2. Testing insertPingLog...");
        await insertPingLog({
            monitor_id: TEST_MONITOR_ID,
            http_status_code: 200,
            latency_ms: 125,
            status: "up",
        });
        console.log("✅ Success! Ping log inserted.");

        console.log("\n3. Testing updateMonitorState...");
        // Mocking the orchestrator's math: setting the next check 5 minutes from now
        const nextCheck = new Date(Date.now() + 5 * 60 * 1000).toISOString();
        await updateMonitorState({
            monitorId: TEST_MONITOR_ID,
            current_status: "up",
            consecutive_failures: 0,
            next_check_at: nextCheck,
        });
        console.log("✅ Success! Monitor state updated.");

        console.log("\n4. Testing openIncident...");
        await openIncident(
            TEST_MONITOR_ID,
            "Testing automated timeout failure",
        );
        console.log(
            "✅ Success! Incident opened. (Check your DB to ensure resolved_at is null)",
        );

        console.log("\n5. Testing resolveOpenIncident...");
        await resolveOpenIncident(TEST_MONITOR_ID);
        console.log(
            "✅ Success! Incident resolved. (Check your DB to ensure resolved_at has a timestamp)",
        );

        console.log("\n🎉 All repository tests passed!");
    } catch (error) {
        console.error("\n❌ Test Suite Failed:", error);
    }
}

runTests();
