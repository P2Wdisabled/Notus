"use client";

import * as React from "react";
import { useState, useRef } from "react";
import Image  from "next/image";
import Icon from "@/components/Icon";

export interface ImageUploadProps {
  label?: string;
  value?: string | null;
  onChange: (value: string | null) => void;
  error?: string;
  className?: string;
  accept?: string;
  maxSize?: number;
  preview?: boolean;
  recommendedSize?: string | null;
  variant?: "dropzone" | "input";
}

export default function ImageUpload({
  label,
  value,
  onChange,
  error,
  className = "",
  accept = "image/jpeg,image/jpg,image/png,image/gif",
  maxSize = 10 * 1024 * 1024, // 10MB
  preview = true,
  recommendedSize = null,
  variant = "dropzone",
}: ImageUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(value || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (file: File | null | undefined) => {
    if (!file) return;

    // Vérifier la taille du fichier
    if (file.size > maxSize) {
      alert(
        `Le fichier est trop volumineux. Taille maximale : ${Math.round(
          maxSize / 1024 / 1024
        )}MB`
      );
      return;
    }

    // Vérifier le type de fichier
    if (!file.type.startsWith("image/")) {
      alert("Veuillez sélectionner un fichier image valide");
      return;
    }

    // Convertir en base64
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      setPreviewUrl(base64);
      onChange(base64);
    };
    reader.readAsDataURL(file);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    handleFileSelect(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);

    const file = e.dataTransfer.files?.[0];
    handleFileSelect(file);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleRemove = () => {
    setPreviewUrl(null);
    onChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const sizeInMb = Math.round(maxSize / 1024 / 1024);

  // Input-like variant (compact, similar to text input with pencil icon)
  if (variant === "input") {
    return (
      <div className={`space-y-2 ${className}`}>
        <label className="block text-foreground text-xl font-title font-bold">
          {label}
        </label>
        <div
          className={`relative w-full px-3 py-2 border rounded-lg transition-colors bg-background text-foreground ${
            error
              ? "border-destructive focus-within:ring-destructive"
              : "border-border"
          } focus-within:outline-none focus-within:ring-2 focus-within:ring-ring focus-within:border-transparent`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={handleClick}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              handleClick();
            }
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={accept}
            onChange={handleFileInputChange}
            className="hidden"
          />

          <div className="flex items-center justify-between select-none">
            <div className="text-muted-foreground text-sm">
              {previewUrl
                ? "Image sélectionnée — cliquez pour changer"
                : `JPEG, PNG, GIF et moins de ${sizeInMb}MB`}
            </div>
            <div className="text-muted-foreground">
              <Icon name="pencil" className="w-4 h-4" />
            </div>
          </div>
        </div>
        {recommendedSize && (
          <p className="text-sm text-muted-foreground">
            Format recommandé : {recommendedSize}
          </p>
        )}
        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}
      </div>
    );
  }

  // Default: dropzone variant
  return (
    <div className={`space-y-2 ${className}`}>
      <label className="block text-foreground text-xl font-title font-bold">
        {label}
      </label>

      <div
        className={`
          relative border-2 border-dashed rounded-lg p-6 text-center transition-colors
          ${
            isDragOver
              ? "border-primary bg-primary/10"
              : "border-border hover:border-primary"
          }
          ${error ? "border-destructive" : ""}
        `}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={handleClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={handleFileInputChange}
          className="hidden"
        />

        {previewUrl ? (
          <div className="space-y-4">
            <div className="relative inline-block">
              <img
                src={previewUrl}
                alt="Aperçu"
                className="max-w-full max-h-48 rounded-lg object-cover"
              />
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemove();
                }}
                className="absolute -top-2 -right-2 w-6 h-6 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center text-sm hover:bg-destructive/90"
              >
                ×
              </button>
            </div>
            <p className="text-sm text-muted-foreground">
              Cliquez pour changer l'image
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="w-12 h-12 mx-auto text-muted-foreground">
              <Icon name="image" className="w-12 h-12" />
            </div>
            <p className="text-muted-foreground">
              Glissez-déposez une image ou cliquez pour sélectionner
            </p>
            <p className="text-sm text-muted-foreground">
              JPEG, PNG, GIF (max {Math.round(maxSize / 1024 / 1024)}MB)
              {recommendedSize && (
                <span className="block text-xs mt-1">
                  Recommandé : {recommendedSize}
                </span>
              )}
            </p>
          </div>
        )}
      </div>

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  );
}

