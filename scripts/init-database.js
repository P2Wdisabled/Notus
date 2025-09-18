require("dotenv").config();
const { initializeTables } = require("../src/lib/database");

async function initDatabase() {
  try {
    // Initialiser les tables avec toutes les colonnes
    await initializeTables();
  } catch (error) {
    console.error("❌ Erreur lors de l'initialisation:", error.message);
    console.error("Stack trace:", error.stack);
  }
}

initDatabase().then(() => {
  process.exit(0);
});
