"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import Icon from "@/components/Icon";

interface SelectionBarProps {
  selectedCount: number;
  totalCount: number;
  isPending: boolean;
  onCancel: () => void;
  onToggleAll: () => void;
  onBulkDelete: (formData: FormData) => void;
  onAddToDossier?: (dossierId: number, documentIds: string[]) => void;
  onRemoveFromDossier?: (documentIds: string[]) => void;
  selectedDocumentIds: string[];
  currentUserId?: string | number | null;
}

export default function SelectionBar({
  selectedCount,
  totalCount,
  isPending,
  onCancel,
  onToggleAll,
  onBulkDelete,
  onAddToDossier,
  onRemoveFromDossier,
  selectedDocumentIds,
  currentUserId,
}: SelectionBarProps) {
  const isAllSelected = selectedCount === totalCount;
  const [showDossierModal, setShowDossierModal] = useState(false);
  const [selectedDossierId, setSelectedDossierId] = useState<string>("");
  const [dossiers, setDossiers] = useState<Array<{ id: number; nom: string }>>([]);
  const [isLoadingDossiers, setIsLoadingDossiers] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  const handleAddToDossierClick = async () => {
    if (!onAddToDossier) return;
    setIsLoadingDossiers(true);
    try {
      const response = await fetch("/api/dossiers");
      if (response.ok) {
        const data = await response.json();
        setDossiers(data.dossiers || []);
        setShowDossierModal(true);
      }
    } catch (error) {
      console.error("Erreur lors du chargement des dossiers:", error);
    } finally {
      setIsLoadingDossiers(false);
    }
  };

  const handleConfirmAddToDossier = async () => {
    if (!selectedDossierId || !onAddToDossier || selectedDocumentIds.length === 0) return;
    setIsAdding(true);
    try {
      const dossierId = parseInt(selectedDossierId);
      await onAddToDossier(dossierId, selectedDocumentIds);
      setShowDossierModal(false);
      setSelectedDossierId("");
    } catch (error) {
      console.error("Erreur lors de l'ajout au dossier:", error);
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <>
      <aside className="fixed left-0 right-0 z-20 px-0 md:ml-68 md:px-4 bottom-0 mb-0" role="region" aria-label="Barre de sélection">
        <div className="max-w-4xl mx-auto px-4 md:px-6 lg:px-8 py-3 bg-background text-foreground border-t border-border">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Button onClick={onCancel} variant="ghost" size="icon" aria-label="Annuler la sélection">
                <Icon name="x" className="w-6 h-6" />
              </Button>
              <span className="text-sm text-foreground font-medium hidden md:inline">
                {selectedCount} note{selectedCount > 1 ? 's' : ''}
              </span>
              <span className="text-sm text-foreground font-medium md:hidden">{selectedCount}</span>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={onToggleAll} variant="ghost" size="sm" className="flex items-center gap-2 p-3 py-1.5 rounded-full font-title text-lg" aria-label={isAllSelected ? "Tout désélectionner" : "Tout sélectionner"}>
                {isAllSelected ? "Tout désélectionner" : "Tout sélectionner"}
              </Button>
              {onRemoveFromDossier ? (
                <Button 
                  onClick={async () => {
                    if (selectedDocumentIds.length > 0) {
                      await onRemoveFromDossier(selectedDocumentIds);
                    }
                  }}
                  disabled={isPending || selectedCount === 0} 
                  variant="default" 
                  className="flex items-center gap-2 p-3 lg:py-1.5 rounded-full font-medium" 
                  aria-label="Retirer du dossier"
                >
                  <Icon name="folder" className="w-5 h-5" />
                  <span className="hidden lg:inline">{isPending ? "Retrait..." : "Retirer du dossier"}</span>
                </Button>
              ) : onAddToDossier && currentUserId ? (
                <Button 
                  onClick={handleAddToDossierClick} 
                  disabled={isLoadingDossiers || selectedCount === 0} 
                  variant="default" 
                  className="flex items-center gap-2 p-3 lg:py-1.5 rounded-full font-medium" 
                  aria-label="Ajouter au dossier"
                >
                  <Icon name="folder" className="w-5 h-5" />
                  <span className="hidden lg:inline">{isLoadingDossiers ? "Chargement..." : "Ajouter au dossier"}</span>
                </Button>
              ) : null}
              <form action={onBulkDelete} className="flex items-center">
                <Button type="submit" disabled={isPending || selectedCount === 0} variant="destructive" className="flex items-center gap-2 p-3 lg:py-1.5 rounded-full font-medium" aria-label="Supprimer les notes sélectionnées">
                  <Icon name="trash" className="w-5 h-5" />
                  <span className="hidden lg:inline">{isPending ? "Suppression..." : "Supprimer"}</span>
                </Button>
              </form>
            </div>
          </div>
        </div>
      </aside>
      {showDossierModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowDossierModal(false)}>
          <div className="bg-background border border-border rounded-lg p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-4">Sélectionner un dossier</h3>
            {dossiers.length === 0 ? (
              <p className="text-muted-foreground mb-4">Aucun dossier disponible. Créez-en un d'abord.</p>
            ) : (
              <select
                value={selectedDossierId}
                onChange={(e) => setSelectedDossierId(e.target.value)}
                className="w-full p-2 border border-border rounded-md mb-4 bg-background"
              >
                <option value="">Sélectionner un dossier</option>
                {dossiers.map((dossier) => (
                  <option key={dossier.id} value={String(dossier.id)}>
                    {dossier.nom}
                  </option>
                ))}
              </select>
            )}
            <div className="flex gap-2 justify-end">
              <Button variant="ghost" onClick={() => setShowDossierModal(false)}>
                Annuler
              </Button>
              <Button 
                onClick={handleConfirmAddToDossier} 
                disabled={!selectedDossierId || isAdding}
                variant="default"
              >
                {isAdding ? "Ajout..." : "Ajouter"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}


