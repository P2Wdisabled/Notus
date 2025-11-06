"use client";

import React, { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

interface LinkPopinProps {
    onClose: () => void;
    onInsertUrl: (url: string) => void;
    mode?: "link" | "image";
}

export function ToolbarPopin({ onClose, onInsertUrl, mode = "link" }: LinkPopinProps) {
    const rootRef = useRef<HTMLDivElement | null>(null);
    const [url, setUrl] = useState("");
    const [previewLoading, setPreviewLoading] = useState(false);
    const [previewError, setPreviewError] = useState<string | null>(null);

    useEffect(() => {
        const onKey = (ev: KeyboardEvent) => {
            if (ev.key === "Escape") onClose();
        };
        const onDocMouse = (ev: MouseEvent) => {
            const target = ev.target as Element | null;
            if (target && !target.closest('[data-link-popin]')) {
                onClose();
            }
        };
        document.addEventListener("keydown", onKey);
        document.addEventListener("mousedown", onDocMouse);
        return () => {
            document.removeEventListener("keydown", onKey);
            document.removeEventListener("mousedown", onDocMouse);
        };
    }, [onClose]);

    const handleInsert = () => {
        if (!url) return;
        onInsertUrl(url);
        setUrl("");
        onClose();
    };

    const heading = mode === "image" ? "Insérer une image (URL)" : "Insérer un lien";
    const buttonText = mode === "image" ? "Insérer l'image" : "Insérer le lien";

    return (
        <div
            data-link-popin
            ref={rootRef}
            className="fixed left-1/2 top-16 md:top-20 -translate-x-1/2 z-50 bg-background border border-border rounded shadow-lg p-3 w-auto max-w-[92vw] max-h-[80vh] overflow-auto text-foreground"
            role="dialog"
            aria-modal="true"
        >
            <div className="space-y-2 w-fit">
                <label className="text-sm font-medium text-foreground">{heading}</label>
                <div className="flex gap-2 md:w-100">
                    <input
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        placeholder="https://..."
                        className="flex-1 min-w-0 px-2 py-1 border rounded bg-background text-foreground border-border text-sm"
                    />
                </div>
                {mode === "image" && (
                    <div className="mt-2">
                        {url ? (
                            <div className="rounded border border-border p-2 bg-background">
                                {previewError ? (
                                    <div className="text-sm text-destructive">Impossible de charger l'image.</div>
                                ) : (
                                    <div className="flex items-center justify-center">
                                        <img
                                            src={url}
                                            alt="Prévisualisation"
                                            className="max-h-36 object-contain"
                                            onLoad={() => {
                                                setPreviewLoading(false);
                                                setPreviewError(null);
                                            }}
                                            onError={() => {
                                                setPreviewLoading(false);
                                                setPreviewError('error');
                                            }}
                                            onLoadStart={() => {
                                                setPreviewLoading(true);
                                                setPreviewError(null);
                                            }}
                                        />
                                    </div>
                                )}
                                {previewLoading && !previewError && (
                                    <div className="text-xs text-muted-foreground mt-1">Chargement…</div>
                                )}
                            </div>
                        ) : (
                            <div className="text-xs text-muted-foreground">Coller une URL d'image pour voir la prévisualisation.</div>
                        )}
                    </div>
                )}
                <div className="text-right flex items-center justify-end gap-2">
                    <Button variant="primary" size="sm" onClick={handleInsert} className="whitespace-nowrap">
                        {buttonText}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={onClose} className="whitespace-nowrap">
                        Annuler
                    </Button>
                </div>
            </div>
        </div>
    );
}