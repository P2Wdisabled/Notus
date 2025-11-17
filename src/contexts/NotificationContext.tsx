"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";

type NotificationContextValue = {
  unreadCount: number;
  setUnreadCountSync: (n: number) => void; 
  adjustUnreadCount: (delta: number) => void; 
  refresh: () => Promise<void>;
};

const NotificationContext = createContext<NotificationContextValue | null>(null);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const [unreadCount, setUnreadCount] = useState<number>(0);

  useEffect(() => {
    let mounted = true;
    async function fetchCount() {
      if (!session?.user?.id) {
        if (mounted) setUnreadCount(0);
        return;
      }
      try {
        const id = encodeURIComponent(String(session.user.id));
        const res = await fetch(`/api/notification/unread-count?id=${id}`);
        if (!res.ok) return;
        const data = await res.json();
        if (mounted && typeof data?.count === "number") setUnreadCount(data.count);
      } catch {}
    }
    fetchCount();
    return () => { mounted = false; };
  }, [session?.user?.id]);

  const setUnreadCountSync = (n: number) => {
    setUnreadCount(Math.max(0, Math.floor(n || 0)));
  };

  const adjustUnreadCount = (delta: number) => {
    setUnreadCount((prev) => Math.max(0, prev + Math.floor(delta || 0)));
  };

  const refresh = async () => {
    if (!session?.user?.id) return;
    try {
      const id = encodeURIComponent(String(session.user.id));
      const res = await fetch(`/api/notification/unread-count?id=${id}`);
      if (!res.ok) return;
      const data = await res.json();
      if (typeof data?.count === "number") setUnreadCount(data.count);
    } catch {}
  };

  const value = useMemo(() => ({ unreadCount, setUnreadCountSync, adjustUnreadCount, refresh }), [unreadCount]);

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}

export function useNotification() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error("useNotification must be used inside NotificationProvider");
  return ctx;
}
