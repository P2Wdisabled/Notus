"use client";

import { useSearch } from "@/contexts/SearchContext";
import DocumentCard from "@/components/DocumentCard";
import { Card, Alert } from "@/components/ui";

export function SearchableDocumentsList({ documents, currentUserId, error }) {
  const { filterDocuments, isSearching } = useSearch();

  if (error) {
    return (
      <Alert variant="error">
        <Alert.Description>
          Erreur lors du chargement des documents: {error}
        </Alert.Description>
      </Alert>
    );
  }

  const filteredDocuments = filterDocuments(documents);

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
    <div className="grid gap-4 grid-cols-[repeat(auto-fit,minmax(300px,1fr))]">
      {filteredDocuments.map((document) => (
        <div key={document.id} className="w-full">
          <DocumentCard document={document} currentUserId={currentUserId} />
        </div>
      ))}
    </div>
  );
}
