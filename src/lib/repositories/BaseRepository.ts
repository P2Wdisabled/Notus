import { Pool } from "pg";
import { QueryResult } from "../types";

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

// Classe de base pour les repositories
export abstract class BaseRepository {
  protected pool = pool;

  public async query<T = unknown>(text: string, params?: unknown[]): Promise<QueryResult<T>> {
    const start = Date.now();
    try {
      const res = await this.pool.query(text, params);
      const duration = Date.now() - start;
      return res;
    } catch (error) {
      console.error("❌ Erreur de requête:", error);
      throw error;
    }
  }

  // Méthode pour initialiser les tables (à implémenter dans les repositories spécialisés)
  abstract initializeTables(): Promise<void>;
}

export { pool };
