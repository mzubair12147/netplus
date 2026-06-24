"use client";

import { createContext, useContext, useCallback, useRef, useState, ReactNode } from "react";

type ToastType = "success" | "error" | "info";
interface ToastItem { id: number; message: string; type: ToastType; }
interface ToastCtx { toast: (msg: string, type?: ToastType) => void; }

const ToastContext = createContext<ToastCtx>({ toast: () => {} });

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<ToastItem[]>([]);
    const counter = useRef(0);

    const toast = useCallback((message: string, type: ToastType = "success") => {
        const id = ++counter.current;
        setToasts((prev) => [...prev, { id, message, type }]);
        setTimeout(() => {
            // trigger fade-out class then remove
            setToasts((prev) =>
                prev.map((t) => (t.id === id ? { ...t, removing: true } as any : t)),
            );
            setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 220);
        }, 3500);
    }, []);

    return (
        <ToastContext.Provider value={{ toast }}>
            {children}
            <div className="toast-container">
                {toasts.map((t: any) => (
                    <div
                        key={t.id}
                        className={`toast toast-${t.type}${t.removing ? " removing" : ""}`}
                    >
                        <span>
                            {t.type === "success" ? "✓" : t.type === "error" ? "✗" : "ℹ"}
                        </span>
                        {t.message}
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
}

export function useToast() {
    return useContext(ToastContext);
}
