"use client";
import { useState, useEffect, useRef } from "react";
import { useActionState } from "react";
import { deleteDocumentAction } from "@/lib/actions";
import Link from "next/link";
import DOMPurify from "dompurify";

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

export default function DocumentCard({ document, currentUserId, onDelete }) {
  const [message, formAction, isPending] = useActionState(
    deleteDocumentAction,
    undefined
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
    <Link
      href={`/documents/${document.id}`}
      className="block bg-white dark:bg-black rounded-2xl shadow-lg p-6 mb-4 hover:shadow-lg transition-shadow border border-gray dark:border-dark-gray"
    >
      {/* En-tête du document */}
      {/* <div className="flex justify-between items-start mb-4">
      </div> */}

      {/* Titre du document */}
      <div className="mb-2">
        <span className="text-xl font-title text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
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
        <time
          dateTime={document.updated_at}
          className="text-xs text-light-gray dark:text-dark-gray"
        >
          {formattedDate}
        </time>
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
