"use server";

import { signIn } from "next-auth/react";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../lib/auth";
import { UserService } from "../services/UserService";
import { UserValidator } from "../validators/UserValidator";
import { ActionResult } from "../types";

const userService = new UserService();

export async function authenticate(prevState: unknown, formData: FormData): Promise<string> {
  try {
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    if (!email || !password) {
      return "Email et mot de passe requis";
    }

    // Vérifier si l'utilisateur est banni avant la tentative de connexion
    const userResult = await userService.getUserByEmail(email);
    if (userResult.success && userResult.user?.is_banned) {
      return "Ce compte a été banni. Contactez un administrateur pour plus d'informations.";
    }

    await signIn("credentials", {
      email,
      password,
    });

    return "";
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'type' in error && error.type === "CredentialsSignin") {
      return "Email ou mot de passe incorrect, ou email non vérifié.";
    }

    return "Une erreur est survenue.";
  }
}

export async function registerUser(prevState: unknown, formData: FormData): Promise<string> {
  try {
    const userData = {
      email: formData.get("email") as string,
      username: formData.get("username") as string,
      password: formData.get("password") as string,
      firstName: formData.get("firstName") as string,
      lastName: formData.get("lastName") as string,
    };

    // Vérifier l'acceptation des conditions d'utilisation
    const acceptTerms = formData.get("acceptTerms");
    if (!acceptTerms) {
      return "Vous devez accepter les conditions d'utilisation et les mentions légales pour vous inscrire.";
    }

    // Validation côté serveur
    const validation = UserValidator.validateRegistrationData(userData);
    if (!validation.isValid) {
      return Object.values(validation.errors)[0] || "Données invalides";
    }

    // Vérifier si la base de données est configurée
    if (!process.env.DATABASE_URL) {
      return "Inscription réussie (mode simulation). Configurez DATABASE_URL pour la persistance.";
    }

    // Initialiser les tables si elles n'existent pas
    await userService.initializeTables();

    // Créer l'utilisateur
    const result = await userService.createUser(userData);

    if (!result.success) {
      return result.error || "Erreur lors de l'inscription";
    }

    return "Inscription réussie ! Un email de vérification a été envoyé. Vérifiez votre boîte de réception.";
  } catch (error: unknown) {
    console.error("❌ Erreur lors de l'inscription:", error);

    if (error instanceof Error && (error.message.includes("déjà utilisé") || error.message.includes("existe déjà"))) {
      return error.message;
    }

    if (error && typeof error === 'object' && 'code' in error && 
        (error.code === "ECONNRESET" || error.code === "ECONNREFUSED")) {
      return "Base de données non accessible. Vérifiez la configuration PostgreSQL.";
    }

    return "Erreur lors de l'inscription. Veuillez réessayer.";
  }
}

export async function sendPasswordResetEmailAction(prevState: unknown, formData: FormData): Promise<string> {
  try {
    const email = formData.get("email") as string;

    if (!email) {
      return "Veuillez entrer votre adresse email.";
    }

    // Validation basique de l'email
    const emailValidation = UserValidator.validateEmail(email);
    if (!emailValidation.isValid) {
      return "Veuillez entrer une adresse email valide.";
    }

    // Vérifier si la base de données est configurée
    if (!process.env.DATABASE_URL) {
      return "Email de réinitialisation envoyé (mode simulation). Configurez DATABASE_URL pour la persistance.";
    }

    // Initialiser les tables si elles n'existent pas
    await userService.initializeTables();

    // Envoyer l'email de réinitialisation
    const result = await userService.sendPasswordResetEmail(email);

    if (!result.success) {
      return result.error || "Erreur lors de l'envoi de l'email";
    }

    return "Si un compte existe avec cette adresse email, un lien de réinitialisation a été envoyé.";
  } catch (error: unknown) {
    console.error("❌ Erreur lors de l'envoi de l'email de réinitialisation:", error);

    if (error && typeof error === 'object' && 'code' in error && 
        (error.code === "ECONNRESET" || error.code === "ECONNREFUSED")) {
      return "Base de données non accessible. Vérifiez la configuration PostgreSQL.";
    }

    return "Erreur lors de l'envoi de l'email. Veuillez réessayer.";
  }
}

export async function resetPasswordAction(prevState: unknown, formData: FormData): Promise<string> {
  try {
    const token = formData.get("token") as string;
    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    if (!token || !password || !confirmPassword) {
      return "Tous les champs sont requis.";
    }

    // Validation des mots de passe
    const passwordValidation = UserValidator.validatePasswordResetData(password, confirmPassword);
    if (!passwordValidation.isValid) {
      return Object.values(passwordValidation.errors)[0] || "Données invalides";
    }

    // Vérifier si la base de données est configurée
    if (!process.env.DATABASE_URL) {
      return "Mot de passe modifié avec succès (mode simulation). Configurez DATABASE_URL pour la persistance.";
    }

    // Initialiser les tables si elles n'existent pas
    await userService.initializeTables();

    // Réinitialiser le mot de passe
    const result = await userService.resetPassword(token, password);

    if (!result.success) {
      return result.error || "Erreur lors de la réinitialisation du mot de passe";
    }

    return "Mot de passe modifié avec succès. Vous pouvez maintenant vous connecter.";
  } catch (error: unknown) {
    console.error("❌ Erreur lors de la réinitialisation du mot de passe:", error);

    if (error && typeof error === 'object' && 'code' in error && 
        (error.code === "ECONNRESET" || error.code === "ECONNREFUSED")) {
      return "Base de données non accessible. Vérifiez la configuration PostgreSQL.";
    }

    return "Erreur lors de la réinitialisation. Veuillez réessayer.";
  }
}

