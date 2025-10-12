import { Pool, PoolClient } from "pg";

// Configuration de la connexion à la base de données
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

// Test de connexion
pool.on("connect", () => {});

pool.on("error", (err: Error) => {
  console.error("❌ Erreur de connexion PostgreSQL:", err);
  process.exit(-1);
});

// Types pour les données
export interface User {
  id: number;
  email: string;
  username: string;
  password_hash?: string;
  first_name: string;
  last_name: string;
  email_verified: boolean;
  email_verification_token?: string;
  provider?: string;
  provider_id?: string;
  created_at: Date;
  updated_at: Date;
  reset_token?: string;
  reset_token_expiry?: Date;
  is_admin: boolean;
  is_banned: boolean;
  terms_accepted_at?: Date;
  profile_image?: string;
  banner_image?: string;
}

export interface Document {
  id: number;
  user_id: number;
  title: string;
  content: string;
  tags: string[];
  created_at: Date;
  updated_at: Date;
  username?: string;
  first_name?: string;
  last_name?: string;
}

export interface UserSession {
  id: number;
  user_id: number;
  token_hash: string;
  expires_at: Date;
  created_at: Date;
}

export interface QueryResult<T = unknown> {
  rows: T[];
  rowCount: number | null;
}

// Fonction pour exécuter des requêtes
const query = async <T = unknown>(text: string, params?: unknown[]): Promise<QueryResult<T>> => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    return res;
  } catch (error) {
    console.error("❌ Erreur de requête:", error);
    throw error;
  }
};

// Fonction pour initialiser les tables
const initializeTables = async (): Promise<void> => {
  try {
    // Vérifier si on doit réinitialiser la base de données
    const shouldReset = process.env.RESET_DATABASE === "true";

    if (shouldReset) {
      const { resetDatabase } = require("./reset-database");
      await resetDatabase();
      // Continuer pour ajouter les colonnes OAuth
    }

    // Table des utilisateurs
    await query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        username VARCHAR(50) UNIQUE NOT NULL,
        password_hash VARCHAR(255),
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        email_verified BOOLEAN DEFAULT FALSE,
        email_verification_token VARCHAR(255),
        provider VARCHAR(50),
        provider_id VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Ajouter les colonnes OAuth si elles n'existent pas (pour les bases existantes)
    try {
      await query(`
        ALTER TABLE users 
        ADD COLUMN IF NOT EXISTS provider VARCHAR(50)
      `);
    } catch (error) {
      // Ignorer l'erreur si la colonne existe déjà
    }

    try {
      await query(`
        ALTER TABLE users 
        ADD COLUMN IF NOT EXISTS provider_id VARCHAR(255)
      `);
    } catch (error) {
      // Ignorer l'erreur si la colonne existe déjà
    }

    // Rendre password_hash nullable pour les utilisateurs OAuth
    try {
      await query(`
        ALTER TABLE users 
        ALTER COLUMN password_hash DROP NOT NULL
      `);
    } catch (error) {
      // Ignorer l'erreur si la colonne est déjà nullable
    }

    // Ajouter les colonnes pour la réinitialisation de mot de passe
    try {
      await query(`
        ALTER TABLE users 
        ADD COLUMN IF NOT EXISTS reset_token VARCHAR(255)
      `);
    } catch (error) {
      // Ignorer l'erreur si la colonne existe déjà
    }

    try {
      await query(`
        ALTER TABLE users 
        ADD COLUMN IF NOT EXISTS reset_token_expiry TIMESTAMP
      `);
    } catch (error) {
      // Ignorer l'erreur si la colonne existe déjà
    }

    // Ajouter les colonnes pour l'administration
    try {
      await query(`
        ALTER TABLE users 
        ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE
      `);
    } catch (error) {
      // Ignorer l'erreur si la colonne existe déjà
    }

    try {
      await query(`
        ALTER TABLE users 
        ADD COLUMN IF NOT EXISTS is_banned BOOLEAN DEFAULT FALSE
      `);
    } catch (error) {
      // Ignorer l'erreur si la colonne existe déjà
    }

    // Ajouter la colonne pour l'acceptation des conditions d'utilisation
    try {
      await query(`
        ALTER TABLE users 
        ADD COLUMN IF NOT EXISTS terms_accepted_at TIMESTAMP
      `);
    } catch (error) {
      // Ignorer l'erreur si la colonne existe déjà
    }

    // Ajouter les colonnes pour les images de profil et bannière
    try {
      await query(`
        ALTER TABLE users 
        ADD COLUMN IF NOT EXISTS profile_image TEXT
      `);
    } catch (error) {
      // Ignorer l'erreur si la colonne existe déjà
    }

    try {
      await query(`
        ALTER TABLE users 
        ADD COLUMN IF NOT EXISTS banner_image TEXT
      `);
    } catch (error) {
      // Ignorer l'erreur si la colonne existe déjà
    }

    // Table des sessions (pour JWT)
    await query(`
      CREATE TABLE IF NOT EXISTS user_sessions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        token_hash VARCHAR(255) NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Table des documents (anciennement notes)
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

    // Ajouter la colonne tags si base déjà existante
    try {
      await query(`
        ALTER TABLE documents
        ADD COLUMN IF NOT EXISTS tags TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[]
      `);
    } catch (error) {
      // Ignorer si déjà présent
    }

    // Index pour améliorer les performances
    await query(`
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)
    `);

    await query(`
      CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)
    `);

    await query(`
      CREATE INDEX IF NOT EXISTS idx_users_provider ON users(provider, provider_id)
    `);

    await query(`
      CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON user_sessions(user_id)
    `);

    await query(`
      CREATE INDEX IF NOT EXISTS idx_documents_user_id ON documents(user_id)
    `);

    await query(`
      CREATE INDEX IF NOT EXISTS idx_documents_created_at ON documents(created_at DESC)
    `);

    // Trigger pour mettre à jour updated_at automatiquement
    await query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ language 'plpgsql'
    `);

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
  } catch (error) {
    console.error("❌ Erreur lors de l'initialisation des tables:", error);
    throw error;
  }
};

