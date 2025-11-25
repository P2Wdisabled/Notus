"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button, Textarea, ScrollArea } from "@/components/ui";
import Icon from "@/components/Icon";

interface CommentUser {
  id: number;
  username?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
  profile_image?: string | null;
}

interface CommentItem {
  id: number;
  content: string;
  created_at: string;
  user: CommentUser | null;
}

interface CommentsSidebarProps {
  documentId: number | null | undefined;
  isOpen: boolean;
  onClose: () => void;
}

function getUserInitials(user: CommentUser | null): string {
  if (!user) return "?";
  const first = user.first_name || user.username || user.email || "";
  const last = user.last_name || "";
  const a = first.trim().charAt(0);
  const b = last.trim().charAt(0);
  const initials = `${a}${b}`.trim();
  return initials || "?";
}

function getUserDisplayName(user: CommentUser | null): string {
  if (!user) return "Utilisateur inconnu";
  if (user.first_name || user.last_name) {
    return `${user.first_name ?? ""} ${user.last_name ?? ""}`.trim();
  }
  if (user.username) return user.username;
  if (user.email) return user.email;
  return "Utilisateur";
}

export default function CommentsSidebar({ documentId, isOpen, onClose }: CommentsSidebarProps) {
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const fetchComments = useCallback(async () => {
    if (!documentId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/comments?documentId=${documentId}`, {
        method: "GET",
        headers: {
          "Accept": "application/json",
        },
        cache: "no-store",
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || "Impossible de charger les commentaires");
        setComments([]);
        return;
      }
      setComments(Array.isArray(data.comments) ? data.comments : []);
    } catch (e) {
      setError("Erreur lors du chargement des commentaires");
      setComments([]);
    } finally {
      setLoading(false);
    }
  }, [documentId]);

  useEffect(() => {
    if (isOpen && documentId) {
      void fetchComments();
    }
  }, [isOpen, documentId, fetchComments]);

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [comments, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!documentId) return;
    const content = newComment.trim();
    if (!content) return;

    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify({ documentId, content }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || "Impossible d'envoyer le commentaire");
        return;
      }

      setNewComment("");
      // Ajouter le nouveau commentaire en bas de la liste
      if (data.comment) {
        setComments((prev) => [...prev, data.comment as CommentItem]);
      } else {
        // Au cas où, on recharge la liste
        void fetchComments();
      }
    } catch (e) {
      setError("Erreur lors de l'envoi du commentaire");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-background border-l border-border shadow-xl flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Icon name="inbox" className="w-5 h-5" />
          <h2 className="text-sm font-semibold">Commentaires de la note</h2>
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
          {loading && <span>Chargement des commentaires…</span>}
          {!loading && !error && comments.length === 0 && (
            <span>Aucun commentaire pour l’instant. Soyez le premier à commenter.</span>
          )}
          {!loading && error && (
            <span className="text-red-500">{error}</span>
          )}
        </div>
        <ScrollArea className="flex-1 px-2 pb-2">
          <div className="space-y-3 px-2">
            {comments.map((comment) => {
              const user = comment.user ?? null;
              return (
                <div
                  key={comment.id}
                  className="flex items-start gap-3 rounded-lg bg-muted/40 px-3 py-2"
                >
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    {user?.profile_image ? (
                      <AvatarImage src={user.profile_image} alt={getUserDisplayName(user)} />
                    ) : (
                      <AvatarFallback>
                        {getUserInitials(user)}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-foreground">
                        {getUserDisplayName(user)}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(comment.created_at).toLocaleString()}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-foreground whitespace-pre-wrap break-words">
                      {comment.content}
                    </p>
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>
        </ScrollArea>
      </div>

      <form onSubmit={handleSubmit} className="border-t border-border px-3 py-2 space-y-2">
        <Textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Écrire un commentaire…"
          rows={2}
          className="text-sm resize-none"
        />
        <div className="flex items-center justify-between gap-2">
          <span className="text-[10px] text-muted-foreground">
            {newComment.trim().length}/2000 caractères
          </span>
          <Button
            type="submit"
            size="sm"
            disabled={submitting || !newComment.trim() || !documentId}
          >
            {submitting ? "Envoi..." : "Envoyer"}
          </Button>
        </div>
      </form>
    </div>
  );
}


