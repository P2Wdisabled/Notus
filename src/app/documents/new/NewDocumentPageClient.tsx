"use client";
import { useActionState, startTransition } from "react";
import { Button } from "@/components/ui";
import { createDocumentAction } from "@/lib/actions";
import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Icon from "@/components/Icon";
import { useLocalSession } from "@/hooks/useLocalSession";
import WysiwygNotepad from "@/components/Paper.js/WysiwygNotepad";

interface NewDocumentPageClientProps {
  session?: any;
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

export default function NewDocumentPageClient(props: NewDocumentPageClientProps) {
  // -------- State management --------
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState<NotepadContent>({
    text: "",
    drawings: [],
    textFormatting: {},
  });
  const [canvasCtrl, setCanvasCtrl] = useState<CanvasController | null>(null);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [showSavedState, setShowSavedState] = useState(false);

  // Action state
  const [state, formAction, isPending] = useActionState(createDocumentAction, {
    success: false,
    message: "",
    documentId: 0,
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

  // -------- Content change handling --------
  const handleContentChange = useCallback((newContent: any) => {
    const normalized = normalizeContent(newContent);
    setContent(normalized);
  }, []);

  // -------- Success message handling --------
  const handleSuccess = useCallback(
    (documentId: string | number) => {
      setShowSuccessMessage(true);
      setShowSavedState(true);

      const savedTimer = setTimeout(() => setShowSavedState(false), 1500);
      const messageTimer = setTimeout(() => {
        setShowSuccessMessage(false);
        router.push(`/documents/${documentId}`);
      }, 2000);

      return () => {
        clearTimeout(savedTimer);
        clearTimeout(messageTimer);
      };
    },
    [router]
  );

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
      formData.append("userId", String(submittingUserId));
      formData.append("title", title || "Sans titre");
      formData.append("content", JSON.stringify(contentToSave));
      formData.append("tags", JSON.stringify([]));

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
      title,
      formAction,
    ]
  );

  // Handle successful creation
  useEffect(() => {
    console.log("State received:", state);
    if (state && (state as any).success && (state as any).documentId) {
      console.log("Redirecting to document:", (state as any).documentId);
      handleSuccess((state as any).documentId);
    }
  }, [state, handleSuccess]);

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

  // -------- Main render --------
  return (
    <div className="min-h-screen bg-white dark:bg-black py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Link
            href="/"
            className="text-black dark:text-white font-semibold flex items-center"
          >
            <Icon name="arrowLeft" className="h-5 w-5 mr-2" />
            Retour
          </Link>
        </div>

        {/* Create form */}
        <div className="bg-white dark:bg-black rounded-2xl border border-gray dark:border-dark-gray p-6 overflow-hidden">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
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

            {/* Content */}
            <div>
              <div className="border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden bg-white dark:bg-gray-700">
                <WysiwygNotepad
                  initialData={content}
                  onContentChange={handleContentChange}
                  placeholder="Commencez à écrire votre document..."
                  className=""
                  showDebug={false}
                />
              </div>
            </div>

            {/* Buttons */}
            <div className="flex justify-center space-x-4">
              <Button variant="ghost" className="px-6 py-3" onClick={() => router.back()}>
                Annuler
              </Button>
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
                className={`shrink-0 rounded-lg p-4 mt-4 ${
                  showSuccessMessage
                    ? "bg-white dark:bg-black border border-orange dark:border-dark-purple"
                    : "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800"
                }`}
              >
                <p
                  className={`text-sm ${
                    showSuccessMessage
                      ? "text-orange dark:text-dark-purple"
                      : "text-red-600 dark:text-red-400"
                  }`}
                >
                  {showSuccessMessage
                    ? "Document créé avec succès !"
                    : (state as any)?.error || "Erreur lors de la création"}
                </p>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}

