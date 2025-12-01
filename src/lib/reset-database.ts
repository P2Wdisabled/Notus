import { Pool } from "pg";

// Configuration de la connexion à la base de données
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

// Fonction pour vider et réinitialiser la base de données
async function resetDatabase(): Promise<boolean> {
  try {
    
    // Supprimer les tables dans l'ordre inverse de création (pour éviter les contraintes de clés étrangères)
    await pool.query("DROP TABLE IF EXISTS documents CASCADE");
    await pool.query("DROP TABLE IF EXISTS users CASCADE");

    // Supprimer la fonction si elle existe
    await pool.query("DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE");

    // Recréer les tables
    await pool.query(`
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


    await pool.query(`
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
    await pool.query("CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)");
    await pool.query(
      "CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)"
    );
    await pool.query(
      "CREATE INDEX IF NOT EXISTS idx_documents_user_id ON documents(user_id)"
    );
    await pool.query(
      "CREATE INDEX IF NOT EXISTS idx_documents_created_at ON documents(created_at DESC)"
    );

    // Créer la fonction de mise à jour automatique
    // Ne met pas à jour updated_at si seul le champ favori a été modifié
    await pool.query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        -- Ne pas mettre à jour updated_at si seul le champ favori a changé
        IF (OLD.favori IS DISTINCT FROM NEW.favori) AND
           (OLD.title IS NOT DISTINCT FROM NEW.title) AND
           (OLD.content IS NOT DISTINCT FROM NEW.content) AND
           (OLD.tags IS NOT DISTINCT FROM NEW.tags) AND
           (OLD.user_id IS NOT DISTINCT FROM NEW.user_id) THEN
          -- Seul favori a changé, préserver updated_at
          NEW.updated_at = OLD.updated_at;
        ELSE
          -- D'autres champs ont changé, mettre à jour updated_at
          NEW.updated_at = CURRENT_TIMESTAMP;
        END IF;
        RETURN NEW;
      END;
      $$ language 'plpgsql'
    `);

    // Créer les triggers
    await pool.query(`
      DROP TRIGGER IF EXISTS update_users_updated_at ON users;
      CREATE TRIGGER update_users_updated_at
        BEFORE UPDATE ON users
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column()
    `);

    await pool.query(`
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

export { resetDatabase };
