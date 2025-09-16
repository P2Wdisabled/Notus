const crypto = require("crypto");
const { Resend } = require("resend");

// Configuration Resend - initialiser seulement si la clé API est présente
const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

// Générer un token de vérification sécurisé
function generateVerificationToken() {
  return crypto.randomBytes(32).toString("hex");
}

// Envoyer un email de vérification avec Resend
async function sendVerificationEmail(email, token, firstName) {
  const verificationUrl = `${process.env.NEXTAUTH_URL}/verify-email?token=${token}`;
  const from = process.env.EMAIL_FROM || "Notus <noreply@notus.com>";

  // Si pas de clé API Resend, simuler l'envoi
  if (!process.env.RESEND_API_KEY || !resend) {
    console.log("📧 === EMAIL DE VÉRIFICATION (SIMULATION) ===");
    console.log(`De: ${from}`);
    console.log(`À: ${email}`);
    console.log(`Sujet: Vérification de votre compte Notus`);
    console.log(`Contenu: Bonjour ${firstName} !`);
    console.log(`Lien de vérification: ${verificationUrl}`);
    console.log("=============================================");
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

    console.log("📧 Email de vérification envoyé via Resend:", data.id);
    return { success: true, messageId: data.id };
  } catch (error) {
    console.error("❌ Erreur envoi email:", error);
    return { success: false, error: error.message };
  }
}

// Envoyer un email de bienvenue après vérification avec Resend
async function sendWelcomeEmail(email, firstName) {
  const from = process.env.EMAIL_FROM || "Notus <noreply@notus.com>";

  // Si pas de clé API Resend, simuler l'envoi
  if (!process.env.RESEND_API_KEY || !resend) {
    console.log("📧 === EMAIL DE BIENVENUE (SIMULATION) ===");
    console.log(`De: ${from}`);
    console.log(`À: ${email}`);
    console.log(`Sujet: Bienvenue sur Notus - Votre compte est activé !`);
    console.log(
      `Contenu: Félicitations ${firstName} ! Votre compte a été activé.`
    );
    console.log(`Lien de connexion: ${process.env.NEXTAUTH_URL}/login`);
    console.log("==========================================");
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

    console.log("📧 Email de bienvenue envoyé via Resend:", data.id);
    return { success: true, messageId: data.id };
  } catch (error) {
    console.error("❌ Erreur envoi email de bienvenue:", error);
    return { success: false, error: error.message };
  }
}

// Envoyer un email de réinitialisation de mot de passe avec Resend
async function sendPasswordResetEmail(email, token, firstName) {
  const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${token}`;
  const from = process.env.EMAIL_FROM || "Notus <noreply@notus.com>";

  // Si pas de clé API Resend, simuler l'envoi
  if (!process.env.RESEND_API_KEY || !resend) {
    console.log("📧 === EMAIL DE RÉINITIALISATION (SIMULATION) ===");
    console.log(`De: ${from}`);
    console.log(`À: ${email}`);
    console.log(`Sujet: Réinitialisation de votre mot de passe Notus`);
    console.log(`Contenu: Bonjour ${firstName} !`);
    console.log(`Lien de réinitialisation: ${resetUrl}`);
    console.log("===============================================");
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

    console.log("📧 Email de réinitialisation envoyé via Resend:", data.id);
    return { success: true, messageId: data.id };
  } catch (error) {
    console.error("❌ Erreur envoi email de réinitialisation:", error);
    return { success: false, error: error.message };
  }
}

module.exports = {
  generateVerificationToken,
  sendVerificationEmail,
  sendWelcomeEmail,
  sendPasswordResetEmail,
};
