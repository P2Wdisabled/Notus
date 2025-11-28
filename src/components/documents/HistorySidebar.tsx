"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button, ScrollArea } from "@/components/ui";
import Icon from "@/components/Icon";
import { useLocalSession } from "@/hooks/useLocalSession";
import { cn } from "@/lib/utils";

interface HistoryUser {
  id: number;
  username?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
  profile_image?: string | null;
}

interface HistoryItem {
  id: number;
  created_at: string;
  diff_added?: string | null;
  diff_removed?: string | null;
  user: HistoryUser | null;
}

interface HistorySidebarProps {
  documentId: number | null | undefined;
  isOpen: boolean;
  onClose: () => void;
}

function getUserInitials(user: HistoryUser | null): string {
  if (!user) return "?";
  if (user.username) {
    return user.username.substring(0, 2).toUpperCase();
  }
  const first = user.first_name || user.email || "";
  const last = user.last_name || "";
  const a = first.trim().charAt(0);
  const b = last.trim().charAt(0);
  const initials = `${a}${b}`.trim();
  return initials || "?";
}

function getUserDisplayName(user: HistoryUser | null): string {
  if (!user) return "Utilisateur inconnu";
  if (user.username) return user.username;
  if (user.first_name || user.last_name) {
    return `${user.first_name ?? ""} ${user.last_name ?? ""}`.trim();
  }
  if (user.email) return user.email;
  return "Utilisateur";
}

