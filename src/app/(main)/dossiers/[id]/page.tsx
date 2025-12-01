"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import NavBar from "@/components/navigation/NavBar";
import ContentWrapper from "@/components/common/ContentWrapper";
import { Button } from "@/components/ui/button";
import { Card, Alert, BackHeader } from "@/components/ui";
import Icon from "@/components/Icon";
import { useSession } from "next-auth/react";
import { SearchableDocumentsList } from "@/components/documents/SearchableDocumentsList";
import Link from "next/link";

interface Document {
  id: number;
  title: string;
  content: string;
  tags: string[];
  favori: boolean | null;
  created_at: string;
  updated_at: string;
}

interface DossierData {
  id: number;
  nom: string;
  created_at: string;
  updated_at: string;
  documents: Document[];
}

export default function DossierDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { data: session } = useSession();
  const [dossier, setDossier] = useState<DossierData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [removingIds, setRemovingIds] = useState<Set<number>>(new Set());

  const dossierId = params?.id ? parseInt(String(params.id)) : null;

  useEffect(() => {
    if (session?.user?.id && dossierId) {
      loadDossier();
    }
  }, [session, dossierId]);

  const loadDossier = async () => {
    if (!dossierId) return;
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/dossiers/${dossierId}`);
      if (response.ok) {
        const data = await response.json();
        setDossier(data.dossier);
      } else {
        const data = await response.json();
        setError(data.error || "Erreur lors du chargement du dossier");
      }
    } catch (error) {
      console.error("Erreur lors du chargement du dossier:", error);
      setError("Erreur lors du chargement du dossier");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveDocuments = async (documentIds: string[]) => {
    if (!dossierId) return;
    const ids = documentIds.map((id) => parseInt(id)).filter((id) => !isNaN(id));
    setRemovingIds(new Set(ids));
    try {
      const response = await fetch(`/api/dossiers/${dossierId}/documents`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentIds }),
      });
      if (response.ok) {
        loadDossier();
      } else {
        const data = await response.json();
        alert(data.error || "Erreur lors du retrait des documents");
      }
    } catch (error) {
      console.error("Erreur lors du retrait des documents:", error);
      alert("Erreur lors du retrait des documents");
    } finally {
      setRemovingIds(new Set());
    }
  };

  if (!session?.user) {
    return (
      <main className="min-h-screen bg-background">
        <NavBar />
        <ContentWrapper maxWidth="lg">
          <p>Vous devez être connecté pour accéder aux dossiers.</p>
        </ContentWrapper>
      </main>
    );
  }

  if (isLoading) {
    return (
      <main className="min-h-screen bg-background">
        <NavBar />
        <ContentWrapper maxWidth="lg">
          <div className="text-center py-12">
            <Icon name="spinner" className="w-8 h-8 mx-auto animate-spin" />
            <p className="mt-4 text-muted-foreground">Chargement...</p>
          </div>
        </ContentWrapper>
      </main>
    );
  }

  if (error || !dossier) {
    return (
      <main className="min-h-screen bg-background">
        <NavBar />
        <ContentWrapper maxWidth="lg">
          <Alert variant="error">
            <Alert.Description>{error || "Dossier non trouvé"}</Alert.Description>
          </Alert>
          <div className="mt-4">
            <Link href="/dossiers">
              <Button variant="ghost">Retour aux dossiers</Button>
            </Link>
          </div>
        </ContentWrapper>
      </main>
    );
  }

  const documents = dossier.documents.map((doc) => ({
    ...doc,
    id: String(doc.id),
    user_id: session.user?.id ? String(session.user.id) : undefined,
    dossierIds: [dossier.id],
  }));

  return (
    <main className="min-h-screen bg-background">
      <NavBar />
      <ContentWrapper maxWidth="lg">
        <section className="space-y-6">
          <div className="hidden md:block mb-4">
            <BackHeader href="/dossiers" title={dossier.nom} />
          </div>
          <header className="md:hidden flex items-center gap-3 mb-4">
            <Link href="/dossiers" className="text-foreground font-semibold flex items-center" aria-label="Retour">
              <Icon name="arrowLeft" className="h-6 w-6 mr-2" />
            </Link>
            <div>
              <h1 className="font-title text-2xl font-regular text-foreground">
                {dossier.nom}
              </h1>
            </div>
          </header>
          <p className="text-sm text-muted-foreground -mt-2 md:mt-0">
            {dossier.documents.length} note{dossier.documents.length > 1 ? "s" : ""} dans ce dossier
          </p>

          {dossier.documents.length === 0 ? (
            <Card className="text-center py-12">
              <Card.Content>
                <div className="text-muted-foreground mb-4">
                  <Icon name="document" className="w-16 h-16 mx-auto" />
                </div>
                <Card.Title className="text-lg mb-2">Aucun document</Card.Title>
                <Card.Description>
                  Ce dossier est vide. Ajoutez des documents depuis la page des notes.
                </Card.Description>
              </Card.Content>
            </Card>
          ) : (
            <SearchableDocumentsList
              documents={documents}
              currentUserId={session.user.id ? String(session.user.id) : undefined}
              onRemoveFromDossier={handleRemoveDocuments}
            />
          )}
        </section>
      </ContentWrapper>
    </main>
  );
}

