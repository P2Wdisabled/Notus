const { query } = require("./database");

// Fonction pour vider et réinitialiser la base de données
async function resetDatabase() {
  try {
    // Supprimer les tables dans l'ordre inverse de création (pour éviter les contraintes de clés étrangères)
    await query("DROP TABLE IF EXISTS documents CASCADE");
    await query("DROP TABLE IF EXISTS user_sessions CASCADE");
    await query("DROP TABLE IF EXISTS users CASCADE");

    // Supprimer la fonction si elle existe
    await query("DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE");

    // Recréer les tables
    await query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        username VARCHAR(50) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        email_verified BOOLEAN DEFAULT FALSE,
        email_verification_token VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS user_sessions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        token_hash VARCHAR(255) NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS documents (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL DEFAULT 'Sans titre',
        content TEXT NOT NULL DEFAULT '',
        tags TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Créer les index
    await query("CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)");
    await query(
      "CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)"
    );
    await query(
      "CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON user_sessions(user_id)"
    );
    await query(
      "CREATE INDEX IF NOT EXISTS idx_documents_user_id ON documents(user_id)"
    );
    await query(
      "CREATE INDEX IF NOT EXISTS idx_documents_created_at ON documents(created_at DESC)"
    );

    // Créer la fonction de mise à jour automatique
    await query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ language 'plpgsql'
    `);

    // Créer les triggers
    await query(`
      DROP TRIGGER IF EXISTS update_users_updated_at ON users;
      CREATE TRIGGER update_users_updated_at
        BEFORE UPDATE ON users
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column()
    `);

    await query(`
      DROP TRIGGER IF EXISTS update_documents_updated_at ON documents;
      CREATE TRIGGER update_documents_updated_at
        BEFORE UPDATE ON documents
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column()
    `);

    return true;
  } catch (error) {
    console.error("❌ Erreur lors de la réinitialisation:", error);
    return false;
  }
}

module.exports = { resetDatabase };
