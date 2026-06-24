"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { Activity, LogOut, ExternalLink } from "lucide-react";

export default function Navbar({ user }: { user: User }) {
    const router = useRouter();

    async function handleSignOut() {
        const supabase = createClient();
        await supabase.auth.signOut();
        router.push("/login");
        router.refresh();
    }

    return (
        <nav className="navbar">
            <div className="container navbar-inner">
                <Link href="/dashboard" className="logo">
                    <Activity size={18} color="var(--accent)" />
                    Net<span className="logo-dot">Pulse</span>
                </Link>

                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <Link
                        href={`/status/${user.id}`}
                        target="_blank"
                        className="btn btn-ghost btn-sm"
                        title="View your public status page"
                    >
                        <ExternalLink size={13} />
                        Status page
                    </Link>

                    <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                        {user.email}
                    </span>

                    <button
                        id="signout-btn"
                        onClick={handleSignOut}
                        className="btn btn-ghost btn-sm"
                        title="Sign out"
                    >
                        <LogOut size={13} />
                    </button>
                </div>
            </div>
        </nav>
    );
}
