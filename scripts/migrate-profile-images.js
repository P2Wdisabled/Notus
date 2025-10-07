require("dotenv").config();
const { initializeTables, testConnection } = require("../src/lib/database");

async function migrateProfileImages() {
  try {
    console.log("🔍 Test de connexion à la base de données...");
    const isConnected = await testConnection();
    if (!isConnected) {
      throw new Error("Impossible de se connecter à la base de données");
    }
    console.log("✅ Connexion réussie");

    console.log("🔧 Application de la migration pour les images de profil...");
    await initializeTables();
    console.log("✅ Migration terminée avec succès");
    console.log(
      "📋 Les colonnes suivantes ont été ajoutées à la table 'users':"
    );
    console.log(
      "  - profile_image (TEXT) : pour stocker l'URL de l'image de profil"
    );
    console.log(
      "  - banner_image (TEXT) : pour stocker l'URL de l'image de bannière"
    );
    console.log(
      "🎉 La base de données est maintenant prête pour les images de profil !"
    );
  } catch (error) {
    console.error("❌ Erreur lors de la migration:", error.message);
    console.error("Stack trace:", error.stack);
    process.exit(1);
  }
}

migrateProfileImages().then(() => {
  process.exit(0);
});
