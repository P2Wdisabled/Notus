import bcrypt from "bcryptjs";
import { PrismaUserRepository } from "../repositories/PrismaUserRepository";
import { EmailService } from "./EmailService";
import { CreateUserData, UpdateUserProfileData, User, UserRepositoryResult } from "../types";

export class PrismaUserService {
  private userRepository: PrismaUserRepository;
  private emailService: EmailService;

  constructor() {
    this.userRepository = new PrismaUserRepository();
    this.emailService = new EmailService();
  }

  async initializeTables(): Promise<void> {
    await this.userRepository.initializeTables();
  }

  async createUser(userData: Omit<CreateUserData, 'verificationToken'>): Promise<UserRepositoryResult<User>> {
    try {
      // Générer un token de vérification
      const verificationToken = this.emailService.generateVerificationToken();

      const createUserData: CreateUserData = {
        ...userData,
        verificationToken,
      };

      // Créer l'utilisateur
      const result = await this.userRepository.createUser(createUserData);

      if (!result.success) {
        return result;
      }

      // Envoyer l'email de vérification
      const emailResult = await this.emailService.sendVerificationEmail(
        userData.email,
        verificationToken,
        userData.firstName
      );

      if (!emailResult.success) {
        console.error("❌ Erreur envoi email:", emailResult.error);
        // Ne pas faire échouer la création d'utilisateur si l'email échoue
      }

      return result;
    } catch (error) {
      console.error("❌ Erreur création utilisateur:", error);
      return { success: false, error: error instanceof Error ? error.message : "Erreur inconnue" };
    }
  }

  async verifyUserEmail(token: string): Promise<UserRepositoryResult<User>> {
    try {
      const result = await this.userRepository.verifyEmail(token);

      if (result.success && result.user) {
        // Envoyer un email de bienvenue
        const emailResult = await this.emailService.sendWelcomeEmail(
          result.user.email,
          result.user.first_name || "Utilisateur"
        );

        if (!emailResult.success) {
          console.error("❌ Erreur envoi email de bienvenue:", emailResult.error);
          // Ne pas faire échouer la vérification si l'email échoue
        }

        return result;
      }

      return result;
    } catch (error) {
      console.error("❌ Erreur vérification email:", error);
      return { success: false, error: error instanceof Error ? error.message : "Erreur inconnue" };
    }
  }

  async updateUserProfile(userId: number, fields: UpdateUserProfileData): Promise<UserRepositoryResult<User>> {
    try {
      return await this.userRepository.updateUser(userId, fields);
    } catch (error) {
      console.error("❌ Erreur mise à jour profil:", error);
      return { success: false, error: error instanceof Error ? error.message : "Erreur inconnue" };
    }
  }

  async getUserById(userId: number): Promise<UserRepositoryResult<User>> {
    try {
      return await this.userRepository.getUserById(userId);
    } catch (error) {
      console.error("❌ Erreur récupération utilisateur:", error);
      return { success: false, error: error instanceof Error ? error.message : "Erreur inconnue" };
    }
  }

  async getUserByEmail(email: string): Promise<UserRepositoryResult<User>> {
    try {
      return await this.userRepository.getUserByEmail(email);
    } catch (error) {
      console.error("❌ Erreur récupération utilisateur par email:", error);
      return { success: false, error: error instanceof Error ? error.message : "Erreur inconnue" };
    }
  }

  async getAllUsers(): Promise<UserRepositoryResult<User[]>> {
    try {
      return await this.userRepository.getAllUsers();
    } catch (error) {
      console.error("❌ Erreur récupération utilisateurs:", error);
      return { success: false, error: error instanceof Error ? error.message : "Erreur inconnue" };
    }
  }

