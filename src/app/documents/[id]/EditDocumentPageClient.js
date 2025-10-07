"use client";
import { useActionState } from "react";
import { updateDocumentAction } from "@/lib/actions";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useLocalSession } from "@/hooks/useLocalSession";
import CollaborativeNotepad from "@/components/Paper.js/CollaborativeNotepad";

export default function EditDocumentPageClient(props) {
  // -------- ALL hooks in a stable order (top of component) --------
  const router = useRouter();

  const [document, setDocument] = useState(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [canvasCtrl, setCanvasCtrl] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // keep custom hook declarations here (stable order)
  const [actionMsg, formAction, isPending] = useActionState(
    updateDocumentAction,
    undefined
  );

  // session hook
  const {
    session: localSession,
    loading: sessionLoading,
    isLoggedIn,
    userId,
  } = useLocalSession(props.session);

  // move normalizeContent here so it's available to all effects/callbacks
  const normalizeContent = (raw) => {
    if (!raw) return { text: "", drawings: [] };
    if (typeof raw === "string") {
      try {
        const parsed = JSON.parse(raw);
        if (typeof parsed === "object" && parsed.text) return parsed;
        return { text: parsed, drawings: [] };
      } catch {
        return { text: raw, drawings: [] };
      }
    }
    if (typeof raw === "object" && raw.text) return raw;
    return { text: String(raw), drawings: [] };
  };

  function deepNormalizeContent(raw) {
    let obj = raw;
    let safety = 0;
    while (obj && typeof obj === "string" && safety++ < 5) {
      try {
        obj = JSON.parse(obj);
      } catch {
        break;
      }
    }
    // If obj.text is a stringified object, parse it
    if (obj && typeof obj === "object" && typeof obj.text === "string") {
      try {
        const parsedText = JSON.parse(obj.text);
        if (typeof parsedText === "object" && parsedText.text) {
          obj.text = parsedText.text;
          obj.drawings = parsedText.drawings ?? obj.drawings ?? [];
          obj.textFormatting = parsedText.textFormatting ?? obj.textFormatting ?? {};
          obj.timestamp = parsedText.timestamp ?? obj.timestamp ?? Date.now();
        } else if (typeof parsedText === "string") {
          obj.text = parsedText;
        }
      } catch {
        // leave as is
      }
    }
    if (!obj || typeof obj !== "object") {
      return { text: String(obj ?? ""), drawings: [], textFormatting: {} };
    }
    return {
      text: typeof obj.text === "string" ? obj.text : "",
      drawings: Array.isArray(obj.drawings) ? obj.drawings : [],
      textFormatting: obj.textFormatting ?? {},
      timestamp: obj.timestamp ?? Date.now(),
    };
  }

  // get the deepest plain text from nested structures (avoid "[object Object]")
  const getPlainText = (value) => {
    try {
      let cur = value;
      let safety = 0;
      while (safety++ < 50) {
        if (typeof cur === "string") return cur;
        if (!cur || typeof cur !== "object") return String(cur ?? "");
        // prefer .text if present
        if ("text" in cur) {
          cur = cur.text;
          continue;
        }
        // fallback: find first string property
        for (const k of Object.keys(cur)) {
          if (typeof cur[k] === "string") return cur[k];
          if (cur[k] && typeof cur[k] === "object" && "text" in cur[k]) {
            cur = cur[k].text;
            break;
          }
        }
        // if nothing useful, stringify whole object (last resort)
        return JSON.stringify(cur);
      }
      return String(value ?? "");
    } catch (e) {
      return String(value ?? "");
    }
  };

  // helper: loadDocument must be declared before useEffect that calls it
  const loadDocument = useCallback(async () => {
    try {
      setIsLoading(true);
      const apiUrl = `/api/openDoc?id=${props.params.id}`;
      const response = await fetch(apiUrl);
      const result = await response.json();

      console.log("DEBUG openDoc result:", result);

      if (result.success) {
        const normalizedContent = deepNormalizeContent(result.content);

        const documentData = {
          id: Number(props.params.id),
          title: result.title,
          content: normalizedContent,
          updated_at: result.updated_at,
          user_id: Number(result.user_id ?? result.owner ?? NaN),
        };
        setDocument(documentData);
        setTitle(result.title);
        setContent(normalizedContent); // <-- store the full object!
      } else {
        console.error("❌ [CLIENT] Erreur API:", result.error);
        setError(result.error || "Erreur lors du chargement du document");
      }
    } catch (err) {
      setError("Erreur lors du chargement du document");
      console.error("❌ [CLIENT] Erreur:", err);
    } finally {
      setIsLoading(false);
    }
  }, [props.params.id]);

  // Load document when session / user available
  useEffect(() => {
    if (isLoggedIn && props.params?.id && userId) {
      loadDocument();
    }
  }, [isLoggedIn, props.params?.id, userId, loadDocument]);

  // debug logging for document (safe: effect always declared)
  useEffect(() => {
    if (!document) return;
    console.log("DEBUG document:", document);
  }, [document]);

  // watch canvas controller changes (safe: effect always declared)
  useEffect(() => {
    console.log("canvasCtrl changed:", canvasCtrl);
  }, [canvasCtrl]);

  // reset editor state when switching documents so previous content doesn't leak
  useEffect(() => {
    setCanvasCtrl(null);
    setTitle(document?.title ?? "");
    setContent(document?.content ?? "");

    // clear localStorage entries used by the editor (adjust prefix to match your editor)
    try {
      const prefix = "collab-notepad"; // change if your editor uses a different prefix/key
      for (const key of Object.keys(localStorage || {})) {
        if (key.startsWith(prefix) || key.includes(`notepad`)) {
          localStorage.removeItem(key);
        }
      }
    } catch (e) {
      // ignore (SSR safety already handled by this effect running in browser)
    }
  }, [document?.id]);

  // ---------- PATCH: build editorInitialData with only a plain string ----------
  const editorInitialData = document
    ? {
        ...document,
        // Only pass a plain string to the editor!
        text: getPlainText(
          document.content?.text ??
            document.content ??
            content?.text ??
            content ??
            ""
        ),
        drawings: Array.isArray(document.content?.drawings)
          ? document.content.drawings
          : [],
        textFormatting: document.content?.textFormatting ?? {},
      }
    : null;

  // clear editor-related localStorage entries for this doc (optional)
  useEffect(() => {
    try {
      const prefix = `collab-notepad-${document?.id ?? ""}`; // adjust to your editor key
      for (const k of Object.keys(localStorage || {})) {
        if (
          k.startsWith(prefix) ||
          k.includes("collab-notepad") ||
          k.includes("notepad")
        ) {
          localStorage.removeItem(k);
        }
      }
    } catch (e) {
      /* ignore in browsers without localStorage */
    }
  }, [document?.id]);

  // ensure handleContentChange stores normalized object:
  const handleContentChange = useCallback((newContent) => {
    setContent(deepNormalizeContent(newContent));
  }, []);
  // current user id to send with save: prefer hook userId then session fallbacks
  const currentUserId =
    userId ?? localSession?.user?.id ?? props.session?.user?.id;

  const handleSubmit = useCallback(
    async (e) => {
      e?.preventDefault?.();

      const submittingUserId = Number(currentUserId ?? 0);
      if (!submittingUserId || isNaN(submittingUserId)) {
        alert('Session invalide. Veuillez vous reconnecter.');
        return;
      }

      // collect raw drawings (prefer canvas controller)
      let drawingsPayload = [];
      if (canvasCtrl && typeof canvasCtrl.saveDrawings === 'function') {
        try {
          drawingsPayload = await canvasCtrl.saveDrawings();
        } catch (err) {
          console.warn('canvasCtrl.saveDrawings failed, falling back to content.drawings', err);
        }
      }
      if (!Array.isArray(drawingsPayload) || drawingsPayload.length === 0) {
        drawingsPayload =
          (content && content.drawings) ||
          (document?.content && document.content.drawings) ||
          [];
      }

      // helper: simplify drawing events to avoid huge payloads (round coords)
      const simplifyDrawings = (dArr) =>
        Array.isArray(dArr)
          ? dArr.map((ev) => {
              if (!ev || typeof ev !== 'object') return ev;
              const copy = { ...ev };
              if (Array.isArray(ev.point)) {
                copy.point = ev.point.map((p) =>
                  typeof p === 'number' ? Math.round(p * 100) / 100 : p
                );
              }
              // keep only needed props
              const allowed = {};
              if (copy.type) allowed.type = copy.type;
              if (copy.point) allowed.point = copy.point;
              if (copy.color) allowed.color = copy.color;
              if (copy.size !== undefined) allowed.size = copy.size;
              return allowed;
            })
          : [];

      const cleanedDrawings = simplifyDrawings(drawingsPayload);

      // convert event stream to strokes for storage (idempotent)
      const drawingsToSave = eventsToStrokes(cleanedDrawings);

      // Build normalized content (single source of truth) - save strokes
      const normalizedContentObj = {
        text: (content && content.text) || getPlainText(content) || "",
        drawings: drawingsToSave,               // <-- store strokes here
        textFormatting: (content && content.textFormatting) || {},
        timestamp: Date.now(),
      };

      console.log('Submitting document with drawings strokes:', drawingsToSave.length);
      console.log('normalizedContentObj preview:', {
        textLength: normalizedContentObj.text.length,
        drawingsSamples: normalizedContentObj.drawings.slice(0,2)
      });

      // Send only content (avoid duplicate drawings field)
      const formData = new FormData();
      formData.append('documentId', String(props.params?.id || ''));
      formData.append('userId', String(submittingUserId));
      formData.append('title', title || '');
      formData.append('content', JSON.stringify(normalizedContentObj));

      console.log('Submitting document with drawings length:', cleanedDrawings.length);

      const result = await updateDocumentAction(formData);
      console.log('updateDocumentAction result:', result);

      if (!result || result.ok !== true || result.dbResult?.success !== true) {
        alert('Save failed: ' + (result?.dbResult?.error || result?.error || 'Unknown error'));
        return;
      }
      // success: you may update local state / notify user
    },
    [canvasCtrl, content, currentUserId, props.params.id, title, document]
  );

  const handleSetDrawingMode = () => {
    if (canvasCtrl && typeof canvasCtrl.setMode === "function") {
      canvasCtrl.setMode("drawing");
    } else {
      console.warn("canvasCtrl not ready or setMode missing", canvasCtrl);
    }
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

  if (isLoading) {
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

  // Verify ownership (use numeric comparison)
  if (Number(document.user_id) !== Number(userId)) {
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

  const normalizedContent = deepNormalizeContent(document.content);
  //console.log("Editor initialData:", normalizedContent);

  // Main render (editing form)
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
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
          </div>
        </div>

        {/* Edit form */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
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

            {/* Content */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Contenu
              </label>
              <div className="border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden bg-white dark:bg-gray-700 min-h-[400px]">
                <CollaborativeNotepad
                  key={`doc-${document.id}-${document.updated_at}-${normalizedContent.text}`}
                  initialData={normalizedContent}
                  useLocalStorage={false}
                  calMode={false}
                  onContentChange={handleContentChange}
                  onCanvasReady={(ctrl) => setCanvasCtrl(ctrl)}
                  placeholder="Edit your document..."
                  className="min-h-[400px]"
                />
              </div>
            </div>

            {/* Buttons */}
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

            {/* Success / error message */}
            {actionMsg && (
              <div
                className={`rounded-lg p-4 ${
                  actionMsg.includes("succès") ||
                  actionMsg.includes("sauvegardé")
                    ? "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800"
                    : "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800"
                }`}
              >
                <p
                  className={`text-sm ${
                    actionMsg.includes("succès") ||
                    actionMsg.includes("sauvegardé")
                      ? "text-green-600 dark:text-green-400"
                      : "text-red-600 dark:text-red-400"
                  }`}
                >
                  {actionMsg}
                </p>
              </div>
            )}
          </form>

          {/* Debug info - remove in production */}
          {process.env.NODE_ENV === "development" && (
            <div className="mt-4 p-3 bg-gray-100 dark:bg-gray-700 rounded text-xs text-gray-600 dark:text-gray-400">
              Document ID: {document.id} | User ID: {userId} | Content Length:{" "}
              {String(content).length}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
