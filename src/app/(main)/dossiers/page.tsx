"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import NavBar from "@/components/navigation/NavBar";
import ContentWrapper from "@/components/common/ContentWrapper";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui";
import Icon from "@/components/Icon";
import { useSession } from "next-auth/react";

interface Dossier {
  id: number;
  nom: string;
  created_at: string;
  updated_at: string;
  documentCount: number;
}

export default function DossiersPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [dossiers, setDossiers] = useState<Dossier[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newDossierName, setNewDossierName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    if (session?.user?.id) {
      loadDossiers();
    }
  }, [session]);

  const loadDossiers = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/dossiers");
      if (response.ok) {
        const data = await response.json();
        setDossiers(data.dossiers || []);
      }
    } catch (error) {
      console.error("Erreur lors du chargement des dossiers:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateDossier = async () => {
    if (!newDossierName.trim()) return;
    setIsCreating(true);
    try {
      const response = await fetch("/api/dossiers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nom: newDossierName.trim() }),
      });
      if (response.ok) {
        setShowCreateModal(false);
        setNewDossierName("");
        loadDossiers();
      } else {
        const data = await response.json();
        alert(data.error || "Erreur lors de la création du dossier");
      }
    } catch (error) {
      console.error("Erreur lors de la création du dossier:", error);
      alert("Erreur lors de la création du dossier");
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteDossier = async (id: number) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce dossier ?")) return;
    setDeletingId(id);
    try {
      const response = await fetch(`/api/dossiers/${id}`, {
        method: "DELETE",
      });
      if (response.ok) {
        loadDossiers();
      } else {
        const data = await response.json();
        alert(data.error || "Erreur lors de la suppression du dossier");
      }
    } catch (error) {
      console.error("Erreur lors de la suppression du dossier:", error);
      alert("Erreur lors de la suppression du dossier");
    } finally {
      setDeletingId(null);
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

  return (
    <main className="min-h-screen bg-background">
      <NavBar />
      <ContentWrapper maxWidth="lg">
        <section className="space-y-6">
          <header className="flex items-center justify-between">
            <h1 className="font-title text-4xl font-regular text-foreground hidden md:block">
              Dossiers
            </h1>
            <Button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2"
            >
              <Icon name="plus" className="w-5 h-5" />
              <span className="hidden md:inline">Créer un dossier</span>
            </Button>
          </header>

          {isLoading ? (
            <div className="text-center py-12">
              <Icon name="spinner" className="w-8 h-8 mx-auto animate-spin" />
              <p className="mt-4 text-muted-foreground">Chargement...</p>
            </div>
          ) : dossiers.length === 0 ? (
            <Card className="text-center py-12">
              <Card.Content>
                <div className="text-muted-foreground mb-4">
                  <Icon name="folder" className="w-16 h-16 mx-auto" />
                </div>
                <Card.Title className="text-lg mb-2">Aucun dossier</Card.Title>
                <Card.Description>
                  Créez votre premier dossier pour organiser vos documents
                </Card.Description>
              </Card.Content>
            </Card>
          ) : (
            <div className="grid gap-4 grid-cols-[repeat(auto-fill,minmax(250px,1fr))]">
              {dossiers.map((dossier) => (
                <Card
                  key={dossier.id}
                  className="cursor-pointer hover:bg-accent/50 transition-colors"
                  onClick={() => router.push(`/dossiers/${dossier.id}`)}
                >
                  <Card.Content className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <Icon name="folder" className="w-6 h-6 shrink-0" />
                        <h3 className="font-semibold text-foreground truncate">
                          {dossier.nom}
                        </h3>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteDossier(dossier.id);
                        }}
                        disabled={deletingId === dossier.id}
                        className="p-1 hover:bg-destructive/10 rounded shrink-0"
                        aria-label="Supprimer le dossier"
                      >
                        <Icon
                          name={deletingId === dossier.id ? "spinner" : "trash"}
                          className={`w-4 h-4 ${deletingId === dossier.id ? "animate-spin" : ""}`}
                        />
                      </button>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {dossier.documentCount} document{dossier.documentCount > 1 ? "s" : ""}
                    </p>
                  </Card.Content>
                </Card>
              ))}
            </div>
          )}
        </section>
      </ContentWrapper>

      {showCreateModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={() => setShowCreateModal(false)}
        >
          <div
            className="bg-background border border-border rounded-lg p-6 max-w-md w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold mb-4">Créer un dossier</h3>
            <input
              type="text"
              value={newDossierName}
              onChange={(e) => setNewDossierName(e.target.value)}
              placeholder="Nom du dossier"
              className="w-full p-2 border border-border rounded-md mb-4 bg-background"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleCreateDossier();
                }
              }}
              autoFocus
            />
            <div className="flex gap-2 justify-end">
              <Button variant="ghost" onClick={() => setShowCreateModal(false)}>
                Annuler
              </Button>
              <Button
                onClick={handleCreateDossier}
                disabled={!newDossierName.trim() || isCreating}
              >
                {isCreating ? "Création..." : "Créer"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

