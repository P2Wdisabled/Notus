import crypto from "crypto";
import { Resend } from "resend";

// Configuration Resend - initialiser seulement si la clé API est présente
const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

// Types pour les réponses
interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

// Générer un token de vérification sécurisé
function generateVerificationToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

// Envoyer un email de vérification avec Resend
async function sendVerificationEmail(email: string, token: string, firstName: string): Promise<EmailResult> {
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
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Bienvenue sur Notus !</h1>
          </div>
          
          <div style="padding: 30px; background: #f8f9fa;">
            <h2 style="color: #333; margin-bottom: 20px;">Bonjour ${firstName} !</h2>
            
            <p style="color: #666; line-height: 1.6; margin-bottom: 25px;">
              Merci de vous être inscrit sur Notus. Pour activer votre compte, 
              veuillez cliquer sur le bouton ci-dessous pour vérifier votre adresse email.
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationUrl}" 
                 style="background: #667eea; color: white; padding: 15px 30px; 
                        text-decoration: none; border-radius: 5px; font-weight: bold; 
                        display: inline-block; font-size: 16px;">
                Vérifier mon email
              </a>
            </div>
            
            <p style="color: #999; font-size: 14px; margin-top: 30px;">
              Si le bouton ne fonctionne pas, copiez et collez ce lien dans votre navigateur :<br>
              <a href="${verificationUrl}" style="color: #667eea; word-break: break-all;">${verificationUrl}</a>
            </p>
            
            <p style="color: #999; font-size: 14px; margin-top: 20px;">
              Ce lien expire dans 24 heures. Si vous n'avez pas créé de compte, 
              vous pouvez ignorer cet email.
            </p>
          </div>
          
          <div style="background: #333; color: white; padding: 20px; text-align: center; font-size: 12px;">
            <p style="margin: 0;">© 2025 Notus. Tous droits réservés.</p>
          </div>
        </div>
      `,
    });

    if (error) {
      console.error("❌ Erreur Resend:", error);
      return { success: false, error: error.message };
    }

    return { success: true, messageId: data.id };
  } catch (error: unknown) {
    console.error("❌ Erreur envoi email:", error);
    return { success: false, error: error.message };
  }
}

// Envoyer un email de bienvenue après vérification avec Resend
async function sendWelcomeEmail(email: string, firstName: string): Promise<EmailResult> {
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
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #28a745 0%, #20c997 100%); padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">🎉 Compte activé !</h1>
          </div>
          
          <div style="padding: 30px; background: #f8f9fa;">
            <h2 style="color: #333; margin-bottom: 20px;">Félicitations ${firstName} !</h2>
            
            <p style="color: #666; line-height: 1.6; margin-bottom: 25px;">
              Votre compte Notus a été activé avec succès ! Vous pouvez maintenant 
              profiter de toutes les fonctionnalités de notre plateforme.
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.NEXTAUTH_URL}/login" 
                 style="background: #28a745; color: white; padding: 15px 30px; 
                        text-decoration: none; border-radius: 5px; font-weight: bold; 
                        display: inline-block; font-size: 16px;">
                Se connecter maintenant
              </a>
            </div>
          </div>
          
          <div style="background: #333; color: white; padding: 20px; text-align: center; font-size: 12px;">
            <p style="margin: 0;">© 2025 Notus. Tous droits réservés.</p>
          </div>
        </div>
      `,
    });

    if (error) {
      console.error("❌ Erreur Resend:", error);
      return { success: false, error: error.message };
    }

    return { success: true, messageId: data.id };
  } catch (error: unknown) {
    console.error("❌ Erreur envoi email de bienvenue:", error);
    return { success: false, error: error.message };
  }
}

