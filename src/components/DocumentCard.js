"use client";
import { useState, useEffect, useRef } from "react";
import { useActionState, startTransition } from "react";
import { deleteDocumentAction, updateDocumentAction } from "@/lib/actions";
import Link from "next/link";
import DOMPurify from "dompurify";
import { Button, Badge, Input } from "@/components/ui";

function unwrapToString(raw) {
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
function detectHtmlInString(str) {
  if (!str || typeof str !== "string") return false;
  try {
    const doc = new DOMParser().parseFromString(str, "text/html");
    return Array.from(doc.body.childNodes).some((n) => n.nodeType === 1);
  } catch (e) {
    return /<\/?[a-z][\s\S]*>/i.test(str);
  }
}
function stripHtml(str) {
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
}) {
  const [message, formAction, isPending] = useActionState(
    deleteDocumentAction,
    undefined
  );
  const [updateMsg, updateFormAction, isUpdating] = useActionState(
    updateDocumentAction,
    { ok: false }
  );
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const isOwner = document.user_id === currentUserId;
  const updatedDate = new Date(document.updated_at);
  const formattedDate = updatedDate.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  const firstLine = (document.content || "").split(/\r?\n/)[0];

  // ensure we always define contentIsHtml and previewText
  const rawPreviewSource = document?.content ?? "";
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
  const [tags, setTags] = useState([]);
  const [showTagInput, setShowTagInput] = useState(false);
  const [newTag, setNewTag] = useState("");

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

  const persistTags = (nextTags) => {
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
    persistTags(next);
    setNewTag("");
    setShowTagInput(false);
  };

  const removeTag = (value) => {
    const next = tags.filter((t) => t !== value);
    setTags(next);
    persistTags(next);
  };

  const handleDelete = (formData) => {
    if (!currentUserId) return;
    formData.append("documentId", document.id);
    formData.append("userId", currentUserId);
    formAction(formData);
    setShowDeleteConfirm(false);
    if (onDelete) {
      onDelete(document.id);
    }
  };

  // Gestion du mode sélection (long press / clic contextuel)
  const longPressTimerRef = useRef(null);
  const longPressActivatedRef = useRef(false);

  const handleCheckboxClick = (e) => {
    e.stopPropagation();
    e.preventDefault();
  };

  const handleCheckboxChange = (e) => {
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

  const handleContextMenu = (e) => {
    e.preventDefault();
    onEnterSelectMode(document.id);
    onToggleSelect(document.id, !selected);
  };

  const handleClick = (e) => {
    if (selectMode || longPressActivatedRef.current) {
      e.preventDefault();
      onToggleSelect(document.id, !selected);
      longPressActivatedRef.current = false;
    }
  };

  // ref + state pour lire les styles calculés
  const previewRef = useRef(null);
  const [computedStyle, setComputedStyle] = useState({
    color: null,
    backgroundColor: null,
    fontSize: null,
    fontFamily: null,
    fontWeight: null,
    lineHeight: null,
    // add other properties or css vars you need
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const el = previewRef.current;
    // si l'élément n'est pas prêt, on essaie le root (ou on attend previewHtml)
    const target = el instanceof Element ? el : document.documentElement;
    try {
      const style = window.getComputedStyle(target);
      setComputedStyle({
        color: style.color,
        backgroundColor: style.backgroundColor,
        fontSize: style.fontSize,
        fontFamily: style.fontFamily,
        fontWeight: style.fontWeight,
        lineHeight: style.lineHeight,
        // lire une variable CSS : style.getPropertyValue('--my-var')
        accent: style.getPropertyValue("--accent-color") || null,
      });
    } catch (e) {
      // fallback silencieux
      setComputedStyle((s) => s);
    }
    // Si le thème / classes peuvent changer dynamiquement,
    // ajoutez en dépendances un state qui change (ex: previewHtml, theme)
  }, [previewHtml, previewText]); // relire quand le contenu est mis à jour

  // Définir l'URL en fonction du type de document (local ou serveur)
  const documentUrl = isLocal
    ? `/documents/local/${encodeURIComponent(document.id)}`
    : `/documents/${document.id}`;

  return (
    <Link
      href={documentUrl}
      className="block bg-white dark:bg-black rounded-2xl shadow-lg p-6 mb-4 hover:shadow-lg transition-shadow border border-gray dark:border-dark-gray"
      onContextMenu={handleContextMenu}
      onClick={handleClick}
      onMouseDown={startLongPressTimer}
      onMouseUp={clearLongPressTimer}
      onMouseLeave={clearLongPressTimer}
      onTouchStart={startLongPressTimer}
      onTouchEnd={clearLongPressTimer}
    >
      {/* Tags + ajout */}
      <div className="mb-2">
        <div
          className="flex flex-wrap items-center gap-2"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
        >
          {tags.map((tag) => (
            <Badge key={tag} variant="purple" size="sm" className="pr-1">
              <span className="mr-1 max-w-[200px] truncate" title={tag}>
                {tag}
              </span>
              <button
                type="button"
                className="ml-1 inline-flex items-center justify-center w-4 h-4 rounded-full text-purple dark:text-light-purple hover:bg-purple/20 dark:hover:bg-purple/30"
                aria-label={`Supprimer le tag ${tag}`}
                onClick={() => removeTag(tag)}
              >
                ×
              </button>
            </Badge>
          ))}

          {!showTagInput && (
            <Button
              variant="secondary"
              className="px-2 py-0.5 text-sm"
              onClick={() => setShowTagInput(true)}
            >
              +
            </Button>
          )}

          {showTagInput && (
            <div className="flex items-center gap-1">
              <Input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="Nouveau tag"
                className="h-7 text-sm"
                onKeyDown={(e) => {
                  if (e.key === "Enter") addTag();
                  if (e.key === "Escape") {
                    setShowTagInput(false);
                    setNewTag("");
                  }
                }}
                autoFocus
              />
              <Button
                variant="primary"
                className="px-2 py-0.5 text-sm"
                onClick={addTag}
              >
                Ajouter
              </Button>
              <Button
                variant="ghost"
                className="px-2 py-0.5 text-sm"
                onClick={() => {
                  setShowTagInput(false);
                  setNewTag("");
                }}
              >
                Annuler
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Titre du document */}
      <div className="mb-2">
        <span className="block truncate text-xl font-title text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
          {document.title}
        </span>
      </div>

      {/* preview */}
      <div
        ref={previewRef} // <--- attach ref ici
        className="text-gray-600 dark:text-gray-300 mb-4"
      >
        {contentIsHtml ? (
          // only render sanitized HTML when previewHtml available
          previewHtml ? (
            <div
              className="line-clamp-3 prose max-w-full"
              dangerouslySetInnerHTML={{ __html: previewHtml }}
            />
          ) : (
            <p className="text-gray-400 dark:text-gray-500 italic">
              Chargement...
            </p>
          )
        ) : previewText ? (
          <p className="line-clamp-3">
            {previewText.length > 200
              ? `${previewText.substring(0, 200)}...`
              : previewText}
          </p>
        ) : (
          <p className="text-gray-400 dark:text-gray-500 italic">
            Document vide
          </p>
        )}
        <div className="flex items-center justify-between mt-2">
          <time
            dateTime={document.updated_at}
            className="text-xs text-light-gray dark:text-dark-gray"
          >
            {formattedDate}
          </time>
          {selectMode && (
            <input
              type="checkbox"
              checked={selected}
              onClick={handleCheckboxClick}
              onChange={handleCheckboxChange}
              className="w-5 h-5 cursor-pointer rounded-full appearance-none border-2 border-gray-300 dark:border-gray-600 checked:border-orange dark:checked:border-dark-purple checked:bg-orange dark:checked:bg-dark-purple"
              aria-label="Sélectionner ce document"
            />
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-between items-center"></div>

      {/* Message de suppression */}
      {message && (
        <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-600 dark:text-red-400">{message}</p>
        </div>
      )}
    </Link>
  );
}
