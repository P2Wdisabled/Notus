"use client";

import { useState, useCallback } from "react";

interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

interface ProfileData {
  profileImage?: string;
  bannerImage?: string;
  [key: string]: any;
}

interface UseImageValidationReturn {
  errors: Record<string, string | null>;
  validateImage: (base64: string, fieldName: string) => ValidationResult;
  validateProfileImages: (profileData: ProfileData) => ValidationResult;
  clearError: (fieldName: string) => void;
  clearAllErrors: () => void;
}

// Validation côté client pour les images base64
const validateBase64Image = (base64: string, fieldName: string): ValidationResult => {
  const errors: string[] = [];

  if (base64 && base64.trim() !== "") {
    // Vérifier le format base64
    const base64Regex = /^data:image\/(jpeg|jpg|png|gif);base64,/;
    if (!base64Regex.test(base64)) {
      errors.push(
        `${fieldName} doit être une image en base64 valide (JPEG, PNG, ou GIF)`
      );
    } else {
      // Vérifier que les données base64 sont valides
      const base64Data = base64.split(",")[1];
      if (!base64Data || base64Data.length === 0) {
        errors.push(`${fieldName} contient des données base64 invalides`);
      } else {
        // Vérifier que c'est du base64 valide
        try {
          atob(base64Data);
        } catch {
          errors.push(`${fieldName} contient des données base64 corrompues`);
        }
      }
    }

    // Vérifier la taille (limite à 10MB pour éviter les problèmes de performance)
    if (base64.length > 13.3 * 1024 * 1024) {
      // 10MB en base64 ≈ 13.3MB
      errors.push(`${fieldName} est trop volumineuse (maximum 10MB)`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

export function useImageValidation(): UseImageValidationReturn {
  const [errors, setErrors] = useState<Record<string, string | null>>({});

  const validateImage = useCallback((base64: string, fieldName: string): ValidationResult => {
    const validation = validateBase64Image(base64, fieldName);

    setErrors((prev) => ({
      ...prev,
      [fieldName]: validation.isValid ? null : validation.errors[0],
    }));

    return validation;
  }, []);

  const validateProfileImages = useCallback((profileData: ProfileData): ValidationResult => {
    const newErrors: Record<string, string | null> = {};

    // Validation image de profil
    if (profileData.profileImage) {
      const profileValidation = validateBase64Image(
        profileData.profileImage,
        "Image de profil"
      );
      if (!profileValidation.isValid) {
        newErrors.profileImage = profileValidation.errors[0];
      }
    }

    // Validation image de bannière
    if (profileData.bannerImage) {
      const bannerValidation = validateBase64Image(
        profileData.bannerImage,
        "Image de bannière"
      );
      if (!bannerValidation.isValid) {
        newErrors.bannerImage = bannerValidation.errors[0];
      }
    }

    setErrors(newErrors);
    return {
      isValid: Object.keys(newErrors).length === 0,
      errors: Object.values(newErrors).filter((error): error is string => error !== null),
    };
  }, []);

  const clearError = useCallback((fieldName: string): void => {
    setErrors((prev) => ({
      ...prev,
      [fieldName]: null,
    }));
  }, []);

  const clearAllErrors = useCallback((): void => {
    setErrors({});
  }, []);

  return {
    errors,
    validateImage,
    validateProfileImages,
    clearError,
    clearAllErrors,
  };
}
