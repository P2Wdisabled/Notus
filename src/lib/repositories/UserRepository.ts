import { BaseRepository } from "./BaseRepository";
import { User, CreateUserData, UpdateUserProfileData, UserRepositoryResult } from "../types";
import bcrypt from "bcryptjs";

export class UserRepository extends BaseRepository {
  async initializeTables(): Promise<void> {
    if (!process.env.DATABASE_URL) {
      return;
    }

    return this.ensureInitialized(async () => {
      try {
        // Vérifier si on doit réinitialiser la base de données
        const shouldReset = process.env.RESET_DATABASE === "true";

        if (shouldReset) {
          const { resetDatabase } = require("../reset-database");
          await resetDatabase();
        }

        // Table des utilisateurs
        await this.query(`
          CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            email VARCHAR(255) UNIQUE NOT NULL,
            username VARCHAR(50) UNIQUE NOT NULL,
            password_hash VARCHAR(255),
            first_name VARCHAR(100) NOT NULL,
            last_name VARCHAR(100) NOT NULL,
            email_verified BOOLEAN DEFAULT FALSE,
            email_verification_token VARCHAR(255),
            provider VARCHAR(50),
            provider_id VARCHAR(255),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `);

        // Ajouter les colonnes OAuth si elles n'existent pas
        await this.addColumnIfNotExists("users", "provider", "VARCHAR(50)");
        await this.addColumnIfNotExists("users", "provider_id", "VARCHAR(255)");
        
        // Rendre password_hash nullable pour les utilisateurs OAuth
        await this.makeColumnNullable("users", "password_hash");
        
        // Ajouter les colonnes pour la réinitialisation de mot de passe
        await this.addColumnIfNotExists("users", "reset_token", "VARCHAR(255)");
        await this.addColumnIfNotExists("users", "reset_token_expiry", "TIMESTAMP");
        
        // Ajouter les colonnes pour l'administration
        await this.addColumnIfNotExists("users", "is_admin", "BOOLEAN DEFAULT FALSE");
        await this.addColumnIfNotExists("users", "is_banned", "BOOLEAN DEFAULT FALSE");
        
        // Ajouter la colonne pour l'acceptation des conditions d'utilisation
        await this.addColumnIfNotExists("users", "terms_accepted_at", "TIMESTAMP");
        
        // Ajouter les colonnes pour les images de profil et bannière
        await this.addColumnIfNotExists("users", "profile_image", "TEXT");
        await this.addColumnIfNotExists("users", "banner_image", "TEXT");

        // Créer les index
        await this.createIndexes();

        // Créer les triggers
        await this.createTriggers();
      } catch (error) {
        console.error("❌ Erreur lors de l'initialisation des tables utilisateurs:", error);
        throw error;
      }
    });
  }

  private async addColumnIfNotExists(tableName: string, columnName: string, columnDefinition: string): Promise<void> {
    try {
      await this.query(`ALTER TABLE ${tableName} ADD COLUMN IF NOT EXISTS ${columnName} ${columnDefinition}`);
    } catch (error) {
      // Ignorer l'erreur si la colonne existe déjà
    }
  }

  private async makeColumnNullable(tableName: string, columnName: string): Promise<void> {
    try {
      await this.query(`ALTER TABLE ${tableName} ALTER COLUMN ${columnName} DROP NOT NULL`);
    } catch (error) {
      // Ignorer l'erreur si la colonne est déjà nullable
    }
  }

  private async createIndexes(): Promise<void> {
    const indexes = [
      "CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)",
      "CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)",
      "CREATE INDEX IF NOT EXISTS idx_users_provider ON users(provider, provider_id)"
    ];

    for (const indexQuery of indexes) {
      await this.query(indexQuery);
    }
  }

