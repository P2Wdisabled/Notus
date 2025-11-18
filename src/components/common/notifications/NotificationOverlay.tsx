"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import NotificationItem from "@/components/ui/notifications/notification-item";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import type { Notification } from "@/lib/types";
import { Button } from "@/components/ui/button";
import Icon from "@/components/Icon";

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

    async function markAsRead(notificationId: number) {
        if (!notificationId) return;
        setNotifications(prev => prev ? prev.map(n => n.id === notificationId ? { ...n, read_date: new Date() } : n) : prev);
        try {
            await fetch("/api/notification/mark-read", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ notificationId }),
                cache: "no-store",
            });
        } catch {
        }
    }

    return (
        <aside className="h-screen w-80 bg-card rounded-none shadow-lg p-2 flex flex-col" role="complementary" aria-label="Notifications">
            <div className="flex items-center justify-between p-2 pt-2.5 flex-shrink-0 ">
                <div className="flex items-center gap-2">
                    <h2 className="font-title text-2xl sm:text-3xl font-regular">Notifications</h2>
                    {(notifications ?? []).some(n => !n.read_date && ((n as any).id_sender == null)) && (
                        <button
                            onClick={async (e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                const systemIds = (notifications ?? [])
                                    .filter(n => !n.read_date && ((n as any).id_sender == null))
                                    .map(n => n.id);
                                if (systemIds.length === 0) return;
                                await Promise.allSettled(systemIds.map(id => markAsRead(id)));
                            }}
                            title="Marquer toutes les notifications comme lues"
                            className="text-sm px-2 py-1 text-primary" 
                        >
                            Tout marquer lu
                        </button>
                    )}
                </div>

                <Button onClick={onClose} className="text-foreground hover:bg-primary/70">
                    <Icon name="x" className="w-6 h-6" />
                </Button>
            </div>

            <div className="mt-2 flex-1 overflow-y-auto scroller divide-y divide-border">
                {loading && <div className="p-4">Chargement...</div>}
                {error && <div className="p-4 text-destructive">{error}</div>}

                {!loading && !error && (notifications ?? []).length === 0 && (
                    <div className="p-4 text-sm text-muted-foreground">Aucune notification</div>
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
                            <div key={n.id} className={`px-2 py-2 ${isRead ? "bg-muted" : ""}`}>
                                <div className="flex items-center gap-3 min-w-0">
                                    <Avatar className="w-10 h-10 flex-shrink-0" title={username}>
                                        <AvatarImage src={avatarUrl || undefined} alt={username} />
                                        <AvatarFallback className="text-sm font-medium">{initial}</AvatarFallback>
                                    </Avatar>

                                    <div className="flex-1 min-w-0 pr-2">
                                        <div className="font-medium text-sm line-clamp-2" title='Partage de note'>
                                            {username} vous a partagé une note
                                        </div>
                                        <div className="text-xs text-muted-foreground truncate" title={String(docTitle)}>
                                            {displayTitle}
                                        </div>
                                    </div>

                                    <div className="flex-shrink-0">
                                        {isRead ? (
                                            <Button
                                                title="Notification traitée"
                                                disabled
                                                    className="bg-muted text-foreground px-3 py-1 rounded opacity-80 cursor-not-allowed"
                                                >
                                                    
                                                </Button>
                                        ) : (
                                            <div className="flex flex-row items-stretch gap-2">
                                                <Button
                                                    onClick={async (e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        await markAsRead(n.id);
                                                        if (confirmUrl) window.location.href = confirmUrl;
                                                    }}
                                                    className="bg-primary text-primary-foreground p-1 rounded"
                                                >
                                                    <Icon name="check" className="w-6 h-6" />
                                                </Button>

                                                <Button
                                                    onClick={async (e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        await markAsRead(n.id);
                                                    }}
                                                    className="text-primary p-1 rounded hover:bg-primary/10"
                                                    variant="ghost"
                                                >
                                                    <Icon name="x" className="w-6 h-6" />
                                                </Button>
                                            </div>
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
                        <div key={`item-${n.id}`} className={`${isRead ? "bg-muted" : ""}`}>
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
        </aside>
    );
}