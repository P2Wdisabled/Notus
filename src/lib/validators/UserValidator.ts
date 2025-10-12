import { ValidationResult } from "../types";

export class UserValidator {
  static validateEmail(email: string): ValidationResult {
    const errors: Record<string, string> = {};

    if (!email || email.trim().length === 0) {
      errors.email = "L'email est requis";
      return { isValid: false, errors };
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      errors.email = "L'email n'est pas valide";
      return { isValid: false, errors };
    }

    if (email.length > 255) {
      errors.email = "L'email ne peut pas dépasser 255 caractères";
      return { isValid: false, errors };
    }

    return { isValid: true, errors: {} };
  }

  static validateUsername(username: string): ValidationResult {
    const errors: Record<string, string> = {};

    if (!username || username.trim().length === 0) {
      errors.username = "Le nom d'utilisateur est requis";
      return { isValid: false, errors };
    }

    if (username.length < 3) {
      errors.username = "Le nom d'utilisateur doit contenir au moins 3 caractères";
      return { isValid: false, errors };
    }

    if (username.length > 50) {
      errors.username = "Le nom d'utilisateur ne peut pas dépasser 50 caractères";
      return { isValid: false, errors };
    }

    const usernameRegex = /^[a-zA-Z0-9_-]+$/;
    if (!usernameRegex.test(username)) {
      errors.username = "Le nom d'utilisateur ne peut contenir que des lettres, chiffres, tirets et underscores";
      return { isValid: false, errors };
    }

    return { isValid: true, errors: {} };
  }

  static validatePassword(password: string): ValidationResult {
    const errors: Record<string, string> = {};

    if (!password || password.length === 0) {
      errors.password = "Le mot de passe est requis";
      return { isValid: false, errors };
    }

    if (password.length < 6) {
      errors.password = "Le mot de passe doit contenir au moins 6 caractères";
      return { isValid: false, errors };
    }

    if (password.length > 128) {
      errors.password = "Le mot de passe ne peut pas dépasser 128 caractères";
      return { isValid: false, errors };
    }

    return { isValid: true, errors: {} };
  }

  static validateName(name: string, fieldName: string): ValidationResult {
    const errors: Record<string, string> = {};

    if (!name || name.trim().length === 0) {
      errors[fieldName] = `${fieldName} est requis`;
      return { isValid: false, errors };
    }

    if (name.length > 100) {
      errors[fieldName] = `${fieldName} ne peut pas dépasser 100 caractères`;
      return { isValid: false, errors };
    }

    const nameRegex = /^[a-zA-ZÀ-ÿ\s'-]+$/;
    if (!nameRegex.test(name)) {
      errors[fieldName] = `${fieldName} ne peut contenir que des lettres, espaces, apostrophes et tirets`;
      return { isValid: false, errors };
    }

    return { isValid: true, errors: {} };
  }

  static validateRegistrationData(userData: {
    email: string;
    username: string;
    password: string;
    firstName: string;
    lastName: string;
  }): ValidationResult {
    const errors: Record<string, string> = {};

    // Valider l'email
    const emailValidation = this.validateEmail(userData.email);
    if (!emailValidation.isValid) {
      Object.assign(errors, emailValidation.errors);
    }

    // Valider le nom d'utilisateur
    const usernameValidation = this.validateUsername(userData.username);
    if (!usernameValidation.isValid) {
      Object.assign(errors, usernameValidation.errors);
    }

    // Valider le mot de passe
    const passwordValidation = this.validatePassword(userData.password);
    if (!passwordValidation.isValid) {
      Object.assign(errors, passwordValidation.errors);
    }

    // Valider le prénom
    const firstNameValidation = this.validateName(userData.firstName, "firstName");
    if (!firstNameValidation.isValid) {
      Object.assign(errors, firstNameValidation.errors);
    }

    // Valider le nom
    const lastNameValidation = this.validateName(userData.lastName, "lastName");
    if (!lastNameValidation.isValid) {
      Object.assign(errors, lastNameValidation.errors);
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }

  static validateProfileData(profileData: {
    email?: string;
    username?: string;
    firstName?: string;
    lastName?: string;
    profileImage?: string;
    bannerImage?: string;
  }): ValidationResult {
    const errors: Record<string, string> = {};

    // Valider l'email si fourni
    if (profileData.email !== undefined) {
      const emailValidation = this.validateEmail(profileData.email);
      if (!emailValidation.isValid) {
        Object.assign(errors, emailValidation.errors);
      }
    }

    // Valider le nom d'utilisateur si fourni
    if (profileData.username !== undefined) {
      const usernameValidation = this.validateUsername(profileData.username);
      if (!usernameValidation.isValid) {
        Object.assign(errors, usernameValidation.errors);
      }
    }

    // Valider le prénom si fourni
    if (profileData.firstName !== undefined) {
      const firstNameValidation = this.validateName(profileData.firstName, "firstName");
      if (!firstNameValidation.isValid) {
        Object.assign(errors, firstNameValidation.errors);
      }
    }

    // Valider le nom si fourni
    if (profileData.lastName !== undefined) {
      const lastNameValidation = this.validateName(profileData.lastName, "lastName");
      if (!lastNameValidation.isValid) {
        Object.assign(errors, lastNameValidation.errors);
      }
    }

    // Valider les images si fournies
    if (profileData.profileImage !== undefined && profileData.profileImage.length > 0) {
      if (profileData.profileImage.length > 1000) {
        errors.profileImage = "L'URL de l'image de profil est trop longue";
      }
    }

    if (profileData.bannerImage !== undefined && profileData.bannerImage.length > 0) {
      if (profileData.bannerImage.length > 1000) {
        errors.bannerImage = "L'URL de l'image de bannière est trop longue";
      }
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }

  static validatePasswordResetData(password: string, confirmPassword: string): ValidationResult {
    const errors: Record<string, string> = {};

    // Valider le mot de passe
    const passwordValidation = this.validatePassword(password);
    if (!passwordValidation.isValid) {
      Object.assign(errors, passwordValidation.errors);
    }

    // Vérifier que les mots de passe correspondent
    if (password !== confirmPassword) {
      errors.confirmPassword = "Les mots de passe ne correspondent pas";
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }
}
