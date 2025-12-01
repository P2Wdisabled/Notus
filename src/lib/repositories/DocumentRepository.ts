import { BaseRepository } from "./BaseRepository";
import { Document, CreateDocumentData, UpdateDocumentData, DocumentRepositoryResult } from "../types";

export class DocumentRepository extends BaseRepository {
  async initializeTables(): Promise<void> {
    if (!process.env.DATABASE_URL) {
      return;
    }

    return this.ensureInitialized(async () => {
      try {
        await this.withAdvisoryLock(async () => {
          // Table des documents
          await this.query(`
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

          // Table des partages (shares)
          await this.query(`
            CREATE TABLE IF NOT EXISTS shares (
              id SERIAL PRIMARY KEY,
              id_doc INTEGER REFERENCES documents(id) ON DELETE CASCADE,
              email VARCHAR(255) NOT NULL,
              permission BOOLEAN NOT NULL DEFAULT FALSE,
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
          `);

          // Table des documents supprimés (trash)
          await this.query(`
            CREATE TABLE IF NOT EXISTS trash_documents (
              id SERIAL PRIMARY KEY,
              user_id INTEGER,
              title VARCHAR(255) NOT NULL,
              content TEXT NOT NULL DEFAULT '',
              tags TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              deleted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              original_id INTEGER
            )
          `);

          // Table d'historique des documents (pour suivre les modifications successives)
          await this.query(`
            CREATE TABLE IF NOT EXISTS document_history (
              id SERIAL PRIMARY KEY,
              document_id INTEGER REFERENCES documents(id) ON DELETE CASCADE,
              user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
              user_email VARCHAR(255),
              snapshot_before TEXT,
              snapshot_after TEXT NOT NULL,
              diff_added TEXT,
              diff_removed TEXT,
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
          `);

          // Ajouter la colonne tags si base déjà existante
          await this.addColumnIfNotExists("documents", "tags", "TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[]");

          // Créer les index
          await this.createIndexes();

          // Créer les triggers
          await this.createTriggers();
        });
      } catch (error) {
        console.error("❌ Erreur lors de l'initialisation des tables documents:", error);
        throw error;
      }
    });
  }

  private async addColumnIfNotExists(tableName: string, columnName: string, columnDefinition: string): Promise<void> {
    try {
      await this.query(`ALTER TABLE ${tableName} ADD COLUMN IF NOT EXISTS ${columnName} ${columnDefinition}`);
    } catch (error) {
      // Ignorer l'erreur si la colonne existe déjà
    }
  }

  private async createIndexes(): Promise<void> {
    const indexes = [
      "CREATE INDEX IF NOT EXISTS idx_documents_user_id ON documents(user_id)",
      "CREATE INDEX IF NOT EXISTS idx_documents_created_at ON documents(created_at DESC)"
    ];

    // Indexes for shares table (unique constraint for ON CONFLICT)
    indexes.push("CREATE UNIQUE INDEX IF NOT EXISTS uq_shares_id_doc_email ON shares(id_doc, email)");
    indexes.push("CREATE INDEX IF NOT EXISTS idx_shares_email ON shares(email)");

    // Indexes pour l'historique des documents
    indexes.push("CREATE INDEX IF NOT EXISTS idx_document_history_document_id ON document_history(document_id)");

    for (const indexQuery of indexes) {
      await this.query(indexQuery);
    }
  }

  private async createTriggers(): Promise<void> {
    // Fonction pour mettre à jour updated_at
    // Ne met pas à jour updated_at si seul le champ favori a été modifié
    // Create function first (this is idempotent with CREATE OR REPLACE)
    await this.query(`
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

    // Trigger pour documents
    // Use a single transaction-safe approach: drop if exists, then create
    // The advisory lock ensures this is serialized, preventing deadlocks
    await this.query(`
      DROP TRIGGER IF EXISTS update_documents_updated_at ON documents;
      CREATE TRIGGER update_documents_updated_at
        BEFORE UPDATE ON documents
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column()
    `);
  }

  async createDocument(data: CreateDocumentData): Promise<DocumentRepositoryResult<Document>> {
    try {
      const { userId, title, content, tags } = data;

      const result = await this.query<Document>(
        `INSERT INTO documents (user_id, title, content, tags, updated_at)
         VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
         RETURNING id, title, content, tags, created_at, updated_at, user_id`,
        [userId, title, content, tags]
      );

      const document = result.rows[0];
      return { success: true, document };
    } catch (error) {
      console.error("❌ Erreur création document:", error);
      return { success: false, error: error instanceof Error ? error.message : "Erreur inconnue" };
    }
  }

  async getUserDocuments(userId: number, limit: number = 20, offset: number = 0): Promise<DocumentRepositoryResult<Document[]>> {
    try {
      const result = await this.query(
        `SELECT 
            d.id,
            d.user_id,
            d.title,
            d.content,
            d.tags,
            d.favori,
            d.created_at,
            d.updated_at,
            u.username,
            u.first_name,
            u.last_name,
            COALESCE(
              json_agg(
                DISTINCT jsonb_build_object('email', s.email, 'permission', s.permission)
              ) FILTER (WHERE s.id IS NOT NULL),
              '[]'
            ) AS shared_with,
            COALESCE(
              json_agg(DISTINCT dd.dossier_id) FILTER (WHERE dd.dossier_id IS NOT NULL),
              '[]'
            ) AS dossier_ids
         FROM documents d
         JOIN users u ON d.user_id = u.id
         LEFT JOIN shares s ON s.id_doc = d.id
         LEFT JOIN dossier_documents dd ON dd.document_id = d.id
         WHERE d.user_id = $1
         GROUP BY d.id, d.user_id, d.title, d.content, d.tags, d.favori, d.created_at, d.updated_at, u.username, u.first_name, u.last_name
         ORDER BY d.updated_at DESC
         LIMIT $2 OFFSET $3`,
        [userId, limit, offset]
      );

      interface JsonSerializable {
        toJSON(): unknown;
      }

      const parseJsonArray = (raw: unknown): unknown[] => {
        if (Array.isArray(raw)) return raw;
        if (typeof raw === "string") {
          try {
            return JSON.parse(raw);
          } catch (e) {
            return [];
          }
        }
        if (raw && typeof raw === "object" && "toJSON" in raw) {
          try {
            const asJson = (raw as JsonSerializable).toJSON();
            return Array.isArray(asJson) ? asJson : [];
          } catch {
            return [];
          }
        }
        return [];
      };

      interface DatabaseRow {
        id: number;
        user_id: number;
        title: string;
        content: string;
        tags: string[];
        created_at: Date;
        updated_at: Date;
        username?: string | null;
        first_name?: string | null;
        last_name?: string | null;
        favori?: boolean | null;
        shared_with: unknown;
        dossier_ids: unknown;
      }

      const documents: Document[] = (result.rows as DatabaseRow[]).map((row) => {
        const sharedWithRaw = parseJsonArray(row.shared_with);
        interface SharedEntry {
          email?: unknown;
          permission?: unknown;
        }
        const sharedWith = sharedWithRaw
          .map((entry: unknown) => {
            const typed = entry as SharedEntry;
            return {
              email: typeof typed?.email === "string" ? typed.email : null,
              permission: typeof typed?.permission === "boolean" ? typed.permission : Boolean(typed?.permission),
            };
          })
          .filter((entry) => Boolean(entry.email)) as { email: string; permission: boolean }[];

        const dossierIds = parseJsonArray(row.dossier_ids)
          .map((id) => Number(id))
          .filter((id) => !Number.isNaN(id));

        return {
          id: row.id,
          user_id: row.user_id,
          title: row.title,
          content: row.content,
          tags: row.tags || [],
          created_at: row.created_at,
          updated_at: row.updated_at,
          username: row.username ?? undefined,
          first_name: row.first_name ?? undefined,
          last_name: row.last_name ?? undefined,
          sharedWith,
          dossierIds,
          favori: row.favori ?? null,
          shared: sharedWith.length > 0,
        } as Document;
      });

      return { success: true, documents };
    } catch (error) {
      console.error("❌ Erreur récupération documents:", error);
      return { success: false, error: error instanceof Error ? error.message : "Erreur inconnue" };
    }
  }

  async getDocumentById(documentId: number): Promise<DocumentRepositoryResult<Document>> {
    try {
      const result = await this.query<Document>(
        `SELECT d.id, d.title, d.content, d.tags, d.created_at, d.updated_at, u.username, u.first_name, u.last_name, d.user_id
         FROM documents d
         JOIN users u ON d.user_id = u.id
         WHERE d.id = $1`,
        [documentId]
      );

      if (result.rows.length === 0) {
        return { success: false, error: "Document non trouvé" };
      }

      return { success: true, document: result.rows[0] };
    } catch (error) {
      console.error("❌ Erreur récupération document:", error);
      return { success: false, error: error instanceof Error ? error.message : "Erreur inconnue" };
    }
  }

  async updateDocument(data: UpdateDocumentData): Promise<DocumentRepositoryResult<Document>> {
    try {
      const { documentId, userId, title, content, tags } = data;

      const result = await this.query<Document>(
        `UPDATE documents 
         SET title = $1, content = $2, tags = $3, updated_at = CURRENT_TIMESTAMP
         WHERE id = $4 AND user_id = $5
         RETURNING id, title, content, tags, created_at, updated_at, user_id`,
        [title, content, tags, documentId, userId]
      );

      if (result.rows.length === 0) {
        return { success: false, error: "Document non trouvé ou vous n'êtes pas autorisé à le modifier" };
      }

      return { success: true, document: result.rows[0] };
    } catch (error) {
      console.error("❌ Erreur mise à jour document:", error);
      return { success: false, error: error instanceof Error ? error.message : "Erreur inconnue" };
    }
  }

  async createOrUpdateDocumentById(
    documentId: number | null,
    userId: number,
    title: string,
    content: string,
    tags: string[] | undefined = undefined,
    userEmail?: string
  ): Promise<DocumentRepositoryResult<Document>> {
    try {
      if (documentId) {
        const updateFields = ["title = $1", "content = $2"];
        const values: unknown[] = [title, content, documentId, userId];
        if (Array.isArray(tags)) {
          updateFields.push(`tags = $3`);
          values.splice(2, 0, tags);
        }

        let whereClause = `WHERE id = $${values.length - 1} AND user_id = $${values.length}`;

        // Si un email est fourni, vérifier aussi les permissions de partage
        if (userEmail) {
          whereClause = `WHERE id = $${values.length - 1} AND (
            user_id = $${values.length} OR 
            EXISTS (
              SELECT 1 FROM shares 
              WHERE id_doc = $${values.length - 1} 
              AND lower(trim(email)) = lower(trim($${values.length + 1})) 
              AND permission = true
            )
          )`;
          values.push(userEmail);
        }

        const result = await this.query<Document>(
          `UPDATE documents 
           SET ${updateFields.join(", ")}, updated_at = CURRENT_TIMESTAMP
           ${whereClause}
           RETURNING id, title, content, tags, created_at, updated_at, user_id`,
          values
        );

        if (result.rows.length === 0) {
          return { success: false, error: "Document non trouvé ou vous n'êtes pas autorisé à le modifier" };
        }

        return { success: true, document: result.rows[0] };
      } else {
        const result = await this.query<Document>(
          `INSERT INTO documents (user_id, title, content, tags, updated_at)
           VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
           RETURNING id, title, content, tags, created_at, updated_at, user_id`,
          [userId, title, content, Array.isArray(tags) ? tags : []]
        );

        return { success: true, document: result.rows[0] };
      }
    } catch (error) {
      console.error("❌ Erreur création/mise à jour document par ID:", error);
      return { success: false, error: error instanceof Error ? error.message : "Erreur inconnue" };
    }
  }

  async deleteDocument(documentId: number, userId: number): Promise<DocumentRepositoryResult<{ id: number }>> {
    try {
      const document = await this.query<Document>(
        `SELECT * FROM documents WHERE id = $1 AND user_id = $2`,
        [documentId, userId]
      );

      if (document.rows.length === 0) {
        return { success: false, error: "Document non trouvé ou vous n'êtes pas autorisé à le supprimer" };
      }

      const doc = document.rows[0];

      // 2. Insérer dans la table de corbeille
      await this.query(
        `INSERT INTO trash_documents (user_id, title, content, tags, created_at, updated_at, deleted_at, original_id)
       VALUES ($1, $2, $3, $4, $5, $6, NOW(), $7)`,
        [doc.user_id, doc.title, doc.content, doc.tags, doc.created_at, doc.updated_at, doc.id]
      );

      // 3. Supprimer de la table principale
      const result = await this.query<{ id: number }>(
        `DELETE FROM documents 
         WHERE id = $1 AND user_id = $2
         RETURNING id`,
        [documentId, userId]
      );


      return { success: true, data: result.rows[0] };
    } catch (error) {
      console.error("❌ Erreur suppression document:", error);
      return { success: false, error: error instanceof Error ? error.message : "Erreur inconnue" };
    }
  }

  async deleteDocumentsBulk(userId: number, documentIds: (string | number)[]): Promise<DocumentRepositoryResult<{ deletedIds: number[]; deletedCount: number }>> {
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

      // 1. Récupérer tous les documents avant suppression
      const documents = await this.query<Document>(
        `SELECT * FROM documents 
         WHERE user_id = $1 AND id = ANY($2::int[])`,
        [userId, ids]
      );

      if (documents.rows.length === 0) {
        return { success: false, error: "Aucun document trouvé ou vous n'êtes pas autorisé à les supprimer" };
      }

      // 2. Insérer tous les documents dans la table de corbeille en une seule requête
      const trashValues = documents.rows.map((doc, index) =>
        `($${index * 8 + 1}, $${index * 8 + 2}, $${index * 8 + 3}, $${index * 8 + 4}, $${index * 8 + 5}, $${index * 8 + 6}, NOW(), $${index * 8 + 7})`
      ).join(', ');

      const trashParams: (number | string | string[] | Date | null)[] = [];
      documents.rows.forEach((doc) => {
        trashParams.push(
          doc.user_id,
          doc.title,
          doc.content,
          doc.tags,
          doc.created_at,
          doc.updated_at,
          doc.id // original_id
        );
      });

      await this.query(
        `INSERT INTO trash_documents (user_id, title, content, tags, created_at, updated_at, deleted_at, original_id)
         VALUES ${trashValues}`,
        trashParams
      );

      // 3. Supprimer de la table principale
      const result = await this.query<{ id: number }>(
        `DELETE FROM documents
         WHERE user_id = $1 AND id = ANY($2::int[])
         RETURNING id`,
        [userId, ids]
      );

      return {
        success: true,
        data: {
          deletedIds: result.rows.map((r) => r.id),
          deletedCount: result.rows.length,
        },
      };
    } catch (error) {
      console.error("❌ Erreur suppression multiple documents:", error);
      return { success: false, error: error instanceof Error ? error.message : "Erreur inconnue" };
    }
  }

  async fetchSharedWithUser(email: string): Promise<DocumentRepositoryResult<Document[]>> {
    try {
      const result = await this.query<Document & { favori: boolean | null }>(
        `SELECT d.id, d.title, d.content, d.tags, d.created_at, d.updated_at, u.username, u.first_name, u.last_name, d.user_id,
                s.favori as favori
           FROM documents d
           JOIN users u ON d.user_id = u.id
           JOIN shares s ON s.id_doc = d.id
           WHERE lower(trim(s.email)) = lower(trim($1))`,
        [email]
      );
      // Inject favori from share link
      interface SharedDocumentRow extends Document {
        favori: boolean | null;
      }
      const docs: Document[] = result.rows.map((r: SharedDocumentRow) => ({ ...r, favori: r.favori ?? null }));
      return { success: true, documents: docs };
    } catch (error) {
      console.error("❌ Erreur récupération documents partagés:", error);
      return { success: false, error: error instanceof Error ? error.message : "Erreur inconnue" };
    }
  }

  async fetchSharedByUser(userId: number): Promise<DocumentRepositoryResult<Document[]>> {
    try {
      const result = await this.query(
        `SELECT d.id, d.title, d.content, d.tags, d.created_at, d.updated_at, u.username, u.first_name, u.last_name, d.user_id,
                array_agg(s.email) as shared_emails, array_agg(s.permission) as shared_permissions
           FROM documents d
           JOIN users u ON d.user_id = u.id
           JOIN shares s ON s.id_doc = d.id
           WHERE d.user_id = $1
           GROUP BY d.id, d.title, d.content, d.tags, d.created_at, d.updated_at, u.username, u.first_name, u.last_name, d.user_id
           ORDER BY d.updated_at DESC`,
        [userId]
      );

      // Transformer les résultats pour inclure les informations de partage
      interface SharedByUserRow {
        id: number;
        user_id: number;
        title: string;
        content: string;
        tags: string[];
        created_at: Date;
        updated_at: Date;
        username?: string | null;
        first_name?: string | null;
        last_name?: string | null;
        shared_emails: string[] | string;
        shared_permissions: boolean[] | boolean;
      }

      const transformedDocuments: Document[] = (result.rows as SharedByUserRow[]).map((doc) => {
        // Parse arrays if they come as strings from PostgreSQL
        const sharedEmails = Array.isArray(doc.shared_emails) ? doc.shared_emails : (typeof doc.shared_emails === 'string' ? [doc.shared_emails] : []);
        const sharedPermissions = Array.isArray(doc.shared_permissions) ? doc.shared_permissions : (typeof doc.shared_permissions === 'boolean' ? [doc.shared_permissions] : []);
        
        return {
          id: doc.id,
          user_id: doc.user_id,
          title: doc.title,
          content: doc.content,
          tags: doc.tags,
          created_at: doc.created_at,
          updated_at: doc.updated_at,
          username: doc.username ?? undefined,
          first_name: doc.first_name ?? undefined,
          last_name: doc.last_name ?? undefined,
          sharedWith: sharedEmails.map((email: string, index: number) => ({
            email,
            permission: sharedPermissions[index] ?? false
          }))
        };
      });

      return { success: true, documents: transformedDocuments };
    } catch (error) {
      console.error("❌ Erreur récupération documents partagés par utilisateur:", error);
      return { success: false, error: error instanceof Error ? error.message : "Erreur inconnue" };
    }
  }

  async getSharePermission(documentId: number, email: string): Promise<DocumentRepositoryResult<{ permission: boolean }>> {
    try {
      const result = await this.query<{ permission: boolean }>(
        `SELECT permission 
         FROM shares 
         WHERE id_doc = $1 AND lower(trim(email)) = lower(trim($2))`,
        [documentId, email]
      );

      if (result.rows.length === 0) {
        return { success: false, error: "Permission non trouvée" };
      }

      return { success: true, data: { permission: result.rows[0].permission } };
    } catch (error) {
      console.error("❌ Erreur récupération permission de partage:", error);
      return { success: false, error: error instanceof Error ? error.message : "Erreur inconnue" };
    }
  }

  async updatePermission(documentId: number, userId: number, permission: boolean): Promise<DocumentRepositoryResult<{ updatedCount: number }>> {
    try {
      const result = await this.query<{ id: number }>(
        `UPDATE shares s
         SET permission = $3
         FROM users u
         WHERE s.id_doc = $1 AND lower(trim(s.email)) = lower(trim(u.email)) AND u.id = $2
         RETURNING s.id`,
        [documentId, userId, permission]
      );

      return { success: true, data: { updatedCount: result.rows.length } };
    } catch (error) {
      console.error("❌ Erreur mise à jour permission de partage:", error);
      return { success: false, error: error instanceof Error ? error.message : "Erreur inconnue" };
    }
  }

  async findShare(documentId: number, userId: number): Promise<DocumentRepositoryResult<{ share: any }>> {
    try {
      const result = await this.query(
        `SELECT s.* FROM shares s
         JOIN users u ON lower(trim(u.email)) = lower(trim(s.email))
         WHERE s.id_doc = $1 AND u.id = $2
         LIMIT 1`,
        [documentId, userId]
      );

      if (result.rows.length === 0) {
        return { success: false, error: 'Partage introuvable' };
      }

      return { success: true, data: { share: result.rows[0] } };
    } catch (error) {
      console.error('❌ Erreur recherche partage:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Erreur inconnue' };
    }
  }

  async ownerIdForDocument(documentId: number): Promise<DocumentRepositoryResult<{ ownerId: number | null }>> {
    try {
      const result = await this.query<{ user_id: number }>(
        `SELECT user_id FROM documents WHERE id = $1`,
        [documentId]
      );

      if (result.rows.length === 0) {
        return { success: true, data: { ownerId: null } };
      }

      return { success: true, data: { ownerId: result.rows[0].user_id ?? null } };
    } catch (error) {
      console.error('❌ Erreur récupération ownerId pour document:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Erreur inconnue' };
    }
  }

  async addShare(documentId: number, email: string, permission: boolean): Promise<DocumentRepositoryResult<{ id: number }>> {
    try {
      const updateRes = await this.query<{ id: number }>(
        `UPDATE shares SET permission = $3
         WHERE id_doc = $1 AND lower(trim(email)) = lower(trim($2))
         RETURNING id`,
        [documentId, email, permission]
      );

      if (updateRes.rows.length > 0) {
        return { success: true, data: { id: updateRes.rows[0].id } };
      }

      const insertRes = await this.query<{ id: number }>(
        `INSERT INTO shares (id_doc, email, permission)
         VALUES ($1, lower(trim($2)), $3)
         RETURNING id`,
        [documentId, email, permission]
      );

      if (insertRes.rows.length === 0) {
        return { success: false, error: "Erreur lors de l'ajout du partage" };
      }

      return { success: true, data: { id: insertRes.rows[0].id } };
    } catch (error) {
      console.error("❌ Erreur ajout partage:", error);
      return { success: false, error: error instanceof Error ? error.message : "Erreur inconnue" };
    }
  }

  async getAccessList(documentId: number): Promise<DocumentRepositoryResult<{ accessList: Array<{
    id: number | null;
    email: string;
    username?: string;
    first_name?: string;
    last_name?: string;
    profile_image?: string | null;
    permission: boolean | undefined;
    is_owner: boolean;
  }> }>> {
    try {
      // Single query: owner UNION shared users, deduped by email
      const result = await this.query(
        `SELECT u.id, u.username, u.email, u.profile_image, TRUE as is_owner, NULL::boolean as permission
        FROM documents d
        JOIN users u ON d.user_id = u.id
        WHERE d.id = $1
        UNION ALL
        SELECT u.id, u.username, s.email, u.profile_image, FALSE as is_owner, s.permission as permission
        FROM shares s
        LEFT JOIN users u ON lower(trim(u.email)) = lower(trim(s.email))
        WHERE s.id_doc = $1`,
        [documentId]
      );

      // Deduplicate by normalized email, owner first
      interface AccessListRow {
        id?: number | null;
        email: string | null;
        username?: string | null;
        first_name?: string | null;
        last_name?: string | null;
        profile_image?: string | null;
        permission: boolean | null;
        is_owner: boolean;
      }

      interface AccessListItem {
        id: number | null;
        email: string;
        username?: string;
        first_name?: string;
        last_name?: string;
        profile_image?: string | null;
        permission: boolean | undefined;
        is_owner: boolean;
      }

      const seen = new Set<string>();
      const accessList: AccessListItem[] = [];
      for (const rowRaw of result.rows) {
        const row = rowRaw as AccessListRow;
        const email = row.email || null;
        const normalized = email ? String(email).trim().toLowerCase() : '';
        if (!normalized || seen.has(normalized)) continue;
        seen.add(normalized);
        accessList.push({
          id: row.id || null,
          email: row.email || '',
          username: row.username || undefined,
          first_name: row.first_name || undefined,
          last_name: row.last_name || undefined,
          profile_image: row.profile_image || undefined,
          permission: row.permission === null || row.permission === undefined ? undefined : !!row.permission,
          is_owner: !!row.is_owner,
        });
      }
      if (accessList.length === 0) {
        return { success: false, error: 'Document non trouvé ou aucun accès' };
      }
      return { success: true, data: { accessList } };
    } catch (error) {
      console.error('❌ Erreur récupération access list:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Erreur inconnue' };
    }
  }

  async removeShare(documentId: number, email: string): Promise<DocumentRepositoryResult<{ deletedCount: number }>> {
    try {
      const result = await this.query<{ id: number }>(
        `DELETE FROM shares 
         WHERE id_doc = $1 AND lower(trim(email)) = lower(trim($2))
         RETURNING id`,
        [documentId, email]
      );
      return { success: true, data: { deletedCount: result.rows.length } };
    } catch (error) {
      console.error("❌ Erreur suppression partage:", error);
      return { success: false, error: error instanceof Error ? error.message : "Erreur inconnue" };
    }
  }
}  