  async toggleUserBan(userId: number, isBanned: boolean, reason?: string): Promise<UserRepositoryResult<User>> {
    try {
      const result = await this.userRepository.toggleBan(userId, isBanned);

      if (result.success && result.user) {
        // Envoyer un email de notification
        if (isBanned) {
          await this.emailService.sendBanNotificationEmail(
            result.user.email,
            result.user.first_name || "Utilisateur",
            reason || "Aucune raison spécifiée"
          );
        } else {
          await this.emailService.sendUnbanNotificationEmail(
            result.user.email,
            result.user.first_name || "Utilisateur"
          );
        }

        return result;
      }

      return result;
    } catch (error) {
      console.error("❌ Erreur bannissement utilisateur:", error);
      return { success: false, error: error instanceof Error ? error.message : "Erreur inconnue" };
    }
  }

  async toggleUserAdmin(userId: number, isAdmin: boolean): Promise<UserRepositoryResult<User>> {
    try {
      const result = await this.userRepository.toggleAdmin(userId, isAdmin);

      if (result.success && result.user) {
        return result;
      }

      return result;
    } catch (error) {
      console.error("❌ Erreur changement statut admin:", error);
      return { success: false, error: error instanceof Error ? error.message : "Erreur inconnue" };
    }
  }

  async isUserAdmin(userId: number): Promise<boolean> {
    try {
      return await this.userRepository.isUserAdmin(userId);
    } catch (error) {
      console.error("❌ Erreur vérification statut admin:", error);
      return false;
    }
  }

  async sendPasswordResetEmail(email: string): Promise<{ success: boolean; error?: string }> {
    try {
      const userResult = await this.userRepository.getUserByEmail(email);
      
      if (!userResult.success) {
        // Pour des raisons de sécurité, on ne révèle pas si l'email existe ou non
        return { success: true };
      }

      const user = userResult.user!;

      // Générer un token de réinitialisation
      const resetToken = this.emailService.generateVerificationToken();
      const resetTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 heures

      // Sauvegarder le token en base
      await this.userRepository.updatePasswordResetToken(email, resetToken, resetTokenExpiry);

      // Envoyer l'email de réinitialisation
      const emailResult = await this.emailService.sendPasswordResetEmail(
        email,
        resetToken,
        user.first_name || "Utilisateur"
      );

      if (!emailResult.success) {
        console.error("❌ Erreur envoi email:", emailResult.error);
        return { success: false, error: "Erreur lors de l'envoi de l'email" };
      }

      return { success: true };
    } catch (error) {
      console.error("❌ Erreur envoi email de réinitialisation:", error);
      return { success: false, error: error instanceof Error ? error.message : "Erreur inconnue" };
    }
  }

  async resetPassword(token: string, newPassword: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Hasher le nouveau mot de passe
      const hashedPassword = await bcrypt.hash(newPassword, 12);

      // Mettre à jour le mot de passe et supprimer le token
      const updateResult = await this.userRepository.updatePassword(token, hashedPassword);

      if (!updateResult.success) {
        return { success: false, error: updateResult.error || "Erreur lors de la mise à jour du mot de passe" };
      }

      return { success: true };
    } catch (error) {
      console.error("❌ Erreur réinitialisation mot de passe:", error);
      return { success: false, error: error instanceof Error ? error.message : "Erreur inconnue" };
    }
  }

  async authenticateUser(identifier: string, password: string): Promise<{ success: boolean; user?: User; error?: string }> {
    try {
      const userResult = await this.userRepository.getUserByEmail(identifier);

      if (!userResult.success) {
        return { success: false, error: "Identifiants invalides" };
      }

      const user = userResult.user!;

      if (user.is_banned) {
        return { success: false, error: "Ce compte a été banni" };
      }

      if (!user.password_hash) {
        return { success: false, error: "Compte OAuth sans mot de passe" };
      }

      const isValid = await bcrypt.compare(password, user.password_hash);
      if (!isValid) {
        return { success: false, error: "Identifiants invalides" };
      }

      if (!user.email_verified) {
        return { success: false, error: "Email non vérifié" };
      }

      return { success: true, user };
    } catch (error) {
      console.error("❌ Erreur authentification:", error);
      return { success: false, error: error instanceof Error ? error.message : "Erreur inconnue" };
    }
  }
}