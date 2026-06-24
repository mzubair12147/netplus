import type { Metadata } from "next";
import "./globals.css";
import { ToastProvider } from "@/components/ui/ToastProvider";

export const metadata: Metadata = {
    title: {
        default: "NetPulse — Uptime Monitoring",
        template: "%s | NetPulse",
    },
    description:
        "Production-grade uptime monitoring for developers. Monitor your APIs, get instant alerts, and never miss downtime.",
    keywords: ["uptime monitoring", "API monitoring", "status page", "incident management"],
    openGraph: {
        title: "NetPulse — Uptime Monitoring",
        description: "Production-grade uptime monitoring for developers. Monitor your APIs, get instant alerts, and never miss downtime.",
        url: "https://netpulse.app",
        siteName: "NetPulse",
        images: [
            {
                url: "https://netpulse.app/og-image.jpg",
                width: 1200,
                height: 630,
            },
        ],
        locale: "en_US",
        type: "website",
    },
    twitter: {
        card: "summary_large_image",
        title: "NetPulse — Uptime Monitoring",
        description: "Production-grade uptime monitoring for developers. Monitor your APIs, get instant alerts, and never miss downtime.",
        images: ["https://netpulse.app/og-image.jpg"],
    },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en">
            <head>
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
            </head>
            <body>
                <ToastProvider>{children}</ToastProvider>
            </body>
        </html>
    );
}