  private async createTriggers(): Promise<void> {
    // Fonction pour mettre à jour updated_at
    await this.query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ language 'plpgsql'
    `);

    // Trigger pour users
    await this.query(`
      DROP TRIGGER IF EXISTS update_users_updated_at ON users;
      CREATE TRIGGER update_users_updated_at
        BEFORE UPDATE ON users
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column()
    `);
  }

  async createUser(userData: CreateUserData & { emailVerified?: boolean; provider?: string; providerId?: string }): Promise<UserRepositoryResult<User>> {
    try {
      const { email, username, password, firstName, lastName, verificationToken, emailVerified = false, provider, providerId } = userData;

      // Vérifier si l'email existe déjà
      const existingEmail = await this.query<{ id: number }>("SELECT id FROM users WHERE email = $1", [email]);
      if (existingEmail.rows.length > 0) {
        return { success: false, error: "Cet email est déjà utilisé" };
      }

      // Vérifier si le nom d'utilisateur existe déjà
      const existingUsername = await this.query<{ id: number }>("SELECT id FROM users WHERE username = $1", [username]);
      if (existingUsername.rows.length > 0) {
        return { success: false, error: "Ce nom d'utilisateur est déjà utilisé" };
      }

      // Hacher le mot de passe seulement s'il est fourni (pas pour OAuth)
      const passwordHash = password && password.trim() !== "" ? await bcrypt.hash(password, 12) : null;

      // Insérer l'utilisateur
      const result = await this.query<User>(
        `INSERT INTO users (email, username, password_hash, first_name, last_name, email_verified, email_verification_token, terms_accepted_at, provider, provider_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP, $8, $9)
         RETURNING id, email, username, first_name, last_name, email_verified, email_verification_token, created_at, terms_accepted_at, provider, provider_id`,
        [email, username, passwordHash, firstName, lastName, emailVerified, verificationToken || null, provider || null, providerId || null]
      );

      return { success: true, user: result.rows[0] };
    } catch (error) {
      console.error("❌ Erreur création utilisateur:", error);
      return { success: false, error: error instanceof Error ? error.message : "Erreur inconnue" };
    }
  }

  async verifyUserEmail(token: string): Promise<UserRepositoryResult<{ id: number; email: string; first_name: string }>> {
    try {
      // Trouver l'utilisateur avec ce token
      const user = await this.query<{
        id: number;
        email: string;
        first_name: string;
        email_verified: boolean;
      }>("SELECT id, email, first_name, email_verified FROM users WHERE email_verification_token = $1", [token]);

      if (user.rows.length === 0) {
        return { success: false, error: "Token de vérification invalide" };
      }

      if (user.rows[0].email_verified) {
        return { success: false, error: "Email déjà vérifié" };
      }

      // Marquer l'email comme vérifié et supprimer le token
      await this.query(
        "UPDATE users SET email_verified = TRUE, email_verification_token = NULL WHERE id = $1",
        [user.rows[0].id]
      );

      return {
        success: true,
        data: {
          id: user.rows[0].id,
          email: user.rows[0].email,
          first_name: user.rows[0].first_name,
        },
      };
    } catch (error) {
      console.error("❌ Erreur vérification email:", error);
      return { success: false, error: error instanceof Error ? error.message : "Erreur inconnue" };
    }
  }

  async updateUserProfile(userId: number, fields: UpdateUserProfileData): Promise<UserRepositoryResult<User>> {
    try {
      const updates: string[] = [];
      const values: unknown[] = [];
      let index = 1;

      if (Object.prototype.hasOwnProperty.call(fields, "email")) {
        updates.push(`email = $${index++}`);
        values.push(fields.email);
      }
      if (Object.prototype.hasOwnProperty.call(fields, "username")) {
        updates.push(`username = $${index++}`);
        values.push(fields.username);
      }
      if (Object.prototype.hasOwnProperty.call(fields, "firstName")) {
        updates.push(`first_name = $${index++}`);
        values.push(fields.firstName);
      }
      if (Object.prototype.hasOwnProperty.call(fields, "lastName")) {
        updates.push(`last_name = $${index++}`);
        values.push(fields.lastName);
      }
      if (Object.prototype.hasOwnProperty.call(fields, "profileImage")) {
        updates.push(`profile_image = $${index++}`);
        values.push(fields.profileImage);
      }
      if (Object.prototype.hasOwnProperty.call(fields, "bannerImage")) {
        updates.push(`banner_image = $${index++}`);
        values.push(fields.bannerImage);
      }

      if (updates.length === 0) {
        return { success: false, error: "Aucun champ à mettre à jour" };
      }

      // Always touch updated_at
      updates.push(`updated_at = CURRENT_TIMESTAMP`);
      values.push(userId);

      const result = await this.query<User>(
        `UPDATE users SET ${updates.join(", ")}
         WHERE id = $${index}
         RETURNING id, email, username, first_name, last_name, profile_image, banner_image, updated_at, created_at, password_hash, email_verified, email_verification_token, provider, provider_id, reset_token, reset_token_expiry, is_admin, is_banned, terms_accepted_at`,
        values
      );

      if (result.rows.length === 0) {
        return { success: false, error: "Utilisateur non trouvé" };
      }

      return { success: true, user: result.rows[0] };
    } catch (error) {
      // Gérer les violations d'unicité
      if (error && typeof error === 'object' && 'code' in error && error.code === "23505") {
        const detail = String((error as any).detail || "");
        if (detail.includes("users_email_key") || detail.includes("(email)")) {
          return { success: false, error: "Cet email est déjà utilisé" };
        }
        if (detail.includes("users_username_key") || detail.includes("(username)")) {
          return { success: false, error: "Ce nom d'utilisateur est déjà utilisé" };
        }
      }
      console.error("❌ Erreur mise à jour profil:", error);
      return { success: false, error: error instanceof Error ? error.message : "Erreur inconnue" };
    }
  }

  async getUserById(userId: number): Promise<UserRepositoryResult<User>> {
    try {
      const result = await this.query<User>(
        `SELECT id, username, first_name, last_name, email, profile_image, banner_image, created_at
         FROM users WHERE id = $1`,
        [userId]
      );

      if (result.rows.length === 0) {
        return { success: false, error: "Utilisateur non trouvé" };
      }

      return { success: true, user: result.rows[0] };
    } catch (error) {
      console.error("❌ Erreur récupération utilisateur:", error);
      return { success: false, error: error instanceof Error ? error.message : "Erreur inconnue" };
    }
  }

  async getUserByEmail(email: string): Promise<UserRepositoryResult<User>> {
    try {
      const result = await this.query<User>(
        `SELECT id, email, username, first_name, last_name, password_hash, email_verified, is_banned, is_admin
         FROM users WHERE email = $1`,
        [email]
      );

      if (result.rows.length === 0) {
        return { success: false, error: "Utilisateur non trouvé" };
      }

      return { success: true, user: result.rows[0] };
    } catch (error) {
      console.error("❌ Erreur récupération utilisateur par email:", error);
      return { success: false, error: error instanceof Error ? error.message : "Erreur inconnue" };
    }
  }

  async getAllUsers(limit: number = 50, offset: number = 0): Promise<UserRepositoryResult<User[]>> {
    try {
      const result = await this.query<User>(
        `SELECT id, email, username, first_name, last_name, email_verified, 
                is_admin, is_banned, created_at, updated_at, provider, terms_accepted_at,
                profile_image, banner_image, password_hash, email_verification_token, provider_id, reset_token, reset_token_expiry
         FROM users
         ORDER BY created_at DESC
         LIMIT $1 OFFSET $2`,
        [limit, offset]
      );

      return { success: true, users: result.rows };
    } catch (error) {
      console.error("❌ Erreur récupération utilisateurs:", error);
      return { success: false, error: error instanceof Error ? error.message : "Erreur inconnue" };
    }
  }

  async toggleUserBan(userId: number, isBanned: boolean): Promise<UserRepositoryResult<{ id: number; email: string; username: string; is_banned: boolean }>> {
    try {
      const result = await this.query<{
        id: number;
        email: string;
        username: string;
        is_banned: boolean;
      }>(
        `UPDATE users 
         SET is_banned = $1, updated_at = CURRENT_TIMESTAMP
         WHERE id = $2
         RETURNING id, email, username, is_banned`,
        [isBanned, userId]
      );

      if (result.rows.length === 0) {
        return { success: false, error: "Utilisateur non trouvé" };
      }

      return { success: true, data: result.rows[0] };
    } catch (error) {
      console.error("❌ Erreur bannissement utilisateur:", error);
      return { success: false, error: error instanceof Error ? error.message : "Erreur inconnue" };
    }
  }

  async toggleUserAdmin(userId: number, isAdmin: boolean): Promise<UserRepositoryResult<{ id: number; email: string; username: string; is_admin: boolean }>> {
    try {
      const result = await this.query<{
        id: number;
        email: string;
        username: string;
        is_admin: boolean;
      }>(
        `UPDATE users 
         SET is_admin = $1, updated_at = CURRENT_TIMESTAMP
         WHERE id = $2
         RETURNING id, email, username, is_admin`,
        [isAdmin, userId]
      );

      if (result.rows.length === 0) {
        return { success: false, error: "Utilisateur non trouvé" };
      }

      return { success: true, data: result.rows[0] };
    } catch (error) {
      console.error("❌ Erreur changement statut admin:", error);
      return { success: false, error: error instanceof Error ? error.message : "Erreur inconnue" };
    }
  }

  async isUserAdmin(userId: number): Promise<boolean> {
    try {
      const result = await this.query<{ is_admin: boolean }>(`SELECT is_admin FROM users WHERE id = $1`, [userId]);

      if (result.rows.length === 0) {
        return false;
      }

      return result.rows[0].is_admin === true;
    } catch (error) {
      console.error("❌ Erreur vérification statut admin:", error);
      return false;
    }
  }

  async updatePasswordResetToken(userId: number, token: string, expiry: Date): Promise<UserRepositoryResult<void>> {
    try {
      await this.query(
        "UPDATE users SET reset_token = $1, reset_token_expiry = $2 WHERE id = $3",
        [token, expiry, userId]
      );
      return { success: true };
    } catch (error) {
      console.error("❌ Erreur mise à jour token reset:", error);
      return { success: false, error: error instanceof Error ? error.message : "Erreur inconnue" };
    }
  }

  async getUserByResetToken(token: string): Promise<UserRepositoryResult<User>> {
    try {
      const result = await this.query<User>(
        "SELECT * FROM users WHERE reset_token = $1 AND reset_token_expiry > NOW()",
        [token]
      );

      if (result.rows.length === 0) {
        return { success: false, error: "Token invalide ou expiré" };
      }

      return { success: true, user: result.rows[0] };
    } catch (error) {
      console.error("❌ Erreur récupération utilisateur par token:", error);
      return { success: false, error: error instanceof Error ? error.message : "Erreur inconnue" };
    }
  }

  async updatePassword(userId: number, hashedPassword: string): Promise<UserRepositoryResult<void>> {
    try {
      await this.query(
        "UPDATE users SET password_hash = $1, reset_token = NULL, reset_token_expiry = NULL WHERE id = $2",
        [hashedPassword, userId]
      );
      return { success: true };
    } catch (error) {
      console.error("❌ Erreur mise à jour mot de passe:", error);
      return { success: false, error: error instanceof Error ? error.message : "Erreur inconnue" };
    }
  }
}