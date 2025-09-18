require("dotenv").config();
const { Pool } = require("pg");

async function testConnection() {
  try {
    console.log("🔍 Test de connexion à la base de données...\n");

    // Vérifier si DATABASE_URL est configuré
    if (!process.env.DATABASE_URL) {
      console.log("❌ DATABASE_URL non configuré dans le fichier .env");
      console.log("\n📋 Configuration requise:");
      console.log(
        "DATABASE_URL=postgresql://username:password@localhost:5432/database_name"
      );
      return;
    }

    console.log("✅ DATABASE_URL configuré");
    console.log(
      `📍 URL: ${process.env.DATABASE_URL.replace(/:[^:@]+@/, ":***@")}`
    );

    // Tester la connexion
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    });

    console.log("\n🔄 Tentative de connexion...");
    const client = await pool.connect();

    console.log("✅ Connexion réussie !");

    // Tester une requête simple
    const result = await client.query(
      "SELECT NOW() as current_time, version() as pg_version"
    );
    console.log(`⏰ Heure actuelle: ${result.rows[0].current_time}`);
    console.log(
      `🐘 Version PostgreSQL: ${result.rows[0].pg_version.split(" ")[0]}`
    );

    client.release();
    await pool.end();

    console.log("\n✅ Test de connexion terminé avec succès !");
    console.log("\n🔧 Vous pouvez maintenant exécuter:");
    console.log("node scripts/init-database.js");
  } catch (error) {
    console.error("❌ Erreur de connexion:", error.message);

    if (error.code === "ECONNREFUSED") {
      console.log("\n🔧 Solutions possibles:");
      console.log("1. Vérifiez que PostgreSQL est démarré");
      console.log("2. Vérifiez que le port 5432 est ouvert");
      console.log("3. Vérifiez la configuration DATABASE_URL");
      console.log("4. Vérifiez que la base de données existe");
    } else if (error.code === "ENOTFOUND") {
      console.log("\n🔧 Solutions possibles:");
      console.log("1. Vérifiez l'URL de connexion");
      console.log("2. Vérifiez que le serveur est accessible");
    } else if (error.code === "28P01") {
      console.log("\n🔧 Solutions possibles:");
      console.log("1. Vérifiez le nom d'utilisateur et le mot de passe");
      console.log("2. Vérifiez les permissions de l'utilisateur");
    }

    console.log("\n📋 Configuration .env requise:");
    console.log(
      "DATABASE_URL=postgresql://username:password@localhost:5432/database_name"
    );
  }
}

testConnection().then(() => {
  process.exit(0);
});
