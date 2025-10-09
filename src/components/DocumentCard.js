"use client";

import { useActionState, startTransition } from "react";
import { deleteDocumentAction, updateDocumentAction } from "@/lib/actions";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Button, Badge, Input } from "@/components/ui";

export default function DocumentCard({ document, currentUserId, onDelete }) {
  const [message, formAction, isPending] = useActionState(
    deleteDocumentAction,
    undefined
  );
  const [updateMsg, updateFormAction, isUpdating] = useActionState(
    updateDocumentAction,
    undefined
  );
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const isOwner = document.user_id === currentUserId;
  const updatedDate = new Date(document.updated_at);
  const formattedDate = updatedDate.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  const firstLine = (document.content || "").split(/\r?\n/)[0];

  // --- Tags (stockés localement par document) ---
  const [tags, setTags] = useState([]);
  const [showTagInput, setShowTagInput] = useState(false);
  const [newTag, setNewTag] = useState("");

  useEffect(() => {
    // Priorité aux tags venant de la base si présents
    if (Array.isArray(document.tags)) {
      setTags(document.tags);
      return;
    }
    try {
      const raw = localStorage.getItem("notus.tags");
      const parsed = raw ? JSON.parse(raw) : {};
      const existing = parsed?.[String(document.id)] || [];
      if (Array.isArray(existing)) setTags(existing);
    } catch (_) {
      // ignore
    }
  }, [document.id, document.tags]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("notus.tags");
      const parsed = raw ? JSON.parse(raw) : {};
      parsed[String(document.id)] = tags;
      localStorage.setItem("notus.tags", JSON.stringify(parsed));
    } catch (_) {
      // ignore
    }
  }, [tags, document.id]);

  const persistTags = (nextTags) => {
    if (!currentUserId) return; // pas connecté => pas de persistance
    const fd = new FormData();
    fd.append("documentId", String(document.id));
    fd.append("userId", String(currentUserId));
    fd.append("title", document.title || "Sans titre");
    fd.append("content", document.content || "");
    fd.append("tags", JSON.stringify(nextTags));
    startTransition(() => {
      updateFormAction(fd);
    });
  };

  const addTag = () => {
    const value = (newTag || "").trim().substring(0, 30);
    if (!value) return;
    if (tags.includes(value)) {
      setNewTag("");
      setShowTagInput(false);
      return;
    }
    const next = [...tags, value];
    setTags(next);
    persistTags(next);
    setNewTag("");
    setShowTagInput(false);
  };

  const removeTag = (value) => {
    const next = tags.filter((t) => t !== value);
    setTags(next);
    persistTags(next);
  };

  const handleDelete = (formData) => {
    if (!currentUserId) return;
    formData.append("documentId", document.id);
    formData.append("userId", currentUserId);
    formAction(formData);
    setShowDeleteConfirm(false);
    if (onDelete) {
      onDelete(document.id);
    }
  };

  return (
    <Link
      href={`/documents/${document.id}`}
      className="block bg-white dark:bg-black rounded-2xl shadow-lg p-6 mb-4 hover:shadow-lg transition-shadow border border-gray dark:border-dark-gray"
    >
      {/* Tags + ajout */}
      <div className="mb-2">
        <div
          className="flex flex-wrap items-center gap-2"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
        >
          {tags.map((tag) => (
            <Badge key={tag} variant="purple" size="sm" className="pr-1">
              <span className="mr-1 max-w-[200px] truncate" title={tag}>
                {tag}
              </span>
              <button
                type="button"
                className="ml-1 inline-flex items-center justify-center w-4 h-4 rounded-full text-purple dark:text-light-purple hover:bg-purple/20 dark:hover:bg-purple/30"
                aria-label={`Supprimer le tag ${tag}`}
                onClick={() => removeTag(tag)}
              >
                ×
              </button>
            </Badge>
          ))}

          {!showTagInput && (
            <Button
              variant="secondary"
              className="px-2 py-0.5 text-sm"
              onClick={() => setShowTagInput(true)}
            >
              +
            </Button>
          )}

          {showTagInput && (
            <div className="flex items-center gap-1">
              <Input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="Nouveau tag"
                className="h-7 text-sm"
                onKeyDown={(e) => {
                  if (e.key === "Enter") addTag();
                  if (e.key === "Escape") {
                    setShowTagInput(false);
                    setNewTag("");
                  }
                }}
                autoFocus
              />
              <Button
                variant="primary"
                className="px-2 py-0.5 text-sm"
                onClick={addTag}
              >
                Ajouter
              </Button>
              <Button
                variant="ghost"
                className="px-2 py-0.5 text-sm"
                onClick={() => {
                  setShowTagInput(false);
                  setNewTag("");
                }}
              >
                Annuler
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Titre du document */}
      <div className="mb-2">
        <span className="block truncate text-xl font-title text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
          {document.title}
        </span>
      </div>

      {/* Aperçu du contenu */}
      <div className="text-gray-600 dark:text-gray-300">
        {document.content ? (
          <p className="line-clamp-1">{firstLine}</p>
        ) : (
          <p className="text-gray-400 dark:text-gray-500 italic">
            Document vide
          </p>
        )}
        <time
          dateTime={document.updated_at}
          className="text-xs text-light-gray dark:text-dark-gray"
        >
          {formattedDate}
        </time>
      </div>

      {/* Actions */}
      <div className="flex justify-between items-center"></div>

      {/* Message de suppression */}
      {message && (
        <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-600 dark:text-red-400">{message}</p>
        </div>
      )}
    </Link>
  );
}
