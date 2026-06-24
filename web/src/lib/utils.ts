import { type ClassValue, clsx } from "clsx";

export function cn(...inputs: ClassValue[]) {
    return inputs.filter(Boolean).join(" ");
}

export function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
    });
}

export function formatDuration(startedAt: string, resolvedAt?: string | null): string {
    const start = new Date(startedAt).getTime();
    const end = resolvedAt ? new Date(resolvedAt).getTime() : Date.now();
    const diffMs = end - start;
    const minutes = Math.floor(diffMs / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    return `${minutes}m`;
}

export function uptimePercent(logs: { status: string }[]): number {
    if (!logs.length) return 100;
    const up = logs.filter((l) => l.status === "up").length;
    return Math.round((up / logs.length) * 1000) / 10;
}