// Envoyer un email de notification de bannissement avec Resend
async function sendBanNotificationEmail(email: string, firstName: string, reason: string | null = null): Promise<EmailResult> {
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
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #dc3545 0%, #c82333 100%); padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">⚠️ Compte suspendu</h1>
          </div>
          
          <div style="padding: 30px; background: #f8f9fa;">
            <h2 style="color: #333; margin-bottom: 20px;">Bonjour ${firstName} !</h2>
            
            <p style="color: #666; line-height: 1.6; margin-bottom: 25px;">
              Nous vous informons que votre compte Notus a été suspendu par notre équipe d'administration.
              Vous ne pouvez plus accéder à la plateforme avec ce compte.
            </p>
            
            ${
              reason
                ? `
            <div style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 5px; padding: 15px; margin: 20px 0;">
              <h3 style="color: #856404; margin: 0 0 10px 0; font-size: 16px;">Raison de la suspension :</h3>
              <p style="color: #856404; margin: 0; font-style: italic;">${reason}</p>
            </div>
            `
                : ""
            }
            
            <div style="background: #e2e3e5; border-radius: 5px; padding: 20px; margin: 25px 0;">
              <h3 style="color: #495057; margin: 0 0 15px 0; font-size: 18px;">Que faire maintenant ?</h3>
              <ul style="color: #495057; line-height: 1.6; margin: 0; padding-left: 20px;">
                <li>Si vous pensez qu'il s'agit d'une erreur, contactez notre support</li>
                <li>Respectez les conditions d'utilisation pour éviter de futures suspensions</li>
                <li>Vous pouvez créer un nouveau compte si nécessaire</li>
              </ul>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="mailto:${process.env.ADMIN_EMAIL || "admin@notus.com"}" 
                 style="background: #6c757d; color: white; padding: 15px 30px; 
                        text-decoration: none; border-radius: 5px; font-weight: bold; 
                        display: inline-block; font-size: 16px;">
                Contacter le support
              </a>
            </div>
            
            <p style="color: #999; font-size: 14px; margin-top: 30px;">
              Cet email a été envoyé automatiquement. Veuillez ne pas répondre à cet email.
            </p>
          </div>
          
          <div style="background: #333; color: white; padding: 20px; text-align: center; font-size: 12px;">
            <p style="margin: 0;">© 2025 Notus. Tous droits réservés.</p>
          </div>
        </div>
      `,
    });

    if (error) {
      console.error("❌ Erreur Resend:", error);
      return { success: false, error: error.message };
    }

    return { success: true, messageId: data.id };
  } catch (error: unknown) {
    console.error("❌ Erreur envoi email de bannissement:", error);
    return { success: false, error: error.message };
  }
}

// Envoyer un email de notification de débannissement avec Resend
async function sendUnbanNotificationEmail(email: string, firstName: string): Promise<EmailResult> {
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
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #28a745 0%, #20c997 100%); padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">🎉 Compte réactivé !</h1>
          </div>
          
          <div style="padding: 30px; background: #f8f9fa;">
            <h2 style="color: #333; margin-bottom: 20px;">Bonjour ${firstName} !</h2>
            
            <p style="color: #666; line-height: 1.6; margin-bottom: 25px;">
              Nous avons le plaisir de vous informer que votre compte Notus a été réactivé par notre équipe d'administration.
              Vous pouvez maintenant accéder à nouveau à toutes les fonctionnalités de la plateforme.
            </p>
            
            <div style="background: #d4edda; border: 1px solid #c3e6cb; border-radius: 5px; padding: 20px; margin: 25px 0;">
              <h3 style="color: #155724; margin: 0 0 15px 0; font-size: 18px;">✅ Votre compte est maintenant actif</h3>
              <ul style="color: #155724; line-height: 1.6; margin: 0; padding-left: 20px;">
                <li>Vous pouvez vous connecter normalement</li>
                <li>Toutes vos données sont préservées</li>
                <li>Vous avez accès à toutes les fonctionnalités</li>
              </ul>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.NEXTAUTH_URL}/login" 
                 style="background: #28a745; color: white; padding: 15px 30px; 
                        text-decoration: none; border-radius: 5px; font-weight: bold; 
                        display: inline-block; font-size: 16px;">
                Se connecter maintenant
              </a>
            </div>
            
            <div style="background: #e2e3e5; border-radius: 5px; padding: 20px; margin: 25px 0;">
              <h3 style="color: #495057; margin: 0 0 15px 0; font-size: 16px;">📋 Pour éviter de futures suspensions :</h3>
              <ul style="color: #495057; line-height: 1.6; margin: 0; padding-left: 20px;">
                <li>Respectez les conditions d'utilisation</li>
                <li>Maintenez un comportement respectueux envers les autres utilisateurs</li>
                <li>Contactez le support si vous avez des questions</li>
              </ul>
            </div>
            
            <p style="color: #999; font-size: 14px; margin-top: 30px;">
              Si vous avez des questions, n'hésitez pas à contacter notre équipe de support.
            </p>
          </div>
          
          <div style="background: #333; color: white; padding: 20px; text-align: center; font-size: 12px;">
            <p style="margin: 0;">© 2025 Notus. Tous droits réservés.</p>
          </div>
        </div>
      `,
    });

    if (error) {
      console.error("❌ Erreur Resend:", error);
      return { success: false, error: error.message };
    }

    return { success: true, messageId: data.id };
  } catch (error: unknown) {
    console.error("❌ Erreur envoi email de débannissement:", error);
    return { success: false, error: error.message };
  }
}

// Envoyer un email de réinitialisation de mot de passe avec Resend
async function sendPasswordResetEmail(email: string, token: string, firstName: string): Promise<EmailResult> {
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
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #dc3545 0%, #fd7e14 100%); padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">🔐 Réinitialisation</h1>
          </div>
          
          <div style="padding: 30px; background: #f8f9fa;">
            <h2 style="color: #333; margin-bottom: 20px;">Bonjour ${firstName} !</h2>
            
            <p style="color: #666; line-height: 1.6; margin-bottom: 25px;">
              Vous avez demandé la réinitialisation de votre mot de passe. 
              Cliquez sur le bouton ci-dessous pour créer un nouveau mot de passe.
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" 
                 style="background: #dc3545; color: white; padding: 15px 30px; 
                        text-decoration: none; border-radius: 5px; font-weight: bold; 
                        display: inline-block; font-size: 16px;">
                Réinitialiser mon mot de passe
              </a>
            </div>
            
            <p style="color: #999; font-size: 14px; margin-top: 30px;">
              Si le bouton ne fonctionne pas, copiez et collez ce lien dans votre navigateur :<br>
              <a href="${resetUrl}" style="color: #dc3545; word-break: break-all;">${resetUrl}</a>
            </p>
            
            <p style="color: #999; font-size: 14px; margin-top: 20px;">
              Ce lien expire dans 24 heures. Si vous n'avez pas demandé cette réinitialisation, 
              vous pouvez ignorer cet email en toute sécurité.
            </p>
          </div>
          
          <div style="background: #333; color: white; padding: 20px; text-align: center; font-size: 12px;">
            <p style="margin: 0;">© 2025 Notus. Tous droits réservés.</p>
          </div>
        </div>
      `,
    });

    if (error) {
      console.error("❌ Erreur Resend:", error);
      return { success: false, error: error.message };
    }

    return { success: true, messageId: data.id };
  } catch (error: unknown) {
    console.error("❌ Erreur envoi email de réinitialisation:", error);
    return { success: false, error: error.message };
  }
}

export {
  generateVerificationToken,
  sendVerificationEmail,
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendBanNotificationEmail,
  sendUnbanNotificationEmail,
};
