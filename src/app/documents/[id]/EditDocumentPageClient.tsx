"use client";
import { useActionState, startTransition } from "react";
import { Button, Modal } from "@/components/ui";
import MenuItem from "@/components/ui/overlay-menu-item";
import { Input } from "@/components/ui/input";
import { updateDocumentAction } from "@/lib/actions";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useLocalSession } from "@/hooks/useLocalSession";
import WysiwygNotepad from "@/components/Paper.js/WysiwygNotepad";
import CollaborativeNotepad from "@/components/Paper.js/CollaborativeNotepad";
import { Document } from "@/lib/types";
import TagsManager from "@/components/TagsManager";
import { addShareAction } from "@/lib/actions/DocumentActions";
import UserListButton from "@/components/ui/UserList/UserListButton";
import { useGuardedNavigate } from "@/hooks/useGuardedNavigate";

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

  const normalizeContent = (rawContent: any): NotepadContent => {
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
  };

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
        } catch {}
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
        } catch {}
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
      } catch {}
      setError("Erreur lors du chargement du document");
    } finally {
      setIsLoading(false);
    }
  }, [props.params.id]);

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
  }, [document]);

  useEffect(() => {
    const key = `notus:doc:${props.params.id}`;
    const handleBeforeUnload = () => {
      try {
        localStorage.removeItem(key);
      } catch {}
    };

    if (typeof window !== "undefined") {
      window.addEventListener("beforeunload", handleBeforeUnload);
    }

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("beforeunload", handleBeforeUnload);
        try {
          localStorage.removeItem(key);
        } catch {}
      }
    };
  }, [props.params.id]);

  const handleContentChange = useCallback((newContent: any) => {
    const normalized = normalizeContent(newContent);
    setContent(normalized);

    try {
      if (typeof window !== "undefined") {
        const key = `notus:doc:${props.params.id}`;
        const cachedRaw = localStorage.getItem(key);
        const cached = cachedRaw ? JSON.parse(cachedRaw) : {};
        const payload = {
          ...(cached || {}),
          id: Number(props.params.id),
          title: title,
          content: normalized,
          tags: tags,
          updated_at: new Date().toISOString(),
        user_id: cached?.user_id ?? Number(userId ?? ((props.session as any)?.user?.id ?? 0)),
          cachedAt: Date.now(),
        };
        localStorage.setItem(key, JSON.stringify(payload));
      }
    } catch {}
  }, []);

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
        text: content.text || "",
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
          setTimeout(() => setShowSavedState(false), 1500);
          setTimeout(() => setShowSuccessMessage(false), 3000);
        } catch {}
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
    ]
  );

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
    if (typeof navigator !== "undefined" && navigator.onLine) {
      persistTags(nextTags);
    }
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
    try {
      const key = `notus:doc:${props.params.id}`;
      const cachedRaw = typeof window !== "undefined" ? localStorage.getItem(key) : null;
      const cached = cachedRaw ? JSON.parse(cachedRaw) : {};
      const payload = {
        ...(cached || {}),
        id: Number(props.params.id),
        title: title,
        content: content,
        tags: next,
        updated_at: new Date().toISOString(),
            user_id: cached?.user_id ?? Number(userId ?? ((props.session as any)?.user?.id ?? 0)),
        cachedAt: Date.now(),
      };
      if (typeof window !== "undefined") {
        localStorage.setItem(key, JSON.stringify(payload));
      }
    } catch {}

    if (typeof navigator !== "undefined" && navigator.onLine) {
      persistTags(next);
    }
    setNewTag("");
    setShowTagInput(false);
  };

  const removeTag = (value: string) => {
    const next = tags.filter((t) => t !== value);
    setTags(next);
    try {
      const key = `notus:doc:${props.params.id}`;
      const cachedRaw = typeof window !== "undefined" ? localStorage.getItem(key) : null;
      const cached = cachedRaw ? JSON.parse(cachedRaw) : {};
      const payload = {
        ...(cached || {}),
        id: Number(props.params.id),
        title: title,
        content: content,
        tags: next,
        updated_at: new Date().toISOString(),
        user_id: cached?.user_id ?? Number(userId ?? ((props.session as any)?.user?.id ?? 0)),
        cachedAt: Date.now(),
      };
      if (typeof window !== "undefined") {
        localStorage.setItem(key, JSON.stringify(payload));
      }
    } catch {}

    if (typeof navigator !== "undefined" && navigator.onLine) {
      persistTags(next);
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
  }, [document, userEmail]);

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

  // Check if user has any access (read or edit)
  if (hasReadAccess === false) {
    return (
      <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center p-4">
        <div className="bg-white dark:bg-black rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <h1 className="text-2xl font-bold text-black dark:text-white mb-4">
            Accès refusé
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Vous n'êtes pas autorisé à accéder à ce document.
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
    <div className="min-h-screen bg-white dark:bg-black py-8">
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
          <div className="flex flex-row justify-center items-center">
            <UserListButton users={users} className="self-center" />
            {hasEditAccess === false && (
              <div className="ml-4 px-3 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 text-sm font-medium rounded-full border border-yellow-200 dark:border-yellow-700">
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
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <circle cx="12" cy="5" r="2" className="fill-black dark:fill-white" />
                  <circle cx="12" cy="12" r="2" className="fill-black dark:fill-white" />
                  <circle cx="12" cy="19" r="2" className="fill-black dark:fill-white" />
                </svg>
              </Button>
              {isMenuOpen && (
                <div
                  className="absolute right-0 top-full z-40 rounded-lg shadow-lg p-4 min-w-[13rem] bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700"
                >
                  <MenuItem
                    onClick={() => {
                      if (hasEditAccess !== false) {
                        handleShareButtonClick();
                        setIsMenuOpen(false);
                      }
                    }}
                    disabled={hasEditAccess === false}
                    icon={
                      <svg width="18" height="16" viewBox="0 0 18 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M16.59 7.5L12 2.91V5.37L11.14 5.5C6.83 6.11 3.91 8.37 2.24 11.83C4.56 10.19 7.44 9.4 11 9.4H12V12.09M10 10.42C5.53 10.63 2.33 12.24 0 15.5C1 10.5 4 5.5 11 4.5V0.5L18 7.5L11 14.5V10.4C10.67 10.4 10.34 10.41 10 10.42Z" fill={hasEditAccess === false ? "#999" : "#DD05C7"} />
                      </svg>
                    }
                  >
                    {hasEditAccess === false ? "Lecture seule" : "Partager"}
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
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
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
                      className={permission === "read" ? "bg-gray-100 dark:bg-gray-700" : ""}
                    >
                      Peut lire
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setPermission("write")}
                      className={permission === "write" ? "bg-gray-100 dark:bg-gray-700" : ""}
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
                <p className="text-sm text-red-600 dark:text-red-400 mt-2">{shareError}</p>
              )}
              {shareSuccess && (
                <p className="text-sm text-green-600 dark:text-green-400 mt-2">{shareSuccess}</p>
              )}
            </div>
          </Modal.Content>
          <Modal.Footer>
          </Modal.Footer>
        </Modal>

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
                disabled={hasEditAccess === false}
              />
            </div>

            {/* Title */}
            <div>
              <input
                type="text"
                value={title}
                onChange={hasEditAccess === false ? undefined : (e) => setTitle(e.target.value)}
                readOnly={hasEditAccess === false}
                className={`w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange dark:focus:ring-primary bg-transparent text-foreground text-xl font-semibold ${hasEditAccess === false ? 'cursor-default opacity-75' : ''}`}
                placeholder="Titre du document"
                maxLength={255}
              />
            </div>

            {/* Content */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Contenu
              </label>
              <div className="border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden bg-white dark:bg-gray-700">
                <WysiwygNotepad
                  key={`doc-${document.id}-${document.updated_at}`}
                  initialData={content}
                  onContentChange={handleContentChange}
                  placeholder="Commencez à écrire votre document..."
                  className=""
                  showDebug={false}
                  readOnly={hasEditAccess === false}
                />
              </div>
            </div>

            {/* Buttons */}
            <div className="flex justify-center space-x-4">
            <button
                type="button"
                onClick={() => guardedNavigate("/")}
                className="px-6 py-3 rounded-lg text-foreground hover:shadow-md hover:border-primary hover:bg-foreground/5 border border-primary cursor-pointer"
              >
                Annuler
              </button>
              <Button
                type="submit"
                disabled={isPending || hasEditAccess === false}
                className={`${showSavedState
                  ? "bg-green-600 hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-600"
                  : "bg-primary hover:bg-primary/90 text-primary-foreground"
                  } disabled:bg-gray-400 disabled:cursor-not-allowed font-semibold py-3 px-6 rounded-lg transition-colors`}
              >
                {isPending
                  ? "Sauvegarde..."
                  : showSavedState
                    ? "Sauvegardé"
                    : hasEditAccess === false
                      ? "Lecture seule"
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