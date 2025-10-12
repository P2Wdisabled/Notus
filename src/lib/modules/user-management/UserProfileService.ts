import { getServerSession } from "next-auth";
import { authOptions } from "../../../../lib/auth";
import { UserService } from "../../services/UserService";
import { UserValidator } from "../../validators/UserValidator";
import { ActionResult } from "../../types";

export class UserProfileService {
  private userService: UserService;

  constructor() {
    this.userService = new UserService();
  }

  async updateUserProfile(prevState: unknown, formData: FormData): Promise<string> {
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

      await this.userService.initializeTables();

      const userId = parseInt(String(userIdRaw));
      const result = await this.userService.updateUserProfile(userId, fields);

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

  async getUserProfile(userId: number): Promise<ActionResult> {
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
      await this.userService.initializeTables();

      // Récupérer les données complètes de l'utilisateur
      const result = await this.userService.getUserById(userId);

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

  async getUserIdByEmail(email: string): Promise<ActionResult> {
    try {
      // Vérifier si la base de données est configurée
      if (!process.env.DATABASE_URL) {
        return {
          success: true,
          userId: "1", // ID de simulation
        };
      }

      // Initialiser les tables si elles n'existent pas
      await this.userService.initializeTables();

      // Récupérer l'ID utilisateur par email
      const result = await this.userService.getUserByEmail(email);

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
}
