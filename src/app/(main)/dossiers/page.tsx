"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import NavBar from "@/components/navigation/NavBar";
import ContentWrapper from "@/components/common/ContentWrapper";
import { Button } from "@/components/ui/button";
import { Card, Modal, Input } from "@/components/ui";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui";
import Icon from "@/components/Icon";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";

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
          <header className="flex items-center md:justify-between justify-start mb-4 gap-2 flex-wrap">
            <div>
              <h1 className="font-title text-4xl font-regular text-[var(--foreground)] hidden md:block mb-2">
                Dossiers
              </h1>
              <p className="text-sm text-[var(--muted-foreground)] hidden md:block">
                Organisez vos documents en dossiers
              </p>
            </div>
            <Button
              onClick={() => setShowCreateModal(true)}
              variant="primary"
              className="flex items-center gap-2"
            >
              <Icon name="plus" className="w-5 h-5" />
              <span className="">Créer un dossier</span>
            </Button>
          </header>

          {isLoading ? (
            <div className="text-center py-16">
              <Icon name="spinner" className="w-10 h-10 mx-auto animate-spin text-[var(--primary)]" />
              <p className="mt-4 text-[var(--muted-foreground)]">Chargement des dossiers...</p>
            </div>
          ) : dossiers.length === 0 ? (
            <Card className="text-center py-16">
              <Card.Content>
                <div className="text-[var(--muted-foreground)] mb-6">
                  <Icon name="folder" className="w-20 h-20 mx-auto opacity-50" />
                </div>
                <Card.Title className="text-xl mb-3 font-semibold">Aucun dossier</Card.Title>
                <Card.Description className="mb-6">
                  Créez votre premier dossier pour organiser vos documents
                </Card.Description>
                <Button
                  onClick={() => setShowCreateModal(true)}
                  className="flex items-center gap-2 mx-auto"
                >
                  <Icon name="plus" className="w-5 h-5" />
                  <span>Créer un dossier</span>
                </Button>
              </Card.Content>
            </Card>
          ) : (
            <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {dossiers.map((dossier) => {
                const formatDate = (dateString: string) => {
                  const date = new Date(dateString);
                  const day = String(date.getDate()).padStart(2, "0");
                  const month = String(date.getMonth() + 1).padStart(2, "0");
                  const year = date.getFullYear();
                  return `${day}/${month}/${year}`;
                };

                return (
                  <Card
                    key={dossier.id}
                    className={cn(
                      "group cursor-pointer overflow-hidden",
                      "bg-[var(--card)] border border-[var(--border)]",
                      "hover:shadow-lg",
                      "transition-all duration-200 ease-in-out"
                    )}
                    onClick={() => router.push(`/dossiers/${dossier.id}`)}
                  >
                    <Card.Content className="">
                      {/* Header avec icône et menu */}
                      <div className="flex items-start justify-between mb-6">
                        {/* Icône de dossier en haut à gauche */}
                        <div className={cn(
                          "flex items-center justify-center",
                          "w-14 h-14 rounded-xl",
                          "bg-[var(--primary)]/10 text-[var(--primary)]",
                          "shrink-0"
                        )}>
                          <Icon name="folder" className="w-8 h-8 block" />
                        </div>
                        {/* Menu trois points en haut à droite */}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button
                              onClick={(e) => e.stopPropagation()}
                              className={cn(
                                "p-2 rounded-md shrink-0",
                                "text-[var(--muted-foreground)]",
                                "hover:bg-[var(--muted)]",
                                "transition-colors duration-200",
                              )}
                              aria-label="Options du dossier"
                            >
                              <Icon name="dotsVertical" className="w-5 h-5" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                            <DropdownMenuItem
                              variant="destructive"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteDossier(dossier.id);
                              }}
                              disabled={deletingId === dossier.id}
                            >
                              {deletingId === dossier.id ? (
                                <>
                                  <Icon name="spinner" className="w-4 h-4 animate-spin" />
                                  Suppression...
                                </>
                              ) : (
                                <>
                                  <Icon name="trash" className="w-4 h-4" />
                                  Supprimer
                                </>
                              )}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      {/* Nom du dossier au centre */}
                      <h3 className="font-bold text-[var(--foreground)] text-xl mb-6 line-clamp-2">
                        {dossier.nom}
                      </h3>

                      {/* Footer avec nombre de notes et date */}
                      <div className="flex items-center justify-between text-sm text-[var(--muted-foreground)]">
                        <span>
                          {dossier.documentCount} note{dossier.documentCount > 1 ? "s" : ""}
                        </span>
                        <span>
                          {formatDate(dossier.updated_at)}
                        </span>
                      </div>
                    </Card.Content>
                  </Card>
                );
              })}
            </div>
          )}
        </section>
      </ContentWrapper>

      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setNewDossierName("");
        }}
        title="Créer un dossier"
        size="md"
      >
        <Modal.Content>
          <div className="space-y-4">
            <Input
              label="Nom du dossier"
              type="text"
              value={newDossierName}
              onChange={(e) => setNewDossierName(e.target.value)}
              placeholder="Ex: Projets, Notes personnelles..."
              onKeyDown={(e) => {
                if (e.key === "Enter" && newDossierName.trim() && !isCreating) {
                  handleCreateDossier();
                }
              }}
              autoFocus
            />
          </div>
        </Modal.Content>
        <Modal.Footer>
          <div className="flex gap-2 justify-end w-full">
            <Button
              variant="ghost"
              onClick={() => {
                setShowCreateModal(false);
                setNewDossierName("");
              }}
            >
              Annuler
            </Button>
            <Button
              onClick={handleCreateDossier}
              disabled={!newDossierName.trim() || isCreating}
              variant="primary"
            >
              <Icon name="plus" className="w-4 h-4" />
              Créer
            </Button>
          </div>
        </Modal.Footer>
      </Modal>

    </main>
  );
}

