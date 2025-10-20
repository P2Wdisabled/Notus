import { UserService } from "../../services/UserService";
import { ActionResult } from "../../types";

export class AdminService {
  private userService: UserService;

  constructor() {
    this.userService = new UserService();
  }

  async getAllUsers(): Promise<ActionResult> {
    try {
      // Vérifier si la base de données est configurée
      if (!process.env.DATABASE_URL) {
        return {
          success: true,
          users: [
            {
              id: 1,
              email: "admin@example.com",
              username: "admin",
              first_name: "Admin",
              last_name: "User",
              email_verified: true,
              is_admin: true,
              is_banned: false,
              created_at: new Date(),
              updated_at: new Date(),
            },
          ],
        };
      }

      // Initialiser les tables si elles n'existent pas
      await this.userService.initializeTables();

      // Récupérer tous les utilisateurs
      const result = await this.userService.getAllUsers();

      if (!result.success) {
        console.error("❌ Erreur récupération utilisateurs:", result.error);
        return {
          success: false,
          error: "Erreur lors de la récupération des utilisateurs.",
          users: [],
        };
      }

      return {
        success: true,
        users: result.users || [],
      };
    } catch (error: unknown) {
      console.error("❌ Erreur lors de la récupération des utilisateurs:", error);
      return {
        success: false,
        error: "Erreur lors de la récupération des utilisateurs.",
        users: [],
      };
    }
  }

  async toggleUserBan(userId: number): Promise<ActionResult> {
    try {
      // Vérifier si la base de données est configurée
      if (!process.env.DATABASE_URL) {
        return {
          success: true,
          message: "Statut de bannissement modifié (mode simulation).",
        };
      }

      // Initialiser les tables si elles n'existent pas
      await this.userService.initializeTables();

      // Basculer le statut de bannissement
      const result = await this.userService.toggleUserBan(userId, true);

      if (!result.success) {
        console.error("❌ Erreur basculement bannissement:", result.error);
        return {
          success: false,
          error: result.error || "Erreur lors de la modification du statut de bannissement.",
        };
      }

      return {
        success: true,
        message: "Statut de bannissement modifié avec succès.",
      };
    } catch (error: unknown) {
      console.error("❌ Erreur lors de la modification du statut de bannissement:", error);
      return {
        success: false,
        error: "Erreur lors de la modification du statut de bannissement.",
      };
    }
  }

  async toggleUserAdmin(userId: number): Promise<ActionResult> {
    try {
      // Vérifier si la base de données est configurée
      if (!process.env.DATABASE_URL) {
        return {
          success: true,
          message: "Statut administrateur modifié (mode simulation).",
        };
      }

      // Initialiser les tables si elles n'existent pas
      await this.userService.initializeTables();

      // Basculer le statut administrateur
      const result = await this.userService.toggleUserAdmin(userId, true);

      if (!result.success) {
        console.error("❌ Erreur basculement admin:", result.error);
        return {
          success: false,
          error: result.error || "Erreur lors de la modification du statut administrateur.",
        };
      }

      return {
        success: true,
        message: "Statut administrateur modifié avec succès.",
      };
    } catch (error: unknown) {
      console.error("❌ Erreur lors de la modification du statut administrateur:", error);
      return {
        success: false,
        error: "Erreur lors de la modification du statut administrateur.",
      };
    }
  }

  async isUserAdmin(userId: number): Promise<boolean> {
    try {
      // Vérifier si la base de données est configurée
      if (!process.env.DATABASE_URL) {
        return userId === 1; // Simulation : seul l'utilisateur 1 est admin
      }

      // Initialiser les tables si elles n'existent pas
      await this.userService.initializeTables();

      // Vérifier le statut administrateur
      const result = await this.userService.isUserAdmin(userId);

      return result;
    } catch (error: unknown) {
      console.error("❌ Erreur lors de la vérification du statut administrateur:", error);
      return false;
    }
  }
}