function formatDateHeader(date: Date): string {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const historyDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (historyDate.getTime() === today.getTime()) {
    return "Aujourd'hui";
  } else if (historyDate.getTime() === yesterday.getTime()) {
    return "Hier";
  } else {
    return date.toLocaleDateString("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
    });
  }
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getDateKey(date: Date): string {
  return date.toLocaleDateString("fr-FR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

interface GroupedHistoryItem extends HistoryItem {
  groupedIds: number[];
}

function groupHistoryEntries(entries: HistoryItem[]): GroupedHistoryItem[] {
  if (entries.length === 0) return [];

  const grouped: GroupedHistoryItem[] = [];
  const GROUPING_WINDOW_MS = 60000; // 1 minute pour regrouper les modifications

  for (const entry of entries) {
    const entryDate = new Date(entry.created_at);
    const entryUserId = entry.user?.id ?? null;

    // Chercher un groupe existant auquel cette entrée peut être ajoutée
    let foundGroup = false;
    for (let i = 0; i < grouped.length; i++) {
      const group = grouped[i];
      const groupDate = new Date(group.created_at);
      const groupUserId = group.user?.id ?? null;

      // Vérifier si l'entrée appartient à ce groupe (même utilisateur et timestamp proche)
      const timeDiff = Math.abs(entryDate.getTime() - groupDate.getTime());
      const sameUser = entryUserId === groupUserId;

      if (sameUser && timeDiff <= GROUPING_WINDOW_MS) {
        // Fusionner les diffs
        const existingAdded = group.diff_added || "";
        const existingRemoved = group.diff_removed || "";
        const newAdded = entry.diff_added || "";
        const newRemoved = entry.diff_removed || "";

        group.diff_added = (existingAdded + newAdded).trim() || null;
        group.diff_removed = (existingRemoved + newRemoved).trim() || null;
        group.groupedIds.push(entry.id);
        // Garder le timestamp le plus ancien du groupe (première modification)
        if (entryDate.getTime() < groupDate.getTime()) {
          group.created_at = entry.created_at;
        }
        foundGroup = true;
        break;
      }
    }

    // Si aucun groupe trouvé, créer un nouveau groupe
    if (!foundGroup) {
      grouped.push({
        ...entry,
        groupedIds: [entry.id],
      });
    }
  }

  return grouped;
}

export default function HistorySidebar({ documentId, isOpen, onClose }: HistorySidebarProps) {
  const [entries, setEntries] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const { userId } = useLocalSession();

  const fetchHistory = useCallback(async () => {
    if (!documentId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/openDoc/history?documentId=${documentId}`, {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
        cache: "no-store",
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || "Impossible de charger l'historique");
        setEntries([]);
        return;
      }
      const raw = Array.isArray(data.history) ? data.history : [];
      const normalized: HistoryItem[] = raw.map((item: any) => ({
        id: item.id,
        created_at: item.created_at,
        diff_added: item.diff_added ?? null,
        diff_removed: item.diff_removed ?? null,
        user: item.user ?? null,
      }));
      setEntries(normalized);
    } catch (e) {
      setError("Erreur lors du chargement de l'historique");
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }, [documentId]);

  useEffect(() => {
    if (isOpen && documentId) {
      void fetchHistory();
    }
  }, [isOpen, documentId, fetchHistory]);

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [entries, isOpen]);

  // Empêcher le scroll du body sur mobile quand le sidebar est ouvert
  useEffect(() => {
    if (isOpen) {
      const originalStyle = window.getComputedStyle(document.body).overflow;
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflowX = "hidden";
      return () => {
        document.body.style.overflow = originalStyle;
        document.documentElement.style.overflowX = "";
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed top-0 bottom-0 left-0 right-0 md:left-auto md:right-0 z-50 md:w-full md:max-w-md bg-background md:border-l border-border shadow-xl flex flex-col overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Icon name="clock" className="w-5 h-5" />
          <h2 className="text-xl font-title">Historique de la note</h2>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="h-8 w-8"
        >
          <Icon name="x" className="w-4 h-4" />
        </Button>
      </div>

      <div className="flex-1 min-h-0 flex flex-col">
        <div className="px-4 pt-3 pb-1 text-xs text-muted-foreground">
          {loading && <span>Chargement de l'historique…</span>}
          {!loading && !error && entries.length === 0 && (
            <span>Aucune modification enregistrée pour l’instant.</span>
          )}
          {!loading && error && (
            <span className="text-red-500">{error}</span>
          )}
        </div>
        <ScrollArea className="flex-1 px-2 pb-2 max-h-full overflow-hidden">
          <div className="space-y-3 px-2">
            {(() => {
              const groupedEntries = groupHistoryEntries(entries);
              return groupedEntries.map((entry, index) => {
                const user = entry.user ?? null;
                const isCurrentUser =
                  userId && user?.id && String(userId) === String(user.id);
                const entryDate = new Date(entry.created_at);
                const previousDate =
                  index > 0 ? new Date(groupedEntries[index - 1].created_at) : null;
                const showDateHeader =
                  !previousDate ||
                  getDateKey(entryDate) !== getDateKey(previousDate);

              const hasAdded = !!entry.diff_added && entry.diff_added.trim().length > 0;
              const hasRemoved = !!entry.diff_removed && entry.diff_removed.trim().length > 0;

              return (
                <div key={entry.groupedIds[0] || entry.id} className="space-y-1">
                  {showDateHeader && (
                    <div className="flex items-center justify-center py-2">
                      <span className="text-[10px] text-muted-foreground font-medium">
                        {formatDateHeader(entryDate)}
                      </span>
                    </div>
                  )}
                  <div className="flex items-start gap-2 px-1">
                    <div className="flex flex-col items-center gap-1 min-w-[60px]">
                      <span
                        className={cn(
                          "text-[9px] text-muted-foreground",
                          isCurrentUser ? "text-right" : "text-left"
                        )}
                      >
                        {formatTime(entryDate)}
                      </span>
                    </div>
                    <div
                      className={cn(
                        "flex items-start gap-3 rounded-lg px-3 py-2 w-fit max-w-[85%] overflow-hidden bg-muted/40"
                      )}
                    >
                      <Avatar className="h-8 w-8 flex-shrink-0">
                        {user?.profile_image ? (
                          <AvatarImage
                            src={user.profile_image}
                            alt={getUserDisplayName(user)}
                          />
                        ) : (
                          <AvatarFallback className="bg-muted text-xs">
                            {getUserInitials(user)}
                          </AvatarFallback>
                        )}
                      </Avatar>
                      <div className="min-w-0 max-w-full overflow-hidden">
                        <div className="flex items-center gap-2 justify-start">
                          <span className="text-xs font-semibold break-words text-foreground">
                            {getUserDisplayName(user)}
                          </span>
                        </div>
                        <div className="mt-1 space-y-1 text-xs">
                          {hasAdded && (
                            <div className="border-l-2 border-emerald-500 pl-2">
                              <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 mb-0.5">
                                <Icon name="plus" className="w-3 h-3" />
                                <span className="font-medium">Ajouts</span>
                              </div>
                              <p className="whitespace-pre-wrap break-words text-foreground/90">
                                {entry.diff_added}
                              </p>
                            </div>
                          )}
                          {hasRemoved && (
                            <div className="border-l-2 border-rose-500 pl-2">
                              <div className="flex items-center gap-1 text-rose-600 dark:text-rose-400 mb-0.5">
                                <Icon name="minus" className="w-3 h-3" />
                                <span className="font-medium">Suppressions</span>
                              </div>
                              <p className="whitespace-pre-wrap break-words text-foreground/90 line-through decoration-rose-500/60">
                                {entry.diff_removed}
                              </p>
                            </div>
                          )}
                          {!hasAdded && !hasRemoved && (
                            <p className="text-muted-foreground text-[11px]">
                              Aucune différence textuelle détectée pour cet envoi.
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
              });
            })()}
            <div ref={bottomRef} />
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}