// Suppression en masse de documents (seulement par leur créateur)
const deleteDocumentsBulk = async (userId: number, documentIds: (string | number)[]): Promise<{
  success: boolean;
  error?: string;
  deletedIds?: number[];
  deletedCount?: number;
  message?: string;
}> => {
  try {
    if (!Array.isArray(documentIds) || documentIds.length === 0) {
      return { success: false, error: "Aucun document sélectionné" };
    }

    // Forcer le typage en entiers et retirer les valeurs invalides
    const ids = documentIds
      .map((id) => parseInt(id.toString()))
      .filter((id) => !isNaN(id) && id > 0);

    if (ids.length === 0) {
      return { success: false, error: "Identifiants de documents invalides" };
    }

    const result = await query<{ id: number }>(
      `DELETE FROM documents
       WHERE user_id = $1 AND id = ANY($2::int[])
       RETURNING id`,
      [userId, ids]
    );

    return {
      success: true,
      deletedIds: result.rows.map((r) => r.id),
      deletedCount: result.rows.length,
      message: `${result.rows.length} document(s) supprimé(s) avec succès`,
    };
  } catch (error: unknown) {
    console.error("❌ Erreur suppression multiple documents:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

// Fonction pour vérifier la connexion
const testConnection = async (): Promise<boolean> => {
  try {
    const result = await query("SELECT NOW()");
    return true;
  } catch (error) {
    console.error("❌ Test de connexion échoué:", error);
    return false;
  }
};

// Fonction pour créer un utilisateur avec token de vérification
const createUser = async (userData: {
  email: string;
  username: string;
  password: string;
  firstName: string;
  lastName: string;
  verificationToken: string;
}): Promise<User> => {
  const { email, username, password, firstName, lastName, verificationToken } = userData;

  // Vérifier si l'email existe déjà
  const existingEmail = await query<{ id: number }>("SELECT id FROM users WHERE email = $1", [email]);

  if (existingEmail.rows.length > 0) {
    throw new Error("Cet email est déjà utilisé");
  }

  // Vérifier si le nom d'utilisateur existe déjà
  const existingUsername = await query<{ id: number }>(
    "SELECT id FROM users WHERE username = $1",
    [username]
  );

  if (existingUsername.rows.length > 0) {
    throw new Error("Ce nom d'utilisateur est déjà utilisé");
  }

  // Hacher le mot de passe
  const bcrypt = require("bcryptjs");
  const passwordHash = await bcrypt.hash(password, 12);

  // Insérer l'utilisateur avec la date d'acceptation des conditions
  const result = await query<User>(
    `INSERT INTO users (email, username, password_hash, first_name, last_name, email_verified, email_verification_token, terms_accepted_at)
     VALUES ($1, $2, $3, $4, $5, FALSE, $6, CURRENT_TIMESTAMP)
     RETURNING id, email, username, first_name, last_name, email_verified, email_verification_token, created_at, terms_accepted_at`,
    [email, username, passwordHash, firstName, lastName, verificationToken]
  );

  return result.rows[0];
};

// Fonction pour vérifier l'email d'un utilisateur
const verifyUserEmail = async (token: string): Promise<{
  success: boolean;
  error?: string;
  user?: {
    id: number;
    email: string;
    first_name: string;
  };
}> => {
  try {
    // Trouver l'utilisateur avec ce token
    const user = await query<{
      id: number;
      email: string;
      first_name: string;
      email_verified: boolean;
    }>(
      "SELECT id, email, first_name, email_verified FROM users WHERE email_verification_token = $1",
      [token]
    );

    if (user.rows.length === 0) {
      throw new Error("Token de vérification invalide");
    }

    if (user.rows[0].email_verified) {
      throw new Error("Email déjà vérifié");
    }

    // Marquer l'email comme vérifié et supprimer le token
    await query(
      "UPDATE users SET email_verified = TRUE, email_verification_token = NULL WHERE id = $1",
      [user.rows[0].id]
    );

    return {
      success: true,
      user: {
        id: user.rows[0].id,
        email: user.rows[0].email,
        first_name: user.rows[0].first_name,
      },
    };
  } catch (error: unknown) {
    console.error("❌ Erreur vérification email:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

// Fonction pour créer un document
const createDocument = async (
  userId: number,
  title: string = "Sans titre",
  content: string = "",
  tags: string[] = []
): Promise<{
  success: boolean;
  error?: string;
  document?: Document;
}> => {
  try {
    const result = await query<Document>(
      `INSERT INTO documents (user_id, title, content, tags)
       VALUES ($1, $2, $3, $4)
       RETURNING id, title, content, tags, created_at, updated_at, user_id`,
      [userId, title, content, tags]
    );

    return {
      success: true,
      document: result.rows[0],
    };
  } catch (error: unknown) {
    console.error("❌ Erreur création document:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

// Fonction pour créer ou mettre à jour une note (évite les doublons)
const createOrUpdateNote = async (userId: number, content: string): Promise<{
  success: boolean;
  error?: string;
  document?: Document;
  isUpdate?: boolean;
}> => {
  try {
    // Vérifier s'il existe déjà une note pour cet utilisateur aujourd'hui
    const today = new Date().toISOString().split("T")[0]; // Format YYYY-MM-DD
    const existingNote = await query<{ id: number; content: string }>(
      `SELECT id, content FROM documents 
       WHERE user_id = $1 AND title LIKE $2 AND DATE(created_at) = $3
       ORDER BY created_at DESC LIMIT 1`,
      [userId, `Note du %`, today]
    );

    if (existingNote.rows.length > 0) {
      // Mettre à jour la note existante
      const result = await query<Document>(
        `UPDATE documents 
         SET content = $1, updated_at = CURRENT_TIMESTAMP
         WHERE id = $2 AND user_id = $3
         RETURNING id, title, content, created_at, updated_at, user_id, tags`,
        [content, existingNote.rows[0].id, userId]
      );

      return {
        success: true,
        document: result.rows[0],
        isUpdate: true,
      };
    } else {
      // Créer une nouvelle note
      const title = `Note du ${new Date().toLocaleDateString("fr-FR")}`;
      const result = await query<Document>(
        `INSERT INTO documents (user_id, title, content)
         VALUES ($1, $2, $3)
         RETURNING id, title, content, created_at, updated_at, user_id, tags`,
        [userId, title, content]
      );

      return {
        success: true,
        document: result.rows[0],
        isUpdate: false,
      };
    }
  } catch (error: unknown) {
    console.error("❌ Erreur création/mise à jour note:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

// Fonction pour créer ou mettre à jour un document (évite les doublons)
const createOrUpdateDocument = async (
  userId: number,
  title: string,
  content: string,
  tags: string[] | undefined = undefined
): Promise<{
  success: boolean;
  error?: string;
  document?: Document;
  isUpdate?: boolean;
}> => {
  try {
    // Vérifier s'il existe déjà un document "en cours" pour cet utilisateur
    // Un document est considéré "en cours" s'il a été créé dans les dernières 24h
    const existingDocument = await query<{ id: number; title: string; content: string }>(
      `SELECT id, title, content FROM documents 
       WHERE user_id = $1 AND created_at > NOW() - INTERVAL '24 hours'
       ORDER BY created_at DESC LIMIT 1`,
      [userId]
    );

    if (existingDocument.rows.length > 0) {
      // Mettre à jour le document existant
      const updateFields = ["title = $1", "content = $2"];
      const values: unknown[] = [title, content, existingDocument.rows[0].id, userId];
      if (Array.isArray(tags)) {
        updateFields.push(`tags = $3`);
        values.splice(2, 0, tags); // insère tags en 3e position
      }

      const result = await query<Document>(
        `UPDATE documents 
         SET ${updateFields.join(", ")}, updated_at = CURRENT_TIMESTAMP
         WHERE id = $${values.length - 1} AND user_id = $${values.length}
         RETURNING id, title, content, tags, created_at, updated_at, user_id`,
        values
      );

      return {
        success: true,
        document: result.rows[0],
        isUpdate: true,
      };
    } else {
      // Créer un nouveau document
      const result = await query<Document>(
        `INSERT INTO documents (user_id, title, content, tags)
         VALUES ($1, $2, $3, $4)
         RETURNING id, title, content, tags, created_at, updated_at, user_id`,
        [userId, title, content, Array.isArray(tags) ? tags : []]
      );

      return {
        success: true,
        document: result.rows[0],
        isUpdate: false,
      };
    }
  } catch (error: unknown) {
    console.error("❌ Erreur création/mise à jour document:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

// Fonction pour récupérer les documents d'un utilisateur
const getUserDocuments = async (userId: number, limit: number = 20, offset: number = 0): Promise<{
  success: boolean;
  error?: string;
  documents?: Document[];
}> => {
  try {
    const result = await query<Document>(
      `SELECT d.id, d.user_id, d.title, d.content, d.tags, d.created_at, d.updated_at, u.username, u.first_name, u.last_name
       FROM documents d
       JOIN users u ON d.user_id = u.id
       WHERE d.user_id = $1
       ORDER BY d.updated_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );

    return {
      success: true,
      documents: result.rows,
    };
  } catch (error: unknown) {
    console.error("❌ Erreur récupération documents:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

// Fonction pour récupérer tous les documents (fil d'actualité)
const getAllDocuments = async (limit: number = 20, offset: number = 0): Promise<{
  success: boolean;
  error?: string;
  documents?: Document[];
}> => {
  try {
    const result = await query<Document>(
      `SELECT d.id, d.user_id, d.title, d.content, d.tags, d.created_at, d.updated_at, u.username, u.first_name, u.last_name
       FROM documents d
       JOIN users u ON d.user_id = u.id
       ORDER BY d.updated_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    return {
      success: true,
      documents: result.rows,
    };
  } catch (error: unknown) {
    console.error("❌ Erreur récupération tous les documents:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

// Fonction pour récupérer un document par ID
const getDocumentById = async (documentId: number): Promise<{
  success: boolean;
  error?: string;
  document?: Document;
}> => {
  try {
    const result = await query<Document>(
      `SELECT d.id, d.title, d.content, d.tags, d.created_at, d.updated_at, u.username, u.first_name, u.last_name, d.user_id
       FROM documents d
       JOIN users u ON d.user_id = u.id
       WHERE d.id = $1`,
      [documentId]
    );

    if (result.rows.length === 0) {
      return {
        success: false,
        error: "Document non trouvé",
      };
    }

    return {
      success: true,
      document: result.rows[0],
    };
  } catch (error: unknown) {
    console.error("❌ Erreur récupération document:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

// Fonction pour mettre à jour un document
const updateDocument = async (
  documentId: number,
  userId: number,
  title: string,
  content: string,
  tags: string[] | undefined = undefined
): Promise<{
  success: boolean;
  error?: string;
  document?: Document;
}> => {
  try {
    const updateFields = ["title = $1", "content = $2"];
    const values: unknown[] = [title, content, documentId, userId];
    if (Array.isArray(tags)) {
      updateFields.push(`tags = $3`);
      values.splice(2, 0, tags);
    }

    const result = await query<Document>(
      `UPDATE documents 
       SET ${updateFields.join(", ")}, updated_at = CURRENT_TIMESTAMP
       WHERE id = $${values.length - 1} AND user_id = $${values.length}
       RETURNING id, title, content, tags, updated_at, user_id, created_at`,
      values
    );

    if (result.rows.length === 0) {
      return {
        success: false,
        error: "Document non trouvé ou vous n'êtes pas autorisé à le modifier",
      };
    }

    return {
      success: true,
      document: result.rows[0],
    };
  } catch (error: unknown) {
    console.error("❌ Erreur mise à jour document:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

// Fonction pour créer ou mettre à jour un document avec ID spécifique (pour l'édition)
const createOrUpdateDocumentById = async (
  documentId: number | null,
  userId: number,
  title: string,
  content: string,
  tags: string[] | undefined = undefined
): Promise<{
  success: boolean;
  error?: string;
  document?: Document;
  isUpdate?: boolean;
}> => {
  try {
    if (documentId) {
      // Mettre à jour le document existant
      const updateFields = ["title = $1", "content = $2"];
      const values: unknown[] = [title, content, documentId, userId];
      if (Array.isArray(tags)) {
        updateFields.push(`tags = $3`);
        values.splice(2, 0, tags);
      }

      const result = await query<Document>(
        `UPDATE documents 
         SET ${updateFields.join(", ")}, updated_at = CURRENT_TIMESTAMP
         WHERE id = $${values.length - 1} AND user_id = $${values.length}
         RETURNING id, title, content, tags, created_at, updated_at, user_id`,
        values
      );

      if (result.rows.length === 0) {
        return {
          success: false,
          error: "Document non trouvé ou vous n'êtes pas autorisé à le modifier",
        };
      }

      return {
        success: true,
        document: result.rows[0],
        isUpdate: true,
      };
    } else {
      // Créer un nouveau document
      const result = await query<Document>(
        `INSERT INTO documents (user_id, title, content, tags)
         VALUES ($1, $2, $3, $4)
         RETURNING id, title, content, tags, created_at, updated_at, user_id`,
        [userId, title, content, Array.isArray(tags) ? tags : []]
      );

      return {
        success: true,
        document: result.rows[0],
        isUpdate: false,
      };
    }
  } catch (error: unknown) {
    console.error("❌ Erreur création/mise à jour document par ID:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

// Mettre à jour les informations du profil utilisateur
const updateUserProfile = async (userId: number, fields: {
  email?: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  profileImage?: string;
  bannerImage?: string;
}): Promise<{
  success: boolean;
  error?: string;
  user?: User;
}> => {
  try {
    const updates: string[] = [];
    const values: unknown[] = [];
    let index = 1;

    if (Object.prototype.hasOwnProperty.call(fields, "email")) {
      updates.push(`email = $${index++}`);
      values.push(fields.email);
    }
    if (Object.prototype.hasOwnProperty.call(fields, "username")) {
      updates.push(`username = $${index++}`);
      values.push(fields.username);
    }
    if (Object.prototype.hasOwnProperty.call(fields, "firstName")) {
      updates.push(`first_name = $${index++}`);
      values.push(fields.firstName);
    }
    if (Object.prototype.hasOwnProperty.call(fields, "lastName")) {
      updates.push(`last_name = $${index++}`);
      values.push(fields.lastName);
    }
    if (Object.prototype.hasOwnProperty.call(fields, "profileImage")) {
      updates.push(`profile_image = $${index++}`);
      values.push(fields.profileImage);
    }
    if (Object.prototype.hasOwnProperty.call(fields, "bannerImage")) {
      updates.push(`banner_image = $${index++}`);
      values.push(fields.bannerImage);
    }

    if (updates.length === 0) {
      return { success: false, error: "Aucun champ à mettre à jour" };
    }

    // Always touch updated_at
    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(userId);

    const result = await query<User>(
      `UPDATE users SET ${updates.join(", ")}
       WHERE id = $${index}
       RETURNING id, email, username, first_name, last_name, profile_image, banner_image, updated_at, created_at, password_hash, email_verified, email_verification_token, provider, provider_id, reset_token, reset_token_expiry, is_admin, is_banned, terms_accepted_at`,
      values
    );

    if (result.rows.length === 0) {
      return { success: false, error: "Utilisateur non trouvé" };
    }

    return { success: true, user: result.rows[0] };
  } catch (error: unknown) {
    // Gérer les violations d'unicité (email/username)
    if (error && error.code === "23505") {
      const detail = String(error.detail || "");
      if (detail.includes("users_email_key") || detail.includes("(email)")) {
        return { success: false, error: "Cet email est déjà utilisé" };
      }
      if (
        detail.includes("users_username_key") ||
        detail.includes("(username)")
      ) {
        return {
          success: false,
          error: "Ce nom d'utilisateur est déjà utilisé",
        };
      }
    }
    console.error("❌ Erreur mise à jour profil:", error);
    return { success: false, error: error.message };
  }
};

// Fonction pour supprimer un document (seulement par son créateur)
const deleteDocument = async (documentId: number, userId: number): Promise<{
  success: boolean;
  error?: string;
  message?: string;
}> => {
  try {
    const result = await query<{ id: number }>(
      `DELETE FROM documents 
       WHERE id = $1 AND user_id = $2
       RETURNING id`,
      [documentId, userId]
    );

    if (result.rows.length === 0) {
      return {
        success: false,
        error: "Document non trouvé ou vous n'êtes pas autorisé à le supprimer",
      };
    }

    return {
      success: true,
      message: "Document supprimé avec succès",
    };
  } catch (error: unknown) {
    console.error("❌ Erreur suppression document:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

// Fonction pour récupérer tous les utilisateurs (admin)
const getAllUsers = async (limit: number = 50, offset: number = 0): Promise<{
  success: boolean;
  error?: string;
  users?: User[];
}> => {
  try {
    const result = await query<User>(
      `SELECT id, email, username, first_name, last_name, email_verified, 
              is_admin, is_banned, created_at, updated_at, provider, terms_accepted_at,
              profile_image, banner_image, password_hash, email_verification_token, provider_id, reset_token, reset_token_expiry
       FROM users
       ORDER BY created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    return {
      success: true,
      users: result.rows,
    };
  } catch (error: unknown) {
    console.error("❌ Erreur récupération utilisateurs:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

// Fonction pour bannir/débannir un utilisateur (admin)
const toggleUserBan = async (userId: number, isBanned: boolean): Promise<{
  success: boolean;
  error?: string;
  user?: {
    id: number;
    email: string;
    username: string;
    is_banned: boolean;
  };
}> => {
  try {
    const result = await query<{
      id: number;
      email: string;
      username: string;
      is_banned: boolean;
    }>(
      `UPDATE users 
       SET is_banned = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING id, email, username, is_banned`,
      [isBanned, userId]
    );

    if (result.rows.length === 0) {
      return {
        success: false,
        error: "Utilisateur non trouvé",
      };
    }

    return {
      success: true,
      user: result.rows[0],
    };
  } catch (error: unknown) {
    console.error("❌ Erreur bannissement utilisateur:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

// Fonction pour promouvoir/rétrograder un utilisateur admin (admin)
const toggleUserAdmin = async (userId: number, isAdmin: boolean): Promise<{
  success: boolean;
  error?: string;
  user?: {
    id: number;
    email: string;
    username: string;
    is_admin: boolean;
  };
}> => {
  try {
    const result = await query<{
      id: number;
      email: string;
      username: string;
      is_admin: boolean;
    }>(
      `UPDATE users 
       SET is_admin = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING id, email, username, is_admin`,
      [isAdmin, userId]
    );

    if (result.rows.length === 0) {
      return {
        success: false,
        error: "Utilisateur non trouvé",
      };
    }

    return {
      success: true,
      user: result.rows[0],
    };
  } catch (error: unknown) {
    console.error("❌ Erreur changement statut admin:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

// Fonction pour vérifier si un utilisateur est admin
const isUserAdmin = async (userId: number): Promise<boolean> => {
  try {
    const result = await query<{ is_admin: boolean }>(`SELECT is_admin FROM users WHERE id = $1`, [userId]);

    if (result.rows.length === 0) {
      return false;
    }

    return result.rows[0].is_admin === true;
  } catch (error) {
    console.error("❌ Erreur vérification statut admin:", error);
    return false;
  }
};

export {
  pool,
  query,
  initializeTables,
  testConnection,
  createUser,
  verifyUserEmail,
  createDocument,
  createOrUpdateNote,
  createOrUpdateDocument,
  createOrUpdateDocumentById,
  getUserDocuments,
  getAllDocuments,
  getDocumentById,
  updateDocument,
  deleteDocument,
  deleteDocumentsBulk,
  // Fonctions profil utilisateur
  updateUserProfile,
  // Fonctions admin
  getAllUsers,
  toggleUserBan,
  toggleUserAdmin,
  isUserAdmin,
};

// Anciennes fonctions pour compatibilité
export const createNote = createDocument;
export const getUserNotes = getUserDocuments;
export const getAllNotes = getAllDocuments;
export const deleteNote = deleteDocument;
