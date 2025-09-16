// Script de test pour l'envoi d'email avec Resend
require("dotenv").config();

const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

async function testEmail() {
  console.log("📧 Test d'envoi d'email avec Resend...");
  console.log(
    "Clé API:",
    process.env.RESEND_API_KEY ? "Configurée" : "Non configurée"
  );
  console.log("Expéditeur:", process.env.EMAIL_FROM);

  try {
    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM || "onboarding@resend.dev",
      to: ["louis@louis-potevin.dev"],
      subject: "Test Notus - Vérification email",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Test Notus !</h1>
          </div>
          
          <div style="padding: 30px; background: #f8f9fa;">
            <h2 style="color: #333; margin-bottom: 20px;">Bonjour !</h2>
            
            <p style="color: #666; line-height: 1.6; margin-bottom: 25px;">
              Ceci est un email de test pour vérifier que le système d'envoi d'emails 
              fonctionne correctement avec Resend.
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <div style="background: #28a745; color: white; padding: 15px 30px; 
                          border-radius: 5px; font-weight: bold; 
                          display: inline-block; font-size: 16px;">
                ✅ Email de test envoyé avec succès !
              </div>
            </div>
            
            <p style="color: #999; font-size: 14px; margin-top: 20px;">
              Si vous recevez cet email, la configuration Resend fonctionne parfaitement.
            </p>
          </div>
          
          <div style="background: #333; color: white; padding: 20px; text-align: center; font-size: 12px;">
            <p style="margin: 0;">© 2024 Notus. Test d'envoi d'email.</p>
          </div>
        </div>
      `,
    });

    if (error) {
      console.error("❌ Erreur Resend:", error);
      return;
    }

    console.log("✅ Email de test envoyé avec succès !");
    console.log("ID de l'email:", data.id);
    console.log("Vérifiez votre boîte de réception (et les spams)");
  } catch (error) {
    console.error("❌ Erreur lors de l'envoi:", error);
  }
}

testEmail();
