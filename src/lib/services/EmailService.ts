import crypto from "crypto";
import { Resend } from "resend";
import { EmailResult } from "../types";

// Configuration Resend - initialiser seulement si la clé API est présente
const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

export class EmailService {
  generateVerificationToken(): string {
    return crypto.randomBytes(32).toString("hex");
  }

  async sendVerificationEmail(email: string, token: string, firstName: string): Promise<EmailResult> {
    const verificationUrl = `${process.env.NEXTAUTH_URL}/verify-email?token=${token}`;
    const from = process.env.EMAIL_FROM || "Notus <noreply@notus.com>";

    // Si pas de clé API Resend, simuler l'envoi
    if (!process.env.RESEND_API_KEY || !resend) {
      return { success: true, messageId: `sim-${Date.now()}` };
    }

    try {
      const { data, error } = await resend.emails.send({
        from: from,
        to: [email],
        subject: "Vérification de votre compte Notus",
        html: this.getVerificationEmailTemplate(verificationUrl, firstName),
      });

      if (error) {
        console.error("❌ Erreur Resend:", error);
        return { success: false, error: error.message };
      }

      return { success: true, messageId: data.id };
    } catch (error: unknown) {
      console.error("❌ Erreur envoi email:", error);
      return { success: false, error: error instanceof Error ? error.message : "Erreur inconnue" };
    }
  }

  async sendWelcomeEmail(email: string, firstName: string): Promise<EmailResult> {
    const from = process.env.EMAIL_FROM || "Notus <noreply@notus.com>";

    // Si pas de clé API Resend, simuler l'envoi
    if (!process.env.RESEND_API_KEY || !resend) {
      return { success: true, messageId: `sim-welcome-${Date.now()}` };
    }

    try {
      const { data, error } = await resend.emails.send({
        from: from,
        to: [email],
        subject: "Bienvenue sur Notus - Votre compte est activé !",
        html: this.getWelcomeEmailTemplate(firstName),
      });

      if (error) {
        console.error("❌ Erreur Resend:", error);
        return { success: false, error: error.message };
      }

      return { success: true, messageId: data.id };
    } catch (error: unknown) {
      console.error("❌ Erreur envoi email de bienvenue:", error);
      return { success: false, error: error instanceof Error ? error.message : "Erreur inconnue" };
    }
  }