export async function updateUserProfileAction(prevState: unknown, formData: FormData): Promise<string> {
  try {
      const session = await getServerSession(authOptions);
    const userIdRaw = session?.user?.id;

    if (!userIdRaw) {
      return "Vous devez être connecté pour modifier votre profil.";
    }

    const email = formData.get("email") as string || undefined;
    const username = formData.get("username") as string || undefined;
    const firstName = formData.get("firstName") as string || undefined;
    const lastName = formData.get("lastName") as string || undefined;
    const profileImage = formData.get("profileImage") as string || undefined;
    const bannerImage = formData.get("bannerImage") as string || undefined;

    // Validation des données de profil
    const profileData = {
      email: email?.trim(),
      username: username?.trim(),
      firstName: firstName?.trim(),
      lastName: lastName?.trim(),
      profileImage,
      bannerImage,
    };

    const validation = UserValidator.validateProfileData(profileData);
    if (!validation.isValid) {
      return Object.values(validation.errors)[0] || "Données invalides";
    }

    const fields: Record<string, string> = {};
    if (email !== undefined) fields.email = email.trim();
    if (username !== undefined) fields.username = username.trim();
    if (firstName !== undefined) fields.firstName = firstName.trim();
    if (lastName !== undefined) fields.lastName = lastName.trim();
    if (profileImage !== undefined) fields.profileImage = profileImage;
    if (bannerImage !== undefined) fields.bannerImage = bannerImage;

    if (Object.keys(fields).length === 0) {
      return "Aucun changement détecté.";
    }

    if (!process.env.DATABASE_URL) {
      return "Profil mis à jour (mode simulation). Configurez DATABASE_URL pour la persistance.";
    }

    await userService.initializeTables();

    const userId = parseInt(String(userIdRaw));
    const result = await userService.updateUserProfile(userId, fields);

    if (!result.success) {
      return result.error || "Erreur lors de la mise à jour du profil.";
    }

    return "Profil mis à jour avec succès !";
  } catch (error: unknown) {
    console.error("❌ Erreur mise à jour profil:", error);
    if (error && typeof error === 'object' && 'code' in error && 
        (error.code === "ECONNRESET" || error.code === "ECONNREFUSED")) {
      return "Base de données non accessible. Vérifiez la configuration PostgreSQL.";
    }
    return "Erreur lors de la mise à jour du profil. Veuillez réessayer.";
  }
}

export async function getUserProfileAction(userId: number): Promise<ActionResult> {
  try {
    // Vérifier si la base de données est configurée
    if (!process.env.DATABASE_URL) {
      return {
        success: true,
        user: {
          id: userId,
          email: "test@example.com",
          username: "simulation",
          password_hash: undefined,
          first_name: "Test",
          last_name: "User",
          email_verified: true,
          email_verification_token: undefined,
          provider: undefined,
          provider_id: undefined,
          created_at: new Date(),
          updated_at: new Date(),
          reset_token: undefined,
          reset_token_expiry: undefined,
          is_admin: false,
          is_banned: false,
          terms_accepted_at: new Date(),
          profile_image: undefined,
          banner_image: undefined,
        },
      };
    }

    // Initialiser les tables si elles n'existent pas
    await userService.initializeTables();

    // Récupérer les données complètes de l'utilisateur
    const result = await userService.getUserById(userId);

    if (!result.success) {
      return {
        success: false,
        error: result.error || "Utilisateur non trouvé",
      };
    }

    return {
      success: true,
      user: result.user,
    };
  } catch (error: unknown) {
    console.error("❌ Erreur lors de la récupération du profil utilisateur:", error);
    return {
      success: false,
      error: "Erreur lors de la récupération du profil",
    };
  }
}

export async function getUserIdByEmailAction(email: string): Promise<ActionResult> {
  try {
    // Vérifier si la base de données est configurée
    if (!process.env.DATABASE_URL) {
      return {
        success: true,
        userId: "1", // ID de simulation
      };
    }

    // Initialiser les tables si elles n'existent pas
    await userService.initializeTables();

    // Récupérer l'ID utilisateur par email
    const result = await userService.getUserByEmail(email);

    if (!result.success) {
      return {
        success: false,
        error: "Utilisateur non trouvé",
      };
    }

    return {
      success: true,
      userId: result.user!.id.toString(),
    };
  } catch (error: unknown) {
    console.error("❌ Erreur lors de la récupération de l'ID utilisateur:", error);
    return {
      success: false,
      error: "Erreur lors de la récupération de l'ID utilisateur",
    };
  }
}