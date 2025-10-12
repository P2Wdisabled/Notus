"use client";

import { useState, useEffect } from "react";
import { useActionState } from "react";
import { deleteMultipleDocumentsAction } from "@/lib/actions";
import DocumentCard from "@/components/DocumentCard";
import { Button } from "@/components/ui";

const LOCAL_DOCS_KEY = "notus.local.documents";

export default function DocumentsGridClient({ documents: serverDocuments = [], currentUserId }) {
  const [localDocuments, setLocalDocuments] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [message, formAction, isPending] = useActionState(
    deleteMultipleDocumentsAction,
    undefined
  );
  const [selectMode, setSelectMode] = useState(false);

  // Charger les documents locaux (toujours, même si connecté)
  useEffect(() => {
    const loadLocalDocs = () => {
      try {
        const raw = localStorage.getItem(LOCAL_DOCS_KEY);
        const parsed = raw ? JSON.parse(raw) : [];
        if (Array.isArray(parsed)) {
          setLocalDocuments(parsed);
        } else {
          setLocalDocuments([]);
        }
      } catch (_) {
        setLocalDocuments([]);
      }
    };

    loadLocalDocs();
    const onStorage = (e) => {
      if (e.key === LOCAL_DOCS_KEY) {
        loadLocalDocs();
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // Fusionner les documents locaux et serveur
  // Les documents locaux en premier, puis les documents serveur
  const documents = [...localDocuments, ...serverDocuments];

  const toggleSelect = (id, checked) => {
    setSelectedIds((prev) => {
      const set = new Set(prev);
      if (checked) set.add(id);
      else set.delete(id);
      return Array.from(set);
    });
  };

  const toggleAll = () => {
    if (selectedIds.length === documents.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(documents.map((d) => d.id));
    }
  };

  const handleBulkDelete = (formData) => {
    if (selectedIds.length === 0) return;

    // Séparer les documents locaux et serveur
    const localIdsToDelete = [];
    const serverIdsToDelete = [];

    selectedIds.forEach((id) => {
      const doc = documents.find((d) => d.id === id);
      if (doc && !doc.user_id) {
        // Document local
        localIdsToDelete.push(id);
      } else {
        // Document serveur
        serverIdsToDelete.push(id);
      }
    });

    // Supprimer les documents locaux du localStorage
    if (localIdsToDelete.length > 0) {
      try {
        const raw = localStorage.getItem(LOCAL_DOCS_KEY);
        const parsed = raw ? JSON.parse(raw) : [];
        const updated = parsed.filter((doc) => !localIdsToDelete.includes(doc.id));
        localStorage.setItem(LOCAL_DOCS_KEY, JSON.stringify(updated));
        setLocalDocuments(updated);
      } catch (e) {
        console.error("Erreur lors de la suppression locale:", e);
      }
    }

    // Supprimer les documents serveur via l'action
    if (currentUserId && serverIdsToDelete.length > 0) {
      formData.append("userId", String(currentUserId));
      serverIdsToDelete.forEach((id) => formData.append("documentIds", String(id)));
      formAction(formData);
    }

    // Optimistic UI
    setSelectedIds([]);
    setSelectMode(false);
  };

  // Affichage vide si aucun document
  if (!documents || documents.length === 0) {
    return (
      <section aria-labelledby="docs-empty">
        <div className="bg-white dark:bg-black border border-light-gray dark:border-dark-gray rounded-2xl text-center py-12">
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
          <h3 id="docs-empty" className="font-title text-lg mb-2 text-black dark:text-white">
            Aucun document pour le moment
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Créez votre premier document !
          </p>
        </div>
      </section>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {message && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-600 dark:text-red-400">{message}</p>
          </div>
        )}

        <div className="grid gap-4 grid-cols-[repeat(auto-fit,minmax(300px,1fr))]">
          {documents.map((document) => {
            // Un document est local s'il n'a pas de user_id (vient du localStorage)
            const isLocal = !document.user_id;
            return (
              <div key={document.id} className="w-full">
                <DocumentCard
                  document={document}
                  currentUserId={currentUserId}
                  isLocal={isLocal}
                  selectMode={selectMode}
                  selected={selectedIds.includes(document.id)}
                  onToggleSelect={toggleSelect}
                  onEnterSelectMode={(firstId) => {
                    if (!selectMode) {
                      setSelectMode(true);
                      setSelectedIds([firstId]);
                    }
                  }}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Bandeau fixe en bas de page */}
      {selectMode && (
        <div className={`fixed left-0 right-0 z-10 px-0 md:px-4 ${!currentUserId ? 'bottom-20' : 'bottom-0'}`}>
          <div className="md:ml-64 md:max-w-4/5 max-w-4xl mx-auto py-3 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-lg px-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => { setSelectMode(false); setSelectedIds([]); }}
                  className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
                  aria-label="Annuler la sélection"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                <span className="text-sm text-gray-700 dark:text-gray-300 font-medium hidden md:inline">
                  {selectedIds.length} note{selectedIds.length > 1 ? 's' : ''} sélectionnée{selectedIds.length > 1 ? 's' : ''}
                </span>
                <span className="text-sm text-gray-700 dark:text-gray-300 font-medium md:hidden">
                  {selectedIds.length}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={toggleAll}
                  className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
                  aria-label={selectedIds.length === documents.length ? "Tout désélectionner" : "Tout sélectionner"}
                  title={selectedIds.length === documents.length ? "Tout désélectionner" : "Tout sélectionner"}
                >
                  {selectedIds.length === documents.length ? (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  ) : (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  )}
                </button>

                <form action={handleBulkDelete} className="flex items-center">
                  <button
                    type="submit"
                    disabled={isPending || selectedIds.length === 0}
                    className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-full font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    aria-label="Supprimer les notes sélectionnées"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    <span className="hidden md:inline">{isPending ? "Suppression..." : "Supprimer"}</span>
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
