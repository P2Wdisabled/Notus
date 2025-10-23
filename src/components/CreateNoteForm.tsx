"use client";

import { useActionState, startTransition } from "react";
import { createDocumentAction } from "@/lib/actions";
import { useState } from "react";

interface CreateNoteFormProps {
  userId: string;
}

export default function CreateNoteForm({ userId }: CreateNoteFormProps) {
  const [message, formAction, isPending] = useActionState(
    createDocumentAction,
    {
      success: false,
      message: "",
      documentId: 0,
    }
  );
  const [content, setContent] = useState("");

  const handleSubmit = (formData: FormData) => {
    formData.append("userId", userId);
    startTransition(() => {
      formAction(formData);
    });
    setContent(""); // Réinitialiser le champ après soumission
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 mb-6">
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
        Quoi de neuf ?
      </h2>

      <form action={handleSubmit} className="space-y-4">
        <div>
          <textarea
            name="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Partagez ce qui vous passe par la tête..."
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
            rows={4}
            maxLength={1000}
            required
          />
          <div className="flex justify-between items-center mt-2">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {content.length}/1000 caractères
            </span>
            <button
              type="submit"
              disabled={isPending || content.trim().length === 0}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-2 px-6 rounded-lg transition-colors"
            >
              {isPending ? "Publication..." : "Publier"}
            </button>
          </div>
        </div>

        {/* Message de succès/erreur */}
        {message && (() => {
          const messageText = typeof message === 'string' ? message : message.message;
          const isSuccess = messageText.includes("succès") ||
            messageText.includes("publiée") ||
            messageText.includes("mise à jour");

          return (
            <div
              className={`rounded-lg p-4 ${isSuccess
                ? "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800"
                : "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800"
                }`}
            >
              <p
                className={`text-sm ${isSuccess
                  ? "text-green-600 dark:text-green-400"
                  : "text-red-600 dark:text-red-400"
                  }`}
              >
                {messageText}
              </p>
            </div>
          );
        })()}
      </form>
    </div>
  );
}

