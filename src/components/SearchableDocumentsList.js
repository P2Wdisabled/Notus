"use client";

import { useState, useEffect } from "react";
import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { useSearch } from "@/contexts/SearchContext";
import { deleteMultipleDocumentsAction } from "@/lib/actions";
import DocumentCard from "@/components/DocumentCard";
import { Card, Alert, Button } from "@/components/ui";

const LOCAL_DOCS_KEY = "notus.local.documents";

export function SearchableDocumentsList({
  documents: serverDocuments = [],
  currentUserId,
  error,
}) {
  const { filterDocuments, filterLocalDocuments, isSearching } = useSearch();
  const router = useRouter();
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

  // Recharger la page après une suppression réussie
  useEffect(() => {
    if (message && !isPending && !message.includes("Erreur")) {
      // Attendre un peu pour que l'utilisateur voie le message de succès
      const timer = setTimeout(() => {
        router.refresh();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [message, isPending, router]);

  // Fusionner les documents locaux et serveur
  // Les documents locaux en premier, puis les documents serveur
  const documents = [...localDocuments, ...serverDocuments];

  // Fonctions de gestion de la sélection
  const toggleSelect = (id, checked) => {
    setSelectedIds((prev) => {
      const set = new Set(prev);
      if (checked) set.add(id);
      else set.delete(id);
      return Array.from(set);
    });
  };

  const toggleAll = () => {
    if (selectedIds.length === filteredDocuments.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredDocuments.map((d) => d.id));
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
        const updated = parsed.filter(
          (doc) => !localIdsToDelete.includes(doc.id)
        );
        localStorage.setItem(LOCAL_DOCS_KEY, JSON.stringify(updated));
        setLocalDocuments(updated);
      } catch (e) {
        console.error("Erreur lors de la suppression locale:", e);
      }
    }

    // Supprimer les documents serveur via l'action
    if (currentUserId && serverIdsToDelete.length > 0) {
      formData.append("userId", String(currentUserId));
      serverIdsToDelete.forEach((id) =>
        formData.append("documentIds", String(id))
      );
      formAction(formData);
    }

    // Optimistic UI
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
  const filteredDocuments = isSearching
    ? [
        ...filterLocalDocuments(localDocuments),
        ...filterDocuments(serverDocuments),
      ]
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
    <>
      <div className="space-y-3">
        {message && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-600 dark:text-red-400">{message}</p>
          </div>
        )}

        <div className="grid gap-4 grid-cols-[repeat(auto-fit,minmax(300px,1fr))]">
          {filteredDocuments.map((document) => {
            // Un document est local s'il provient du localStorage (pas de user_id)
            // Un document est serveur s'il provient de la base de données (a un user_id)
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
        <div className={`fixed left-0 right-0 z-50 bg-white dark:bg-black px-4  md:ml-64 ${!currentUserId ? 'bottom-12' : 'bottom-0'}`}>
          <div className="max-w-4xl mx-auto flex items-center justify-between py-3 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {selectedIds.length} document(s) sélectionné(s)
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleAll}
                className="text-blue-600 dark:text-blue-400"
              >
                {selectedIds.length === filteredDocuments.length
                  ? "Tout désélectionner"
                  : "Tout sélectionner"}
              </Button>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectMode(false);
                  setSelectedIds([]);
                }}
                className="text-gray-600 dark:text-gray-400"
              >
                Annuler
              </Button>
              <form action={handleBulkDelete}>
                <Button
                  type="submit"
                  variant="destructive"
                  size="sm"
                  disabled={selectedIds.length === 0 || isPending}
                >
                  {isPending
                    ? "Suppression..."
                    : `Supprimer (${selectedIds.length})`}
                </Button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
