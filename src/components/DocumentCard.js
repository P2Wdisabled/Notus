"use client";
import { useState, useEffect, useRef } from "react";
import { useActionState } from "react";
import { deleteDocumentAction } from "@/lib/actions";
import Link from "next/link";
import DOMPurify from 'dompurify';

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
          if (cur[k] && typeof cur[k] === "object" && "text" in cur[k] && typeof cur[k].text === "string") {
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

export default function DocumentCard({ document, currentUserId, onDelete }) {
  const [message, formAction, isPending] = useActionState(
    deleteDocumentAction,
    undefined
  );
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const isOwner = document.user_id === currentUserId;
  const updatedDate = new Date(document.updated_at);
  const timeAgo = getTimeAgo(updatedDate);

  // ensure we always define contentIsHtml and previewText
  const rawPreviewSource = document?.content ?? "";
  const normalizedString = unwrapToString(rawPreviewSource);
  const contentIsHtml = detectHtmlInString(normalizedString);
  const previewText = contentIsHtml ? stripHtml(normalizedString) : normalizedString;

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

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 mb-4 hover:shadow-2xl transition-shadow">
      {/* En-tête du document */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-sm">
              {document.first_name?.charAt(0) || "U"}
            </span>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">
              {document.first_name} {document.last_name}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              @{document.username} • {timeAgo}
            </p>
          </div>
        </div>

        {/* Bouton de suppression pour le propriétaire */}
        {isOwner && (
          <div className="relative">
            <button
              onClick={() => setShowDeleteConfirm(!showDeleteConfirm)}
              className="text-gray-400 hover:text-red-500 transition-colors"
              title="Supprimer le document"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </button>

            {/* Confirmation de suppression */}
            {showDeleteConfirm && (
              <div className="absolute right-0 top-8 bg-white dark:bg-gray-700 rounded-lg shadow-lg p-4 border border-gray-200 dark:border-gray-600 z-10">
                <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
                  Supprimer ce document ?
                </p>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="text-sm px-3 py-1 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-500"
                  >
                    Annuler
                  </button>
                  <form action={handleDelete}>
                    <button
                      type="submit"
                      disabled={isPending}
                      className="text-sm px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50"
                    >
                      {isPending ? "Suppression..." : "Supprimer"}
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Titre du document */}
      <div className="mb-4">
        <Link
          href={`/documents/${document.id}`}
          className="text-xl font-bold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
        >
          {document.title}
        </Link>
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
            <p className="text-gray-400 dark:text-gray-500 italic">Chargement...</p>
          )
        ) : previewText ? (
          <p className="line-clamp-3">
            {previewText.length > 200 ? `${previewText.substring(0, 200)}...` : previewText}
          </p>
        ) : (
          <p className="text-gray-400 dark:text-gray-500 italic">Document vide</p>
        )}
      </div>

      {/* Actions */}
      <div className="flex justify-between items-center">
        <Link
          href={`/documents/${document.id}`}
          className="text-blue-600 hover:text-blue-700 font-semibold text-sm"
        >
          Ouvrir le document →
        </Link>
        <span className="text-xs text-gray-400 dark:text-gray-500">
          {document.content ? `${document.content.length} caractères` : "Vide"}
        </span>
      </div>

      {/* Message de suppression */}
      {message && (
        <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-600 dark:text-red-400">{message}</p>
        </div>
      )}
    </div>
  );
}

// Fonction utilitaire pour calculer le temps écoulé
function getTimeAgo(date) {
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);

  if (diffInSeconds < 60) {
    return "À l'instant";
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `Il y a ${minutes} minute${minutes > 1 ? "s" : ""}`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `Il y a ${hours} heure${hours > 1 ? "s" : ""}`;
  } else if (diffInSeconds < 2592000) {
    const days = Math.floor(diffInSeconds / 86400);
    return `Il y a ${days} jour${days > 1 ? "s" : ""}`;
  } else {
    return date.toLocaleDateString("fr-FR");
  }
}
