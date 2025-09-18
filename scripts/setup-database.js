require("dotenv").config();
const { Pool } = require("pg");

async function setupDatabase() {
  try {
    console.log("🚀 Configuration de la base de données...\n");

    // Vérifier si DATABASE_URL est configuré
    if (!process.env.DATABASE_URL) {
      console.log("❌ DATABASE_URL non configuré");
      console.log("\n📋 Créez un fichier .env avec:");
      console.log(
        "DATABASE_URL=postgresql://username:password@localhost:5432/notus_db"
      );
      return;
    }

    // Extraire les informations de connexion
    const url = new URL(process.env.DATABASE_URL);
    const host = url.hostname;
    const port = url.port || 5432;
    const database = url.pathname.slice(1);
    const username = url.username;
    const password = url.password;

    console.log(`📍 Connexion à: ${host}:${port}`);
    console.log(`🗄️  Base de données: ${database}`);
    console.log(`👤 Utilisateur: ${username}`);

    // Connexion sans spécifier la base de données (pour la créer)
    const adminPool = new Pool({
      host: host,
      port: port,
      user: username,
      password: password,
      database: "postgres", // Connexion à la base par défaut
      ssl: { rejectUnauthorized: false },
    });

    console.log("\n🔄 Vérification de la base de données...");

    try {
      // Vérifier si la base de données existe
      const dbCheck = await adminPool.query(
        "SELECT 1 FROM pg_database WHERE datname = $1",
        [database]
      );

      if (dbCheck.rows.length === 0) {
        console.log(`📦 Création de la base de données '${database}'...`);
        await adminPool.query(`CREATE DATABASE "${database}"`);
        console.log("✅ Base de données créée avec succès");
      } else {
        console.log("✅ Base de données existe déjà");
      }
    } catch (error) {
      if (error.code === "42P04") {
        console.log("✅ Base de données existe déjà");
      } else {
        throw error;
      }
    }

    await adminPool.end();

    // Maintenant tester la connexion à la base de données
    console.log("\n🔄 Test de connexion à la base de données...");
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    });

    const client = await pool.connect();
    console.log("✅ Connexion réussie !");

    client.release();
    await pool.end();

    console.log("\n✅ Configuration terminée avec succès !");
    console.log("\n🔧 Prochaines étapes:");
    console.log("1. node scripts/init-database.js");
    console.log("2. node scripts/fix-accept-date.js");
  } catch (error) {
    console.error("❌ Erreur lors de la configuration:", error.message);

    if (error.code === "ECONNREFUSED") {
      console.log("\n🔧 PostgreSQL n'est pas démarré. Solutions:");
      console.log("Windows: net start postgresql-x64-14");
      console.log("Linux: sudo systemctl start postgresql");
      console.log("Mac: brew services start postgresql");
    } else if (error.code === "28P01") {
      console.log("\n🔧 Erreur d'authentification. Vérifiez:");
      console.log("- Le nom d'utilisateur");
      console.log("- Le mot de passe");
      console.log("- Les permissions de l'utilisateur");
    }
  }
}

setupDatabase().then(() => {
  process.exit(0);
});
