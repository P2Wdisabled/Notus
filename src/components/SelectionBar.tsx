"use client";

import { Button } from "@/components/ui/button";

interface SelectionBarProps {
  selectedCount: number;
  totalCount: number;
  isPending: boolean;
  onCancel: () => void;
  onToggleAll: () => void;
  onBulkDelete: (formData: FormData) => void;
  currentUserId?: string | number | null;
}

export default function SelectionBar({
  selectedCount,
  totalCount,
  isPending,
  onCancel,
  onToggleAll,
  onBulkDelete,
  currentUserId,
}: SelectionBarProps) {
  const isAllSelected = selectedCount === totalCount;

  return (
    <div className="fixed left-0 right-0 z-20 px-0 md:ml-68 md:px-4 bottom-0 mb-0">
      <div className="max-w-4xl mx-auto px-4 md:px-6 lg:px-8 py-3 bg-background text-foreground border-t border-border">
        <div className="flex items-center justify-between gap-4">
          {/* Section gauche : Annuler + Compteur */}
          <div className="flex items-center gap-2">
            <Button
              onClick={onCancel}
              variant="ghost"
              size="icon"
              aria-label="Annuler la sélection"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </Button>
            <span className="text-sm text-gray-700 dark:text-gray-300 font-medium hidden md:inline">
              {selectedCount} note{selectedCount > 1 ? 's' : ''} sélectionnée{selectedCount > 1 ? 's' : ''}
            </span>
            <span className="text-sm text-gray-700 dark:text-gray-300 font-medium md:hidden">
              {selectedCount}
            </span>
          </div>

          {/* Section droite : Actions */}
          <div className="flex items-center gap-2">
            {/* Bouton Tout sélectionner/désélectionner */}
            <Button
              onClick={onToggleAll}
              variant="ghost"
              size="sm"
              className="flex items-center gap-2 p-3 md:py-1.5 rounded-full font-title text-lg"
              aria-label={isAllSelected ? "Tout désélectionner" : "Tout sélectionner"}
            >
              {isAllSelected ? "Tout désélectionner" : "Tout sélectionner"}
            </Button>

            {/* Bouton Supprimer */}
            <form action={onBulkDelete} className="flex items-center">
              <Button
                type="submit"
                disabled={isPending || selectedCount === 0}
                variant="destructive"
                className="flex items-center gap-2 p-3 md:py-1.5 rounded-full font-medium"
                aria-label="Supprimer les notes sélectionnées"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                <span className="hidden md:inline">{isPending ? "Suppression..." : "Supprimer"}</span>
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
