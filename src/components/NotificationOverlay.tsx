"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import NotificationItem from "./ui/Notifications/notification-item";
import type { Notification } from "@/lib/types";

interface NotificationOverlayProps {
    isOpen?: boolean;
    onClose?: () => void;
}

export default function NotificationOverlay({ isOpen = true, onClose }: NotificationOverlayProps) {
    const { data: session } = useSession();
    const [notifications, setNotifications] = useState<Notification[] | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!isOpen) return;
        const fetchNotifications = async () => {
            if (!session?.user?.id) {
                setNotifications([]);
                return;
            }

            setLoading(true);
            setError(null);
            try {
                const res = await fetch(`/api/notification?id=${session.user.id}`, { cache: "no-store" });
                const body = await res.json();
                if (!body.success) {
                    setError(body.error || "Erreur récupération notifications");
                    setNotifications([]);
                } else {
                    setNotifications(body.notifications ?? body.data ?? []);
                }
            } catch (e) {
                setError(String(e));
                setNotifications([]);
            } finally {
                setLoading(false);
            }
        };

        fetchNotifications();
    }, [isOpen, session]);
    useEffect(() => {
        if (!isOpen) return;
        console.log("fetchNotifications result:", { notifications, loading, error });
    }, [notifications, loading, error, isOpen]);
    if (!isOpen) return null;

    return (
        <div className="h-screen w-80 bg-white dark:bg-gray-800 rounded-none shadow-lg border-l border-gray-200 dark:border-gray-700 p-2 flex flex-col">
            <div className="flex items-center justify-between px-2 py-2 flex-shrink-0">
                <strong>Notifications</strong>
                <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                    ×
                </button>
            </div>

            {/* Scrollable list area - fill remaining height and scroll */}
            <div className="mt-2 flex-1 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-700">
                {loading && <div className="p-4">Chargement...</div>}
                {error && <div className="p-4 text-red-500">{error}</div>}

                {!loading && !error && (notifications ?? []).length === 0 && (
                    <div className="p-4 text-sm text-gray-500">Aucune notification</div>
                )}

            {!loading && (notifications ?? []).map((n, i) => {
                                // message was stored as JSON-string or plain string; try to parse
                                let parsed: any = null;
                                try {
                                    parsed = JSON.parse(n.message as unknown as string);
                                } catch {
                                    parsed = { message: String(n.message || "") };
                                }

                                // Prefer the sender metadata from the DB (if id_sender present),
                                // falling back to the structured message `from`, then to a system label.
                                const senderUsername = (n as any).sender_username;
                                const senderFirst = (n as any).sender_first_name;
                                const senderLast = (n as any).sender_last_name;
                                let username = "Système";
                                if (senderFirst || senderLast) {
                                    username = [senderFirst, senderLast].filter(Boolean).join(" ");
                                } else if (senderUsername) {
                                    username = String(senderUsername);
                                } else if (parsed?.from) {
                                    username = String(parsed.from);
                                }

                                // If this is a share-invite, show special text and an accept button
                                if (parsed?.type === "share-invite" || parsed?.type === "share-invite" ) {
                                    const docTitle = parsed.documentTitle || parsed.title || "un document";
                                    const confirmUrl = parsed.url || parsed.confirmUrl;

                                    return (
                                        <div key={n.id} className="px-2 py-2">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <div className="font-medium">{username} vous a partagé un document</div>
                                                    <div className="text-sm text-gray-600 dark:text-gray-300">{docTitle}</div>
                                                </div>
                                                <div className="ml-2">
                                                                        <button
                                                                            onClick={async (e) => {
                                                                                e.preventDefault();
                                                                                try {
                                                                                    await fetch('/api/notification/mark-read', {
                                                                                        method: 'POST',
                                                                                        headers: { 'Content-Type': 'application/json' },
                                                                                        body: JSON.stringify({ notificationId: n.id }),
                                                                                        cache: 'no-store'
                                                                                    });
                                                                                } catch (err) {
                                                                                    console.warn('Failed to mark notification read', err);
                                                                                }
                                                                                // navigate to confirm url after marking as read
                                                                                if (confirmUrl) {
                                                                                    window.location.href = confirmUrl;
                                                                                }
                                                                            }}
                                                                            className="bg-primary text-white px-3 py-1 rounded"
                                                                        >
                                                                            Accepter
                                                                        </button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                }

                                // default notification rendering
                                const messageText = parsed?.message || String(n.message || "");
                                return (
                                    <NotificationItem
                                        key={n.id}
                                        avatar={""}
                                        username={String(username)}
                                        message={messageText}
                                        onClick={() => { /* TODO: handle click */ }}
                                    />
                                );
                })}
            </div>
        </div>
    );
}