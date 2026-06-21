interface Monitor {
    url: string;
    expectedStatus: number;
    timeoutMs: number;
}

type StatusEnum = "up" | "down" | "timeout" | "error";

interface Outputs {
    status: StatusEnum;
    httpStatusCode: number | null;
    latencyMs: number;
    errorMessage: string | null;
}

export async function checkMonitor({
    url,
    expectedStatus = 200,
    timeoutMs = 10000,
}: Monitor): Promise<Outputs> {
    const startTime = performance.now();
    const controller = new AbortController();
    const signal = controller.signal;

    const timeoutId = setTimeout(() => {
        controller.abort();
    }, timeoutMs);

    let status: StatusEnum;
    let httpStatusCode = null;
    let errorMessage: string | null = null;

    try {
        const response = await fetch(url, {
            signal,
        });
        httpStatusCode = response.status;

        if (response.status === expectedStatus) {
            status = "up";
        } else {
            status = "down";
            errorMessage = `Expected status ${expectedStatus}, but got ${response.status}`;
        }
    } catch (e) {
        if (e instanceof Error && e.name === "AbortError") {
            status = "timeout";
            errorMessage = `Request timed out after ${timeoutMs}ms`;
        } else {
            status = "error";
            errorMessage = e instanceof Error ? e.message : JSON.stringify(e);
        }
    } finally {
        clearTimeout(timeoutId);
    }

    const latencyMs = Math.round(performance.now() - startTime);

    return {
        status: status,
        httpStatusCode,
        latencyMs,
        errorMessage: errorMessage,
    };
}
