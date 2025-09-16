"use client";

import { useActionState } from "react";
import { deleteNoteAction } from "@/lib/actions";
import { useState } from "react";

export default function NoteCard({ note, currentUserId, onDelete }) {
  const [message, formAction, isPending] = useActionState(
    deleteNoteAction,
    undefined
  );
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const isOwner = note.user_id === currentUserId;
  const createdDate = new Date(note.created_at);
  const timeAgo = getTimeAgo(createdDate);

  const handleDelete = (formData) => {
    if (!currentUserId) return;
    formData.append("noteId", note.id);
    formData.append("userId", currentUserId);
    formAction(formData);
    setShowDeleteConfirm(false);
    if (onDelete) {
      onDelete(note.id);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 mb-4">
      {/* En-tête de la note */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-sm">
              {note.first_name?.charAt(0) || "U"}
            </span>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">
              {note.first_name} {note.last_name}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              @{note.username} • {timeAgo}
            </p>
          </div>
        </div>

        {/* Bouton de suppression pour le propriétaire */}
        {isOwner && (
          <div className="relative">
            <button
              onClick={() => setShowDeleteConfirm(!showDeleteConfirm)}
              className="text-gray-400 hover:text-red-500 transition-colors"
              title="Supprimer la note"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </button>

            {/* Confirmation de suppression */}
            {showDeleteConfirm && (
              <div className="absolute right-0 top-8 bg-white dark:bg-gray-700 rounded-lg shadow-lg p-4 border border-gray-200 dark:border-gray-600 z-10">
                <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
                  Supprimer cette note ?
                </p>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="text-sm px-3 py-1 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-500"
                  >
                    Annuler
                  </button>
                  <form action={handleDelete}>
                    <button
                      type="submit"
                      disabled={isPending}
                      className="text-sm px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50"
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
      <div className="text-gray-900 dark:text-white whitespace-pre-wrap">
        {note.content}
      </div>

      {/* Message de suppression */}
      {message && (
        <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-600 dark:text-red-400">{message}</p>
        </div>
      )}
    </div>
  );
}

// Fonction utilitaire pour calculer le temps écoulé
function getTimeAgo(date) {
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);

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
