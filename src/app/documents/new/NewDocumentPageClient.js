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
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [localInfo, setLocalInfo] = useState("");

  // Utiliser notre hook personnalisé pour gérer la session
  const {
    session: localSession,
    loading,
    isLoggedIn,
    userId,
  } = useLocalSession(session);

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

  // Helpers pour la sauvegarde locale des documents pour utilisateurs non connectés
  const LOCAL_DOCS_KEY = "notus.local.documents";

  const loadLocalDocuments = () => {
    try {
      const raw = localStorage.getItem(LOCAL_DOCS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (_) {
      return [];
    }
  };

  const saveLocalDocuments = (docs) => {
    try {
      localStorage.setItem(LOCAL_DOCS_KEY, JSON.stringify(docs));
      return true;
    } catch (_) {
      return false;
    }
  };

  const handleSubmit = (formData) => {
    // Si l'utilisateur est connecté, on utilise le flux serveur habituel
    if (isLoggedIn && userId) {
      formData.append("userId", userId);
      formData.append("title", title);
      formData.append("content", content);
      formAction(formData);
      return;
    }

    // Sinon, sauvegarde locale dans le navigateur
    const nowIso = new Date().toISOString();
    const localId = typeof crypto !== "undefined" && crypto.randomUUID ? `local-${crypto.randomUUID()}` : `local-${Date.now()}`;
    const newDoc = {
      id: localId,
      title: (title || "Sans titre").trim(),
      content: content || "",
      created_at: nowIso,
      updated_at: nowIso,
    };

    const docs = loadLocalDocuments();
    docs.unshift(newDoc);
    const ok = saveLocalDocuments(docs);
    if (ok) {
      setLocalInfo("Document enregistré localement dans ce navigateur.");
      // Réinitialiser le formulaire pour l'expérience anonyme
      setTitle("Sans titre");
      setContent("");
    } else {
      setLocalInfo("Impossible d'enregistrer localement (quota ou permissions).");
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-black py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* En-tête */}
        <div className="flex items-center justify-between mb-6">
          <Link
            href="/"
            className="text-black dark:text-white font-semibold flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
          </Link>
        </div>

        {/* Bandeau d'information en mode anonyme */}
        {!isLoggedIn && (
          <div className="mb-6 rounded-xl border border-yellow-300 bg-yellow-50 text-yellow-800 dark:border-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-300 p-4">
            <p className="text-sm">
              Vous n'êtes pas connecté. Votre document sera enregistré <strong>localement</strong> dans ce navigateur.
            </p>
          </div>
        )}

        {/* Formulaire de création */}
        <div className="bg-white dark:bg-black rounded-2xl border border-gray dark:border-dark-gray p-6">
          <form action={handleSubmit} className="space-y-6">
            {/* Titre */}
            <div>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange dark:focus:ring-dark-purple bg-transparent text-black dark:text-white text-xl font-semibold"
                placeholder="Titre de la note"
                maxLength={255}
              />
            </div>

            {/* Contenu */}
            <div>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange dark:focus:ring-dark-purple bg-transparent text-black dark:text-white resize-none min-h-[400px]"
                placeholder="Commencez à écrire votre document..."
              />
            </div>

            {/* Message de succès/erreur */}
            {(message || localInfo) && (
              <div
                className={`rounded-lg p-4 ${
                  (message && (
                    message.includes("succès") ||
                    message.includes("créé") ||
                    message.includes("mis à jour")
                  )) || localInfo
                    ? "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800"
                    : "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800"
                }`}
              >
                <p
                  className={`text-sm ${
                    (message && (
                      message.includes("succès") ||
                      message.includes("créé") ||
                      message.includes("mis à jour")
                    )) || localInfo
                      ? "text-green-600 dark:text-green-400"
                      : "text-red-600 dark:text-red-400"
                  }`}
                >
                  {localInfo || message}
                </p>
              </div>
            )}
          </form>
          
        </div>
        {/* Boutons */}
        <div className="flex justify-center space-x-4 py-4">
          <button
            type="submit"
            disabled={isPending}
            className="bg-orange hover:bg-orange dark:bg-dark-purple dark:hover:bg-dark-purple disabled:bg-gray disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg hover:shadow-md shadow-light-gray dark:shadow-light-black transition-all duration-200 cursor-pointer"
          >
            {isPending ? "Sauvegarde..." : "Sauvegarder"}
          </button>
          <Link
            href="/"
            className="px-6 py-3 border border-orange dark:border-dark-purple text-orange dark:text-dark-purple rounded-lg hover:shadow-md shadow-orange dark:shadow-dark-purple transition-all duration-200 cursor-pointer"
          >
            Annuler
          </Link>
        </div>
      </div>
    </div>
  );
}
