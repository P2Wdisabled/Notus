require("dotenv").config();
const { Pool } = require("pg");

async function setupDatabase() {
  try {
    // Vérifier si DATABASE_URL est configuré
    if (!process.env.DATABASE_URL) {
      console.error("❌ DATABASE_URL non configuré");
      return;
    }

    // Extraire les informations de connexion
    const url = new URL(process.env.DATABASE_URL);
    const host = url.hostname;
    const port = url.port || 5432;
    const database = url.pathname.slice(1);
    const username = url.username;
    const password = url.password;

    // Connexion sans spécifier la base de données (pour la créer)
    const adminPool = new Pool({
      host: host,
      port: port,
      user: username,
      password: password,
      database: "postgres", // Connexion à la base par défaut
      ssl: { rejectUnauthorized: false },
    });

    try {
      // Vérifier si la base de données existe
      const dbCheck = await adminPool.query(
        "SELECT 1 FROM pg_database WHERE datname = $1",
        [database]
      );

      if (dbCheck.rows.length === 0) {
        await adminPool.query(`CREATE DATABASE "${database}"`);
      }
    } catch (error) {
      if (error.code !== "42P04") {
        throw error;
      }
    }

    await adminPool.end();

    // Maintenant tester la connexion à la base de données
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    });

    const client = await pool.connect();
    client.release();
    await pool.end();
  } catch (error) {
    console.error("❌ Erreur lors de la configuration:", error.message);

    if (error.code === "ECONNREFUSED") {
      console.error("PostgreSQL n'est pas démarré");
    } else if (error.code === "28P01") {
      console.error("Erreur d'authentification");
    }
  }
}

setupDatabase().then(() => {
  process.exit(0);
});
