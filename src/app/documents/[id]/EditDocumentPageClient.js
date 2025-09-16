"use client";

import { useActionState } from "react";
import { updateDocumentAction } from "@/lib/actions";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useLocalSession } from "@/hooks/useLocalSession";

export default function EditDocumentPageClient({ session, params }) {
  const router = useRouter();
  const [message, formAction, isPending] = useActionState(
    updateDocumentAction,
    undefined
  );
  const [document, setDocument] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  // Utiliser notre hook personnalisé pour gérer la session
  const {
    session: localSession,
    loading: sessionLoading,
    isLoggedIn,
    userId,
  } = useLocalSession(session);

  useEffect(() => {
    console.log("🔍 [DEBUG] useEffect déclenché avec:", {
      isLoggedIn,
      paramsId: params.id,
      userId,
      shouldLoad: isLoggedIn && params.id && userId,
    });

    if (isLoggedIn && params.id && userId) {
      loadDocument();
    }
  }, [isLoggedIn, params.id, userId]);

  const loadDocument = useCallback(async () => {
    try {
      setLoading(true);
      console.log("🔍 [CLIENT] Début du chargement du document ID:", params.id);

      // Utiliser l'API openDoc pour récupérer le titre et le contenu
      const apiUrl = `/api/openDoc?id=${params.id}`;
      console.log("🔍 [CLIENT] Appel API:", apiUrl);

      const response = await fetch(apiUrl);
      console.log(
        "🔍 [CLIENT] Réponse reçue:",
        response.status,
        response.statusText
      );

      const result = await response.json();
      console.log("🔍 [CLIENT] Données reçues:", result);

      if (result.success) {
        // Créer un objet document avec les données reçues
        const documentData = {
          id: params.id,
          title: result.title,
          content: result.content,
          user_id: parseInt(userId), // Utiliser l'ID utilisateur de la session
        };

        console.log("🔍 [CLIENT] Document créé:", documentData);
        setDocument(documentData);
        setTitle(result.title);
        setContent(result.content);
        console.log("🔍 [CLIENT] État mis à jour avec succès");
      } else {
        console.error("❌ [CLIENT] Erreur API:", result.error);
        setError(result.error || "Erreur lors du chargement du document");
      }
    } catch (err) {
      setError("Erreur lors du chargement du document");
      console.error("❌ [CLIENT] Erreur:", err);
    } finally {
      setLoading(false);
      console.log("🔍 [CLIENT] Chargement terminé");
    }
  }, [params.id, userId]);

  const handleSubmit = (formData) => {
    if (!userId) {
      console.error(
        "❌ Erreur: ID utilisateur non défini dans la session localStorage"
      );
      alert("Erreur: Session utilisateur invalide. Veuillez vous reconnecter.");
      return;
    }

    formData.append("documentId", params.id);
    formData.append("userId", userId);
    formData.append("title", title);
    formData.append("content", content);
    formAction(formData);
  };

  if (sessionLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">
            Chargement de la session...
          </p>
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
            Vous devez être connecté pour modifier un document.
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

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Erreur
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mb-6">{error}</p>
          <Link
            href="/"
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            Retour à l'accueil
          </Link>
        </div>
      </div>
    );
  }

  if (!document) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Document non trouvé
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Ce document n'existe pas ou a été supprimé.
          </p>
          <Link
            href="/"
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            Retour à l'accueil
          </Link>
        </div>
      </div>
    );
  }

  // Vérifier si l'utilisateur est le propriétaire du document
  if (document.user_id !== parseInt(userId)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Accès refusé
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Vous n'êtes pas autorisé à modifier ce document.
          </p>
          <Link
            href="/"
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            Retour à l'accueil
          </Link>
        </div>
      </div>
    );
  }

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
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Modifié le{" "}
              {new Date(document.updated_at).toLocaleDateString("fr-FR")}
            </span>
            <button
              onClick={() => router.back()}
              className="text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
            >
              Fermer
            </button>
          </div>
        </div>

        {/* Formulaire d'édition */}
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
              <button
                type="button"
                onClick={() => router.back()}
                className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition-colors"
              >
                {isPending ? "Sauvegarde..." : "Sauvegarder"}
              </button>
            </div>

            {/* Message de succès/erreur */}
            {message && (
              <div
                className={`rounded-lg p-4 ${
                  message.includes("succès") || message.includes("sauvegardé")
                    ? "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800"
                    : "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800"
                }`}
              >
                <p
                  className={`text-sm ${
                    message.includes("succès") || message.includes("sauvegardé")
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
