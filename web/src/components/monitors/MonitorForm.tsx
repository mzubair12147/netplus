"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface MonitorFormProps {
    mode: "create" | "edit";
    initialValues?: {
        name: string;
        url: string;
        expected_status: number;
        check_interval_seconds: number;
        timeout_ms: number;
        is_active: boolean;
    };
    monitorId?: string;
}

const INTERVAL_OPTIONS = [
    { label: "30 seconds", value: 30 },
    { label: "1 minute", value: 60 },
    { label: "5 minutes", value: 300 },
    { label: "10 minutes", value: 600 },
    { label: "30 minutes", value: 1800 },
    { label: "1 hour", value: 3600 },
];

export default function MonitorForm({ mode, initialValues, monitorId }: MonitorFormProps) {
    const router = useRouter();
    const [name, setName] = useState(initialValues?.name ?? "");
    const [url, setUrl] = useState(initialValues?.url ?? "");
    const [expectedStatus, setExpectedStatus] = useState(initialValues?.expected_status ?? 200);
    const [interval, setInterval] = useState(initialValues?.check_interval_seconds ?? 60);
    const [timeout, setTimeout_] = useState(initialValues?.timeout_ms ?? 10000);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);
        setLoading(true);

        const body = {
            name,
            url,
            expected_status: expectedStatus,
            check_interval_seconds: interval,
            timeout_ms: timeout,
        };

        const endpoint = mode === "create" ? "/api/monitors" : `/api/monitors/${monitorId}`;
        const method = mode === "create" ? "POST" : "PATCH";

        const res = await fetch(endpoint, {
            method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
        });

        const data = await res.json();
        if (!res.ok) {
            setError(data.error ?? "Something went wrong");
            setLoading(false);
        } else {
            router.push(mode === "create" ? `/monitors/${data.id}` : `/monitors/${monitorId}`);
            router.refresh();
        }
    }

    return (
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 560 }}>
            {error && <div className="alert alert-error">{error}</div>}

            <div className="form-group">
                <label className="form-label" htmlFor="monitor-name">Monitor name</label>
                <input
                    id="monitor-name"
                    type="text"
                    className="form-input"
                    placeholder="My Production API"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                />
            </div>

            <div className="form-group">
                <label className="form-label" htmlFor="monitor-url">URL to monitor</label>
                <input
                    id="monitor-url"
                    type="url"
                    className="form-input"
                    placeholder="https://api.example.com/health"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    required
                />
                <span className="form-hint">Must include https:// — we&apos;ll send a GET request to this URL</span>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div className="form-group">
                    <label className="form-label" htmlFor="expected-status">Expected status</label>
                    <input
                        id="expected-status"
                        type="number"
                        className="form-input"
                        value={expectedStatus}
                        onChange={(e) => setExpectedStatus(Number(e.target.value))}
                        min={100}
                        max={599}
                        required
                    />
                    <span className="form-hint">e.g. 200, 201, 204</span>
                </div>

                <div className="form-group">
                    <label className="form-label" htmlFor="check-interval">Check interval</label>
                    <select
                        id="check-interval"
                        className="form-input form-select"
                        value={interval}
                        onChange={(e) => setInterval(Number(e.target.value))}
                    >
                        {INTERVAL_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="form-group">
                <label className="form-label" htmlFor="timeout">Timeout (ms)</label>
                <input
                    id="timeout"
                    type="number"
                    className="form-input"
                    value={timeout}
                    onChange={(e) => setTimeout_(Number(e.target.value))}
                    min={1000}
                    max={30000}
                    step={1000}
                />
                <span className="form-hint">How long to wait before declaring a timeout (1000–30000ms)</span>
            </div>

            <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
                <button
                    id="monitor-submit"
                    type="submit"
                    className="btn btn-primary"
                    disabled={loading}
                >
                    {loading ? <><span className="spinner" style={{ width: 14, height: 14 }} /> Saving…</> : mode === "create" ? "Create monitor" : "Save changes"}
                </button>
                <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={() => router.back()}
                >
                    Cancel
                </button>
            </div>
        </form>
    );
}
