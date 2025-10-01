"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui";

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
            <Card.Title id="local-docs-empty" className="text-lg mb-2">Aucun document local</Card.Title>
            <Card.Description>
              Créez votre premier document !
            </Card.Description>
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
            <a href={`/documents/local/${encodeURIComponent(doc.id)}`} className="block">
            <article className="bg-white dark:bg-black border border-light-gray dark:border-dark-gray rounded-2xl p-6 hover:shadow-lg transition-shadow" aria-label={doc.title || "Sans titre"}>
              <h4 className="font-title font-semibold text-black dark:text-white mb-2">
                {doc.title || "Sans titre"}
              </h4>
              {doc.content ? (
                <p className="font-sans text-16px font-regular text-black dark:text-white line-clamp-1">
                  {(doc.content || "").split(/\r?\n/)[0]}
                </p>
              ) : (
                <p className="text-black dark:text-white italic">Document vide</p>
              )}
              <time dateTime={doc.updated_at} className="text-xs text-light-gray dark:text-dark-gray">
                {formatDate(doc.updated_at)}
              </time>
            </article>
            </a>
          </div>
        ))}
      </div>
    </section>
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


