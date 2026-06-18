interface Monitor {
    url: string;
    expectedStatus: number;
    timeoutMs: number
}

interface Outputs {
    status: "up" | "down" | "timeout" | "error",
    httpStatusCode: number | null,
    latencyMs: number,
    errorMessage: string | null
}

export default async function checkMonitor({ url, expectedStatus, timeoutMs = 10000 }: Monitor): Outputs {
    const startTime = Date.now();
    const controller = new AbortController();
    const signal = controller.signal

    setTimeout(() => {
        controller.abort();
    }, timeoutMs);

    try {
        const response = await fetch(url, {
            signal
        })

        if (response.status === expectedStatus) {
        }
    } catch (e) {

    }
}