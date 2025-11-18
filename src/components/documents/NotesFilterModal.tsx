"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import Modal from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import Icon from "@/components/Icon";
import { useSearch, type NoteFilters } from "@/contexts/SearchContext";
import { useTagsContext } from "@/contexts/TagsContext";

interface NotesFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface DossierOption {
  id: number;
  nom: string;
}

const sharedOptions: Array<{ value: NoteFilters["shared"] | undefined; label: string }> = [
  { value: undefined, label: "Toutes les notes" },
  { value: "shared", label: "Notes partagées" },
  { value: "private", label: "Notes privées" },
];

const normalizeFilters = (filters: NoteFilters): NoteFilters => ({
  ...filters,
  tags: Array.from(new Set((filters.tags || []).map((tag) => tag.trim()).filter(Boolean))),
});

export default function NotesFilterModal({ isOpen, onClose }: NotesFilterModalProps) {
  const { data: session } = useSession();
  const {
    filters,
    applyFilters,
    resetFilters,
    hasActiveFilters,
    defaultFilters,
  } = useSearch();
  const [localFilters, setLocalFilters] = useState<NoteFilters>(normalizeFilters(filters));
  const [dossiers, setDossiers] = useState<DossierOption[]>([]);
  const [isLoadingDossiers, setIsLoadingDossiers] = useState(false);
  const [dossiersError, setDossiersError] = useState<string | null>(null);
  const [hasLoadedDossiers, setHasLoadedDossiers] = useState(false);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [isLoadingTags, setIsLoadingTags] = useState(false);
  const [tagsError, setTagsError] = useState<string | null>(null);

  const isAuthenticated = Boolean(session?.user?.id);
  
  // Essayer d'utiliser le TagsContext d'abord, sinon récupérer via API
  const tagsContext = useTagsContext();
  const contextTags = tagsContext.getAllTags();

  useEffect(() => {
    if (isOpen) {
      setLocalFilters(normalizeFilters(filters));
      if (isAuthenticated && !hasLoadedDossiers && !isLoadingDossiers) {
        void fetchDossiers();
      }
      // Si on a des tags depuis le contexte, les utiliser, sinon récupérer via API
      if (contextTags.length > 0) {
        setAvailableTags(contextTags);
      } else if (isAuthenticated && availableTags.length === 0 && !isLoadingTags) {
        void fetchTags();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, filters, isAuthenticated, contextTags]);

  const fetchDossiers = async () => {
    if (!isAuthenticated) return;
    try {
      setIsLoadingDossiers(true);
      setDossiersError(null);
      const response = await fetch("/api/dossiers", { credentials: "include" });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        setDossiersError(data.error || "Impossible de charger les dossiers.");
        setDossiers([]);
        return;
      }
      const data = await response.json();
      setDossiers(Array.isArray(data.dossiers) ? data.dossiers : []);
      setHasLoadedDossiers(true);
    } catch (error) {
      setDossiersError("Impossible de charger les dossiers.");
    } finally {
      setIsLoadingDossiers(false);
    }
  };

  const fetchTags = async () => {
    if (!isAuthenticated) return;
    try {
      setIsLoadingTags(true);
      setTagsError(null);
      const response = await fetch("/api/tags", { credentials: "include" });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        setTagsError(data.error || "Impossible de charger les tags.");
        setAvailableTags([]);
        return;
      }
      const data = await response.json();
      setAvailableTags(Array.isArray(data.tags) ? data.tags : []);
    } catch (error) {
      setTagsError("Impossible de charger les tags.");
      setAvailableTags([]);
    } finally {
      setIsLoadingTags(false);
    }
  };

  const updateFilter = <K extends keyof NoteFilters>(key: K, value: NoteFilters[K]) => {
    setLocalFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleToggleTag = (tag: string) => {
    setLocalFilters((prev) => {
      const currentTags = prev.tags || [];
      return { ...prev, tags: currentTags.filter((t) => t !== tag) };
    });
  };

  const handleSelectTag = (tag: string) => {
    if (!tag || (localFilters.tags || []).includes(tag)) return;
    setLocalFilters((prev) => {
      return { ...prev, tags: [...(prev.tags || []), tag] };
    });
  };

  const availableTagsForSelect = useMemo(() => {
    const selectedTags = new Set(localFilters.tags || []);
    return availableTags.filter((tag) => !selectedTags.has(tag));
  }, [availableTags, localFilters.tags]);

  const handleApply = () => {
    applyFilters(normalizeFilters(localFilters));
    onClose();
  };

  const hasChanges = useMemo(() => {
    const normalizedLocal = JSON.stringify(normalizeFilters(localFilters));
    const normalizedGlobal = JSON.stringify(normalizeFilters(filters));
    return normalizedLocal !== normalizedGlobal;
  }, [localFilters, filters]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Filtrer mes notes"
      size="xl"
    >
      <div className="space-y-6">
        <section className="space-y-2">
          <h3 className="text-base font-semibold text-foreground">Date de mise à jour</h3>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="flex flex-col gap-1">
              <label htmlFor="filter-date-from" className="text-sm text-muted-foreground">À partir du</label>
              <Input
                id="filter-date-from"
                type="date"
                value={localFilters.dateFrom ?? ""}
                onChange={(e) => updateFilter("dateFrom", e.target.value || undefined)}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="filter-date-to" className="text-sm text-muted-foreground">Jusqu&apos;au</label>
              <Input
                id="filter-date-to"
                type="date"
                value={localFilters.dateTo ?? ""}
                onChange={(e) => updateFilter("dateTo", e.target.value || undefined)}
              />
            </div>
          </div>
        </section>

        <section className="space-y-2">
          <h3 className="text-base font-semibold text-foreground">Auteur</h3>
          <Input
            placeholder="Nom, prénom ou pseudo"
            value={localFilters.author ?? ""}
            onChange={(e) => updateFilter("author", e.target.value || undefined)}
          />
        </section>

        <section className="space-y-2">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="flex flex-col gap-1">
              <h3 className="text-base font-semibold text-foreground">Partage</h3>
              <select
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={localFilters.shared ?? ""}
                onChange={(e) => updateFilter("shared", e.target.value ? (e.target.value as NoteFilters["shared"]) : undefined)}
                disabled={!isAuthenticated}
              >
                {sharedOptions.map((option) => (
                  <option key={option.label} value={option.value ?? ""}>
                    {option.label}{!isAuthenticated && option.value ? " (connexion requise)" : ""}
                  </option>
                ))}
              </select>
              {!isAuthenticated && (
                <p className="text-xs text-muted-foreground">Connectez-vous pour filtrer par statut de partage.</p>
              )}
            </div>
            <div className="flex flex-col gap-1">
              <h3 className="text-base font-semibold text-foreground">Dossier</h3>
              <select
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={localFilters.dossierId ?? ""}
                onChange={(e) => {
                  const value = e.target.value;
                  updateFilter("dossierId", value ? Number(value) : undefined);
                }}
                disabled={!isAuthenticated || isLoadingDossiers}
              >
                <option value="">Tous les dossiers</option>
                {dossiers.map((dossier) => (
                  <option key={dossier.id} value={dossier.id}>
                    {dossier.nom}
                  </option>
                ))}
              </select>
              {dossiersError && (
                <p className="text-xs text-destructive">{dossiersError}</p>
              )}
            </div>
          </div>
        </section>

        <section className="space-y-3">
          <h3 className="text-base font-semibold text-foreground">Tags</h3>
          {isAuthenticated && (
            <>
              {(localFilters.tags || []).length > 0 && (
                <div className="flex flex-wrap gap-2 p-3 bg-primary/5 border border-primary/20 rounded-md">
                  {(localFilters.tags || []).map((tag) => (
                    <Badge
                      key={tag}
                      variant="purple"
                      className="flex items-center gap-1.5"
                    >
                      <span>{tag}</span>
                      <button
                        type="button"
                        onClick={() => handleToggleTag(tag)}
                        className="rounded-full p-0.5 hover:bg-primary/20 transition-colors"
                        aria-label={`Retirer le tag ${tag}`}
                      >
                        <Icon name="x" className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
              {isLoadingTags ? (
                <div className="text-sm text-muted-foreground py-4 text-center">
                  <Icon name="spinner" className="w-5 h-5 animate-spin inline-block mr-2" />
                  Chargement des tags...
                </div>
              ) : tagsError ? (
                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                  <p className="text-xs text-destructive">{tagsError}</p>
                </div>
              ) : availableTagsForSelect.length === 0 ? (
                <div className="p-3 border border-border rounded-md bg-muted/30">
                  <p className="text-sm text-muted-foreground">
                    {availableTags.length === 0
                      ? "Aucun tag disponible."
                      : "Tous les tags sont déjà sélectionnés."}
                  </p>
                </div>
              ) : (
                <select
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value=""
                  onChange={(e) => {
                    const selectedTag = e.target.value;
                    if (selectedTag) {
                      handleSelectTag(selectedTag);
                      e.target.value = "";
                    }
                  }}
                >
                  <option value="">Sélectionner un tag...</option>
                  {availableTagsForSelect.map((tag) => (
                    <option key={tag} value={tag}>
                      {tag}
                    </option>
                  ))}
                </select>
              )}
            </>
          )}
          {!isAuthenticated && (
            <div className="p-3 bg-muted/30 border border-border rounded-md">
              <p className="text-xs text-muted-foreground">Connectez-vous pour filtrer par tags.</p>
            </div>
          )}
        </section>

        <div className="flex flex-col gap-3 border-t border-border pt-4 md:flex-row md:items-center md:justify-between flex-shrink-0">
          <div className="text-sm text-muted-foreground">
            {hasActiveFilters ? "Des filtres sont appliqués." : "Aucun filtre appliqué."}
          </div>
          <div className="flex flex-col gap-2 md:flex-row">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                resetFilters();
                setLocalFilters(normalizeFilters(defaultFilters));
              }}
            >
              Réinitialiser
            </Button>
            <Button type="button" variant="primary" onClick={handleApply} disabled={!hasChanges && !hasActiveFilters}>
              Appliquer les filtres
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}


