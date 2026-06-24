import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
    title: {
        default: "NetPulse — Uptime Monitoring",
        template: "%s | NetPulse",
    },
    description:
        "Production-grade uptime monitoring for developers. Monitor your APIs, get instant alerts, and never miss downtime.",
    keywords: ["uptime monitoring", "API monitoring", "status page", "incident management"],
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
            <head>
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
            </head>
            <body>{children}</body>
        </html>
    );
}