  async sendPasswordResetEmail(email: string, token: string, firstName: string): Promise<EmailResult> {
    const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${token}`;
    const from = process.env.EMAIL_FROM || "Notus <noreply@notus.com>";

    // Si pas de clé API Resend, simuler l'envoi
    if (!process.env.RESEND_API_KEY || !resend) {
      return { success: true, messageId: `sim-reset-${Date.now()}` };
    }

    try {
      const { data, error } = await resend.emails.send({
        from: from,
        to: [email],
        subject: "Réinitialisation de votre mot de passe Notus",
        html: this.getPasswordResetEmailTemplate(resetUrl, firstName),
      });

      if (error) {
        console.error("❌ Erreur Resend:", error);
        return { success: false, error: error.message };
      }

      return { success: true, messageId: data.id };
    } catch (error: unknown) {
      console.error("❌ Erreur envoi email de réinitialisation:", error);
      return { success: false, error: error instanceof Error ? error.message : "Erreur inconnue" };
    }
  }

  async sendBanNotificationEmail(email: string, firstName: string, reason: string | null = null): Promise<EmailResult> {
    const from = process.env.EMAIL_FROM || "Notus <noreply@notus.com>";

    // Si pas de clé API Resend, simuler l'envoi
    if (!process.env.RESEND_API_KEY || !resend) {
      return { success: true, messageId: `sim-ban-${Date.now()}` };
    }

    try {
      const { data, error } = await resend.emails.send({
        from: from,
        to: [email],
        subject: "Votre compte Notus a été suspendu",
        html: this.getBanNotificationEmailTemplate(firstName, reason),
      });

      if (error) {
        console.error("❌ Erreur Resend:", error);
        return { success: false, error: error.message };
      }

      return { success: true, messageId: data.id };
    } catch (error: unknown) {
      console.error("❌ Erreur envoi email de bannissement:", error);
      return { success: false, error: error instanceof Error ? error.message : "Erreur inconnue" };
    }
  }

  async sendUnbanNotificationEmail(email: string, firstName: string): Promise<EmailResult> {
    const from = process.env.EMAIL_FROM || "Notus <noreply@notus.com>";

    // Si pas de clé API Resend, simuler l'envoi
    if (!process.env.RESEND_API_KEY || !resend) {
      return { success: true, messageId: `sim-unban-${Date.now()}` };
    }

    try {
      const { data, error } = await resend.emails.send({
        from: from,
        to: [email],
        subject: "Votre compte Notus a été réactivé",
        html: this.getUnbanNotificationEmailTemplate(firstName),
      });

      if (error) {
        console.error("❌ Erreur Resend:", error);
        return { success: false, error: error.message };
      }

      return { success: true, messageId: data.id };
    } catch (error: unknown) {
      console.error("❌ Erreur envoi email de débannissement:", error);
      return { success: false, error: error instanceof Error ? error.message : "Erreur inconnue" };
    }
  }

  async sendShareInviteEmail(
    email: string,
    link: string,
    inviterName: string,
    docTitle: string
  ): Promise<EmailResult> {
    const from = process.env.EMAIL_FROM || "Notus <noreply@notus.com>";

        // Debug: log environment and parameters
    console.log("[EmailService] RESEND_API_KEY:", process.env.RESEND_API_KEY ? "set" : "NOT SET");
    console.log("[EmailService] EMAIL_FROM:", process.env.EMAIL_FROM);
    console.log("[EmailService] To:", email);
    console.log("[EmailService] Subject:", `${inviterName} vous a invité à collaborer sur "${docTitle}"`);
    console.log("[EmailService] Link:", link);

    // Simuler si pas de clé API Resend
    if (!process.env.RESEND_API_KEY || !resend) {
      console.warn("[EmailService] Simulation mode: email not actually sent.");
      return { success: true, messageId: `sim-share-invite-${Date.now()}` };
    }

    try {
      const { data, error } = await resend.emails.send({
        from: from,
        to: [email],
        subject: `${inviterName} vous a invité à collaborer sur "${docTitle}"`,
        html: this.getShareInviteEmailTemplate(link, inviterName, docTitle),
      });

      if (error) {
        console.error("❌ Erreur Resend:", error);
        return { success: false, error: error.message };
      }

      console.log("[EmailService] Email sent successfully. Message ID:", data.id);
      return { success: true, messageId: data.id };
    } catch (error: unknown) {
      console.error("❌ Erreur envoi email d'invitation de partage:", error);
      return { success: false, error: error instanceof Error ? error.message : "Erreur inconnue" };
    }
  }


  async sendDeletionCompletedEmail(email: string, firstName: string): Promise<EmailResult> {
    const from = process.env.EMAIL_FROM || "Notus <noreply@notus.com>";

    if (!process.env.RESEND_API_KEY || !resend) {
      return { success: true, messageId: `sim-delete-completed-${Date.now()}` };
    }

    try {
      const { data, error } = await resend.emails.send({
        from: from,
        to: [email],
        subject: "Votre compte Notus a été supprimé",
        html: this.getDeletionCompletedEmailTemplate(firstName),
      });

      if (error) {
        console.error("❌ Erreur Resend:", error);
        return { success: false, error: error.message };
      }

      return { success: true, messageId: data.id };
    } catch (error: unknown) {
      console.error("❌ Erreur envoi email de confirmation de suppression:", error);
      return { success: false, error: error instanceof Error ? error.message : "Erreur inconnue" };
    }
  }

  private getVerificationEmailTemplate(verificationUrl: string, firstName: string): string {
    return `
      <div style="background:#F7F8FA; padding:24px; font-family: Nunito, Arial, sans-serif; color:#0f172a;">
        <div style="max-width:640px; margin:0 auto; background:#ffffff; border:1px solid #e5e7eb; border-radius:12px; overflow:hidden;">
          <div style="background:linear-gradient(135deg,#A855F7 0%,#EC4899 100%); padding:28px; text-align:center;">
            <h1 style="margin:0; font-size:26px; line-height:1.2; color:#ffffff; font-family:'Roboto Condensed', Arial, sans-serif;">Bienvenue sur Notus</h1>
          </div>
          <div style="padding:28px;">
            <h2 style="margin:0 0 12px; font-size:20px; font-family:'Roboto Condensed', Arial, sans-serif;">Bonjour ${firstName} 👋</h2>
            <p style="margin:0 0 16px; color:#475569; line-height:1.65;">Merci pour votre inscription. Vérifiez votre adresse email pour activer votre compte.</p>
            <div style="text-align:center; margin:28px 0;">
              <a href="${verificationUrl}" style="background:#A855F7; color:#ffffff; padding:14px 24px; text-decoration:none; border-radius:12px; font-weight:700; display:inline-block; font-size:16px;">Vérifier mon email</a>
            </div>
            <p style="margin:0; color:#94a3b8; font-size:13px;">Si le bouton ne fonctionne pas :</p>
            <p style="margin:6px 0 0; color:#94a3b8; font-size:13px; word-break:break-all;"><a href="${verificationUrl}" style="color:#A855F7;">${verificationUrl}</a></p>
            <p style="margin:16px 0 0; color:#94a3b8; font-size:13px;">Lien valide 24 heures.</p>
          </div>
          <div style="background:#0f172a; color:#ffffff; text-align:center; padding:16px; font-size:12px;">© 2025 Notus</div>
        </div>
      </div>`;
  }

  private getWelcomeEmailTemplate(firstName: string): string {
    return `
      <div style="background:#F7F8FA; padding:24px; font-family: Nunito, Arial, sans-serif; color:#0f172a;">
        <div style="max-width:640px; margin:0 auto; background:#ffffff; border:1px solid #e5e7eb; border-radius:12px; overflow:hidden;">
          <div style="background:linear-gradient(135deg,#A855F7 0%,#EC4899 100%); padding:28px; text-align:center;">
            <h1 style="margin:0; font-size:26px; line-height:1.2; color:#ffffff; font-family:'Roboto Condensed', Arial, sans-serif;">🎉 Compte activé</h1>
          </div>
          <div style="padding:28px;">
            <h2 style="margin:0 0 12px; font-size:20px; font-family:'Roboto Condensed', Arial, sans-serif;">Bienvenue ${firstName} !</h2>
            <p style="margin:0 0 16px; color:#475569; line-height:1.65;">Votre compte Notus est prêt. Commencez dès maintenant.</p>
            <div style="text-align:center; margin:28px 0;">
              <a href="${process.env.NEXTAUTH_URL}/login" style="background:#A855F7; color:#ffffff; padding:14px 24px; text-decoration:none; border-radius:12px; font-weight:700; display:inline-block; font-size:16px;">Se connecter</a>
            </div>
          </div>
          <div style="background:#0f172a; color:#ffffff; text-align:center; padding:16px; font-size:12px;">© 2025 Notus</div>
        </div>
      </div>`;
  }

  private getPasswordResetEmailTemplate(resetUrl: string, firstName: string): string {
    return `
      <div style="background:#F7F8FA; padding:24px; font-family: Nunito, Arial, sans-serif; color:#0f172a;">
        <div style="max-width:640px; margin:0 auto; background:#ffffff; border:1px solid #e5e7eb; border-radius:12px; overflow:hidden;">
          <div style="background:linear-gradient(135deg,#A855F7 0%,#EC4899 100%); padding:28px; text-align:center;">
            <h1 style="margin:0; font-size:26px; line-height:1.2; color:#ffffff; font-family:'Roboto Condensed', Arial, sans-serif;">🔐 Réinitialisation du mot de passe</h1>
          </div>
          <div style="padding:28px;">
            <h2 style="margin:0 0 12px; font-size:20px; font-family:'Roboto Condensed', Arial, sans-serif;">Bonjour ${firstName}</h2>
            <p style="margin:0 0 16px; color:#475569; line-height:1.65;">Cliquez sur le bouton ci-dessous pour créer un nouveau mot de passe.</p>
            <div style="text-align:center; margin:28px 0;">
              <a href="${resetUrl}" style="background:#A855F7; color:#ffffff; padding:14px 24px; text-decoration:none; border-radius:12px; font-weight:700; display:inline-block; font-size:16px;">Réinitialiser mon mot de passe</a>
            </div>
            <p style="margin:0; color:#94a3b8; font-size:13px;">Si le bouton ne fonctionne pas :</p>
            <p style="margin:6px 0 0; color:#94a3b8; font-size:13px; word-break:break-all;"><a href="${resetUrl}" style="color:#A855F7;">${resetUrl}</a></p>
            <p style="margin:16px 0 0; color:#94a3b8; font-size:13px;">Lien valable 24 heures.</p>
          </div>
          <div style="background:#0f172a; color:#ffffff; text-align:center; padding:16px; font-size:12px;">© 2025 Notus</div>
        </div>
      </div>`;
  }

  private getBanNotificationEmailTemplate(firstName: string, reason: string | null): string {
    return `
      <div style="background:#F7F8FA; padding:24px; font-family: Nunito, Arial, sans-serif; color:#0f172a;">
        <div style="max-width:640px; margin:0 auto; background:#ffffff; border:1px solid #e5e7eb; border-radius:12px; overflow:hidden;">
          <div style="background:linear-gradient(135deg,#A855F7 0%,#EC4899 100%); padding:28px; text-align:center;">
            <h1 style="margin:0; font-size:26px; line-height:1.2; color:#ffffff; font-family:'Roboto Condensed', Arial, sans-serif;">⚠️ Compte suspendu</h1>
          </div>
          <div style="padding:28px;">
            <h2 style="margin:0 0 12px; font-size:20px; font-family:'Roboto Condensed', Arial, sans-serif;">Bonjour ${firstName}</h2>
            <p style="margin:0 0 16px; color:#475569; line-height:1.65;">Votre compte Notus a été suspendu par notre équipe.</p>
            ${reason ? `
            <div style="background:#fff7ed; border:1px solid #fed7aa; border-radius:12px; padding:16px; margin:20px 0;">
              <h3 style="margin:0 0 8px; font-size:16px; color:#9a3412; font-family:'Roboto Condensed', Arial, sans-serif;">Raison :</h3>
              <p style="margin:0; color:#9a3412;">${reason}</p>
            </div>
            ` : ""}
            <div style="background:#f8fafc; border-radius:12px; padding:16px; margin:20px 0;">
              <h3 style="margin:0 0 10px; font-size:16px; color:#0f172a; font-family:'Roboto Condensed', Arial, sans-serif;">Que faire ?</h3>
              <ul style="margin:0; padding-left:20px; color:#475569; line-height:1.65;">
                <li>Si vous pensez à une erreur, contactez le support</li>
                <li>Respectez les conditions d'utilisation</li>
              </ul>
            </div>
            <div style="text-align:center; margin:24px 0;">
              <a href="mailto:${process.env.ADMIN_EMAIL || "admin@notus.com"}" style="background:#0f172a; color:#ffffff; padding:12px 20px; text-decoration:none; border-radius:12px; font-weight:700; display:inline-block; font-size:15px;">Contacter le support</a>
            </div>
            <p style="margin:0; color:#94a3b8; font-size:13px;">Cet email est automatique, merci de ne pas y répondre.</p>
          </div>
          <div style="background:#0f172a; color:#ffffff; text-align:center; padding:16px; font-size:12px;">© 2025 Notus</div>
        </div>
      </div>`;
  }

  private getUnbanNotificationEmailTemplate(firstName: string): string {
    return `
      <div style="background:#F7F8FA; padding:24px; font-family: Nunito, Arial, sans-serif; color:#0f172a;">
        <div style="max-width:640px; margin:0 auto; background:#ffffff; border:1px solid #e5e7eb; border-radius:12px; overflow:hidden;">
          <div style="background:linear-gradient(135deg,#A855F7 0%,#EC4899 100%); padding:28px; text-align:center;">
            <h1 style="margin:0; font-size:26px; line-height:1.2; color:#ffffff; font-family:'Roboto Condensed', Arial, sans-serif;">🎉 Compte réactivé</h1>
          </div>
          <div style="padding:28px;">
            <h2 style="margin:0 0 12px; font-size:20px; font-family:'Roboto Condensed', Arial, sans-serif;">Bonjour ${firstName}</h2>
            <p style="margin:0 0 16px; color:#475569; line-height:1.65;">Votre compte Notus est de nouveau actif.</p>
            <div style="text-align:center; margin:24px 0;">
              <a href="${process.env.NEXTAUTH_URL}/login" style="background:#A855F7; color:#ffffff; padding:12px 20px; text-decoration:none; border-radius:12px; font-weight:700; display:inline-block; font-size:15px;">Se connecter</a>
            </div>
            <div style="background:#f8fafc; border-radius:12px; padding:16px; margin:20px 0;">
              <h3 style="margin:0 0 10px; font-size:16px; color:#0f172a; font-family:'Roboto Condensed', Arial, sans-serif;">Conseils</h3>
              <ul style="margin:0; padding-left:20px; color:#475569; line-height:1.65;">
                <li>Respectez les conditions d'utilisation</li>
                <li>Contactez le support en cas de questions</li>
              </ul>
            </div>
          </div>
          <div style="background:#0f172a; color:#ffffff; text-align:center; padding:16px; font-size:12px;">© 2025 Notus</div>
        </div>
      </div>`;
  }

  private getShareInviteEmailTemplate(link: string, inviterName: string, docTitle: string): string {
    return `
      <div style="background:#F7F8FA; padding:24px; font-family: Nunito, Arial, sans-serif; color:#0f172a;">
        <div style="max-width:640px; margin:0 auto; background:#ffffff; border:1px solid #e5e7eb; border-radius:12px; overflow:hidden;">
          <div style="background:linear-gradient(135deg,#A855F7 0%,#EC4899 100%); padding:28px; text-align:center;">
            <h1 style="margin:0; font-size:26px; line-height:1.2; color:#ffffff; font-family:'Roboto Condensed', Arial, sans-serif;">Invitation à collaborer</h1>
          </div>
          <div style="padding:28px;">
            <h2 style="margin:0 0 12px; font-size:20px; font-family:'Roboto Condensed', Arial, sans-serif;">Bonjour !</h2>
            <p style="margin:0 0 16px; color:#475569; line-height:1.65;">${inviterName} vous invite à collaborer sur « ${docTitle} ».</p>
            <div style="text-align:center; margin:24px 0;">
              <a href="${link}" style="background:#A855F7; color:#ffffff; padding:12px 20px; text-decoration:none; border-radius:12px; font-weight:700; display:inline-block; font-size:15px;">Accepter l'invitation</a>
            </div>
            <p style="margin:0; color:#94a3b8; font-size:13px;">Ou copiez-collez ce lien :</p>
            <p style="margin:6px 0 0; color:#94a3b8; font-size:13px; word-break:break-all;"><a href="${link}" style="color:#A855F7;">${link}</a></p>
          </div>
          <div style="background:#0f172a; color:#ffffff; text-align:center; padding:16px; font-size:12px;">© 2025 Notus</div>
        </div>
      </div>`;
  }


  private getDeletionCompletedEmailTemplate(firstName: string): string {
    return `
      <div style="background:#F7F8FA; padding:24px; font-family: Nunito, Arial, sans-serif; color:#0f172a;">
        <div style="max-width:640px; margin:0 auto; background:#ffffff; border:1px solid #e5e7eb; border-radius:12px; overflow:hidden;">
          <div style="background:linear-gradient(135deg,#A855F7 0%,#EC4899 100%); padding:28px; text-align:center;">
            <h1 style="margin:0; font-size:24px; line-height:1.2; color:#ffffff; font-family:'Roboto Condensed', Arial, sans-serif;">Compte supprimé</h1>
          </div>
          <div style="padding:28px;">
            <h2 style="margin:0 0 12px; font-size:20px; font-family:'Roboto Condensed', Arial, sans-serif;">Bonjour ${firstName}</h2>
            <p style="margin:0 0 16px; color:#475569; line-height:1.65;">Votre compte a bien été supprimé. Vous pouvez encore le réactiver dans les 30 jours en vous reconnectant avec la même adresse email.</p>
            <p style="margin:0; color:#94a3b8; font-size:13px;">Si vous n'êtes pas à l'origine de cette action, contactez immédiatement le support.</p>
          </div>
          <div style="background:#0f172a; color:#ffffff; text-align:center; padding:16px; font-size:12px;">© 2025 Notus</div>
        </div>
      </div>`;
  }
}
