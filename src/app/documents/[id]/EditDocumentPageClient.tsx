"use client";
import { startTransition, useActionState } from "react";
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
import { Document, ActionResult } from "@/lib/types";
import TagsManager from "@/components/documents/TagsManager";
import { addShareAction, deleteDocumentAction, createDocumentAction } from "@/lib/actions/DocumentActions";
import UserListButton from "@/components/ui/UserList/UserListButton";
import { useGuardedNavigate } from "@/hooks/useGuardedNavigate";
import { useCollaborativeTitle } from "@/lib/paper.js/useCollaborativeTitle";
import sanitizeLinks from "@/lib/sanitizeLinks";
import Icon from "@/components/Icon";
import type { Session } from "next-auth";
import ExportOverlay from "@/components/Paper.js/Editor/ExportOverlay";

interface EditDocumentPageClientProps {
  session?: Session | null;
  params: { id: string };
}

interface NotepadContent {
  text: string;
  timestamp?: number;
}

type FlushOverride = {
  markdown?: string;
  content?: NotepadContent;
  title?: string;
  tags?: string[];
};

const toPositiveNumber = (raw: unknown): number | undefined => {
  if (typeof raw === "number" && Number.isFinite(raw) && raw > 0) return raw;
  if (typeof raw === "string" && raw.trim().length > 0) {
    const parsed = Number(raw);
    if (Number.isFinite(parsed) && parsed > 0) return parsed;
  }
  return undefined;
};

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
  const [deleteState, deleteAction] = useActionState(
    deleteDocumentAction as unknown as (prev: any, fd: FormData) => Promise<string>,
    ""
  );

  const [document, setDocument] = useState<Document | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState<NotepadContent>({
    text: "",
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
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [showSavedState, setShowSavedState] = useState(false);
  const [showSavedNotification, setShowSavedNotification] = useState(false);
  const [isManualSaving, setIsManualSaving] = useState(false);
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false);


  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [permission, setPermission] = useState("read");
  const [shareEmail, setShareEmail] = useState("");
  const [shareLoading, setShareLoading] = useState(false);
  const [shareError, setShareError] = useState<string | null>(null);
  const [shareSuccess, setShareSuccess] = useState<string | null>(null);
  const [hasEditAccess, setHasEditAccess] = useState<boolean | null>(null);
  const [hasReadAccess, setHasReadAccess] = useState<boolean | null>(null);
  const [users, setUsers] = useState([]);
  const [isOffline, setIsOffline] = useState(false);

  // Load access list for this document and update `users` state
  const loadAccessList = async () => {
    if (!document?.id) return;
    try {
      const res = await fetch(`/api/openDoc/accessList?id=${document.id}`);
      const data = await res.json();
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
    } catch (e) {
      setUsers([]);
    }
  };
  const [offlineBaseline, setOfflineBaseline] = useState<string>("");

  // État de sauvegarde : 'synchronized' | 'saving' | 'unsynchronized'
  const [saveStatus, setSaveStatus] = useState<'synchronized' | 'saving' | 'unsynchronized'>('synchronized');
  const lastSavedContentRef = useRef<string>("");
  const lastSavedTitleRef = useRef<string>("");
  const lastSavedTagsRef = useRef<string[]>([]);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isSavingRef = useRef(false);
  const flushRealtimeRef = useRef<(override?: FlushOverride) => Promise<void>>(async () => { });
  const persistIndicatorsRef = useRef<{
    saved?: NodeJS.Timeout;
    message?: NodeJS.Timeout;
    notification?: NodeJS.Timeout;
  }>({});
  const shouldUseRealtime = isRealtimeConnected && !isOffline;
  const realtimeUserId = toPositiveNumber(userId) ?? toPositiveNumber(props.session?.user?.id);

  const triggerPersistIndicators = useCallback(() => {
    if (persistIndicatorsRef.current.saved) {
      clearTimeout(persistIndicatorsRef.current.saved);
    }
    if (persistIndicatorsRef.current.message) {
      clearTimeout(persistIndicatorsRef.current.message);
    }
    if (persistIndicatorsRef.current.notification) {
      clearTimeout(persistIndicatorsRef.current.notification);
    }

    setShowSuccessMessage(true);
    setShowSavedState(true);
    setShowSavedNotification(true);

    persistIndicatorsRef.current.saved = setTimeout(() => setShowSavedState(false), 1500);
    persistIndicatorsRef.current.message = setTimeout(() => setShowSuccessMessage(false), 3000);
    persistIndicatorsRef.current.notification = setTimeout(() => setShowSavedNotification(false), 2000);
  }, []);

  const handleSyncStatusChange = useCallback(
    (status: 'synchronized' | 'saving' | 'unsynchronized') => {
      setSaveStatus(status);
      if (status === 'saving') {
        isSavingRef.current = true;
      } else if (status === 'synchronized') {
        isSavingRef.current = false;
      }
    },
    []
  );

  const buildContentSnapshot = useCallback((): NotepadContent => {
    return {
      text: sanitizeLinks(content.text || ""),
      timestamp: Date.now(),
    };
  }, [content]);

  const handleRealtimePersisted = useCallback(
    ({
      snapshot,
      title: persistedTitle,
      tags: persistedTags,
    }: {
      snapshot?: NotepadContent | null;
      title?: string;
      tags?: string[];
    }) => {
      const nextSnapshot = snapshot || buildContentSnapshot();
      lastSavedContentRef.current = JSON.stringify(nextSnapshot);
      lastSavedTitleRef.current = persistedTitle ?? title;
      lastSavedTagsRef.current = persistedTags ? [...persistedTags] : [...tags];
      setSaveStatus('synchronized');
      isSavingRef.current = false;
      triggerPersistIndicators();
    },
    [buildContentSnapshot, tags, title, triggerPersistIndicators]
  );

  const handleRegisterFlush = useCallback((flush: (override?: FlushOverride) => Promise<void>) => {
    flushRealtimeRef.current = flush;
  }, []);

  const handleRealtimeConnectionChange = useCallback((connected: boolean) => {
    setIsRealtimeConnected(connected);
  }, []);

  const flushTitleRealtime = useCallback(
    (nextTitle: string) => {
      if (!shouldUseRealtime) return;
      const snapshot = buildContentSnapshot();
      const markdown = snapshot.text || "";
      flushRealtimeRef.current({
        markdown,
        content: snapshot,
        title: nextTitle,
        tags,
      }).catch((error) => {
        console.error("❌ Échec de la synchronisation du titre via websocket:", error);
        setSaveStatus('unsynchronized');
      });
    },
    [shouldUseRealtime, buildContentSnapshot, tags, setSaveStatus]
  );

  const createPersonalCopyFromOffline = useCallback(
    async (snapshot: NotepadContent) => {
      if (!realtimeUserId) return;
      try {
        const copyForm = new FormData();
        copyForm.append("userId", String(realtimeUserId));
        const baseTitle = title || "Sans titre";
        copyForm.append("title", `${baseTitle} (copie personnelle)`);
        copyForm.append("content", JSON.stringify(snapshot));
        copyForm.append("tags", JSON.stringify(tags));
        await createDocumentAction(undefined as unknown as never, copyForm);
        console.log("📄 Copie personnelle créée suite à une modification distante.");
      } catch (error) {
        console.error("❌ Impossible de créer une copie personnelle:", error);
      }
    },
    [realtimeUserId, title, tags]
  );

  useEffect(() => {
    const timersRef = persistIndicatorsRef.current;
    return () => {
      flushRealtimeRef.current = async () => { };
      if (timersRef.saved) {
        clearTimeout(timersRef.saved);
      }
      if (timersRef.message) {
        clearTimeout(timersRef.message);
      }
      if (timersRef.notification) {
        clearTimeout(timersRef.notification);
      }
    };
  }, []);

  // Collaborative title synchronization
  const { emitTitleChange, isConnected: isTitleConnected } = useCollaborativeTitle({
    roomId: document ? String(document.id) : undefined,
    onRemoteTitle: (remoteTitle: string) => {
      setTitle(remoteTitle);
      // Update localStorage with remote title change
      updateLocalStorage(content, remoteTitle);
    },
  });

  const normalizeContent = useCallback((rawContent: unknown): NotepadContent => {
    if (!rawContent) return { text: "" };

    let content: unknown = rawContent;

    if (typeof content === "string") {
      const stringContent = content;
      try {
        content = JSON.parse(stringContent);
      } catch {
        return { text: stringContent };
      }
    }

    interface ParsedContent {
      text?: string;
      timestamp?: number;
    }
    const parsed = content as ParsedContent;
    return {
      text: parsed.text || "",
      timestamp: parsed.timestamp || Date.now(),
    };
  }, []);

  const loadDocument = useCallback(async () => {
    try {
      setIsLoading(true);

      // Si on est hors ligne, charger depuis localStorage
      if (typeof navigator !== "undefined" && !navigator.onLine) {
        const cached = localStorage.getItem(`notus:doc:${props.params.id}`);
        if (cached) {
          try {
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

            const cachedContentString = JSON.stringify(normalizeContent(c.content));
            lastSavedContentRef.current = cachedContentString;
            lastSavedTitleRef.current = c.title;
            lastSavedTagsRef.current = Array.isArray(c.tags) ? c.tags : [];
            setSaveStatus('synchronized');
            setError(null);
            setIsLoading(false);
            return;
          } catch (e) {
            console.error("Erreur lors du chargement depuis localStorage:", e);
          }
        }
        setError("Document non disponible hors ligne");
        setIsLoading(false);
        return;
      }

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

        // Initialiser les refs avec le contenu chargé
        const contentString = JSON.stringify(normalizedContent);
        lastSavedContentRef.current = contentString;
        lastSavedTitleRef.current = result.title;
        lastSavedTagsRef.current = Array.isArray(result.tags) ? result.tags : [];
        setSaveStatus('synchronized');

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

              // Initialiser les refs avec le contenu en cache
              const cachedContentString = JSON.stringify(normalizeContent(c.content));
              lastSavedContentRef.current = cachedContentString;
              lastSavedTitleRef.current = c.title;
              lastSavedTagsRef.current = Array.isArray(c.tags) ? c.tags : [];
              setSaveStatus('synchronized');

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

            // Initialiser les refs avec le contenu en cache
            const cachedContentString = JSON.stringify(normalizeContent(c.content));
            lastSavedContentRef.current = cachedContentString;
            lastSavedTitleRef.current = c.title;
            lastSavedTagsRef.current = Array.isArray(c.tags) ? c.tags : [];
            setSaveStatus('synchronized');

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
      const normalizedContent = normalizeContent(document.content);
      setContent(normalizedContent);

      // Initialiser les refs si elles ne sont pas déjà initialisées
      if (lastSavedContentRef.current === "") {
        const contentString = JSON.stringify(normalizedContent);
        lastSavedContentRef.current = contentString;
        lastSavedTitleRef.current = document.title;
        lastSavedTagsRef.current = document.tags || [];
        setSaveStatus('synchronized');
      }

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

  const isOwner = document ? Number(document.user_id) === Number(userId) : false;

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
  const updateLocalStorage = useCallback((contentToSave: NotepadContent, titleToSave?: string) => {
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
          user_id: cached?.user_id ?? Number(userId ?? (props.session?.user?.id ?? 0)),
          cachedAt: Date.now(),
        };
        localStorage.setItem(key, JSON.stringify(payload));
      }
    } catch (err) {
    }
  }, [props.params.id, title, tags, userId, props.session]);

  // Fonction pour déclencher la sauvegarde automatique avec debounce
  // Note: handleSubmit sera défini plus tard, on utilisera une ref pour l'appeler
  const handleSubmitRef = useRef<(() => Promise<void>) | null>(null);

  const triggerAutoSave = useCallback(() => {
    if (shouldUseRealtime) {
      return;
    }
    if (!document?.id || hasEditAccess === false || isSavingRef.current) {
      return;
    }

    // Annuler le timeout précédent s'il existe
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Marquer comme non synchronisé immédiatement
    setSaveStatus((prevStatus) => {
      if (prevStatus !== 'saving') {
        return 'unsynchronized';
      }
      return prevStatus;
    });

    // Déclencher la sauvegarde après 2 secondes d'inactivité
    saveTimeoutRef.current = setTimeout(async () => {
      // Vérifier les changements au moment de la sauvegarde
      const currentContentString = JSON.stringify(content);
      const hasChanges =
        currentContentString !== lastSavedContentRef.current ||
        title !== lastSavedTitleRef.current ||
        JSON.stringify(tags) !== JSON.stringify(lastSavedTagsRef.current);

      if (!hasChanges || isSavingRef.current) {
        // Pas de changements, remettre à synchronisé
        setSaveStatus('synchronized');
        return;
      }

      try {
        const onlineOk = await checkConnectivity();
        if (!onlineOk) {
          setSaveStatus('unsynchronized');
          return;
        }

        isSavingRef.current = true;
        setSaveStatus('saving');

        // Appeler handleSubmit via la ref
        if (handleSubmitRef.current) {
          await handleSubmitRef.current();
        }
      } catch (err) {
        // Silent error handling for autosave
        isSavingRef.current = false;
        setSaveStatus('unsynchronized');
      }
    }, 2000); // 2 secondes d'inactivité avant sauvegarde
  }, [document?.id, hasEditAccess, content, title, tags, checkConnectivity, shouldUseRealtime]);

  const handleContentChange = useCallback((newContent: unknown) => {
    const normalized = normalizeContent(newContent);
    setContent(normalized);
    updateLocalStorage(normalized);
    triggerAutoSave();
  }, [normalizeContent, updateLocalStorage, triggerAutoSave]);


  const handleSubmit = useCallback(
    async (e?: React.FormEvent) => {
      e?.preventDefault?.();

      const submittingUserId = String(
        userId ?? (localSession as { id?: number } | null)?.id ?? (props.session?.user?.id ?? "")
      );
      if (!submittingUserId) {
        alert("Session invalide. Veuillez vous reconnecter.");
        return;
      }

      const contentToSave: NotepadContent = {
        text: sanitizeLinks(content.text || ""),
        timestamp: Date.now(),
      };

      if (shouldUseRealtime) {
        setIsManualSaving(true);
        try {
          await flushRealtimeRef.current({
            content: contentToSave,
            title,
            tags,
          });
        } catch (error) {
          setSaveStatus('unsynchronized');
        } finally {
          setIsManualSaving(false);
        }
        return;
      }

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
          triggerPersistIndicators();
        } catch {
          setSaveStatus('unsynchronized');
        }
        setSaveStatus('unsynchronized');
        return;
      }

      const formData = new FormData();
      formData.append("documentId", String(props.params?.id || ""));
      formData.append("userId", String(submittingUserId));
      formData.append("title", title || "");
      formData.append("content", JSON.stringify(contentToSave));
      formData.append("tags", JSON.stringify(tags));
      const submittingUserEmail = userEmail || props.session?.user?.email || "";
      formData.append("email", submittingUserEmail);

      setIsManualSaving(true);
      try {
        await (updateDocumentAction as unknown as (prev: any, payload: FormData) => Promise<any>)(undefined as any, formData);
        triggerPersistIndicators();
        setSaveStatus('synchronized');
      } catch (error) {
        console.error("❌ Erreur lors de la sauvegarde fallback:", error);
        setSaveStatus('unsynchronized');
      } finally {
        setIsManualSaving(false);
      }
    },
    [
      content,
      userId,
      localSession,
      props.session,
      props.params.id,
      title,
      tags,
      triggerPersistIndicators,
      checkConnectivity,
      flushRealtimeRef,
      setSaveStatus,
      shouldUseRealtime,
      userEmail,
    ]
  );

  // Assigner handleSubmit à la ref pour l'auto-save
  useEffect(() => {
    handleSubmitRef.current = handleSubmit;
  }, [handleSubmit]);

  // Mettre à jour les refs et le statut après une sauvegarde réussie
  // Nettoyer le timeout lors du démontage
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  // -------- Offline/Online conflict resolution --------
  useEffect(() => {
    if (!document) return;

    const handleOffline = () => {
      setIsOffline(true);
      // Store baseline when going offline
      const baseline = content.text || "";
      setOfflineBaseline(baseline);
      localStorage.setItem(`notus:offline-baseline:${document.id}`, baseline);

      // Sauvegarder le document complet dans localStorage
      try {
        const key = `notus:doc:${document.id}`;
        const payload = {
          id: Number(document.id),
          title: title || "",
          content: content,
          tags: tags,
          updated_at: new Date().toISOString(),
          user_id: Number(document.user_id ?? userId ?? 0),
          cachedAt: Date.now(),
        };
        if (typeof window !== "undefined") {
          localStorage.setItem(key, JSON.stringify(payload));
        }
        console.log('📴 Mode hors ligne activé - Document sauvegardé dans localStorage:', {
          documentId: document.id,
          title: title,
          contentLength: content.text?.length || 0,
        });
      } catch (err) {
        console.error("Erreur lors de la sauvegarde offline:", err);
      }
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
            // Remote changes occurred while offline - create a copy
            console.log('⚠️ Conflit détecté - Changements distants trouvés pendant la déconnexion');
            console.log('📄 Création d\'une copie avec les modifications locales');

            const offlineSnapshot = buildContentSnapshot();

            // Créer une copie avec "name - copie"
            if (realtimeUserId) {
              try {
                const copyForm = new FormData();
                copyForm.append("userId", String(realtimeUserId));
                const baseTitle = title || result.title || "Sans titre";
                copyForm.append("title", `${baseTitle} - copie`);
                copyForm.append("content", JSON.stringify(offlineSnapshot));
                copyForm.append("tags", JSON.stringify(tags));
                await createDocumentAction(undefined as unknown as never, copyForm);
                console.log("📄 Copie créée avec les modifications hors ligne.");
              } catch (error) {
                console.error("❌ Impossible de créer une copie:", error);
              }
            }

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
            console.log('✅ Résolution terminée - Copie créée et données distantes appliquées');
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
  }, [document, content, handleSubmit, normalizeContent, updateLocalStorage, buildContentSnapshot, createPersonalCopyFromOffline, userId, realtimeUserId, title, tags]);

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
        (updateDocumentAction as unknown as (prev: unknown, payload: FormData) => Promise<ActionResult>)(undefined, fd);
      });
    }
    if (typeof navigator !== "undefined" && navigator.onLine) {
      startTransition(() => {
        (updateDocumentAction as unknown as (prev: unknown, payload: FormData) => Promise<ActionResult>)(undefined, fd);
      });
    }
  };

  const handleTagsChange = (nextTags: string[]) => {
    setTags(nextTags);
    setShowSavedState(false);
    if (typeof navigator !== "undefined" && navigator.onLine) {
      persistTags(nextTags);
    }
    triggerAutoSave();
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

          interface AccessListItem {
            email?: string;
            permission?: boolean;
          }
          // Check if user has any access (read or edit)
          const userAccess = result.accessList.find((u: AccessListItem) =>
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
    // If not owner, still open a modal but we'll show a denied message
    setShareError(null);
    setShareSuccess(null);
    setIsShareModalOpen(true);
  };

  const handleShareSubmit = async () => {
    // Prevent non-owners from submitting share
    if (!isOwner) {
      setShareError("Vous n'avez pas le droit de partager ce document");
      return;
    }
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
            <UserListButton users={users} className="self-center" documentId={document.id} onAccessListRefresh={loadAccessList} isOwner={isOwner} currentUserId={userId} />
            {hasEditAccess === false && (
              <div className="ml-4 px-3 py-1 bg-muted text-foreground text-sm font-medium rounded-full border border-border">
                Mode lecture seule
              </div>
            )}
            {hasEditAccess !== false && (
              <div className="ml-4 px-3 py-1 text-sm font-medium rounded-full border flex items-center gap-2">
                {saveStatus === 'synchronized' && (
                  <>
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-muted-foreground">Synchronisé</span>
                  </>
                )}
                {saveStatus === 'saving' && (
                  <>
                    <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                    <span className="text-muted-foreground">Enregistrement...</span>
                  </>
                )}
                {saveStatus === 'unsynchronized' && (
                  <>
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    <span className="text-muted-foreground">Non synchronisé</span>
                  </>
                )}
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
                <>
                  <div
                    className="fixed inset-0 z-30"
                    onMouseDown={() => setIsMenuOpen(false)}
                    aria-hidden="true"
                  />
                  <div className="absolute right-0 top-full z-40 rounded-lg shadow-lg p-4 min-w-[13rem] bg-background border border-border">
                    <MenuItem
                      onClick={() => {
                        if (hasEditAccess !== false) {
                          setIsMenuOpen(false);
                          setShareError(null);
                          setShareSuccess(null);
                          setIsShareModalOpen(true);

                          (async () => {
                            const ok = await checkConnectivity();
                            if (!ok) {
                              setShareError("Connexion requise pour partager la note.");
                            }
                          })();
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
                      disabled={hasEditAccess === false || isManualSaving}
                      icon={<Icon name="document" className={hasEditAccess === false || isManualSaving ? "w-4 h-4 text-muted-foreground" : "w-4 h-4 text-primary"} />}
                    >
                      {isManualSaving ? "Sauvegarde..." : hasEditAccess === false ? "Lecture seule" : "Sauvegarder"}
                    </MenuItem>
                    <MenuItem
                      onClick={() => {
                          setIsMenuOpen(false);
                          setIsExportOpen(true);
                        }}
                      icon={<Icon name="export" className="w-4 h-4 text-primary" />}
                    >
                      Exporter
                    </MenuItem>
                  </div>
                </>
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
            {isOwner ? (
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
            ) : (
              <div className="py-1 text-center">
                <p className="text-lg font-medium text-foreground mb-4">Vous n'avez pas l'autorisation de partager ce document</p>
                <div className="flex justify-center">
                  <Button variant="ghost" onClick={() => setIsShareModalOpen(false)}>Fermer</Button>
                </div>
              </div>
            )}
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
                  if (emitTitleChange && isTitleConnected) {
                    emitTitleChange(newTitle);
                  }
                  flushTitleRealtime(newTitle);
                  triggerAutoSave();
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
                  key={`doc-${document.id}`}
                  initialData={content}
                  onContentChange={handleContentChange}
                  onRemoteContentChange={(remoteContent) => {
                    // Keep React state in sync so autosave submits the latest content
                    setContent(remoteContent);
                    // Persist to localStorage like local edits do
                    updateLocalStorage(remoteContent);
                    // Mettre à jour les refs car c'est un changement distant (synchronisé)
                    const contentString = JSON.stringify(remoteContent);
                    lastSavedContentRef.current = contentString;
                    setSaveStatus('synchronized');
                  }}
                  placeholder="Commencez à écrire votre document..."
                  className=""
                  showDebug={false}
                  readOnly={hasEditAccess === false}
                  roomId={String(document.id)}
                  documentId={String(document.id)}
                  userId={realtimeUserId}
                  userEmail={userEmail || props.session?.user?.email || undefined}
                  title={title}
                  tags={tags}
                  getContentSnapshot={buildContentSnapshot}
                  onSyncStatusChange={handleSyncStatusChange}
                  onPersisted={handleRealtimePersisted}
                  onRegisterFlush={handleRegisterFlush}
                  onRealtimeConnectionChange={handleRealtimeConnectionChange}
                />
              </div>
            </div>


          </form>
        </div>

        {/* Export overlay (client-only) */}
        <ExportOverlay
          open={isExportOpen}
          onClose={() => setIsExportOpen(false)}
          markdown={content.text || ""}
        />

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