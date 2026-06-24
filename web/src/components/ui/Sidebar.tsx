"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Plus, AlertTriangle, Settings } from "lucide-react";

const navItems = [
    { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { href: "/monitors/new", icon: Plus, label: "New Monitor" },
    { href: "/incidents", icon: AlertTriangle, label: "Incidents" },
    { href: "/settings", icon: Settings, label: "Settings" },
];

export default function Sidebar() {
    const pathname = usePathname();

    return (
        <aside className="sidebar">
            {navItems.map(({ href, icon: Icon, label }) => {
                const isActive =
                    href === "/dashboard"
                        ? pathname === "/dashboard"
                        : pathname.startsWith(href);
                return (
                    <Link
                        key={href}
                        href={href}
                        className={`sidebar-link${isActive ? " active" : ""}`}
                    >
                        <Icon size={15} />
                        {label}
                    </Link>
                );
            })}
        </aside>
    );
}
