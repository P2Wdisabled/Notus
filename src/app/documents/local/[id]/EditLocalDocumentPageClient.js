"use client";
import CollaborativeNotepad from "@/components/Paper.js/CollaborativeNotepad";

import { useEffect, useState, useCallback } from "react";
import { useLocalSession } from "@/hooks/useLocalSession";
import Link from "next/link";
import { useRouter } from "next/navigation";

const LOCAL_DOCS_KEY = "notus.local.documents";

export default function EditLocalDocumentPageClient({ params }) {
  const localSession = useLocalSession();
  const router = useRouter();
  const [document, setDocument] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [title, setTitle] = useState("");
  // If creating a new document (no id), always start with empty content and a fresh editor key
  const isNewDoc = !params?.id;
  const [content, setContent] = useState(() => isNewDoc ? { text: "", drawings: [], textFormatting: {} } : { text: "", drawings: [], textFormatting: {} });
  const [editorKey, setEditorKey] = useState(() => isNewDoc ? `new-${Date.now()}` : "");
  const docId = params?.id;

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

  const load = useCallback(() => {
    setLoading(true);
    try {
      const docs = loadLocalDocuments();
      const found = docs.find((d) => d.id === docId);
      if (!found) {
        setError("Document local introuvable");
        setDocument(null);
      } else {
        setDocument(found);
        setTitle(found.title || "Sans titre");
        // Normalize content for editor
        let normalized = found.content;
        if (typeof normalized === "string") {
          try {
            normalized = JSON.parse(normalized);
          } catch {
            normalized = { text: normalized, drawings: [], textFormatting: {} };
          }
        }
        setContent(normalized || { text: "", drawings: [], textFormatting: {} });
        setEditorKey(`local-doc-${docId}-${found.updated_at}`);
      }
    } finally {
      setLoading(false);
    }
  }, [docId]);

  useEffect(() => {
    if (docId) {
      load();
    } else {
      // New document: reset content and editor key
      setContent({ text: "", drawings: [], textFormatting: {} });
      setEditorKey(`new-${Date.now()}`);
    }
  }, [docId, load]);

  const handleSave = async () => {
    const docs = loadLocalDocuments();
    const idx = docs.findIndex((d) => d.id === docId);
    if (idx === -1) {
      setError("Document local introuvable");
      return;
    }
    // Get latest drawings from editor if available
    let drawingsPayload = content.drawings || [];
    // Build normalized content object
    const normalizedContentObj = {
      text: content.text || "",
      drawings: drawingsPayload,
      textFormatting: content.textFormatting || {},
      timestamp: Date.now(),
    };
    const nowIso = new Date().toISOString();
    docs[idx] = {
      ...docs[idx],
      title: (title || "Sans titre").trim(),
      content: normalizedContentObj,
      updated_at: nowIso,
    };
    const ok = saveLocalDocuments(docs);
    if (!ok) {
      setError("Impossible d'enregistrer localement (quota ou permissions)");
      return;
    }
    router.push("/");
  };

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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Erreur</h1>
          <p className="text-gray-600 dark:text-gray-300 mb-6">{error}</p>
          <Link href="/" className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors">
            Retour à l'accueil
          </Link>
        </div>
      </div>
    );
  }

  if (!document) {
    return null;
  }

  // Determine the content text for the document
  const contentText = typeof document.content === 'object' && document.content !== null
    ? document.content.text || ''
    : document.content || '';

  return (
    <div className="h-screen overflow-hidden bg-white dark:bg-black py-8">
      <div className="mx-auto px-4 md:px-[10%] h-full flex flex-col">
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
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Modifié le {new Date(document.updated_at).toLocaleDateString("fr-FR")}
            </span>
          </div>
        </div>

        {/* Contenu */}
        <div className="flex-1 min-h-0 bg-white dark:bg-black rounded-2xl border border-gray dark:border-dark-gray p-6 overflow-hidden">
          <div className="space-y-6 h-full flex flex-col">
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

            <div className="flex-1 min-h-0">
              <CollaborativeNotepad
                key={editorKey}
                initialData={content}
                useLocalStorage={false}
                calMode={false}
                onContentChange={(val) => {
                  if (typeof val === 'string') {
                    try {
                      setContent(JSON.parse(val));
                    } catch {
                      setContent({ text: val, drawings: [], textFormatting: {} });
                    }
                  } else {
                    setContent(val);
                  }
                }}
                placeholder="Commencez à écrire votre document..."
                className="min-h-[400px]"
              />
            </div>

            <div className="flex justify-center space-x-4 pt-2 shrink-0">
              <button
                type="button"
                onClick={handleSave}
                className="bg-orange hover:bg-orange dark:bg-dark-purple dark:hover:bg-dark-purple disabled:bg-gray disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg hover:shadow-md shadow-light-gray dark:shadow-light-black transition-all duration-200 cursor-pointer"
              >
                Sauvegarder
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
      </div>
    </div>
  );
}



