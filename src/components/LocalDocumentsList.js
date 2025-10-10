"use client";

import { useEffect, useState } from "react";
import { Card, Button, Badge, Input } from "@/components/ui";

const LOCAL_DOCS_KEY = "notus.local.documents";

export default function LocalDocumentsList() {
  const [documents, setDocuments] = useState([]);

  const load = () => {
    try {
      const raw = localStorage.getItem(LOCAL_DOCS_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      if (Array.isArray(parsed)) {
        setDocuments(parsed);
      } else {
        setDocuments([]);
      }
    } catch (_) {
      setDocuments([]);
    }
  };

  useEffect(() => {
    load();
    const onStorage = (e) => {
      if (e.key === LOCAL_DOCS_KEY) {
        load();
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  if (!documents || documents.length === 0) {
    return (
      <section aria-labelledby="local-docs-empty">
        <Card className="text-center py-12">
          <Card.Content>
            <div className="text-gray-400 dark:text-gray-500 mb-4">
              <svg
                className="w-16 h-16 mx-auto"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <Card.Title id="local-docs-empty" className="text-lg mb-2">
              Aucun document local
            </Card.Title>
            <Card.Description>Créez votre premier document !</Card.Description>
          </Card.Content>
        </Card>
      </section>
    );
  }

  return (
    <section aria-labelledby="local-docs-heading" className="space-y-4">
      <div className="grid gap-4 grid-cols-[repeat(auto-fit,minmax(300px,1fr))]">
        {documents.map((doc) => (
          <div key={doc.id} className="w-full">
            <a
              href={`/documents/local/${encodeURIComponent(doc.id)}`}
              className="block"
            >
              <LocalDocItem doc={doc} />
            </a>
          </div>
        ))}
      </div>
    </section>
  );
}

function LocalDocItem({ doc }) {
  const [tags, setTags] = useState([]);
  const [showTagInput, setShowTagInput] = useState(false);
  const [newTag, setNewTag] = useState("");

  useEffect(() => {
    try {
      const raw = localStorage.getItem("notus.tags");
      const parsed = raw ? JSON.parse(raw) : {};
      const key = `local:${String(doc.id)}`;
      const existing = parsed?.[key] || [];
      if (Array.isArray(existing)) setTags(existing);
    } catch (_) {
      // ignore
    }
  }, [doc.id]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("notus.tags");
      const parsed = raw ? JSON.parse(raw) : {};
      const key = `local:${String(doc.id)}`;
      parsed[key] = tags;
      localStorage.setItem("notus.tags", JSON.stringify(parsed));
    } catch (_) {
      // ignore
    }
  }, [tags, doc.id]);

  const addTag = () => {
    const value = (newTag || "").trim();
    if (!value) return;
    if (tags.includes(value)) {
      setNewTag("");
      setShowTagInput(false);
      return;
    }
    setTags((prev) => [...prev, value]);
    setNewTag("");
    setShowTagInput(false);
  };

  const removeTag = (value) => {
    // eslint-disable-next-line no-alert
    const ok = window.confirm(`Supprimer le tag "${value}" ?`);
    if (!ok) return;
    setTags((prev) => prev.filter((t) => t !== value));
  };

  const stopNav = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const contentText = typeof doc.content === 'object' && doc.content !== null
    ? doc.content.text || ''
    : doc.content || '';
  // Remove HTML tags from the first line
  const firstLineRaw = contentText.split(/\r?\n/)[0];
  const firstLine = firstLineRaw.replace(/<[^>]+>/g, '').trim();

  return (
    <article
      className="bg-white dark:bg-black border border-light-gray dark:border-dark-gray rounded-2xl p-6 hover:shadow-lg transition-shadow"
      aria-label={doc.title || "Sans titre"}
    >
      {/* Tags + ajout */}
      <div className="mb-2">
        <div className="flex flex-wrap items-center gap-2" onClick={stopNav}>
          {tags.map((tag) => (
            <Badge key={tag} variant="primary" size="sm" className="pr-1">
              <span className="mr-1">{tag}</span>
              <button
                type="button"
                className="ml-1 inline-flex items-center justify-center w-4 h-4 rounded-full text-blue-700 dark:text-blue-200 hover:bg-blue-200/50 dark:hover:bg-blue-800/40"
                aria-label={`Supprimer le tag ${tag}`}
                onClick={(e) => {
                  stopNav(e);
                  removeTag(tag);
                }}
              >
                ×
              </button>
            </Badge>
          ))}

          {!showTagInput && (
            <Button
              variant="secondary"
              className="px-2 py-0.5 text-sm"
              onClick={(e) => {
                stopNav(e);
                setShowTagInput(true);
              }}
            >
              +
            </Button>
          )}

          {showTagInput && (
            <div className="flex items-center gap-1" onClick={stopNav}>
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
                onClick={(e) => {
                  stopNav(e);
                  addTag();
                }}
              >
                Ajouter
              </Button>
              <Button
                variant="ghost"
                className="px-2 py-0.5 text-sm"
                onClick={(e) => {
                  stopNav(e);
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

      {/* Titre */}
      <h4 className="font-title font-semibold text-black dark:text-white mb-2 truncate">
        {doc.title || "Sans titre"}
      </h4>

      {/* Contenu */}
      {doc.content ? (
        <p className="font-sans text-16px font-regular text-black dark:text-white line-clamp-1">
          {firstLine}
        </p>
      ) : (
        <p className="text-black dark:text-white italic">Document vide</p>
      )}
      <time
        dateTime={doc.updated_at}
        className="text-xs text-light-gray dark:text-dark-gray"
      >
        {formatDate(doc.updated_at)}
      </time>
    </article>
  );
}

function formatDate(iso) {
  try {
    const d = new Date(iso);
    return d.toLocaleString("fr-FR");
  } catch {
    return "";
  }
}
