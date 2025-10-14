import { ValidationResult } from "../types";

export class DocumentValidator {
  static validateTitle(title: string): ValidationResult {
    const errors: Record<string, string> = {};

    if (!title || title.trim().length === 0) {
      errors.title = "Le titre du document est requis";
      return { isValid: false, errors };
    }

    if (title.length > 255) {
      errors.title = "Le titre ne peut pas dépasser 255 caractères";
      return { isValid: false, errors };
    }

    return { isValid: true, errors: {} };
  }

  static validateTags(tags: string[]): ValidationResult {
    const errors: Record<string, string> = {};

    if (!Array.isArray(tags)) {
      errors.tags = "Les tags doivent être un tableau";
      return { isValid: false, errors };
    }

    if (tags.length > 20) {
      errors.tags = "Vous ne pouvez pas avoir plus de 20 tags";
      return { isValid: false, errors };
    }

    for (let i = 0; i < tags.length; i++) {
      const tag = tags[i];
      
      if (typeof tag !== 'string') {
        errors.tags = `Le tag à l'index ${i} doit être une chaîne de caractères`;
        return { isValid: false, errors };
      }

      if (tag.trim().length === 0) {
        errors.tags = `Le tag à l'index ${i} ne peut pas être vide`;
        return { isValid: false, errors };
      }

      if (tag.length > 50) {
        errors.tags = `Le tag à l'index ${i} ne peut pas dépasser 50 caractères`;
        return { isValid: false, errors };
      }

      // Vérifier que le tag ne contient que des caractères autorisés
      const tagRegex = /^[a-zA-Z0-9À-ÿ\s_-]+$/;
      if (!tagRegex.test(tag)) {
        errors.tags = `Le tag à l'index ${i} contient des caractères non autorisés`;
        return { isValid: false, errors };
      }
    }

    return { isValid: true, errors: {} };
  }

  static validateDocumentData(data: {
    title: string;
    content: string;
    tags: string[];
  }): ValidationResult {
    const errors: Record<string, string> = {};

    // Valider le titre
    const titleValidation = this.validateTitle(data.title);
    if (!titleValidation.isValid) {
      Object.assign(errors, titleValidation.errors);
    }

    // Valider les tags
    const tagsValidation = this.validateTags(data.tags);
    if (!tagsValidation.isValid) {
      Object.assign(errors, tagsValidation.errors);
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }

  static validateDocumentId(documentId: string | number): ValidationResult {
    const errors: Record<string, string> = {};

    const id = typeof documentId === 'string' ? parseInt(documentId) : documentId;

    if (isNaN(id) || id <= 0) {
      errors.documentId = "L'ID du document doit être un nombre positif valide";
      return { isValid: false, errors };
    }

    return { isValid: true, errors: {} };
  }

  static validateUserId(userId: string | number): ValidationResult {
    const errors: Record<string, string> = {};

    const id = typeof userId === 'string' ? parseInt(userId) : userId;

    if (isNaN(id) || id <= 0) {
      errors.userId = "L'ID de l'utilisateur doit être un nombre positif valide";
      return { isValid: false, errors };
    }

    return { isValid: true, errors };
  }

  static validateDocumentIds(documentIds: (string | number)[]): ValidationResult {
    const errors: Record<string, string> = {};

    if (!Array.isArray(documentIds)) {
      errors.documentIds = "Les IDs des documents doivent être un tableau";
      return { isValid: false, errors };
    }

    if (documentIds.length === 0) {
      errors.documentIds = "Aucun document sélectionné";
      return { isValid: false, errors };
    }

    if (documentIds.length > 100) {
      errors.documentIds = "Vous ne pouvez pas sélectionner plus de 100 documents à la fois";
      return { isValid: false, errors };
    }

    for (let i = 0; i < documentIds.length; i++) {
      const id = parseInt(String(documentIds[i]));
      
      if (isNaN(id) || id <= 0) {
        errors.documentIds = `L'ID du document à l'index ${i} n'est pas valide`;
        return { isValid: false, errors };
      }
    }

    return { isValid: true, errors: {} };
  }

  static validatePaginationParams(limit?: number, offset?: number): ValidationResult {
    const errors: Record<string, string> = {};

    if (limit !== undefined) {
      if (!Number.isInteger(limit) || limit < 1) {
        errors.limit = "La limite doit être un nombre entier positif";
      } else if (limit > 100) {
        errors.limit = "La limite ne peut pas dépasser 100";
      }
    }

    if (offset !== undefined) {
      if (!Number.isInteger(offset) || offset < 0) {
        errors.offset = "L'offset doit être un nombre entier positif ou zéro";
      }
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }
}
