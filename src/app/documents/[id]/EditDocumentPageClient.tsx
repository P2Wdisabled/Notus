"use client";
import { useActionState, startTransition } from "react";
import { Button } from "@/components/ui";
import { updateDocumentAction } from "@/lib/actions";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useLocalSession } from "@/hooks/useLocalSession";
import CollaborativeNotepad from "@/components/Paper.js/CollaborativeNotepad";
import { Document } from "@/lib/types";
import TagsManager from "@/components/TagsManager";

interface EditDocumentPageClientProps {
  session?: any;
  params: { id: string };
}

interface NotepadContent {
  text: string;
  drawings: any[];
  textFormatting: Record<string, any>;
  timestamp?: number;
}

interface CanvasController {
  saveDrawings?: (options?: { force?: boolean }) => Promise<any[]>;
  clearCanvas?: () => void;
}

export default function EditDocumentPageClient(props: EditDocumentPageClientProps) {
  // -------- State management --------
  const router = useRouter();
  const [document, setDocument] = useState<Document | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState<NotepadContent>({
    text: "",
    drawings: [],
    textFormatting: {},
  });
  const [tags, setTags] = useState<string[]>([]);
  const [showTagInput, setShowTagInput] = useState(false);
  const [newTag, setNewTag] = useState("");
  const [canvasCtrl, setCanvasCtrl] = useState<CanvasController | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [showSavedState, setShowSavedState] = useState(false);

  // Action state
  const [state, formAction, isPending] = useActionState(updateDocumentAction, {
    ok: false,
    error: "",
  });

  // Session management
  const {
    session: localSession,
    loading: sessionLoading,
    isLoggedIn,
    userId,
  } = useLocalSession(props.session);

  // -------- Content normalization --------
  const normalizeContent = (rawContent: any): NotepadContent => {
    if (!rawContent) return { text: "", drawings: [], textFormatting: {} };

    let content = rawContent;

    // Parse if string
    if (typeof content === "string") {
      try {
        content = JSON.parse(content);
      } catch {
        return { text: content, drawings: [], textFormatting: {} };
      }
    }

    // Ensure proper structure
    return {
      text: content.text || "",
      drawings: Array.isArray(content.drawings) ? content.drawings : [],
      textFormatting: content.textFormatting || {},
      timestamp: content.timestamp || Date.now(),
    };
  };

  // -------- Document loading --------
  const loadDocument = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/openDoc?id=${props.params.id}`);
      const result = await response.json();

      if (result.success) {
        const normalizedContent = normalizeContent(result.content);

        setDocument({
          id: Number(props.params.id),
          title: result.title,
          content: JSON.stringify(normalizedContent),
          tags: Array.isArray(result.tags) ? result.tags : [],
          created_at: new Date(result.created_at || result.updated_at),
          updated_at: new Date(result.updated_at),
          user_id: Number(result.user_id ?? result.owner ?? NaN),
        });

        setTitle(result.title);
        setContent(normalizedContent);
        setTags(Array.isArray(result.tags) ? result.tags : []);
      } else {
        setError(result.error || "Erreur lors du chargement du document");
      }
    } catch (err) {
      setError("Erreur lors du chargement du document");
    } finally {
      setIsLoading(false);
    }
  }, [props.params.id]);

  // Load document when ready
  useEffect(() => {
    if (isLoggedIn && props.params?.id && userId) {
      loadDocument();
    }
  }, [isLoggedIn, props.params?.id, userId, loadDocument]);

  // Reset editor state when switching documents
  useEffect(() => {
    if (document) {
      setTitle(document.title);
      setContent(normalizeContent(document.content));
      setCanvasCtrl(null);
    }
  }, [document]);

  // -------- Content change handling --------
  const handleContentChange = useCallback((newContent: any) => {
    const normalized = normalizeContent(newContent);
    setContent(normalized);
  }, []);

  // -------- Success message handling --------
  useEffect(() => {
    if (state && (state as any).ok) {
      setShowSuccessMessage(true);
      setShowSavedState(true);

      const savedTimer = setTimeout(() => setShowSavedState(false), 1500);
      const messageTimer = setTimeout(() => setShowSuccessMessage(false), 3000);

      return () => {
        clearTimeout(savedTimer);
        clearTimeout(messageTimer);
      };
    }
  }, [state]);

  // -------- Save handling --------
  const handleSubmit = useCallback(
    async (e?: React.FormEvent) => {
      e?.preventDefault?.();

      const submittingUserId =
        userId ?? (localSession as any)?.id ?? props.session?.user?.id;
      if (!submittingUserId) {
        alert("Session invalide. Veuillez vous reconnecter.");
        return;
      }

      // Get current drawings from canvas or content
      let drawingsToSave: any[] = [];

      if (canvasCtrl && typeof canvasCtrl.saveDrawings === "function") {
        try {
          drawingsToSave = await canvasCtrl.saveDrawings({ force: true });
        } catch (err) {
          // Fallback to content drawings
          drawingsToSave = content.drawings || [];
        }
      } else {
        drawingsToSave = content.drawings || [];
      }

      // Build content object
      const contentToSave = {
        text: content.text || "",
        drawings: drawingsToSave,
        textFormatting: content.textFormatting || {},
        timestamp: Date.now(),
      };

      // Prepare form data
      const formData = new FormData();
      formData.append("documentId", String(props.params?.id || ""));
      formData.append("userId", String(submittingUserId));
      formData.append("title", title || "");
      formData.append("content", JSON.stringify(contentToSave));
      formData.append("tags", JSON.stringify(tags));

      // Submit
      startTransition(() => {
        formAction(formData);
      });
    },
    [
      canvasCtrl,
      content,
      userId,
      localSession,
      props.session,
      props.params.id,
      title,
      tags,
      formAction,
    ]
  );

// -------- Tag management --------
const persistTags = (nextTags: string[]) => {
  if (!userId) return;
  const fd = new FormData();
  fd.append("documentId", String(props.params?.id || ""));
  fd.append("userId", String(userId));
  fd.append("title", title || "Sans titre");
  fd.append("content", JSON.stringify(content || ""));
  fd.append("tags", JSON.stringify(nextTags));
  startTransition(() => {
    formAction(fd);
  });
};

const handleTagsChange = (newTags: string[]) => {
  setTags(newTags);
  persistTags(newTags);
};

  // -------- Loading states --------
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

  if (isLoading) {
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

  // Verify ownership
  if (Number(document.user_id) !== Number(userId)) {
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

  // -------- Main render --------
  return (
    <div className="h-screen overflow-hidden bg-white dark:bg-black py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
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

        {/* Edit form */}
        <div className="bg-white dark:bg-black rounded-2xl border border-gray dark:border-dark-gray p-6 overflow-hidden">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Tags */}
            <div className="mb-1">
              <TagsManager
                tags={tags}
                onTagsChange={handleTagsChange}
                placeholder="Ajouter un tag..."
                maxTags={20}
                className="w-full"
              />
            </div>

            {/* Title */}
            <div>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange dark:focus:ring-primary bg-transparent text-foreground text-xl font-semibold"
                placeholder="Titre du document"
                maxLength={255}
              />
            </div>

            {/* Content */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Contenu
              </label>
              <div className="border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden bg-white dark:bg-gray-700 min-h-[400px]">
                <CollaborativeNotepad
                  key={`doc-${document.id}-${document.updated_at}`}
                  initialData={content}
                  useLocalStorage={false}
                  calMode={false}
                  onContentChange={handleContentChange}
                  onCanvasReady={(ctrl) => setCanvasCtrl(ctrl)}
                  placeholder="Commencez à écrire votre document avec mise en forme..."
                  className="min-h-[400px]"
                />
              </div>
            </div>

            {/* Buttons */}
            <div className="flex justify-center space-x-4">
            <Link
                href="/"
                className="px-6 py-3 rounded-lg text-foreground hover:shadow-md hover:border-primary hover:bg-foreground/5 border border-primary cursor-pointer"
              >
                Annuler
              </Link>
              <Button
                type="submit"
                disabled={isPending}
                className={`${
                  showSavedState
                    ? "bg-green-600 hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-600"
                    : "bg-primary hover:bg-primary/90 text-primary-foreground"
                } disabled:bg-gray-400 disabled:cursor-not-allowed font-semibold py-3 px-6 rounded-lg transition-colors`}
              >
                {isPending
                  ? "Sauvegarde..."
                  : showSavedState
                    ? "Sauvegardé"
                    : "Sauvegarder"}
              </Button>
            </div>
            
            {/* Success/Error messages */}
            {(showSuccessMessage || (state && (state as any).error)) && (
              <div
                className={`shrink-0 rounded-lg p-4 mt-4 ${showSuccessMessage
                  ? "bg-white dark:bg-black border border-orange dark:border-dark-purple"
                  : "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800"
                  }`}
              >
                <p
                  className={`text-sm ${showSuccessMessage
                    ? "text-orange dark:text-dark-purple"
                    : "text-red-600 dark:text-red-400"
                    }`}
                >
                  {showSuccessMessage
                    ? "Document sauvegardé avec succès !"
                    : (state as any)?.error || "Erreur lors de la sauvegarde"}
                </p>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}

