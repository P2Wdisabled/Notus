"use client";
import { useActionState, startTransition } from "react";
import { Button, Modal } from "@/components/ui";
import MenuItem from "@/components/ui/overlay/overlay-menu-item";
import { Input } from "@/components/ui/input";
import { updateDocumentAction } from "@/lib/actions";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useLocalSession } from "@/hooks/useLocalSession";
import WysiwygNotepad from "@/components/Paper.js/WysiwygNotepad";
import { Document } from "@/lib/types";
import TagsManager from "@/components/documents/TagsManager";
import { addShareAction, deleteDocumentAction } from "@/lib/actions/DocumentActions";
import UserListButton from "@/components/ui/UserList/UserListButton";
import { useGuardedNavigate } from "@/hooks/useGuardedNavigate";
import { useCollaborativeTitle } from "@/lib/paper.js/useCollaborativeTitle";
import sanitizeLinks from "@/lib/sanitizeLinks";
import Icon from "@/components/Icon";

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

type UpdateDocState =
  | { ok: boolean; error: string }
  | { ok: boolean; id: number; dbResult: unknown };

export default function EditDocumentPageClient(props: EditDocumentPageClientProps) {
  // -------- All Hooks must be called unconditionally first --------

  const {
    session: localSession,
    loading: sessionLoading,
    isLoggedIn,
    userId,
    userEmail,
  } = useLocalSession(props.session);

  // Router
  const router = useRouter();
  const searchParams = useSearchParams();
  const isNew = searchParams?.get("isNew") === "1";
  const { guardedNavigate, checkConnectivity } = useGuardedNavigate();

  // Action state (must be before any conditional returns)
  const typedUpdateAction =
    updateDocumentAction as unknown as (
      prevState: UpdateDocState,
      payload: FormData | Record<string, any>
    ) => Promise<UpdateDocState>;

  const [state, formAction, isPending] = useActionState<
    UpdateDocState,
    FormData | Record<string, any>
  >(typedUpdateAction, { ok: false, error: "" });

  const [deleteState, deleteAction] = useActionState(
    deleteDocumentAction as unknown as (prev: any, fd: FormData) => Promise<string>,
    ""
  );

  const [document, setDocument] = useState<Document | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState<NotepadContent>({
    text: "",
    drawings: [],
    textFormatting: {},
  });

  async function handleCancelCreation() {
    const fd = new FormData();
    if (document?.id) fd.set("documentId", String(document.id));
    if (userId) fd.set("userId", String(userId));
    startTransition(() => {
      deleteAction(fd);
    });
    router.push("/");
  }
  const [tags, setTags] = useState<string[]>([]);
  const [showTagInput, setShowTagInput] = useState(false);
  const [newTag, setNewTag] = useState("");
  const [canvasCtrl, setCanvasCtrl] = useState<CanvasController | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [showSavedState, setShowSavedState] = useState(false);
  const [showSavedNotification, setShowSavedNotification] = useState(false);


  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [permission, setPermission] = useState("read");
  const [shareEmail, setShareEmail] = useState("");
  const [shareLoading, setShareLoading] = useState(false);
  const [shareError, setShareError] = useState<string | null>(null);
  const [shareSuccess, setShareSuccess] = useState<string | null>(null);
  const [hasEditAccess, setHasEditAccess] = useState<boolean | null>(null);
  const [hasReadAccess, setHasReadAccess] = useState<boolean | null>(null);
  const [users, setUsers] = useState([]);
  const [isOffline, setIsOffline] = useState(false);
  const [offlineBaseline, setOfflineBaseline] = useState<string>("");

  // Collaborative title synchronization
  const { emitTitleChange, isConnected: isTitleConnected } = useCollaborativeTitle({
    roomId: document ? String(document.id) : undefined,
    onRemoteTitle: (remoteTitle: string) => {
      setTitle(remoteTitle);
      // Update localStorage with remote title change
      updateLocalStorage(content, remoteTitle);
    },
  });

  const normalizeContent = useCallback((rawContent: any): NotepadContent => {
    if (!rawContent) return { text: "", drawings: [], textFormatting: {} };

    let content = rawContent;

    if (typeof content === "string") {
      try {
        content = JSON.parse(content);
      } catch {
        return { text: content, drawings: [], textFormatting: {} };
      }
    }

    return {
      text: content.text || "",
      drawings: Array.isArray(content.drawings) ? content.drawings : [],
      textFormatting: content.textFormatting || {},
      timestamp: content.timestamp || Date.now(),
    };
  }, []);

  const loadDocument = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/openDoc?id=${props.params.id}`, { cache: "no-store" });
      const result = await response.json();

      if (result.success) {
        const normalizedContent = normalizeContent(result.content);
        const docObj = {
          id: Number(props.params.id),
          title: result.title,
          content: JSON.stringify(normalizedContent),
          tags: Array.isArray(result.tags) ? result.tags : [],
          created_at: new Date(result.created_at || result.updated_at),
          updated_at: new Date(result.updated_at),
          user_id: Number(result.user_id ?? result.owner ?? NaN),
        };
        setDocument(docObj);
        setTitle(result.title);
        setContent(normalizedContent);
        setTags(Array.isArray(result.tags) ? result.tags : []);

        try {
          const cachePayload = {
            id: Number(props.params.id),
            title: result.title,
            content: normalizedContent,
            tags: Array.isArray(result.tags) ? result.tags : [],
            updated_at: result.updated_at,
            user_id: Number(result.user_id ?? result.owner ?? NaN),
            cachedAt: Date.now(),
          };
          if (typeof window !== "undefined") {
            localStorage.setItem(`notus:doc:${props.params.id}`,
              JSON.stringify(cachePayload)
            );
          }
        } catch { }
      } else {
        try {
          if (typeof window !== "undefined") {
            const cached = localStorage.getItem(`notus:doc:${props.params.id}`);
            if (cached) {
              const c = JSON.parse(cached);
              setDocument({
                id: Number(c.id),
                title: c.title,
                content: JSON.stringify(normalizeContent(c.content)),
                tags: Array.isArray(c.tags) ? c.tags : [],
                created_at: new Date(c.created_at || c.updated_at),
                updated_at: new Date(c.updated_at),
                user_id: Number(c.user_id ?? NaN),
              });
              setTitle(c.title);
              setContent(normalizeContent(c.content));
              setTags(Array.isArray(c.tags) ? c.tags : []);
              setError(null);
              return;
            }
          }
        } catch { }
        setError(result.error || "Erreur lors du chargement du document");
      }
    } catch (err) {
      try {
        if (typeof window !== "undefined") {
          const cached = localStorage.getItem(`notus:doc:${props.params.id}`);
          if (cached) {
            const c = JSON.parse(cached);
            setDocument({
              id: Number(c.id),
              title: c.title,
              content: JSON.stringify(normalizeContent(c.content)),
              tags: Array.isArray(c.tags) ? c.tags : [],
              created_at: new Date(c.created_at || c.updated_at),
              updated_at: new Date(c.updated_at),
              user_id: Number(c.user_id ?? NaN),
            });
            setTitle(c.title);
            setContent(normalizeContent(c.content));
            setTags(Array.isArray(c.tags) ? c.tags : []);
            setError(null);
            return;
          }
        }
      } catch { }
      setError("Erreur lors du chargement du document");
    } finally {
      setIsLoading(false);
    }
  }, [props.params.id, normalizeContent]);

  useEffect(() => {
    if (isLoggedIn && props.params?.id && userId) {
      loadDocument();
    }
  }, [isLoggedIn, props.params?.id, userId, loadDocument]);

  useEffect(() => {
    if (document) {
      setTitle(document.title);
      setContent(normalizeContent(document.content));
      setCanvasCtrl(null);
      fetch(`/api/openDoc/accessList?id=${document.id}`)
        .then(res => res.json())
        .then(data => {
          if (data.success && Array.isArray(data.accessList)) {
            setUsers(
              data.accessList.map((user: any) => ({
                ...user,
                avatarUrl: user.profile_image || "",
                name: user.username || user.email || "Utilisateur",
              }))
            );
          } else {
            setUsers([]);
          }
        })
        .catch(() => setUsers([]));
    }
  }, [document, normalizeContent]);

  useEffect(() => {
    const key = `notus:doc:${props.params.id}`;
    const handleBeforeUnload = () => {
      try {
        localStorage.removeItem(key);
      } catch { }
    };

    if (typeof window !== "undefined") {
      window.addEventListener("beforeunload", handleBeforeUnload);
    }

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("beforeunload", handleBeforeUnload);
        try {
          localStorage.removeItem(key);
        } catch { }
      }
    };
  }, [props.params.id]);

  // Utility function to update localStorage with current state
  const updateLocalStorage = useCallback((contentToSave: any, titleToSave?: string) => {
    try {
      if (typeof window !== "undefined") {
        const key = `notus:doc:${props.params.id}`;
        const cachedRaw = localStorage.getItem(key);
        const cached = cachedRaw ? JSON.parse(cachedRaw) : {};
        const payload = {
          ...(cached || {}),
          id: Number(props.params.id),
          title: titleToSave ?? title,
          content: contentToSave,
          tags: tags,
          updated_at: new Date().toISOString(),
          user_id: cached?.user_id ?? Number(userId ?? ((props.session as any)?.user?.id ?? 0)),
          cachedAt: Date.now(),
        };
        localStorage.setItem(key, JSON.stringify(payload));
      }
    } catch (err) {
    }
  }, [props.params.id, title, tags, userId, props.session]);

  const handleContentChange = useCallback((newContent: any) => {
    const normalized = normalizeContent(newContent);
    setContent(normalized);
    updateLocalStorage(normalized);
  }, [normalizeContent, updateLocalStorage]);

  useEffect(() => {
    if (state && (state as any).ok) {
      setShowSuccessMessage(true);
      setShowSavedState(true);
      setShowSavedNotification(true);

      const savedTimer = setTimeout(() => setShowSavedState(false), 1500);
      const messageTimer = setTimeout(() => setShowSuccessMessage(false), 3000);
      const notificationTimer = setTimeout(() => setShowSavedNotification(false), 2000);

      return () => {
        clearTimeout(messageTimer);
        clearTimeout(notificationTimer);
      };
    }
  }, [state]);

  const handleSubmit = useCallback(
    async (e?: React.FormEvent) => {
      e?.preventDefault?.();

      const submittingUserId = String(
        userId ?? (localSession as any)?.id ?? ((props.session as any)?.user?.id ?? "")
      );
      if (!submittingUserId) {
        alert("Session invalide. Veuillez vous reconnecter.");
        return;
      }

      let drawingsToSave: any[] = [];

      if (canvasCtrl && typeof canvasCtrl.saveDrawings === "function") {
        try {
          drawingsToSave = await canvasCtrl.saveDrawings({ force: true });
        } catch (err) {
          drawingsToSave = content.drawings || [];
        }
      } else {
        drawingsToSave = content.drawings || [];
      }

      const contentToSave = {
        text: sanitizeLinks(content.text || ""),
        drawings: drawingsToSave,
        textFormatting: content.textFormatting || {},
        timestamp: Date.now(),
      };

      const formData = new FormData();
      formData.append("documentId", String(props.params?.id || ""));
      formData.append("userId", String(submittingUserId));
      formData.append("title", title || "");
      formData.append("content", JSON.stringify(contentToSave));
      formData.append("tags", JSON.stringify(tags));
      const submittingUserEmail = userEmail || props.session?.user?.email || "";
      formData.append("email", submittingUserEmail);

      const onlineOk = await checkConnectivity();
      if (!onlineOk) {
        try {
          const key = `notus:doc:${props.params.id}`;
          const cachedRaw = typeof window !== "undefined" ? localStorage.getItem(key) : null;
          const cached = cachedRaw ? JSON.parse(cachedRaw) : {};
          const payload = {
            ...(cached || {}),
            id: Number(props.params.id),
            title: title || "",
            content: contentToSave,
            tags: tags,
            updated_at: new Date().toISOString(),
            user_id: cached?.user_id ?? Number(userId ?? (props.session as any)?.user?.id ?? 0),
            cachedAt: Date.now(),
          };
          if (typeof window !== "undefined") {
            localStorage.setItem(key, JSON.stringify(payload));
          }
          setShowSuccessMessage(true);
          setShowSavedState(true);
          setTimeout(() => setShowSuccessMessage(false), 3000);
        } catch { }
        return;
      }

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
      setShowSavedState,
      setShowSuccessMessage,
      checkConnectivity,
      userEmail,
    ]
  );

  // -------- Auto-save every 10 seconds (checks connectivity beforehand) --------
  useEffect(() => {
    if (!document?.id || hasEditAccess === false) {
      return;
    }

    const intervalId = setInterval(async () => {
      try {
        const onlineOk = await checkConnectivity();
        if (!onlineOk) {
          return;
        }

        await handleSubmit();
      } catch (err) {
        // Silent error handling for autosave
      }
    }, 3000); //Auto-enregistrement après 3 secondes

    return () => {
      clearInterval(intervalId);
    };
  }, [document?.id, hasEditAccess, handleSubmit, checkConnectivity]);

  // -------- Offline/Online conflict resolution --------
  useEffect(() => {
    if (!document) return;

    const handleOffline = () => {
      setIsOffline(true);
      // Store baseline when going offline
      const baseline = content.text || "";
      setOfflineBaseline(baseline);
      localStorage.setItem(`notus:offline-baseline:${document.id}`, baseline);
      console.log('📴 Mode hors ligne activé - Baseline sauvegardé:', {
        documentId: document.id,
        baselineLength: baseline.length,
        baselinePreview: baseline.substring(0, 50) + '...'
      });
    };

    const handleOnline = async () => {
      setIsOffline(false);
      console.log('🌐 Reconnexion détectée - Début de la résolution des conflits');

      try {
        // Fetch current state from database
        const response = await fetch(`/api/openDoc?id=${document.id}`, { cache: "no-store" });
        const result = await response.json();

        if (result.success) {
          const remoteContent = normalizeContent(result.content);
          const remoteText = remoteContent.text || "";
          const storedBaseline = localStorage.getItem(`notus:offline-baseline:${document.id}`) || "";
          const currentText = content.text || "";

          console.log('📊 Données récupérées de la base de données:', {
            documentId: document.id,
            title: result.title,
            updatedAt: result.updated_at,
            contentLength: remoteText.length,
            contentPreview: remoteText.substring(0, 100) + '...',
            tags: result.tags,
            hasContent: !!result.content,
            contentType: typeof result.content
          });

          console.log('🔍 Analyse des conflits:', {
            documentId: document.id,
            baselineLength: storedBaseline.length,
            remoteLength: remoteText.length,
            currentLength: currentText.length,
            baselinePreview: storedBaseline.substring(0, 50) + '...',
            remotePreview: remoteText.substring(0, 50) + '...',
            currentPreview: currentText.substring(0, 50) + '...'
          });

          // Compare remote content with stored baseline
          if (remoteText !== storedBaseline) {
            // Remote changes occurred while offline - overwrite local changes
            console.log('⚠️ Conflit détecté - Changements distants trouvés pendant la déconnexion');
            console.log('🔄 Écrasement des modifications locales par les changements distants');
            console.log('📥 Application des données de la BDD:', {
              title: result.title,
              contentLength: remoteText.length,
              contentPreview: remoteText.substring(0, 100) + '...',
              tags: result.tags,
              updatedAt: result.updated_at
            });

            // Update document state with remote data
            setDocument({
              ...document,
              content: JSON.stringify(remoteContent),
              updated_at: new Date(result.updated_at)
            });

            // Update all local states with remote data
            setContent(remoteContent);
            setTitle(result.title);
            setTags(Array.isArray(result.tags) ? result.tags : []);

            // Update localStorage with remote data
            updateLocalStorage(remoteContent, result.title);

            setOfflineBaseline("");
            localStorage.removeItem(`notus:offline-baseline:${document.id}`);
            console.log('✅ Résolution terminée - Toutes les données distantes appliquées');
          } else {
            // No remote changes - our offline changes are safe to persist
            console.log('✅ Aucun conflit - Aucun changement distant détecté');
            console.log('💾 Sauvegarde des modifications hors ligne');
            await handleSubmit();
            setOfflineBaseline("");
            localStorage.removeItem(`notus:offline-baseline:${document.id}`);
            console.log('✅ Modifications hors ligne sauvegardées avec succès');
          }
        } else {
          console.log('❌ Échec de la récupération du contenu distant:', result.error);
        }
      } catch (err) {
        console.error('❌ Erreur lors de la résolution des conflits:', err);
      }
    };

    // Check initial state
    if (typeof navigator !== 'undefined') {
      const initialOffline = !navigator.onLine;
      setIsOffline(initialOffline);
      console.log('🔌 État de connexion initial:', { isOffline: initialOffline });
    }

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [document, content.text, handleSubmit, normalizeContent, updateLocalStorage]);

  const persistTags = (nextTags: string[]) => {
    if (!userId) return;
    const fd = new FormData();
    fd.append("documentId", String(props.params?.id || ""));
    fd.append("userId", String(userId));
    fd.append("title", title || "Sans titre");
    fd.append("content", JSON.stringify(content || ""));
    fd.append("tags", JSON.stringify(nextTags));
    if (typeof navigator !== "undefined" && navigator.onLine) {
      startTransition(() => {
        (updateDocumentAction as unknown as (s: any, p: any) => any)(undefined as any, fd as any);
      });
    }
    if (typeof navigator !== "undefined" && navigator.onLine) {
      startTransition(() => {
        (updateDocumentAction as unknown as (s: any, p: any) => any)(undefined as any, fd as any);
      });
    }
  };

  const handleTagsChange = (nextTags: string[]) => {
    setTags(nextTags);
    setShowSavedState(false);
    if (typeof navigator !== "undefined" && navigator.onLine) {
      persistTags(nextTags);
    }
  };

  // -------- Access control --------
  useEffect(() => {
    if (!document) {
      return;
    }

    async function checkAccess() {
      if (!userEmail) {
        setHasEditAccess(false);
        setHasReadAccess(false);
        setError('Accès refusé: email utilisateur manquant');
        return;
      }
      try {
        if (!document) {
          setHasEditAccess(false);
          setHasReadAccess(false);
          setError('Accès refusé: document introuvable');
          return;
        }
        const res = await fetch(`/api/openDoc/accessList?id=${document.id}`);
        const result = await res.json();
        if (result.success && Array.isArray(result.accessList)) {
          const myEmail = String(userEmail).trim().toLowerCase();

          // Check if user is owner
          const isOwner = Number(document.user_id) === Number(userId);

          // Check if user has any access (read or edit)
          const userAccess = result.accessList.find((u: any) =>
            (u.email || "").trim().toLowerCase() === myEmail
          );

          if (isOwner) {
            setHasEditAccess(true);
            setHasReadAccess(true);
          } else if (userAccess) {
            // User has shared access - check permission level
            setHasReadAccess(true);
            setHasEditAccess(userAccess.permission === true);
          } else {
            setHasEditAccess(false);
            setHasReadAccess(false);
            setError('Accès refusé: vous n\'avez pas accès à ce document');
          }
        } else {
          setHasEditAccess(false);
          setHasReadAccess(false);
          setError('Accès refusé: liste d\'accès non trouvée');
        }
      } catch (err) {
        setHasEditAccess(false);
        setHasReadAccess(false);
        setError('Erreur lors de la récupération de la liste d\'accès');
      }
    }
    checkAccess();
  }, [document, userEmail, userId]);

  // -------- Share functionality --------
  const handleShareButtonClick = async () => {
    const ok = await checkConnectivity();
    if (!ok) return;
    setIsShareModalOpen(true);
  };

  const handleShareSubmit = async () => {
    if (!document) return;
    const ok = await checkConnectivity();
    if (!ok) {
      setShareError("Connexion requise pour partager la note.");
      return;
    }
    if (!shareEmail || shareEmail.trim().length === 0) {
      setShareError("Email requis");
      return;
    }

    setShareLoading(true);
    setShareError(null);
    setShareSuccess(null);

    try {
      const res = await fetch("/api/invite-share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentId: document.id,
          email: shareEmail.trim(),
          permission: permission === "write",
          docTitle: document.title,     // if available
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setShareSuccess(data.message || "Partage enregistré.");
        setIsShareModalOpen(false);
        router.refresh();
      } else {
        setShareError(data.error || "Erreur lors du partage.");
      }
    } catch (err) {
      console.error(err);
      setShareError("Erreur lors du partage.");
    } finally {
      setShareLoading(false);
    }
  };

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  // -------- Conditional rendering (after all Hooks) --------
  if (sessionLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-primary">
            Chargement de la session...
          </p>
        </div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="bg-card rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">
            Accès refusé
          </h1>
          <p className="text-muted-foreground mb-6">
            Vous devez être connecté pour modifier un document.
          </p>
          <Link
            href="/login"
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            Se connecter
          </Link>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-primary">Chargement...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="bg-card rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">
            Erreur
          </h1>
          <p className="text-foreground mb-6">{error}</p>
          <Link
            href="/"
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            Retour à l'accueil
          </Link>
        </div>
      </div>
    );
  }

  if (!document) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="bg-card rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">
            Document non trouvé
          </h1>
          <p className="text-muted-foreground mb-6">
            Ce document n'existe pas ou a été supprimé.
          </p>
          <Link
            href="/"
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            Retour à l'accueil
          </Link>
        </div>
      </div>
    );
  }

  // Check if user has any access (read or edit)
  if (hasReadAccess === false) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="bg-card rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">
            Accès refusé
          </h1>
          <p className="text-muted-foreground mb-6">
            Vous n'êtes pas autorisé à accéder à ce document.
          </p>
          <Link
            href="/"
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            Retour à l'accueil
          </Link>
        </div>
      </div>
    );
  }

  return (
      <div className="min-h-screen bg-background py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Link
            href="/"
            className="text-foreground font-semibold flex items-center"
          >
            <Icon name="arrowLeft" className="h-5 w-5 mr-2" />
            Retour
          </Link>
          <div className="flex flex-row justify-center items-center">
            <UserListButton users={users} className="self-center" />
            {hasEditAccess === false && (
              <div className="ml-4 px-3 py-1 bg-muted text-foreground text-sm font-medium rounded-full border border-border">
                Mode lecture seule
              </div>
            )}
            <div className="relative inline-block">
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleMenu}
                className="md:mr-0 mr-8"
              >
                <Icon name="dotsVertical" className="h-6 w-6" />
              </Button>
              {isMenuOpen && (
                <div className="absolute right-0 top-full z-40 rounded-lg shadow-lg p-4 min-w-[13rem] bg-background border border-border">
                  <MenuItem
                    onClick={() => {
                      if (hasEditAccess !== false) {
                        handleShareButtonClick();
                        setIsMenuOpen(false);
                      }
                    }}
                    disabled={hasEditAccess === false}
                    icon={<Icon name="share" className={hasEditAccess === false ? "w-4 h-4 text-muted-foreground" : "w-4 h-4 text-primary"} />}
                  >
                    {hasEditAccess === false ? "Lecture seule" : "Partager"}
                  </MenuItem>

                  <MenuItem
                    onClick={() => {
                      if (hasEditAccess !== false) {
                        handleSubmit();
                        setIsMenuOpen(false);
                      }
                    }}
                    disabled={hasEditAccess === false || isPending}
                    icon={<Icon name="document" className={hasEditAccess === false || isPending ? "w-4 h-4 text-muted-foreground" : "w-4 h-4 text-primary"} />}
                  >
                    {isPending ? "Sauvegarde..." : hasEditAccess === false ? "Lecture seule" : "Sauvegarder"}
                  </MenuItem>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Share Modal */}
        <Modal
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          title="Partager la note"
          size="md"
          className="flex flex-col justify-center"
        >
          <Modal.Content>
            <div className="flex flex-col gap-4">
              <Input
                label="Email"
                type="email"
                id="email"
                name="email"
                required
                placeholder="email@email.com"
                value={shareEmail}
                onChange={(e) => setShareEmail(e.target.value)}
              />

              <div>
                <label className="text-sm font-medium text-foreground mb-1">
                  Permissions
                </label>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="w-full justify-between">
                      {permission === "write" ? "Peut modifier" : "Peut lire"}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem
                      onClick={() => setPermission("read")}
                      className={permission === "read" ? "bg-muted" : ""}
                    >
                      Peut lire
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setPermission("write")}
                      className={permission === "write" ? "bg-muted" : ""}
                    >
                      Peut modifier
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="flex items-center justify-center gap-3">
                <Button
                  type="button"
                  variant="primary"
                  size="default"
                  onClick={handleShareSubmit}
                  disabled={shareLoading}
                >
                  {shareLoading ? "Envoi..." : "Envoyer"}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setShareEmail("");
                    setShareError(null);
                    setIsShareModalOpen(false);
                  }}
                >
                  Annuler
                </Button>
              </div>

              {shareError && (
                <p className="text-sm text-destructive mt-2">{shareError}</p>
              )}
              {shareSuccess && (
                <p className="text-sm text-primary mt-2">{shareSuccess}</p>
              )}
            </div>
          </Modal.Content>
          <Modal.Footer>
          </Modal.Footer>
        </Modal>

        {/* New doc banner/cancel */}
        {isNew && hasEditAccess !== false && (
          <div className="mb-4 rounded-lg p-3 bg-muted flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Nouvelle note en création</span>
            <Button variant="ghost" onClick={handleCancelCreation}>Annuler la création</Button>
          </div>
        )}

        {/* Edit form */}
        <div className="bg-card rounded-2xl border border-border p-6 overflow-hidden">
          <form className="space-y-6">
            {/* Tags */}
            <div className="mb-1">
              <TagsManager
                tags={tags}
                onTagsChange={handleTagsChange}
                placeholder="Ajouter un tag..."
                maxTags={20}
                className="w-full"
                disabled={hasEditAccess === false}
                currentUserId={userId}
                requireAuth={true}
              />
            </div>

            {/* Title */}
            <div>
              <input
                type="text"
                value={title}
                onChange={hasEditAccess === false ? undefined : (e) => {
                  const newTitle = e.target.value;
                  setTitle(newTitle);
                  // Emit title change to other clients
                  if (emitTitleChange && isTitleConnected) {
                    emitTitleChange(newTitle);
                  }
                }}
                readOnly={hasEditAccess === false}
                className={`w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-ring bg-transparent text-foreground text-xl font-semibold ${hasEditAccess === false ? 'cursor-default opacity-75' : ''}`}
                placeholder="Titre du document"
                maxLength={255}
              />
            </div>

            {/* Content */}
            <div>
              <div className="border border-border rounded-lg overflow-hidden bg-card">
                <WysiwygNotepad
                  key={`doc-${document.id}-${document.updated_at}`}
                  initialData={content}
                  onContentChange={handleContentChange}
                  onRemoteContentChange={(remoteContent) => {
                    // Keep React state in sync so autosave submits the latest content
                    setContent(remoteContent);
                    // Persist to localStorage like local edits do
                    updateLocalStorage(remoteContent);
                  }}
                  placeholder="Commencez à écrire votre document..."
                  className=""
                  showDebug={false}
                  readOnly={hasEditAccess === false}
                  roomId={String(document.id)}
                />
              </div>
            </div>


          </form>
        </div>

        {/* Saved notification */}
        {showSavedNotification && (
          <div className="fixed bottom-4 left-4 z-50 pointer-events-none">
            <div className="bg-primary text-primary-foreground border border-primary rounded-lg px-3 py-2 shadow-lg pointer-events-auto flex items-center">
              <Icon name="check" className="w-4 h-4 mr-2 text-primary-foreground" />
              <span className="text-sm font-medium">Note enregistrée</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}