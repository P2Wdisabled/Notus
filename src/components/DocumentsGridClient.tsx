"use client";

import { useState, useEffect } from "react";
import { useActionState } from "react";
import { deleteMultipleDocumentsAction } from "@/lib/actions";
import DocumentCard from "@/components/DocumentCard";
import SelectionBar from "@/components/SelectionBar";
import ConnectionWarning from "@/components/ConnectionWarning";
import { useSelection } from "@/contexts/SelectionContext";
import { Document, LocalDocument, AnyDocument } from "@/lib/types";

const LOCAL_DOCS_KEY = "notus.local.documents";

interface DocumentsGridClientProps {
  documents?: Document[];
  currentUserId?: string | number | null;
}

export default function DocumentsGridClient({ documents: serverDocuments = [], currentUserId }: DocumentsGridClientProps) {
  const [localDocuments, setLocalDocuments] = useState<LocalDocument[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [message, formAction, isPending] = useActionState(
    deleteMultipleDocumentsAction,
    undefined
  );
  const [selectMode, setSelectMode] = useState(false);
  const { setIsSelectModeActive } = useSelection();

  // Synchroniser l'état local avec le contexte global
  useEffect(() => {
    setIsSelectModeActive(selectMode);
  }, [selectMode, setIsSelectModeActive]);

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
    const onStorage = (e: StorageEvent) => {
      if (e.key === LOCAL_DOCS_KEY) {
        loadLocalDocs();
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const documents = currentUserId 
    ? serverDocuments
    : [...localDocuments, ...serverDocuments];

  const toggleSelect = (id: string | number, checked: boolean) => {
    const idStr = String(id);
    setSelectedIds((prev) => {
      const set = new Set(prev);
      if (checked) set.add(idStr);
      else set.delete(idStr);
      return Array.from(set);
    });
  };

  const toggleAll = () => {
    if (selectedIds.length === documents.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(documents.map((d) => String(d.id)));
    }
  };

  const handleBulkDelete = (formData: FormData) => {
    if (selectedIds.length === 0) return;

    // Séparer les documents locaux et serveur
    const localIdsToDelete: string[] = [];
    const serverIdsToDelete: string[] = [];

    selectedIds.forEach((id) => {
      const doc = documents.find((d) => String(d.id) === id);
      if (doc && !('user_id' in doc) || (doc as LocalDocument).user_id === undefined) {
        // Document local
        localIdsToDelete.push(id);
      } else {
        serverIdsToDelete.push(id);
      }
    });

    if (localIdsToDelete.length > 0) {
      try {
        const raw = localStorage.getItem(LOCAL_DOCS_KEY);
        const parsed = raw ? JSON.parse(raw) : [];
        const updated = parsed.filter((doc: LocalDocument) => !localIdsToDelete.includes(doc.id));
        localStorage.setItem(LOCAL_DOCS_KEY, JSON.stringify(updated));
        setLocalDocuments(updated);
      } catch (e) {
        console.error("Erreur lors de la suppression locale:", e);
      }
    }

    if (currentUserId && serverIdsToDelete.length > 0) {
      formData.append("userId", String(currentUserId));
      serverIdsToDelete.forEach((id) => formData.append("documentIds", String(id)));
      formAction(formData);
    }

    setSelectedIds([]);
    setSelectMode(false);
  };

  if (!documents || documents.length === 0) {
    return (
      <section aria-labelledby="docs-empty">
        <div className="bg-card border border-border rounded-2xl text-center py-12">
          <div className="text-muted-foreground/70 mb-4">
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
          <h3 id="docs-empty" className="font-title text-lg mb-2 text-foreground">
            Aucun document pour le moment
          </h3>
          <p className="text-muted-foreground">
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
          <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
            <p className="text-sm text-destructive">{message}</p>
          </div>
        )}

        <div className="grid gap-4 grid-cols-[repeat(auto-fit,minmax(300px,1fr))]">
          {documents.map((document) => {
            // Un document est local s'il n'a pas de user_id (vient du localStorage)
            const isLocal = !('user_id' in document) || (document as LocalDocument).user_id === undefined;
            return (
              <div key={String(document.id)} className="w-full">
                <DocumentCard
                  document={document}
                  currentUserId={currentUserId}
                  isLocal={isLocal}
                  selectMode={selectMode}
                  selected={selectedIds.includes(String(document.id))}
                  onToggleSelect={toggleSelect}
                  onEnterSelectMode={(firstId) => {
                    if (!selectMode) {
                      setSelectMode(true);
                      setSelectedIds([String(firstId)]);
                    }
                  }}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Barre de sélection */}
      {selectMode && (
        <SelectionBar
          selectedCount={selectedIds.length}
          totalCount={documents.length}
          isPending={isPending}
          onCancel={() => { setSelectMode(false); setSelectedIds([]); }}
          onToggleAll={toggleAll}
          onBulkDelete={handleBulkDelete}
          currentUserId={currentUserId}
        />
      )}

      {/* Avertissement de connexion - toujours affiché si nécessaire */}
      <ConnectionWarning currentUserId={currentUserId} hasSelectionBar={selectMode} />
    </>
  );
}

