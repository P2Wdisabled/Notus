"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import NotificationItem from "./ui/Notifications/notification-item";
import { Avatar, AvatarImage, AvatarFallback } from "./ui/avatar";
import type { Notification } from "@/lib/types";

interface NotificationOverlayProps {
    isOpen?: boolean;
    onClose?: () => void;
}

function truncateText(s: string, max = 50) {
    if (!s) return s;
    return s.length > max ? s.slice(0, max - 3) + "..." : s;
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
    }, [notifications, loading, error, isOpen]);

    if (!isOpen) return null;

    // mark a notification as read (optimistic UI update)
    async function markAsRead(notificationId: number) {
        if (!notificationId) return;
        // optimistic update
        setNotifications(prev => prev ? prev.map(n => n.id === notificationId ? { ...n, read_date: new Date() } : n) : prev);
        try {
            await fetch("/api/notification/mark-read", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ notificationId }),
                cache: "no-store",
            });
        } catch {
            // ignore errors; UI already updated optimistically
        }
    }

    return (
        <div className="h-screen w-80 bg-white dark:bg-gray-800 rounded-none shadow-lg border-l border-gray-200 dark:border-gray-700 p-2 flex flex-col">
            <div className="flex items-center justify-between px-2 py-2 flex-shrink-0">
                <strong>Notifications</strong>
                <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                    ×
                </button>
            </div>

            <div className="mt-2 flex-1 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-700">
                {loading && <div className="p-4">Chargement...</div>}
                {error && <div className="p-4 text-red-500">{error}</div>}

                {!loading && !error && (notifications ?? []).length === 0 && (
                    <div className="p-4 text-sm text-gray-500">Aucune notification</div>
                )}

                {!loading && (notifications ?? []).map((n: Notification) => {
                    const parsed = (n as any).parsed ?? null;
                    const messageText = parsed?.message ?? String(n.message || "");
                    const isRead = Boolean(n.read_date);

                    const firstNameFromSender = n.sender_first_name
                        ? String(n.sender_first_name).trim().split(/\s+/)[0]
                        : null;
                    const username = firstNameFromSender || "Système";

                    const rawAvatar = n.avatar;
                    const avatarUrl = typeof rawAvatar === "string" ? rawAvatar.trim() : "";

                    if (parsed?.type === "share-invite") {
                        const docTitle = parsed.documentTitle || parsed.title || "un document";
                        const confirmUrl = parsed.url || parsed.confirmUrl;
                        const initial = (username?.charAt(0) || "U").toUpperCase();
                        const displayTitle = truncateText(String(docTitle), 50);

                        return (
                            <div key={n.id} className={`px-2 py-2 ${isRead ? "bg-gray-100 dark:bg-gray-700" : ""}`}>
                                <div className="flex items-center gap-3 min-w-0">
                                    <Avatar className="w-10 h-10 flex-shrink-0" title={username}>
                                        <AvatarImage src={avatarUrl || undefined} alt={username} />
                                        <AvatarFallback className="text-sm font-medium">{initial}</AvatarFallback>
                                    </Avatar>

                                    <div className="flex-1 min-w-0 pr-2">
                                        <div className="font-medium text-sm line-clamp-2" title='Partage de note'>
                                            {username} vous a partagé une note
                                        </div>
                                        <div className="text-xs text-gray-600 dark:text-gray-300 truncate" title={String(docTitle)}>
                                            {displayTitle}
                                        </div>
                                    </div>

                                    <div className="flex-shrink-0">
                                        {isRead ? (
                                            <button
                                                title="Invitation déjà acceptée"
                                                disabled
                                                className="bg-gray-400 text-white px-3 py-1 rounded opacity-80 cursor-not-allowed"
                                            >
                                                Accepté
                                            </button>
                                        ) : (
                                            <button
                                                onClick={async (e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    await markAsRead(n.id);
                                                    if (confirmUrl) window.location.href = confirmUrl;
                                                }}
                                                className="bg-primary text-white px-3 py-1 rounded"
                                            >
                                                Accepter
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    }

                    const idSender = Object.prototype.hasOwnProperty.call(n, "id_sender")
                        ? (n as any).id_sender
                        : undefined;

                    return (
                        <div key={`item-${n.id}`} className={`${isRead ? "bg-gray-100 dark:bg-gray-700" : ""}`}>
                            <NotificationItem
                                key={n.id}
                                id_sender={idSender}
                                avatar={avatarUrl}
                                username={String(username)}
                                message={messageText}
                                onClick={() => { if (!isRead) markAsRead(n.id); }}
                            />
                        </div>
                    );
                })}
            </div>
        </div>
    );
}