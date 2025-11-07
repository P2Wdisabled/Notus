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
import Icon from "@/components/Icon";

const LOCAL_DOCS_KEY = "notus.local.documents";

interface SearchableDocumentsListProps {
  documents?: AnyDocument[];
  currentUserId?: string;
  error?: string;
  isFavoritesList?: boolean;
}

export function SearchableDocumentsList({
  documents: serverDocuments = [],
  currentUserId,
  error,
  isFavoritesList = false,
}: SearchableDocumentsListProps) {
  const { filterDocuments, filterLocalDocuments, isSearching } = useSearch();
  const router = useRouter();
  const [localDocuments, setLocalDocuments] = useState<LocalDocument[]>([]);
  const [runtimeDocuments, setRuntimeDocuments] = useState<AnyDocument[]>(serverDocuments);
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
    setRuntimeDocuments(serverDocuments);
  }, [serverDocuments]);

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

  const baseServerDocs: AnyDocument[] = isFavoritesList ? runtimeDocuments : serverDocuments;

  const documents: AnyDocument[] = currentUserId 
    ? [...baseServerDocs].sort((a, b) => {
        const dateA = new Date(a.updated_at || a.created_at);
        const dateB = new Date(b.updated_at || b.created_at);
        return dateB.getTime() - dateA.getTime();
      })
    : ([...localDocuments, ...baseServerDocs] as AnyDocument[]).sort((a, b) => {
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
      ...filterDocuments(baseServerDocs as unknown as AnyDocument[]),
    ] as AnyDocument[])
    : documents;

  if (documents.length === 0) {
    return (
      <Card className="text-center py-12">
        <Card.Content>
          <div className="text-muted-foreground mb-4">
            <Icon name="document" className="w-16 h-16 mx-auto" />
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
          <div className="text-muted-foreground mb-4">
            <Icon name="search" className="w-16 h-16 mx-auto" />
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
    <TagsProvider documents={[...localDocuments as unknown as AnyDocument[], ...baseServerDocs as unknown as AnyDocument[]]}>
      <section className="space-y-3">
        {message && isMessageVisible && (
          <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg flex items-start justify-between gap-3">
            <p className="text-sm text-destructive flex-1">{message}</p>
            <button
              type="button"
              onClick={() => setIsMessageVisible(false)}
              aria-label="Fermer le message"
              className="text-destructive hover:opacity-80 shrink-0"
            >
              <Icon name="x" className="w-[18px] h-[18px]" />
            </button>
          </div>
        )}

        <ul className="grid gap-4 grid-cols-[repeat(auto-fit,minmax(300px,1fr))]">
          {filteredDocuments.map((document) => {
            // Un document est local s'il provient du localStorage (pas de user_id)
            // Un document est serveur s'il provient de la base de données (a un user_id)
            const isLocal = !('user_id' in document) || (document as LocalDocument).user_id === undefined;
            return (
              <li key={String(document.id)} className="w-full list-none">
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
                  onFavoriteChange={(docId, fav) => {
                    if (isFavoritesList && !fav) {
                      setRuntimeDocuments((prev) => prev.filter((d) => String(d.id) !== String(docId)));
                      setSelectedIds((prev) => prev.filter((id) => id !== String(docId)));
                    }
                  }}
                />
              </li>
            );
          })}
        </ul>
      </section>

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

