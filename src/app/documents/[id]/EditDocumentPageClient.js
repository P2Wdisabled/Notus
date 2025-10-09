"use client";

import { useActionState, startTransition } from "react";
import { Button } from "@/components/ui";
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
  const [tags, setTags] = useState([]);
  const [showTagInput, setShowTagInput] = useState(false);
  const [newTag, setNewTag] = useState("");

  // Utiliser notre hook personnalisé pour gérer la session
  const {
    session: localSession,
    loading: sessionLoading,
    isLoggedIn,
    userId,
  } = useLocalSession(session);

  useEffect(() => {
    if (isLoggedIn && params.id && userId) {
      loadDocument();
    }
  }, [isLoggedIn, params.id, userId]);

  const loadDocument = useCallback(async () => {
    try {
      setLoading(true);

      // Utiliser l'API openDoc pour récupérer le titre et le contenu
      const apiUrl = `/api/openDoc?id=${params.id}`;

      const response = await fetch(apiUrl);
      const result = await response.json();

      if (result.success) {
        // Créer un objet document avec les données reçues
        const documentData = {
          id: params.id,
          title: result.title,
          content: result.content,
          tags: Array.isArray(result.tags) ? result.tags : [],
          updated_at: result.updated_at,
          user_id: parseInt(userId), // Utiliser l'ID utilisateur de la session
        };

        setDocument(documentData);
        setTitle(result.title);
        setContent(result.content);
        setTags(Array.isArray(result.tags) ? result.tags : []);
      } else {
        console.error("❌ [CLIENT] Erreur API:", result.error);
        setError(result.error || "Erreur lors du chargement du document");
      }
    } catch (err) {
      setError("Erreur lors du chargement du document");
      console.error("❌ [CLIENT] Erreur:", err);
    } finally {
      setLoading(false);
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
    formData.append("tags", JSON.stringify(tags));
    formAction(formData);
  };

  const persistTags = (nextTags) => {
    if (!userId) return;
    const fd = new FormData();
    fd.append("documentId", params.id);
    fd.append("userId", userId);
    fd.append("title", title || "Sans titre");
    fd.append("content", content || "");
    fd.append("tags", JSON.stringify(nextTags));
    startTransition(() => {
      formAction(fd);
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

  if (sessionLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange dark:border-dark-purple mx-auto mb-4"></div>
          <p className="text-orange dark:text-dark-purple">
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
      <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange dark:border-dark-purple mx-auto mb-4"></div>
          <p className="text-orange dark:text-dark-purple">Chargement...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center p-4">
        <div className="bg-white dark:bg-black rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <h1 className="text-2xl font-bold text-black dark:text-white mb-4">
            Erreur
          </h1>
          <p className="text-black dark:text-white mb-6">{error}</p>
          <Link
            href="/"
            className="bg-orange hover:bg-orange dark:bg-dark-purple dark:hover:bg-dark-purple text-white font-semibold py-3 px-6 rounded-lg transition-colors"
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
      <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center p-4">
        <div className="bg-white dark:bg-black rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <h1 className="text-2xl font-bold text-black dark:text-white mb-4">
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
    <div className="h-screen overflow-hidden bg-white dark:bg-black py-8">
      <div className="mx-auto px-4 md:px-[10%] h-full flex flex-col">
        {/* En-tête */}
        <div className="flex items-center justify-between mb-6">
          <Link
            href="/"
            className="text-black dark:text-white font-semibold flex items-center"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 mr-2"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
                clipRule="evenodd"
              />
            </svg>
          </Link>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Modifié le{" "}
              {new Date(document.updated_at).toLocaleDateString("fr-FR")}
            </span>
          </div>
        </div>

        {/* Formulaire d'édition */}
        <div className="flex-1 min-h-0 bg-white dark:bg-black rounded-2xl border border-gray dark:border-dark-gray p-6 overflow-hidden">
          <form action={handleSubmit} className="flex h-full flex-col gap-4">
            {/* Tags */}
            <div className="mb-1">
              <div className="flex flex-wrap items-center gap-2">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center font-medium rounded-full px-2 py-0.5 text-xs bg-purple/10 dark:bg-purple/20 text-purple dark:text-light-purple border border-purple/20 dark:border-purple/30 pr-1"
                  >
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
                  </span>
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
                    <input
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      placeholder="Nouveau tag"
                      className="h-7 text-sm px-2 py-1 rounded border border-gray dark:border-dark-gray bg-transparent text-black dark:text-white"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") addTag();
                        if (e.key === "Escape") {
                          setShowTagInput(false);
                          setNewTag("");
                        }
                      }}
                      autoFocus
                    />
                    <button
                      type="button"
                      className="px-2 py-0.5 text-sm bg-orange dark:bg-dark-purple text-white rounded"
                      onClick={addTag}
                    >
                      Ajouter
                    </button>
                    <button
                      type="button"
                      className="px-2 py-0.5 text-sm border border-gray dark:border-dark-gray rounded"
                      onClick={() => {
                        setShowTagInput(false);
                        setNewTag("");
                      }}
                    >
                      Annuler
                    </button>
                  </div>
                )}
              </div>
            </div>
            {/* Titre */}
            <div>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange dark:focus:ring-dark-purple bg-transparent text-black dark:text-white text-xl font-semibold"
                placeholder="Titre du document"
                maxLength={255}
              />
            </div>

            {/* Contenu */}
            <div className="flex-1 min-h-0">
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="h-full w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange dark:focus:ring-dark-purple bg-transparent text-black dark:text-white resize-none"
                placeholder="Commencez à écrire votre document..."
              />
            </div>

            {/* Boutons */}
            <div className="flex justify-center space-x-4 pt-2 shrink-0">
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

            {/* Message de succès/erreur */}
            {message && (
              <div
                className={`shrink-0 rounded-lg p-4 ${
                  message.includes("succès") ||
                  message.includes("mis à jour") ||
                  message.includes("sauvegardé")
                    ? "bg-white dark:bg-black border border-orange dark:border-dark-purple"
                    : "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800"
                }`}
              >
                <p
                  className={`text-sm ${
                    message.includes("succès") ||
                    message.includes("mis à jour") ||
                    message.includes("sauvegardé")
                      ? "text-orange dark:text-dark-purple text-3xl"
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
