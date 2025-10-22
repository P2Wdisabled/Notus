import { getServerSession } from "next-auth";
import { signIn } from "next-auth/react";
import { authOptions } from "../../../../lib/auth";
import { UserService } from "../../services/UserService";
import { UserValidator } from "../../validators/UserValidator";
import { ActionResult } from "../../types";

export class AuthService {
  private userService: UserService;

  constructor() {
    this.userService = new UserService();
  }

  async authenticate(prevState: unknown, formData: FormData): Promise<string> {
    try {
      const email = formData.get("email") as string;
      const password = formData.get("password") as string;

      if (!email || !password) {
        return "Email et mot de passe requis";
      }

      // Vérifier si l'utilisateur est banni avant la tentative de connexion
      const userResult = await this.userService.getUserByEmail(email);
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

  async registerUser(prevState: unknown, formData: FormData): Promise<string> {
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
      await this.userService.initializeTables();

      // Créer l'utilisateur
      const result = await this.userService.createUser(userData);

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

  async getCurrentUser(): Promise<ActionResult> {
    try {
      const session = await getServerSession(authOptions);
      
      if (!session?.user?.id) {
        return {
          success: false,
          error: "Utilisateur non connecté",
        };
      }

      const userId = parseInt(session.user.id);
      return await this.userService.getUserById(userId);
    } catch (error: unknown) {
      console.error("❌ Erreur lors de la récupération de l'utilisateur actuel:", error);
      return {
        success: false,
        error: "Erreur lors de la récupération de l'utilisateur",
      };
    }
  }
}
