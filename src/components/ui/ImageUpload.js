"use client";

import { useState, useRef } from "react";
import { Button } from "./Button";

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
}) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(value || null);
  const fileInputRef = useRef(null);

  const handleFileSelect = (file) => {
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
      const base64 = e.target.result;
      setPreviewUrl(base64);
      onChange(base64);
    };
    reader.readAsDataURL(file);
  };

  const handleFileInputChange = (e) => {
    const file = e.target.files?.[0];
    handleFileSelect(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);

    const file = e.dataTransfer.files?.[0];
    handleFileSelect(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
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

  return (
    <div className={`space-y-2 ${className}`}>
      <label className="block text-black dark:text-white text-xl font-title font-bold">
        {label}
      </label>

      <div
        className={`
          relative border-2 border-dashed rounded-lg p-6 text-center transition-colors
          ${
            isDragOver
              ? "border-orange dark:border-dark-purple bg-orange/10 dark:bg-dark-purple/10"
              : "border-gray dark:border-dark-gray hover:border-orange dark:hover:border-dark-purple"
          }
          ${error ? "border-red-500 dark:border-red-400" : ""}
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
                className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-sm hover:bg-red-600"
              >
                ×
              </button>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Cliquez pour changer l'image
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="w-12 h-12 mx-auto text-gray-400 dark:text-gray-500">
              <svg
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
            <p className="text-gray-600 dark:text-gray-400">
              Glissez-déposez une image ou cliquez pour sélectionner
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500">
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
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );
}
