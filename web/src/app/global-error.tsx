"use client";

// global-error.tsx handles crashes IN the root layout itself (e.g. layout.tsx throws).
// It MUST include its own <html> and <body> tags since it replaces the entire layout.

import { Activity, RefreshCw } from "lucide-react";

interface Props {
    error: Error & { digest?: string };
    reset: () => void;
}

export default function GlobalError({ reset }: Props) {
    return (
        <html lang="en">
            <head>
                <title>Critical Error · NetPulse</title>
                <meta name="viewport" content="width=device-width, initial-scale=1" />
                <style>{`
                    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
                    body {
                        background: #0a0b0f;
                        color: #e4e4e7;
                        font-family: -apple-system, BlinkMacSystemFont, 'Inter', sans-serif;
                        min-height: 100vh;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        padding: 40px 24px;
                    }
                    .wrap { text-align: center; max-width: 480px; width: 100%; }
                    .logo { font-size: 1.1rem; font-weight: 700; display: inline-flex; align-items: center; gap: 8px; margin-bottom: 40px; color: #e4e4e7; text-decoration: none; }
                    .logo span { color: #6366f1; }
                    .code { font-size: clamp(4rem, 12vw, 7rem); font-weight: 900; letter-spacing: -0.05em; line-height: 1; color: #ef4444; margin-bottom: 16px; }
                    h1 { font-size: 1.25rem; font-weight: 700; margin-bottom: 12px; }
                    p { color: #71717a; font-size: 0.9rem; line-height: 1.7; margin-bottom: 32px; }
                    button {
                        display: inline-flex; align-items: center; gap: 8px;
                        padding: 11px 22px; border-radius: 7px;
                        background: #6366f1; color: #fff; border: none;
                        font-size: 0.875rem; font-weight: 600; cursor: pointer;
                        transition: opacity 0.15s;
                    }
                    button:hover { opacity: 0.85; }
                `}</style>
            </head>
            <body>
                <div className="wrap">
                    <a href="/" className="logo">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
                        </svg>
                        Net<span>Pulse</span>
                    </a>
                    <div className="code">!</div>
                    <h1>Critical application error</h1>
                    <p>
                        The application encountered an unrecoverable error.
                        This is extremely rare — try refreshing. If the issue persists, check back shortly.
                    </p>
                    <button onClick={reset}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
                            <path d="M21 3v5h-5"/>
                            <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>
                            <path d="M8 16H3v5"/>
                        </svg>
                        Reload application
                    </button>
                </div>
            </body>
        </html>
    );
}
