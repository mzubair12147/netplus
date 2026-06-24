interface CheckOptions {
    url: string;
    expectedStatus: number;
    timeoutMs: number;
    monitorType?: "http" | "keyword";
    keyword?: string | null;
}

type StatusEnum = "up" | "down" | "timeout" | "error";

interface Outputs {
    status: StatusEnum;
    httpStatusCode: number | null;
    latencyMs: number;
    errorMessage: string | null;
}

/**
 * HTTP monitor — checks status code only.
 */
async function checkHttp(
    url: string,
    expectedStatus: number,
    timeoutMs: number,
    signal: AbortSignal,
): Promise<Omit<Outputs, "latencyMs">> {
    try {
        const response = await fetch(url, { signal });
        const httpStatusCode = response.status;

        if (response.status === expectedStatus) {
            return { status: "up", httpStatusCode, errorMessage: null };
        }
        return {
            status: "down",
            httpStatusCode,
            errorMessage: `Expected HTTP ${expectedStatus}, got ${response.status}`,
        };
    } catch (e) {
        if (e instanceof Error && e.name === "AbortError") {
            return { status: "timeout", httpStatusCode: null, errorMessage: `Timed out after ${timeoutMs}ms` };
        }
        return { status: "error", httpStatusCode: null, errorMessage: e instanceof Error ? e.message : String(e) };
    }
}

/**
 * Keyword monitor — checks status code AND that a keyword appears in the response body.
 */
async function checkKeyword(
    url: string,
    expectedStatus: number,
    keyword: string,
    timeoutMs: number,
    signal: AbortSignal,
): Promise<Omit<Outputs, "latencyMs">> {
    try {
        const response = await fetch(url, { signal });
        const httpStatusCode = response.status;

        if (response.status !== expectedStatus) {
            return {
                status: "down",
                httpStatusCode,
                errorMessage: `Expected HTTP ${expectedStatus}, got ${response.status}`,
            };
        }

        const body = await response.text();
        if (!body.includes(keyword)) {
            return {
                status: "down",
                httpStatusCode,
                errorMessage: `Keyword "${keyword}" not found in response body`,
            };
        }

        return { status: "up", httpStatusCode, errorMessage: null };
    } catch (e) {
        if (e instanceof Error && e.name === "AbortError") {
            return { status: "timeout", httpStatusCode: null, errorMessage: `Timed out after ${timeoutMs}ms` };
        }
        return { status: "error", httpStatusCode: null, errorMessage: e instanceof Error ? e.message : String(e) };
    }
}

/**
 * Main entry point — dispatches to the correct checker based on monitor_type.
 */
export async function checkMonitor({
    url,
    expectedStatus = 200,
    timeoutMs = 10000,
    monitorType = "http",
    keyword,
}: CheckOptions): Promise<Outputs> {
    const startTime = performance.now();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    let result: Omit<Outputs, "latencyMs">;

    try {
        if (monitorType === "keyword" && keyword) {
            result = await checkKeyword(url, expectedStatus, keyword, timeoutMs, controller.signal);
        } else {
            result = await checkHttp(url, expectedStatus, timeoutMs, controller.signal);
        }
    } finally {
        clearTimeout(timeoutId);
    }

    return {
        ...result,
        latencyMs: Math.round(performance.now() - startTime),
    };
}
