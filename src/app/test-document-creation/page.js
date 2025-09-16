"use client";

import { useState } from "react";
import { useActionState } from "react";
import { createDocumentAction } from "@/lib/actions";
import { useLocalSession } from "@/hooks/useLocalSession";

export default function TestDocumentCreationPage() {
  const [title, setTitle] = useState("Document de test");
  const [content, setContent] = useState("Contenu de test");
  const [message, formAction, isPending] = useActionState(
    createDocumentAction,
    undefined
  );

  // Simulation d'une session pour le test
  const mockSession = { user: { id: "1", email: "test@example.com" } };
  const { userId } = useLocalSession(mockSession);

  const handleSubmit = (formData) => {
    if (!userId) {
      alert("Session utilisateur requise pour le test");
      return;
    }

    formData.append("userId", userId);
    formData.append("title", title);
    formData.append("content", content);
    formAction(formData);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
          Test de création de documents (anti-doublons)
        </h1>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            Instructions de test
          </h2>
          <div className="space-y-2 text-gray-600 dark:text-gray-300">
            <p>
              1. Cliquez plusieurs fois sur "Créer le document" avec le même
              titre
            </p>
            <p>2. Vérifiez que seul un document est créé (pas de doublons)</p>
            <p>
              3. Les clics suivants doivent mettre à jour le document existant
            </p>
            <p>4. Changez le titre pour créer un nouveau document</p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
          <form action={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Titre du document
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Titre du document"
                maxLength={255}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Contenu
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none min-h-[200px]"
                placeholder="Contenu du document"
              />
            </div>

            <div className="flex justify-end space-x-4">
              <button
                type="submit"
                disabled={isPending}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition-colors"
              >
                {isPending ? "Création..." : "Créer le document"}
              </button>
            </div>

            {/* Message de succès/erreur */}
            {message && (
              <div
                className={`rounded-lg p-4 ${
                  message.includes("succès") ||
                  message.includes("créé") ||
                  message.includes("mis à jour")
                    ? "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800"
                    : "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800"
                }`}
              >
                <p
                  className={`text-sm ${
                    message.includes("succès") ||
                    message.includes("créé") ||
                    message.includes("mis à jour")
                      ? "text-green-600 dark:text-green-400"
                      : "text-red-600 dark:text-red-400"
                  }`}
                >
                  {message}
                </p>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
