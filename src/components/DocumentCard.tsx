"use client";
import { useState, useEffect, useRef } from "react";
import { useActionState, startTransition } from "react";
import { deleteDocumentAction, updateDocumentAction } from "@/lib/actions";
import Link from "next/link";
import DOMPurify from "dompurify";
import { Button, Input } from "@/components/ui";
import { useGuardedNavigate } from "@/hooks/useGuardedNavigate";
import TagsManager from "@/components/TagsManager";
import { cn } from "@/lib/utils";

interface Document {
  id: string | number;
  title: string;
  content: any;
  updated_at: string;
  user_id?: string | number;
  tags?: string[];
}

interface DocumentCardProps {
  document: Document;
  currentUserId?: string | number | null;
  onDelete?: (id: string | number) => void;
  selectMode?: boolean;
  selected?: boolean;
  onToggleSelect?: (id: string | number, checked: boolean) => void;
  onEnterSelectMode?: (id: string | number) => void;
  isLocal?: boolean;
  index?: number;
}

function unwrapToString(raw: any): string {
  try {
    let cur = raw;
    let safety = 0;

    // boucle robuste : parse JSON strings et descend dans .text objets/strings
    while (safety < 50) {
      safety++;

      // si c'est une string, tenter de la parser (démêler les couches stringifiées)
      if (typeof cur === "string") {
        try {
          const parsed = JSON.parse(cur);
          cur = parsed;
          continue;
        } catch (e) {
          // si ce n'est pas du JSON, on renvoie le texte nettoyé (strip HTML)
          return stripHtml(cur);
        }
      }

      // si c'est un objet avec .text, descendre dans .text (string ou objet)
      if (cur && typeof cur === "object" && "text" in cur) {
        cur = cur.text;
        continue;
      }

      // si c'est un objet sans .text mais avec une propriété textuelle évidente, essayer de l'utiliser
      if (cur && typeof cur === "object") {
        // cherche la première propriété string utile (fallback)
        for (const k of Object.keys(cur)) {
          if (typeof cur[k] === "string") return stripHtml(cur[k]);
          if (
            cur[k] &&
            typeof cur[k] === "object" &&
            "text" in cur[k] &&
            typeof cur[k].text === "string"
          ) {
            return stripHtml(cur[k].text);
          }
        }
        // sinon on stringify pour debug lisible
        return JSON.stringify(cur);
      }

      // autre cas : retourner string safe
      return String(cur ?? "");
    }

    // safety fallback
    return String(raw ?? "");
  } catch (e) {
    return String(raw ?? "");
  }
}

// ✅ ADD: helpers to detect / strip HTML (client-side only)
function detectHtmlInString(str: string): boolean {
  if (!str || typeof str !== "string") return false;
  try {
    const doc = new DOMParser().parseFromString(str, "text/html");
    return Array.from(doc.body.childNodes).some((n) => n.nodeType === 1);
  } catch (e) {
    return /<\/?[a-z][\s\S]*>/i.test(str);
  }
}

function stripHtml(str: string): string {
  if (!str || typeof str !== "string") return "";
  return str.replace(/<\/?[^>]+(>|$)/g, "");
}

