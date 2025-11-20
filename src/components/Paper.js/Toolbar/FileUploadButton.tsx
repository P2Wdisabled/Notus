"use client";

import { useRef, useState } from "react";
import Icon from "@/components/Icon";

export interface UploadedFileData {
  dataUrl: string;
  name: string;
  type: string;
  size: number;
}

interface FileUploadButtonProps {
  onFileSelect: (file: UploadedFileData) => void;
}

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB
const MAX_VIDEO_SIZE = 10 * 1024 * 1024; // 10MB pour les vidéos

export default function FileUploadButton({ onFileSelect }: FileUploadButtonProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const ensureMimeType = (file: File): string => {
    if (file.type) return file.type;
    const extension = file.name.split(".").pop()?.toLowerCase();
    const mimeTypes: Record<string, string> = {
      gif: "image/gif",
      png: "image/png",
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      webp: "image/webp",
      svg: "image/svg+xml",
      mp4: "video/mp4",
      webm: "video/webm",
      mp3: "audio/mpeg",
      wav: "audio/wav",
      pdf: "application/pdf",
      doc: "application/msword",
      docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    };
    return extension ? mimeTypes[extension] || "application/octet-stream" : "application/octet-stream";
  };

  const readFileAsDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        resolve(typeof reader.result === "string" ? reader.result : "");
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
  };

  const validateFile = (file: File): string | null => {
    // Vérifier si c'est une vidéo
    const isVideo = file.type.startsWith('video/') || file.type.startsWith('audio/');
    
    // Vérifier la taille selon le type
    if (isVideo && file.size > MAX_VIDEO_SIZE) {
      return `Le fichier vidéo est trop volumineux. Taille maximale: 10MB`;
    }
    
    if (!isVideo && file.size > MAX_FILE_SIZE) {
      return `Le fichier est trop volumineux. Taille maximale: 25MB`;
    }

    return null;
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);
    setIsProcessing(true);

    try {
      // Valider le fichier
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        setIsProcessing(false);
        return;
      }

      const fileType = ensureMimeType(file);
      const dataUrl = await readFileAsDataUrl(file);

      if (!dataUrl) {
        setError("Impossible de lire le fichier sélectionné");
        setIsProcessing(false);
        return;
      }

      onFileSelect({
        dataUrl,
        name: file.name,
        type: fileType,
        size: file.size,
      });
      
      // Réinitialiser l'input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err) {
      setError('Erreur lors de l\'upload du fichier');
      console.error('Erreur upload fichier:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        disabled={isProcessing}
        className="p-2 rounded transition-colors bg-muted hover:bg-muted/80 text-foreground disabled:opacity-50"
        title="Ajouter un fichier joint"
      >
        <Icon name="document" className="h-5 w-5" />
      </button>
      
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileChange}
        className="hidden"
      />

      {error && (
        <div className="fixed left-1/2 top-20 -translate-x-1/2 z-50 bg-destructive text-destructive-foreground px-4 py-2 rounded shadow-lg">
          {error}
        </div>
      )}
    </>
  );
}

