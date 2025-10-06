const { query } = require("../src/lib/database");

async function initNextAuthTables() {
  try {
    console.log("🔄 Initialisation des tables NextAuth...");

    // Table Account
    await query(`
      CREATE TABLE IF NOT EXISTS "Account" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "userId" TEXT NOT NULL,
        "type" TEXT NOT NULL,
        "provider" TEXT NOT NULL,
        "providerAccountId" TEXT NOT NULL,
        "refresh_token" TEXT,
        "access_token" TEXT,
        "expires_at" INTEGER,
        "token_type" TEXT,
        "scope" TEXT,
        "id_token" TEXT,
        "session_state" TEXT,
        CONSTRAINT "Account_provider_providerAccountId_key" UNIQUE("provider", "providerAccountId")
      )
    `);

    // Table Session
    await query(`
      CREATE TABLE IF NOT EXISTS "Session" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "sessionToken" TEXT NOT NULL UNIQUE,
        "userId" TEXT NOT NULL,
        "expires" TIMESTAMP(3) NOT NULL
      )
    `);

    // Table User (mise à jour pour inclure les champs NextAuth)
    // Vérifier et ajouter les colonnes une par une
    try {
      await query(`ALTER TABLE users ADD COLUMN name TEXT`);
    } catch (error) {
      if (!error.message.includes('already exists') && !error.message.includes('duplicate column')) {
        throw error;
      }
    }
    
    try {
      await query(`ALTER TABLE users ADD COLUMN image TEXT`);
    } catch (error) {
      if (!error.message.includes('already exists') && !error.message.includes('duplicate column')) {
        throw error;
      }
    }
    
    try {
      await query(`ALTER TABLE users ADD COLUMN "emailVerified" TIMESTAMP(3)`);
    } catch (error) {
      if (!error.message.includes('already exists') && !error.message.includes('duplicate column')) {
        throw error;
      }
    }

    // Table VerificationToken
    await query(`
      CREATE TABLE IF NOT EXISTS "VerificationToken" (
        "identifier" TEXT NOT NULL,
        "token" TEXT NOT NULL,
        "expires" TIMESTAMP(3) NOT NULL,
        CONSTRAINT "VerificationToken_identifier_token_key" UNIQUE("identifier", "token")
      )
    `);

    // Ajouter les contraintes de clés étrangères
    try {
      await query(`
        ALTER TABLE "Account" 
        ADD CONSTRAINT "Account_userId_fkey" 
        FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
      `);
    } catch (error) {
      if (!error.message.includes('already exists')) {
        console.log("Contrainte Account_userId_fkey déjà existante ou erreur:", error.message);
      }
    }

    try {
      await query(`
        ALTER TABLE "Session" 
        ADD CONSTRAINT "Session_userId_fkey" 
        FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
      `);
    } catch (error) {
      if (!error.message.includes('already exists')) {
        console.log("Contrainte Session_userId_fkey déjà existante ou erreur:", error.message);
      }
    }

    console.log("✅ Tables NextAuth initialisées avec succès !");
  } catch (error) {
    console.error("❌ Erreur lors de l'initialisation des tables NextAuth:", error);
    throw error;
  }
}

// Exécuter le script si appelé directement
if (require.main === module) {
  initNextAuthTables()
    .then(() => {
      console.log("🎉 Initialisation terminée !");
      process.exit(0);
    })
    .catch((error) => {
      console.error("💥 Erreur fatale:", error);
      process.exit(1);
    });
}

module.exports = { initNextAuthTables };
