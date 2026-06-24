import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import MonitorForm from "@/components/monitors/MonitorForm";
import type { Metadata } from "next";

interface Props { params: Promise<{ id: string }> }

export const metadata: Metadata = { title: "Edit Monitor" };

export default async function EditMonitorPage({ params }: Props) {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const { data: monitor } = await supabase
        .from("monitors")
        .select("*")
        .eq("id", id)
        .eq("user_id", user!.id)
        .single();

    if (!monitor) notFound();

    return (
        <>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Edit Monitor</h1>
                    <p className="page-subtitle">{monitor.name}</p>
                </div>
            </div>
            <div className="card" style={{ maxWidth: 640 }}>
                <MonitorForm
                    mode="edit"
                    monitorId={id}
                    initialValues={{
                        name: monitor.name,
                        url: monitor.url,
                        expected_status: monitor.expected_status,
                        check_interval_seconds: monitor.check_interval_seconds,
                        timeout_ms: monitor.timeout_ms,
                        is_active: monitor.is_active,
                    }}
                />
            </div>
        </>
    );
}
