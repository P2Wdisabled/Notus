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
    <div className="bg-card rounded-2xl shadow-xl p-6 mb-6">
      <h2 className="text-xl font-bold text-foreground mb-4">
        Quoi de neuf ?
      </h2>

      <form action={handleSubmit} className="space-y-4">
        <div>
          <textarea
            name="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Partagez ce qui vous passe par la tête..."
            className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent transition-colors bg-card text-foreground resize-none"
            rows={4}
            maxLength={1000}
            required
          />
          <div className="flex justify-between items-center mt-2">
            <span className="text-sm text-muted-foreground">
              {content.length}/1000 caractères
            </span>
            <button
              type="submit"
              disabled={isPending || content.trim().length === 0}
              className="bg-primary hover:bg-primary/90 disabled:bg-muted disabled:cursor-not-allowed text-primary-foreground font-semibold py-2 px-6 rounded-lg transition-colors"
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
                ? "bg-primary/10 border border-primary/20"
                : "bg-destructive/10 border border-destructive/20"
                }`}
            >
              <p
                className={`text-sm ${isSuccess
                  ? "text-primary"
                  : "text-destructive"
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


