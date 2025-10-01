"use client";

import { useActionState } from "react";
import { deleteDocumentAction } from "@/lib/actions";
import { useState } from "react";
import Link from "next/link";

export default function DocumentCard({ document, currentUserId, onDelete }) {
  const [message, formAction, isPending] = useActionState(
    deleteDocumentAction,
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
    <Link href={`/documents/${document.id}`} className="block bg-white dark:bg-black rounded-2xl shadow-lg p-6 mb-4 hover:shadow-lg transition-shadow border border-gray dark:border-dark-gray">
      {/* En-tête du document */}
      {/* <div className="flex justify-between items-start mb-4">
      </div> */}

      {/* Titre du document */}
      <div className="mb-2">
        <span className="text-xl font-title text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
          {document.title}
        </span>
      </div>

      {/* Aperçu du contenu */}
      <div className="text-gray-600 dark:text-gray-300">
        {document.content ? (
          <p className="line-clamp-1">
            {firstLine}
          </p>
        ) : (
          <p className="text-gray-400 dark:text-gray-500 italic">
            Document vide
          </p>
        )}
        <time dateTime={document.updated_at} className="text-xs text-light-gray dark:text-dark-gray">
          {formattedDate}
        </time>
      </div>

      {/* Actions */}
      <div className="flex justify-between items-center">
      </div>

      {/* Message de suppression */}
      {message && (
        <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-600 dark:text-red-400">{message}</p>
        </div>
      )}
    </Link>
  );
}

