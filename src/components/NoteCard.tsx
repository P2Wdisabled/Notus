"use client";

import { useActionState, startTransition } from "react";
import { deleteDocumentAction } from "@/lib/actions";
import { useState } from "react";
import Icon from "@/components/Icon";

interface Note {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  first_name?: string;
  last_name?: string;
  username?: string;
}

interface NoteCardProps {
  note: Note;
  currentUserId?: string;
  onDelete?: (noteId: string) => void;
}

export default function NoteCard({ note, currentUserId, onDelete }: NoteCardProps) {
  const [message, formAction, isPending] = useActionState(
    deleteDocumentAction,
    undefined
  );
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const isOwner = note.user_id === currentUserId;
  const createdDate = new Date(note.created_at);
  const timeAgo = getTimeAgo(createdDate);

  const handleDelete = (formData: FormData) => {
    if (!currentUserId) return;
    formData.append("noteId", note.id);
    formData.append("userId", currentUserId);
    startTransition(() => {
      formAction(formData);
    });
    setShowDeleteConfirm(false);
    if (onDelete) {
      onDelete(note.id);
    }
  };

  return (
    <div className="bg-background rounded-2xl shadow-xl p-6 mb-4">
      {/* En-tête de la note */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">
              {note.first_name?.charAt(0) || "U"}
            </span>
          </div>
          <div>
            <h3 className="font-semibold text-foreground">
              {note.first_name} {note.last_name}
            </h3>
            <p className="text-sm text-muted-foreground">
              @{note.username} • {timeAgo}
            </p>
          </div>
        </div>

        {/* Bouton de suppression pour le propriétaire */}
        {isOwner && (
          <div className="relative">
            <button
              onClick={() => setShowDeleteConfirm(!showDeleteConfirm)}
              className="text-muted-foreground hover:text-destructive transition-colors"
              title="Supprimer la note"
            >
              <Icon name="trash" className="w-5 h-5" />
            </button>

            {/* Confirmation de suppression */}
            {showDeleteConfirm && (
              <div className="absolute right-0 top-8 bg-card rounded-lg shadow-lg p-4 border border-border z-10">
                <p className="text-sm text-foreground mb-3">
                  Supprimer cette note ?
                </p>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="text-sm px-3 py-1 bg-muted text-foreground rounded hover:bg-muted/80"
                  >
                    Annuler
                  </button>
                  <form action={handleDelete}>
                    <button
                      type="submit"
                      disabled={isPending}
                      className="text-sm px-3 py-1 bg-destructive text-destructive-foreground rounded hover:bg-destructive/90 disabled:opacity-50"
                    >
                      {isPending ? "Suppression..." : "Supprimer"}
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Contenu de la note */}
      <div className="text-foreground whitespace-pre-wrap">
        {note.content}
      </div>

      {/* Message de suppression */}
      {message && (
        <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
          <p className="text-sm text-destructive">{message}</p>
        </div>
      )}
    </div>
  );
}

// Fonction utilitaire pour calculer le temps écoulé
function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return "À l'instant";
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `Il y a ${minutes} minute${minutes > 1 ? "s" : ""}`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `Il y a ${hours} heure${hours > 1 ? "s" : ""}`;
  } else if (diffInSeconds < 2592000) {
    const days = Math.floor(diffInSeconds / 86400);
    return `Il y a ${days} jour${days > 1 ? "s" : ""}`;
  } else {
    return date.toLocaleDateString("fr-FR");
  }
}