export default function DocumentCard({
  document,
  currentUserId,
  onDelete,
  selectMode = false,
  selected = false,
  onToggleSelect = () => {},
  onEnterSelectMode = () => {},
  isLocal = false,
  index = 0,
}: DocumentCardProps) {
  const [message, formAction, isPending] = useActionState(
    deleteDocumentAction,
    undefined
  );
  const [updateMsg, updateFormAction, isUpdating] = useActionState(
    updateDocumentAction,
    { ok: false, error: "" }
  );
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const { checkConnectivity } = useGuardedNavigate();

  const isOwner = document.user_id === currentUserId;
  const updatedDate = new Date(document.updated_at);
  const formattedDate = updatedDate.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  // Gérer le contenu selon le type (objet pour documents locaux, string pour documents serveur)
  const getContentText = (content: any): string => {
    if (typeof content === "object" && content !== null) {
      return content.text || "";
    }
    return content || "";
  };

  const firstLine = getContentText(document.content).split(/\r?\n/)[0];

  // ensure we always define contentIsHtml and previewText
  const rawPreviewSource = getContentText(document?.content);
  const normalizedString = unwrapToString(rawPreviewSource);
  const contentIsHtml = detectHtmlInString(normalizedString);
  const previewText = contentIsHtml
    ? stripHtml(normalizedString)
    : normalizedString;

  // NEW: client-only sanitized HTML state
  const [previewHtml, setPreviewHtml] = useState("");

  useEffect(() => {
    let mounted = true;
    if (!contentIsHtml) {
      setPreviewHtml("");
      return;
    }

    // dynamically import dompurify only on client
    (async () => {
      try {
        const DOMPurifyModule = await import("dompurify");
        const DOMPurify = DOMPurifyModule.default ?? DOMPurifyModule;
        // sanitize and allow inline style/color if you need colors
        const safe = DOMPurify.sanitize(normalizedString, {
          ALLOWED_ATTR: ["style", "color"],
        });
        if (mounted) setPreviewHtml(safe);
      } catch (e) {
        console.warn("dompurify import/sanitize failed", e);
        if (mounted) setPreviewHtml(stripHtml(document?.content || ""));
      }
    })();

    return () => {
      mounted = false;
    };
  }, [document?.content, contentIsHtml]);

  // --- Tags (stockés localement par document) ---
  const [tags, setTags] = useState<string[]>([]);

  useEffect(() => {
    // Priorité aux tags venant de la base si présents
    if (Array.isArray(document.tags)) {
      setTags(document.tags);
      return;
    }
    try {
      const raw = localStorage.getItem("notus.tags");
      const parsed = raw ? JSON.parse(raw) : {};
      const existing = parsed?.[String(document.id)] || [];
      if (Array.isArray(existing)) setTags(existing);
    } catch (_) {
      // ignore
    }
  }, [document.id, document.tags]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("notus.tags");
      const parsed = raw ? JSON.parse(raw) : {};
      parsed[String(document.id)] = tags;
      localStorage.setItem("notus.tags", JSON.stringify(parsed));
    } catch (_) {
      // ignore
    }
  }, [tags, document.id]);

  const persistTags = (nextTags: string[]) => {
    if (!currentUserId) return; // pas connecté => pas de persistance
    const fd = new FormData();
    fd.append("documentId", String(document.id));
    fd.append("userId", String(currentUserId));
    fd.append("title", document.title || "Sans titre");
    fd.append("content", document.content || "");
    fd.append("tags", JSON.stringify(nextTags));
    startTransition(() => {
      updateFormAction(fd);
    });
  };

  const handleTagsChange = async (newTags: string[]) => {
    const prevTags = tags || [];
    const isAddition = newTags.length > prevTags.length;
    const isRemoval = newTags.length < prevTags.length;

    // Création d'un tag: ne créer que si connecté
    if (isAddition) {
      if (!currentUserId) {
        window.dispatchEvent(
          new CustomEvent("notus:offline-popin", {
            detail: {
              message: "Vous pourrez accéder à cette fonctionnalité une fois la connexion rétablie.",
              durationMs: 5000,
            },
          })
        );
        return;
      }
      const online = await checkConnectivity();
      if (!online) {
        console.log(`[DocumentCard] Ajout de tag bloqué (offline)`);
        window.dispatchEvent(
          new CustomEvent("notus:offline-popin", {
            detail: {
              message: "Vous pourrez accéder à cette fonctionnalité une fois la connexion rétablie.",
              durationMs: 5000,
            },
          })
        );
        return;
      }
      // en ligne: on applique côté front et on persiste
      setTags(newTags);
      persistTags(newTags);
      return;
    }

    // Suppression: appliquer côté front; tenter de persister si connecté
    if (isRemoval) {
      setTags(newTags);
      if (!currentUserId) return;
      const online = await checkConnectivity();
      if (online) {
        persistTags(newTags);
      } else {
        window.dispatchEvent(
          new CustomEvent("notus:offline-popin", {
            detail: {
              message: "Vous pourrez accéder à cette fonctionnalité une fois la connexion rétablie.",
              durationMs: 5000,
            },
          })
        );
      }
      return;
    }

    // Aucun changement détecté (sécurité)
  };

  const handleDelete = (formData: FormData) => {
    if (!currentUserId) return;
    formData.append("documentId", String(document.id));
    formData.append("userId", String(currentUserId));
    formAction(formData);
    setShowDeleteConfirm(false);
    if (onDelete) {
      onDelete(document.id);
    }
  };

  // Gestion du mode sélection (long press / clic contextuel)
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const longPressActivatedRef = useRef(false);

  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onToggleSelect(document.id, e.target.checked);
  };

  const clearLongPressTimer = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const startLongPressTimer = () => {
    clearLongPressTimer();
    longPressActivatedRef.current = false;
    longPressTimerRef.current = setTimeout(() => {
      longPressActivatedRef.current = true;
      onEnterSelectMode(document.id);
      onToggleSelect(document.id, true);
    }, 500);
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    onEnterSelectMode(document.id);
    onToggleSelect(document.id, !selected);
  };

  const handleClick = (e: React.MouseEvent) => {
    if (selectMode || longPressActivatedRef.current) {
      e.preventDefault();
      onToggleSelect(document.id, !selected);
      longPressActivatedRef.current = false;
    }
  };

  const handleCardClick = (e: React.MouseEvent) => {
    if (selectMode || longPressActivatedRef.current) {
      e.preventDefault();
      onToggleSelect(document.id, !selected);
      longPressActivatedRef.current = false;
    }
  };

  const handleLongPress = () => {
    onEnterSelectMode(document.id);
    onToggleSelect(document.id, !selected);
  };

  // ref + state pour lire les styles calculés
  const previewRef = useRef<HTMLDivElement>(null);
  const [computedStyle, setComputedStyle] = useState({
    color: null as string | null,
    backgroundColor: null as string | null,
    fontSize: null as string | null,
    fontFamily: null as string | null,
    fontWeight: null as string | null,
    lineHeight: null as string | null,
    accent: null as string | null,
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const el = previewRef.current;
    // si l'élément n'est pas prêt, on essaie le root (ou on attend previewHtml)
    const target = el instanceof Element ? el : (document as any).body;
    try {
      const style = window.getComputedStyle(target);
      setComputedStyle({
        color: style.color,
        backgroundColor: style.backgroundColor,
        fontSize: style.fontSize,
        fontFamily: style.fontFamily,
        fontWeight: style.fontWeight,
        lineHeight: style.lineHeight,
        accent: style.getPropertyValue("--accent-color") || null,
      });
    } catch (e) {
      // fallback silencieux
      setComputedStyle((s) => s);
    }
  }, [previewHtml, previewText]);

  // Définir l'URL en fonction du type de document (local ou serveur)
  const documentUrl = isLocal
    ? `/documents/local/${encodeURIComponent(document.id)}`
    : `/documents/${document.id}`;

  return (
    <div
      className={cn(
        "group relative bg-card border rounded-xl p-5 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-1 cursor-pointer animate-fade-in-up",
        selected && "border-primary ring-2 ring-primary/20 bg-primary/5",
      )}
      style={{ animationDelay: `${index * 50}ms` }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        clearLongPressTimer();
      }}
      onClick={handleCardClick}
      onContextMenu={(e) => {
        e.preventDefault();
        handleLongPress();
      }}
      onMouseDown={startLongPressTimer}
      onMouseUp={clearLongPressTimer}
      onTouchStart={startLongPressTimer}
      onTouchEnd={clearLongPressTimer}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2 w-full min-w-0">
          <div
            className="flex-1 min-w-0 max-w-full"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
          >
            <TagsManager
              tags={tags}
              onTagsChange={handleTagsChange}
              placeholder="Nouveau tag..."
              maxTags={10}
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="space-y-2">
        <a
          href={documentUrl}
          className="block"
          onClick={async (e) => {
            if (selectMode || longPressActivatedRef.current) {
              e.preventDefault();
              return;
            }
            e.preventDefault();
            console.log(`[DocumentCard] Tentative d'ouverture du document ${document.id} (${document.title})`);
            try {
              const controller = new AbortController();
              const timeoutId = window.setTimeout(() => controller.abort(), 5000);
              console.log(`[DocumentCard] Vérification de connexion (check-status) avant navigation...`);
              const resp = await fetch("/api/admin/check-status", {
                method: "GET",
                cache: "no-store",
                credentials: "include",
                headers: { "cache-control": "no-cache" },
                signal: controller.signal,
              });
              window.clearTimeout(timeoutId);
              console.log(`[DocumentCard] Réponse de vérification: ${resp.status} ${resp.ok ? "OK" : "FAIL"}`);
              if (resp.ok) {
                console.log(`[DocumentCard] Connexion OK, redirection vers ${documentUrl}`);
                window.location.href = documentUrl;
              } else {
                console.log(`[DocumentCard] Connexion échouée, affichage popin offline`);
                window.dispatchEvent(
                  new CustomEvent("notus:offline-popin", {
                    detail: {
                      message:
                        "Vous pourrez accéder à cette fonctionnalité une fois la connexion rétablie.",
                      durationMs: 5000,
                    },
                  })
                );
              }
            } catch (error) {
              console.log(`[DocumentCard] Erreur de vérification de connexion:`, error);
              window.dispatchEvent(
                new CustomEvent("notus:offline-popin", {
                  detail: {
                    message:
                      "Vous pourrez accéder à cette fonctionnalité une fois la connexion rétablie.",
                    durationMs: 5000,
                  },
                })
              );
            }
          }}
        >
          <h3 className="text-lg font-semibold text-card-foreground group-hover:text-primary transition-colors duration-200">
            {document.title}
          </h3>
        </a>
        <div
          ref={previewRef}
          className="text-sm text-muted-foreground line-clamp-2 leading-relaxed"
        >
          {contentIsHtml ? (
            // only render sanitized HTML when previewHtml available
            previewHtml ? (
              <div
                className="prose max-w-full"
                dangerouslySetInnerHTML={{ __html: previewHtml }}
              />
            ) : (
              <p className="text-muted-foreground/70 italic">
                Chargement...
              </p>
            )
          ) : previewText ? (
            <p>
              {previewText.length > 200
                ? `${previewText.substring(0, 200)}...`
                : previewText}
            </p>
          ) : (
            <p className="text-gray-400 dark:text-gray-500 italic">
              Document vide
            </p>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="mt-4 pt-3 border-t border-border flex items-center justify-between">
        <time
          dateTime={document.updated_at}
          className="text-xs text-muted-foreground"
        >
          {formattedDate}
        </time>
        {/* {isOwner && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Propriétaire</span>
          </div>
        )} */}
          {selectMode && (
          <div
            onClick={(e) => {
              e.stopPropagation();
              onToggleSelect(document.id, !selected);
            }}
            className="animate-fade-in"
          >
             <input
               type="checkbox"
               checked={selected}
               onClick={handleCheckboxClick}
               onChange={handleCheckboxChange}
               className="h-5 w-5 appearance-none border-2 border-input rounded transition-all duration-200 checked:border-primary checked:bg-primary checked:accent-primary"
               style={{
                 accentColor: selected ? 'var(--primary)' : undefined
               }}
               aria-label="Sélectionner ce document"
             />
          </div>
        )}
      </div>

      {/* Message de suppression */}
      {message && (
        <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
          <p className="text-sm text-destructive">{message}</p>
        </div>
      )}
    </div>
  );
}

