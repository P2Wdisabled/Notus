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

  public async query<T = unknown>(text: string, params?: unknown[], retries: number = 3): Promise<QueryResult<T>> {
    const start = Date.now();
    let lastError: unknown;
    
    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        const res = await this.pool.query(text, params);
        const duration = Date.now() - start;
        return res;
      } catch (error: any) {
        lastError = error;
        
        // Retry on deadlock (PostgreSQL error code 40P01)
        if (error?.code === '40P01' && attempt < retries - 1) {
          const backoffMs = Math.min(100 * Math.pow(2, attempt), 1000);
          console.warn(`⚠️ Deadlock détecté, nouvelle tentative dans ${backoffMs}ms (tentative ${attempt + 1}/${retries})`);
          await new Promise(resolve => setTimeout(resolve, backoffMs));
          continue;
        }
        
        console.error("❌ Erreur de requête:", error);
        throw error;
      }
    }
    
    throw lastError;
  }

  /**
   * Acquire an advisory lock to serialize initialization operations.
   * Uses a hash of the class name to generate a unique lock ID.
   */
  protected async withAdvisoryLock<T>(operation: () => Promise<T>): Promise<T> {
    const lockId = this.getAdvisoryLockId();
    const client = await this.pool.connect();
    
    try {
      // Try to acquire the lock (non-blocking would be pg_advisory_lock_try, but we use blocking for safety)
      // We use pg_advisory_lock which blocks until the lock is available
      await client.query('SELECT pg_advisory_lock($1)', [lockId]);
      
      try {
        return await operation();
      } finally {
        // Always release the lock
        await client.query('SELECT pg_advisory_unlock($1)', [lockId]);
      }
    } finally {
      client.release();
    }
  }

  /**
   * Generate a unique advisory lock ID based on the class name.
   * Uses a simple hash function to convert the class name to a number.
   */
  private getAdvisoryLockId(): number {
    const className = this.constructor.name;
    let hash = 0;
    for (let i = 0; i < className.length; i++) {
      const char = className.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    // Use a large number range to avoid conflicts (PostgreSQL advisory locks use int8)
    // We'll use the lower 32 bits and add a base offset
    return Math.abs(hash) + 1000000;
  }

  // Méthode pour initialiser les tables (à implémenter dans les repositories spécialisés)
  abstract initializeTables(): Promise<void>;
}

export { pool };
