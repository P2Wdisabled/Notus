"use client";

import { useActionState } from "react";
import { createDocumentAction } from "@/lib/actions";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useLocalSession } from "@/hooks/useLocalSession";

export default function NewDocumentPageClient({ session }) {
  const router = useRouter();
  const [message, formAction, isPending] = useActionState(
    createDocumentAction,
    undefined
  );
  const [title, setTitle] = useState("Sans titre");
  const [content, setContent] = useState("");

  // Utiliser notre hook personnalisé pour gérer la session
  const {
    session: localSession,
    loading,
    isLoggedIn,
    userId,
  } = useLocalSession(session);

  // Debug: Afficher le contenu de la session
  console.log("🔍 Debug NewDocumentPageClient - Session serveur:", session);
  console.log(
    "🔍 Debug NewDocumentPageClient - Session localStorage:",
    localSession
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Accès refusé
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Vous devez être connecté pour créer un document.
          </p>
          <Link
            href="/login"
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            Se connecter
          </Link>
        </div>
      </div>
    );
  }

  const handleSubmit = (formData) => {
    // Vérifier que l'ID utilisateur est défini dans la session localStorage
    if (!userId) {
      console.error(
        "❌ Erreur: ID utilisateur non défini dans la session localStorage"
      );
      alert("Erreur: Session utilisateur invalide. Veuillez vous reconnecter.");
      return;
    }

    console.log("🔍 Debug handleSubmit - User ID (localStorage):", userId);
    formData.append("userId", userId);
    formData.append("title", title);
    formData.append("content", content);
    formAction(formData);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* En-tête */}
        <div className="flex items-center justify-between mb-6">
          <Link
            href="/"
            className="text-blue-600 hover:text-blue-700 font-semibold flex items-center"
          >
            ← Retour à l'accueil
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Nouveau document
          </h1>
        </div>

        {/* Formulaire de création */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
          <form action={handleSubmit} className="space-y-6">
            {/* Titre */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Titre du document
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-xl font-semibold"
                placeholder="Sans titre"
                maxLength={255}
              />
            </div>

            {/* Contenu */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Contenu
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none min-h-[400px]"
                placeholder="Commencez à écrire votre document..."
              />
            </div>

            {/* Boutons */}
            <div className="flex justify-end space-x-4">
              <Link
                href="/"
                className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Annuler
              </Link>
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
