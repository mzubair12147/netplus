"use client";

import { useEffect, useRef } from "react";
import { Trash2, X } from "lucide-react";

interface ModalProps {
    open: boolean;
    onClose: () => void;
    onConfirm: () => void;
    loading?: boolean;
    title: string;
    body: React.ReactNode;
    confirmLabel?: string;
    confirmVariant?: "danger" | "primary";
}

export default function Modal({
    open,
    onClose,
    onConfirm,
    loading = false,
    title,
    body,
    confirmLabel = "Confirm",
    confirmVariant = "danger",
}: ModalProps) {
    const confirmRef = useRef<HTMLButtonElement>(null);

    // Focus confirm button when opened; close on Escape
    useEffect(() => {
        if (!open) return;
        const handler = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        document.addEventListener("keydown", handler);
        // Trap focus — small timeout so element is rendered
        setTimeout(() => confirmRef.current?.focus(), 50);
        return () => document.removeEventListener("keydown", handler);
    }, [open, onClose]);

    if (!open) return null;

    return (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
            <div className="modal-box" role="dialog" aria-modal="true" aria-labelledby="modal-title">
                {confirmVariant === "danger" && (
                    <div className="modal-icon modal-icon-danger">
                        <Trash2 size={20} color="var(--red)" />
                    </div>
                )}

                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
                    <h2 className="modal-title" id="modal-title">{title}</h2>
                    <button
                        onClick={onClose}
                        style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: 4, lineHeight: 1, flexShrink: 0 }}
                        aria-label="Close"
                    >
                        <X size={16} />
                    </button>
                </div>

                <div className="modal-body">{body}</div>

                <div className="modal-actions">
                    <button className="btn btn-ghost" onClick={onClose} disabled={loading}>
                        Cancel
                    </button>
                    <button
                        ref={confirmRef}
                        className={`btn ${confirmVariant === "danger" ? "btn-danger" : "btn-primary"}`}
                        onClick={onConfirm}
                        disabled={loading}
                    >
                        {loading ? (
                            <><span className="spinner" style={{ width: 13, height: 13 }} /> Processing…</>
                        ) : (
                            confirmLabel
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
