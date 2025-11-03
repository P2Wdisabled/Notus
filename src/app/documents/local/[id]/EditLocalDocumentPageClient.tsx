"use client";
import WysiwygNotepad from "@/components/Paper.js/WysiwygNotepad";

import { useEffect, useState, useCallback } from "react";
import { useLocalSession } from "@/hooks/useLocalSession";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import TagsManager from "@/components/TagsManager";

const LOCAL_DOCS_KEY = "notus.local.documents";

interface NotepadContent {
  text: string;
  drawings: any[];
  textFormatting: Record<string, any>;
  timestamp?: number;
}

interface LocalDocument {
  id: string;
  title: string;
  content: NotepadContent | string;
  created_at: string;
  updated_at: string;
  tags?: string[];
}

interface EditLocalDocumentPageClientProps {
  params: Promise<{ id: string }> | { id: string };
}

export default function EditLocalDocumentPageClient({ params }: EditLocalDocumentPageClientProps) {
  const localSession = useLocalSession();
  const router = useRouter();
  const [document, setDocument] = useState<LocalDocument | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [showSavedState, setShowSavedState] = useState(false);
  const [tags, setTags] = useState<string[]>([]);

  // Gérer les paramètres asynchrones
  const [docId, setDocId] = useState<string | null>(null);
  const [isNewDoc, setIsNewDoc] = useState(false);

  const [content, setContent] = useState<NotepadContent>(() => ({
    text: "",
    drawings: [],
    textFormatting: {},
  }));
  const [editorKey, setEditorKey] = useState(() => `new-${Date.now()}`);

  // Gérer les paramètres asynchrones
  useEffect(() => {
    const initializeParams = async () => {
      if (params) {
        const resolvedParams = await params;
        const id = resolvedParams?.id;
        const isNew = !id || id === "new";
        setDocId(id);
        setIsNewDoc(isNew);

        // Charger le document directement ici au lieu d'attendre un autre useEffect
        if (isNew) {
          // Nouveau document
          setDocument(null);
          setTitle("");
          setContent({ text: "", drawings: [], textFormatting: {} });
          setEditorKey(`new-${Date.now()}`);
          setError(null);
          setLoading(false);
        } else {
          // Document existant
          const docs = loadLocalDocuments();
          const found = docs.find((d) => d.id === id);
          if (!found) {
            setError("Document local introuvable");
            setDocument(null);
          } else {
            setDocument(found);
            setTitle(found.title || "Sans titre");
            // Charger les tags depuis le doc ou localStorage
            try {
              const rawTags = localStorage.getItem("notus.tags");
              const tagsMap = rawTags ? JSON.parse(rawTags) : {};
              const existing = Array.isArray(found.tags)
                ? found.tags
                : Array.isArray(tagsMap[String(found.id)])
                ? tagsMap[String(found.id)]
                : [];
              setTags(existing);
            } catch (_) {
              setTags([]);
            }
            // Normalize content for editor
            let normalized: NotepadContent;
            if (typeof found.content === "string") {
              try {
                normalized = JSON.parse(found.content);
              } catch {
                normalized = {
                  text: found.content,
                  drawings: [],
                  textFormatting: {},
                };
              }
            } else {
              normalized = found.content as NotepadContent;
            }
            setContent(
              normalized || { text: "", drawings: [], textFormatting: {} }
            );
            setEditorKey(`local-doc-${id}-${found.updated_at}`);
          }
          setLoading(false);
        }
      }
    };
    initializeParams();
  }, [params]);

  const loadLocalDocuments = (): LocalDocument[] => {
    try {
      const raw = localStorage.getItem(LOCAL_DOCS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (_) {
      return [];
    }
  };

  const saveLocalDocuments = (docs: LocalDocument[]): boolean => {
    try {
      localStorage.setItem(LOCAL_DOCS_KEY, JSON.stringify(docs));
      return true;
    } catch (_) {
      return false;
    }
  };

  // La logique de chargement est maintenant dans l'initialisation des paramètres

  const handleSave = async () => {
    const docs = loadLocalDocuments();

    // Get latest drawings from editor if available
    let drawingsPayload = content.drawings || [];
    // Build normalized content object
    const normalizedContentObj: NotepadContent = {
      text: content.text || "",
      drawings: drawingsPayload,
      textFormatting: content.textFormatting || {},
      timestamp: Date.now(),
    };
    const nowIso = new Date().toISOString();

    if (isNewDoc) {
      // Créer un nouveau document
      const newDoc: LocalDocument = {
        id: `local-${Date.now()}`,
        title: (title || "Sans titre").trim(),
        content: normalizedContentObj,
        created_at: nowIso,
        updated_at: nowIso,
        tags: tags,
      };

      docs.push(newDoc);
      const ok = saveLocalDocuments(docs);
      if (!ok) {
        setError("Impossible d'enregistrer localement (quota ou permissions)");
        return;
      }
      // Persister les tags pour ce document dans notus.tags
      try {
        const raw = localStorage.getItem("notus.tags");
        const tagsMap = raw ? JSON.parse(raw) : {};
        tagsMap[String(newDoc.id)] = tags;
        localStorage.setItem("notus.tags", JSON.stringify(tagsMap));
      } catch (_) {}
      // Mettre à jour l'état local et rediriger vers l'URL correcte
      setDocument(newDoc);
      setIsNewDoc(false); // Marquer comme document existant
      setShowSavedState(true);

      // Rediriger vers l'URL avec le nouvel ID
      setTimeout(() => {
        router.push(`/documents/local/${newDoc.id}`);
      }, 100);
    } else {
      // Mettre à jour un document existant
      const idx = docs.findIndex((d) => d.id === docId);
      if (idx === -1) {
        setError("Document local introuvable");
        return;
      }

      docs[idx] = {
        ...docs[idx],
        title: (title || "Sans titre").trim(),
        content: normalizedContentObj,
        updated_at: nowIso,
        tags: tags,
      };
      const ok = saveLocalDocuments(docs);
      if (!ok) {
        setError("Impossible d'enregistrer localement (quota ou permissions)");
        return;
      }
      // Persister les tags pour ce document dans notus.tags
      try {
        const raw = localStorage.getItem("notus.tags");
        const tagsMap = raw ? JSON.parse(raw) : {};
        tagsMap[String(docs[idx].id)] = tags;
        localStorage.setItem("notus.tags", JSON.stringify(tagsMap));
      } catch (_) {}
      // Mettre à jour l'état local et rester sur la page
      setDocument(docs[idx]);
      setShowSavedState(true);
    }
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

  // Supprimé la condition qui empêchait l'affichage pour les nouveaux documents

  // Determine the content text for the document
  const contentText = document
    ? typeof document.content === "object" && document.content !== null
      ? (document.content as NotepadContent).text || ""
      : document.content || ""
    : "";

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
            Retour
          </Link>
        </div>

        {/* Message de sauvegarde */}
        {showSavedState && (
          <div className="mb-4 rounded-lg p-4 bg-white dark:bg-black border border-orange dark:border-dark-purple">
            <p className="text-sm text-orange dark:text-dark-purple">
              {isNewDoc
                ? "Document créé avec succès !"
                : "Document sauvegardé avec succès !"}
            </p>
          </div>
        )}

        {/* Contenu */}
        <div className="bg-white dark:bg-black rounded-2xl border border-gray dark:border-dark-gray p-6 overflow-hidden">
          <div className="space-y-6">
            {/* Tags */}
            <div className="mb-1">
              <TagsManager
                tags={tags}
                onTagsChange={setTags}
                placeholder="Ajouter un tag..."
                maxTags={20}
                className="w-full"
                currentUserId={localSession?.userId}
                requireAuth={true}
              />
            </div>

            {/* Title */}
            <div>
              <input
                type="text"
                value={title}
                onChange={(e) => { setTitle(e.target.value); setShowSavedState(false); }}
                className="w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange dark:focus:ring-primary bg-transparent text-foreground text-xl font-semibold"
                placeholder="Titre du document"
                maxLength={255}
              />
            </div>

            {/* Editor */}
            <div>
              <div className="border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden bg-white dark:bg-gray-700">
                <WysiwygNotepad
                  key={editorKey}
                  initialData={content}
                  onContentChange={(val: any) => {
                    if (typeof val === "string") {
                      try {
                        setContent(JSON.parse(val));
                        setShowSavedState(false);
                      } catch {
                        setContent({
                          text: val,
                          drawings: [],
                          textFormatting: {},
                        });
                        setShowSavedState(false);
                      }
                    } else {
                      setContent(val);
                      setShowSavedState(false);
                    }
                  }}
                  placeholder="Commencez à écrire votre document..."
                  className=""
                  showDebug={false}
                />
              </div>
            </div>

            <div className="flex justify-center space-x-4 pt-2 shrink-0">
              <Button
                type="button"
                onClick={handleSave}
                disabled={showSavedState}
                className={`${showSavedState
                  ? "bg-green-600 hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-600"
                  : "bg-primary hover:bg-primary/90 text-primary-foreground"
                  } disabled:bg-gray-400 disabled:cursor-not-allowed font-semibold py-3 px-6 rounded-lg transition-colors`}
              >
                {showSavedState
                  ? isNewDoc
                    ? "Créé"
                    : "Sauvegardé"
                  : isNewDoc
                    ? "Créer le document"
                    : "Sauvegarder"}
              </Button>
              <Link
                href="/"
                className="px-6 py-3 rounded-lg text-foreground hover:shadow-md hover:border-primary hover:bg-foreground/5 border border-primary cursor-pointer"
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

