import { UserService } from "../../services/UserService";
import { UserValidator } from "../../validators/UserValidator";

export class PasswordService {
  private userService: UserService;

  constructor() {
    this.userService = new UserService();
  }

  async sendPasswordResetEmail(prevState: unknown, formData: FormData): Promise<string> {
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
      await this.userService.initializeTables();

      // Envoyer l'email de réinitialisation
      const result = await this.userService.sendPasswordResetEmail(email);

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

  async resetPassword(prevState: unknown, formData: FormData): Promise<string> {
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
      await this.userService.initializeTables();

      // Réinitialiser le mot de passe
      const result = await this.userService.resetPassword(token, password);

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
}
