"use client";

import { useState, useEffect } from "react";
import { useActionState, startTransition } from "react";
import { useRouter } from "next/navigation";
import { useSearch } from "@/contexts/SearchContext";
import { useSelection } from "@/contexts/SelectionContext";
import { deleteMultipleDocumentsAction } from "@/lib/actions";
import DocumentCard from "@/components/DocumentCard";
import SelectionBar from "@/components/SelectionBar";
import ConnectionWarning from "@/components/ConnectionWarning";
import { Card, Alert } from "@/components/ui";
import { Document, LocalDocument, AnyDocument } from "@/lib/types";
import { TagsProvider } from "@/contexts/TagsContext";

const LOCAL_DOCS_KEY = "notus.local.documents";

interface SearchableDocumentsListProps {
  documents?: AnyDocument[];
  currentUserId?: string;
  error?: string;
}

export function SearchableDocumentsList({
  documents: serverDocuments = [],
  currentUserId,
  error,
}: SearchableDocumentsListProps) {
  const { filterDocuments, filterLocalDocuments, isSearching } = useSearch();
  const router = useRouter();
  const [localDocuments, setLocalDocuments] = useState<LocalDocument[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [message, formAction, isPending] = useActionState(
    deleteMultipleDocumentsAction,
    undefined
  );
  const [selectMode, setSelectMode] = useState(false);
  const [isMessageVisible, setIsMessageVisible] = useState(false);
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

  useEffect(() => {
    // Afficher le message dès qu'il change
    setIsMessageVisible(!!message);
    if (message && !isPending && !message.includes("Erreur")) {
      const timer = setTimeout(() => {
        router.refresh();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [message, isPending, router]);

  const documents: AnyDocument[] = currentUserId 
    ? [...serverDocuments].sort((a, b) => {
        const dateA = new Date(a.updated_at || a.created_at);
        const dateB = new Date(b.updated_at || b.created_at);
        return dateB.getTime() - dateA.getTime();
      })
    : ([...localDocuments, ...serverDocuments] as AnyDocument[]).sort((a, b) => {
        const dateA = new Date(a.updated_at || a.created_at);
        const dateB = new Date(b.updated_at || b.created_at);
        return dateB.getTime() - dateA.getTime();
      });

  // Fonctions de gestion de la sélection
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
    if (selectedIds.length === filteredDocuments.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredDocuments.map((d) => String(d.id)));
    }
  };

  const handleBulkDelete = (formData: FormData) => {
    if (selectedIds.length === 0) return;

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
        const updated = parsed.filter(
          (doc: LocalDocument) => !localIdsToDelete.includes(doc.id)
        );
        localStorage.setItem(LOCAL_DOCS_KEY, JSON.stringify(updated));
        setLocalDocuments(updated);
      } catch (e) {
        console.error("Erreur lors de la suppression locale:", e);
      }
    }

    if (currentUserId && serverIdsToDelete.length > 0) {
      formData.append("userId", String(currentUserId));
      serverIdsToDelete.forEach((id) =>
        formData.append("documentIds", String(id))
      );
      startTransition(() => {
        formAction(formData);
      });
    }

    setSelectedIds([]);
    setSelectMode(false);
  };

  if (error) {
    return (
      <Alert variant="error">
        <Alert.Description>
          Erreur lors du chargement des documents: {error}
        </Alert.Description>
      </Alert>
    );
  }

  // Filtrer les documents en fonction du type (local ou serveur)
  const filteredDocuments: AnyDocument[] = isSearching
    ? ([
      ...filterLocalDocuments(localDocuments as unknown as AnyDocument[]),
      ...filterDocuments(serverDocuments as unknown as AnyDocument[]),
    ] as AnyDocument[])
    : documents;

  if (documents.length === 0) {
    return (
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
          <Card.Title className="text-lg mb-2">
            Aucun document pour le moment
          </Card.Title>
          <Card.Description>Créez votre premier document !</Card.Description>
        </Card.Content>
      </Card>
    );
  }

  if (isSearching && filteredDocuments.length === 0) {
    return (
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
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          <Card.Title className="text-lg mb-2">
            Aucun résultat trouvé
          </Card.Title>
          <Card.Description>Essayez avec d'autres mots-clés</Card.Description>
        </Card.Content>
      </Card>
    );
  }

  return (
    <TagsProvider documents={[...localDocuments as unknown as AnyDocument[], ...serverDocuments as unknown as AnyDocument[]]}>
      <div className="space-y-3">
        {message && isMessageVisible && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start justify-between gap-3">
            <p className="text-sm text-red-600 dark:text-red-400 flex-1">{message}</p>
            <button
              type="button"
              onClick={() => setIsMessageVisible(false)}
              aria-label="Fermer le message"
              className="text-red-500 hover:text-red-700 dark:text-red-300 dark:hover:text-red-200 shrink-0"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                width="18"
                height="18"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        <div className="grid gap-4 grid-cols-[repeat(auto-fit,minmax(300px,1fr))]">
          {filteredDocuments.map((document) => {
            // Un document est local s'il provient du localStorage (pas de user_id)
            // Un document est serveur s'il provient de la base de données (a un user_id)
            const isLocal = !('user_id' in document) || (document as LocalDocument).user_id === undefined;
            return (
              <div key={String(document.id)} className="w-full">
                <DocumentCard
                  document={document as any}
                  currentUserId={currentUserId}
                  isLocal={isLocal}
                  selectMode={selectMode}
                  selected={selectedIds.includes(String(document.id))}
                  onToggleSelect={toggleSelect}
                  onEnterSelectMode={(firstId: string | number) => {
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
          totalCount={filteredDocuments.length}
          isPending={isPending}
          onCancel={() => {
            setSelectMode(false);
            setSelectedIds([]);
          }}
          onToggleAll={toggleAll}
          onBulkDelete={handleBulkDelete}
          currentUserId={currentUserId}
        />
      )}

      {/* Avertissement de connexion - toujours affiché si nécessaire */}
      <ConnectionWarning currentUserId={currentUserId} hasSelectionBar={selectMode} />
    </TagsProvider>
  );
}

