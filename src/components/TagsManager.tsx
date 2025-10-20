"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface TagsManagerProps {
  tags: string[];
  onTagsChange: (tags: string[]) => void;
  placeholder?: string;
  maxTags?: number;
  className?: string;
  disabled?: boolean;
}

export default function TagsManager({
  tags,
  onTagsChange,
  placeholder = "Ajouter un tag...",
  maxTags = 20,
  className = "",
  disabled = false,
}: TagsManagerProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newTag, setNewTag] = useState("");
  const [isValid, setIsValid] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Focus sur l'input quand on commence à ajouter
  useEffect(() => {
    if (isAdding && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isAdding]);

  // Validation du tag
  useEffect(() => {
    const trimmedTag = newTag.trim();
    const isValidTag = 
      trimmedTag.length > 0 && 
      trimmedTag.length <= 50 && 
      !tags.includes(trimmedTag) &&
      tags.length < maxTags;
    setIsValid(isValidTag);
  }, [newTag, tags, maxTags]);

  const addTag = () => {
    if (disabled) return;
    const trimmedTag = newTag.trim();
    if (isValid && trimmedTag) {
      onTagsChange([...tags, trimmedTag]);
      setNewTag("");
      setIsAdding(false);
    }
  };

  const removeTag = (tagToRemove: string) => {
    if (disabled) return;
    onTagsChange(tags.filter(tag => tag !== tagToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && isValid) {
      e.preventDefault();
      addTag();
    } else if (e.key === "Escape") {
      setIsAdding(false);
      setNewTag("");
    }
  };

  const startAdding = () => {
    if (disabled) return;
    setIsAdding(true);
  };

  const cancelAdding = () => {
    setIsAdding(false);
    setNewTag("");
  };

  return (
    <div className={`w-full scroller ${className} ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
      <div
        ref={scrollContainerRef}
        className="flex items-center gap-2 px-1 overflow-x-auto scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent pb-1 max-w-full"
        style={{
          scrollbarWidth: "thin",
          scrollbarColor: "hsl(var(--border)) transparent",
        }}
      >
        {/* Input d'ajout à gauche */}
        {isAdding && (
          <div className="flex items-center gap-1 flex-shrink-0">
            <Input
              ref={inputRef}
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              placeholder={placeholder}
              className={`h-7 text-sm w-32 ${
                !isValid ? "border-none" : ""
              }`}
              onKeyDown={handleKeyDown}
            />
            <Button
              variant="primary"
              size="icon-sm"
              onClick={addTag}
              disabled={!isValid}
              className="bg-primary hover:bg-primary/90 disabled:opacity-50"
              aria-label="Confirmer l'ajout du tag"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={cancelAdding}
              className="text-muted-foreground hover:text-foreground"
              aria-label="Annuler l'ajout du tag"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </Button>
          </div>
        )}

        {/* Bouton d'ajout à gauche */}
        {!isAdding && (
          <Button
            variant="secondary"
            size="icon-sm"
            onClick={startAdding}
            className="flex-shrink-0 bg-primary/10 hover:bg-primary/20 text-primary border-primary/20"
            aria-label="Ajouter un tag"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
          </Button>
        )}

        {/* Tags existants */}
        {tags.map((tag) => (
          <Badge
            key={tag}
            variant="purple"
            size="md"
            className="flex-shrink-0 pr-1 group"
          >
            <span 
              className="mr-1 max-w-[200px] truncate" 
              title={tag}
            >
              {tag}
            </span>
            <button
              type="button"
              className="ml-1 inline-flex items-center justify-center w-5 h-5 rounded-md text-accent hover:bg-accent/20 transition-colors"
              aria-label={`Supprimer le tag ${tag}`}
              onClick={() => removeTag(tag)}
            >
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </Badge>
        ))}
      </div>

      {/* Message d'erreur si nécessaire */}
      {isAdding && !isValid && newTag.trim() && (
        <div className="mt-1 text-xs text-destructive">
          {tags.length >= maxTags
            ? `Maximum ${maxTags} tags autorisés`
            : tags.includes(newTag.trim())
            ? "Ce tag existe déjà"
            : "Tag trop long (max 50 caractères)"}
        </div>
      )}
    </div>
  );
}
