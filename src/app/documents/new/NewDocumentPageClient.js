"use client";

import { useActionState } from "react";
import { createDocumentAction } from "@/lib/actions";
import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useLocalSession } from "@/hooks/useLocalSession";
import PropTypes from "prop-types";
import CollaborativeNotepad from "@/components/Paper.js/CollaborativeNotepad";

export default function NewDocumentPageClient({ session }) {
  const router = useRouter();
  const [message, formAction, isPending] = useActionState(
    createDocumentAction,
    undefined
  );
  const [title, setTitle] = useState("");
  const [content, setContent] = useState({
    text: "",
    drawings: [],
    textFormatting: {},
  });
  const [localInfo, setLocalInfo] = useState("");
  const [lastSaved, setLastSaved] = useState({ title: "", content: "" });

  // Utiliser notre hook personnalisé pour gérer la session
  const {
    session: localSession,
    loading,
    isLoggedIn,
    userId,
  } = useLocalSession(session);

  // Redirection vers la page d'édition après création du document
  useEffect(() => {
    if (
      message &&
      typeof message === "object" &&
      message.success &&
      message.documentId
    ) {
      // Rediriger vers la page d'édition du document créé
      router.push(`/documents/${message.documentId}`);
    }
  }, [message, router]);

  // Debounce content updates to prevent infinite loops
  const [debouncedContent, setDebouncedContent] = useState(content);
  const contentUpdateTimeoutRef = useRef(null);

  // Sync debouncedContent with content on initial load
  useEffect(() => {
    setDebouncedContent(content);
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (contentUpdateTimeoutRef.current) {
        clearTimeout(contentUpdateTimeoutRef.current);
      }
    };
  }, []);

  // Debounced content change handler
  const handleContentChange = useCallback((val) => {
    // Clear existing timeout
    if (contentUpdateTimeoutRef.current) {
      clearTimeout(contentUpdateTimeoutRef.current);
    }

    // Set new timeout for debounced update
    const timeout = setTimeout(() => {
      if (typeof val === "string") {
        try {
          const parsed = JSON.parse(val);
          setContent(parsed);
          setDebouncedContent(parsed);
        } catch {
          const fallback = {
            text: val,
            drawings: [],
            textFormatting: {},
          };
          setContent(fallback);
          setDebouncedContent(fallback);
        }
      } else {
        setContent(val);
        setDebouncedContent(val);
      }
    }, 100); // 100ms debounce

    contentUpdateTimeoutRef.current = timeout;
  }, []);

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

  // Track last saved note to prevent duplicates
  let saveTimeout = null;

  const handleSubmit = (formData) => {
    if (isLoggedIn && userId) {
      formData.append("userId", userId);
      formData.append("title", title);
      formData.append("content", JSON.stringify(debouncedContent));
      formAction(formData);
      return;
    }

    // Prevent duplicate notes: only save if content/title changed
    if (
      title.trim() === lastSaved.title &&
      JSON.stringify(debouncedContent) === lastSaved.content
    ) {
      setLocalInfo("Ce document a déjà été enregistré.");
      return;
    }

    // Debounce rapid submissions
    if (saveTimeout) {
      clearTimeout(saveTimeout);
    }
    saveTimeout = setTimeout(() => {
      const nowIso = new Date().toISOString();
      const localId =
        typeof crypto !== "undefined" && crypto.randomUUID
          ? `local-${crypto.randomUUID()}`
          : `local-${Date.now()}`;
      const newDoc = {
        id: localId,
        title: (title || "Sans titre").trim(),
        content: JSON.stringify(content || {}),
        created_at: nowIso,
        updated_at: nowIso,
      };

      const docs = loadLocalDocuments();
      docs.unshift(newDoc);
      const ok = saveLocalDocuments(docs);
      if (ok) {
        setLocalInfo("Document enregistré localement dans ce navigateur.");
        setLastSaved({ title: title.trim(), content: JSON.stringify(content) });
        setTitle("Sans titre");
        setContent({ text: "", drawings: [], textFormatting: {} });
      } else {
        setLocalInfo(
          "Impossible d'enregistrer localement (quota ou permissions)."
        );
      }
    }, 200);
  };

  return (
    <div className="h-screen overflow-hidden bg-white dark:bg-black py-8">
      <div className="max-w-4xl mx-auto px-4">
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
        </div>

        {/* Bandeau d'information en mode anonyme */}
        {!isLoggedIn && (
          <div className="mb-6 rounded-xl border border-orange bg-white text-orange dark:border-dark-purple dark:bg-black dark:text-dark-purple p-4">
            <p className="text-md">
              Vous n'êtes pas connecté. Votre document sera enregistré{" "}
              <strong>localement</strong> dans ce navigateur.
            </p>
          </div>
        )}

        {/* Formulaire de création */}
        <div className="bg-white dark:bg-black rounded-2xl border border-gray dark:border-dark-gray p-6 overflow-hidden">
          <form action={handleSubmit} className="space-y-6">
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
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Contenu
              </label>
              <div className="border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden bg-white dark:bg-gray-700 min-h-[400px]">
                <CollaborativeNotepad
                  roomId="new-document"
                  documentId={null}
                  userId={session?.user?.id ?? null}
                  initialData={{ text: "", drawings: [], textFormatting: {} }}
                  useLocalStorage={false}
                  localMode={true}
                  onContentChange={handleContentChange}
                  placeholder="Commencez à écrire votre document avec mise en forme..."
                  className="min-h-[400px]"
                />
              </div>
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
                disabled={isPending || title.trim().length === 0}
                className="bg-orange hover:bg-orange dark:bg-dark-purple dark:hover:bg-dark-purple disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition-colors"
              >
                {isPending ? "Création..." : "Créer le document"}
              </button>
            </div>

            {/* Message de succès/erreur */}
            {((message && typeof message === "string" && message.trim()) ||
              (typeof message === "object" && message.message) ||
              localInfo) && (
              <div
                className={`shrink-0 rounded-lg p-4 ${
                  (message &&
                    typeof message === "string" &&
                    (message.includes("succès") ||
                      message.includes("créé") ||
                      message.includes("mis à jour"))) ||
                  (typeof message === "object" && message.success) ||
                  localInfo
                    ? "bg-white dark:bg-black border border-orange dark:border-dark-purple"
                    : "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800"
                }`}
              >
                <p
                  className={`text-sm ${
                    (message &&
                      typeof message === "string" &&
                      (message.includes("succès") ||
                        message.includes("créé") ||
                        message.includes("mis à jour"))) ||
                    (typeof message === "object" && message.success) ||
                    localInfo
                      ? "text-orange dark:text-dark-purple text-3xl"
                      : "text-red-600 dark:text-red-400"
                  }`}
                >
                  {localInfo ||
                    (typeof message === "object" ? message.message : message)}
                </p>
              </div>
            )}

            {/* Boutons */}
            {/* <div className="flex justify-center space-x-4 pt-2 shrink-0">
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
            </div> */}
          </form>
        </div>
      </div>
    </div>
  );
}
