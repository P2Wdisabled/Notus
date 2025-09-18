require("dotenv").config();
const { initializeTables } = require("../src/lib/database");

async function initDatabase() {
  try {
    console.log("🚀 Initialisation de la base de données...\n");

    // Initialiser les tables avec toutes les colonnes
    await initializeTables();

    console.log("✅ Base de données initialisée avec succès!");
    console.log("\n📋 Colonnes ajoutées:");
    console.log("- is_admin (BOOLEAN) : Droits administrateur");
    console.log("- is_banned (BOOLEAN) : Statut de bannissement");
    console.log(
      "- terms_accepted_at (TIMESTAMP) : Date d'acceptation des conditions"
    );

    console.log("\n🔧 Prochaines étapes:");
    console.log("1. Exécutez: node scripts/fix-accept-date.js");
    console.log("2. Testez l'inscription d'un nouvel utilisateur");
    console.log("3. Vérifiez le backoffice administrateur");
  } catch (error) {
    console.error("❌ Erreur lors de l'initialisation:", error.message);
    console.error("Stack trace:", error.stack);
  }
}

initDatabase().then(() => {
  process.exit(0);
});
