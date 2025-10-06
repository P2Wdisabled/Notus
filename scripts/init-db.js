// Charger les variables d'environnement
require("dotenv").config();

const { initializeTables, testConnection } = require("../src/lib/database");
const { initNextAuthTables } = require("./init-nextauth-tables");

async function initDatabase() {
  console.log("🚀 Initialisation de la base de données...");
  console.log(
    "🔗 URL de connexion:",
    process.env.DATABASE_URL ? "Configurée" : "Non configurée"
  );

  try {
    // Tester la connexion
    const connected = await testConnection();
    if (!connected) {
      console.error("❌ Impossible de se connecter à la base de données");
      process.exit(1);
    }

    // Initialiser les tables principales
    await initializeTables();

    // Initialiser les tables NextAuth
    await initNextAuthTables();

    console.log("✅ Base de données initialisée avec succès !");
    process.exit(0);
  } catch (error) {
    console.error("❌ Erreur lors de l'initialisation:", error);
    process.exit(1);
  }
}

initDatabase();
