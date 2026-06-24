import MonitorForm from "@/components/monitors/MonitorForm";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "New Monitor" };

export default function NewMonitorPage() {
    return (
        <>
            <div className="page-header">
                <div>
                    <h1 className="page-title">New Monitor</h1>
                    <p className="page-subtitle">Add a URL to start monitoring its uptime</p>
                </div>
            </div>
            <div className="card" style={{ maxWidth: 640 }}>
                <MonitorForm mode="create" />
            </div>
        </>
    );
}
