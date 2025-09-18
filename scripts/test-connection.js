require("dotenv").config();
const { Pool } = require("pg");

async function testConnection() {
  try {
    // Vérifier si DATABASE_URL est configuré
    if (!process.env.DATABASE_URL) {
      console.error("❌ DATABASE_URL non configuré dans le fichier .env");
      return;
    }

    // Tester la connexion
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    });

    const client = await pool.connect();

    // Tester une requête simple
    const result = await client.query(
      "SELECT NOW() as current_time, version() as pg_version"
    );

    client.release();
    await pool.end();
  } catch (error) {
    console.error("❌ Erreur de connexion:", error.message);

    if (error.code === "ECONNREFUSED") {
      console.error("PostgreSQL n'est pas démarré");
    } else if (error.code === "ENOTFOUND") {
      console.error("Serveur inaccessible");
    } else if (error.code === "28P01") {
      console.error("Erreur d'authentification");
    }
  }
}

testConnection().then(() => {
  process.exit(0);
});
