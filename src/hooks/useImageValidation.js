"use client";

import { useState, useCallback } from "react";

// Validation côté client pour les images base64
const validateBase64Image = (base64, fieldName) => {
  const errors = [];

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

export function useImageValidation() {
  const [errors, setErrors] = useState({});

  const validateImage = useCallback((base64, fieldName) => {
    const validation = validateBase64Image(base64, fieldName);

    setErrors((prev) => ({
      ...prev,
      [fieldName]: validation.isValid ? null : validation.errors[0],
    }));

    return validation;
  }, []);

  const validateProfileImages = useCallback((profileData) => {
    const newErrors = {};

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
      errors: newErrors,
    };
  }, []);

  const clearError = useCallback((fieldName) => {
    setErrors((prev) => ({
      ...prev,
      [fieldName]: null,
    }));
  }, []);

  const clearAllErrors = useCallback(() => {
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
