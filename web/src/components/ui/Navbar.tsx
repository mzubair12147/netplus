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

    // Prefer full_name from user metadata, fall back to email prefix
    const displayName: string =
        (user.user_metadata?.full_name as string | undefined)?.trim() ||
        user.email?.split("@")[0] ||
        "User";

    const initials = displayName
        .split(" ")
        .slice(0, 2)
        .map((w: string) => w[0])
        .join("")
        .toUpperCase();

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

                    {/* User avatar + name */}
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div
                            style={{
                                width: 30,
                                height: 30,
                                borderRadius: "50%",
                                background: "linear-gradient(135deg, var(--accent), #7c3aed)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: "0.7rem",
                                fontWeight: 700,
                                color: "#fff",
                                flexShrink: 0,
                            }}
                        >
                            {initials}
                        </div>
                        <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)", maxWidth: 140, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {displayName}
                        </span>
                    </div>

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
