// Charger les variables d'environnement
require("dotenv").config();

const { resetDatabase } = require("../src/lib/reset-database");

async function main() {
  console.log("🗑️  Réinitialisation de la base de données...");

  try {
    const success = await resetDatabase();

    if (success) {
      console.log("✅ Base de données réinitialisée avec succès !");
      process.exit(0);
    } else {
      console.error("❌ Échec de la réinitialisation");
      process.exit(1);
    }
  } catch (error) {
    console.error("❌ Erreur lors de la réinitialisation:", error);
    process.exit(1);
  }
}

main();
