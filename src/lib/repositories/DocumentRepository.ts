import { BaseRepository } from "./BaseRepository";
import { Document, CreateDocumentData, UpdateDocumentData, DocumentRepositoryResult } from "../types";

export class DocumentRepository extends BaseRepository {
  async initializeTables(): Promise<void> {
    try {

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

      // Ajouter la colonne tags si base déjà existante
      await this.addColumnIfNotExists("documents", "tags", "TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[]");

      // Créer les index
      await this.createIndexes();

      // Créer les triggers
      await this.createTriggers();
    } catch (error) {
      console.error("❌ Erreur lors de l'initialisation des tables documents:", error);
      throw error;
    }
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

    for (const indexQuery of indexes) {
      await this.query(indexQuery);
    }
  }

  private async createTriggers(): Promise<void> {
    // Fonction pour mettre à jour updated_at
    await this.query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ language 'plpgsql'
    `);

    // Trigger pour documents
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

      // Extraire les IDs des fichiers joints du contenu
      const attachmentIdRegex = /data-attachment-id="(\d+)"/gi;
      const attachmentIds: number[] = [];
      let match;
      while ((match = attachmentIdRegex.exec(content)) !== null) {
        const id = parseInt(match[1]);
        if (!isNaN(id) && !attachmentIds.includes(id)) {
          attachmentIds.push(id);
        }
      }

      const result = await this.query<Document>(
        `INSERT INTO documents (user_id, title, content, tags, updated_at)
         VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
         RETURNING id, title, content, tags, created_at, updated_at, user_id`,
        [userId, title, content, tags]
      );

      const document = result.rows[0];

      // Lier les fichiers au document (pour un nouveau document, tous les fichiers sont nouveaux)
      if (attachmentIds.length > 0) {
        await this.query(
          `UPDATE document_attachments 
           SET document_id = $1 
           WHERE id = ANY($2::int[]) AND user_id = $3`,
          [document.id, attachmentIds, userId]
        );
      }

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

      const parseJsonArray = (raw: unknown): any[] => {
        if (Array.isArray(raw)) return raw;
        if (typeof raw === "string") {
          try {
            return JSON.parse(raw);
          } catch (e) {
            return [];
          }
        }
        if (raw && typeof raw === "object" && "toJSON" in (raw as any)) {
          try {
            const asJson = (raw as any).toJSON();
            return Array.isArray(asJson) ? asJson : [];
          } catch {
            return [];
          }
        }
        return [];
      };

      const documents: Document[] = result.rows.map((row: any) => {
        const sharedWithRaw = parseJsonArray(row.shared_with);
        const sharedWith = sharedWithRaw
          .map((entry) => ({
            email: typeof entry?.email === "string" ? entry.email : null,
            permission: typeof entry?.permission === "boolean" ? entry.permission : Boolean(entry?.permission),
          }))
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
        };
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
      // Extraire les IDs des fichiers joints du contenu
      const attachmentIdRegex = /data-attachment-id="(\d+)"/gi;
      const attachmentIds: number[] = [];
      let match;
      while ((match = attachmentIdRegex.exec(content)) !== null) {
        const id = parseInt(match[1]);
        if (!isNaN(id) && !attachmentIds.includes(id)) {
          attachmentIds.push(id);
        }
      }

      if (documentId) {
        // Mettre à jour le document existant
        const updateFields = ["title = $1", "content = $2"];
        const values: unknown[] = [title, content, documentId, userId];
        if (Array.isArray(tags)) {
          updateFields.push(`tags = $3`);
          values.splice(2, 0, tags);
        }

        // Vérifier si l'utilisateur est le propriétaire OU s'il a des permissions de partage
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

        const document = result.rows[0];

        // Récupérer les fichiers actuellement liés au document
        const currentAttachments = await this.query<{ id: number }>(
          `SELECT id FROM document_attachments WHERE document_id = $1 AND user_id = $2`,
          [documentId, userId]
        );
        const currentAttachmentIds = currentAttachments.rows.map(a => a.id);

        // Identifier les fichiers supprimés (présents dans la DB mais pas dans le nouveau contenu)
        const removedAttachmentIds = currentAttachmentIds.filter(id => !attachmentIds.includes(id));

        // Supprimer les fichiers qui ne sont plus dans le contenu
        if (removedAttachmentIds.length > 0) {
          await this.query(
            `DELETE FROM document_attachments 
             WHERE id = ANY($1::int[]) AND user_id = $2`,
            [removedAttachmentIds, userId]
          );
        }

        // Lier les nouveaux fichiers au document
        if (attachmentIds.length > 0) {
          await this.query(
            `UPDATE document_attachments 
             SET document_id = $1 
             WHERE id = ANY($2::int[]) AND user_id = $3`,
            [documentId, attachmentIds, userId]
          );
        }

        return { success: true, document };
      } else {
        // Créer un nouveau document
        const result = await this.query<Document>(
          `INSERT INTO documents (user_id, title, content, tags, updated_at)
           VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
           RETURNING id, title, content, tags, created_at, updated_at, user_id`,
          [userId, title, content, Array.isArray(tags) ? tags : []]
        );

        const document = result.rows[0];

        // Lier les fichiers au document
        if (attachmentIds.length > 0) {
          await this.query(
            `UPDATE document_attachments 
             SET document_id = $1 
             WHERE id = ANY($2::int[]) AND user_id = $3`,
            [document.id, attachmentIds, userId]
          );
        }

        return { success: true, document };
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

      const trashParams: any[] = [];
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
      const docs = result.rows.map((r: any) => ({ ...r, favori: r.favori ?? null }));
      return { success: true, documents: docs as any };
    } catch (error) {
      console.error("❌ Erreur récupération documents partagés:", error);
      return { success: false, error: error instanceof Error ? error.message : "Erreur inconnue" };
    }
  }

  async fetchSharedByUser(userId: number): Promise<DocumentRepositoryResult<Document[]>> {
    try {
      const result = await this.query<Document & { shared_emails: string; shared_permissions: boolean }>(
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
      const transformedDocuments: Document[] = result.rows.map((doc: any) => ({
        id: doc.id,
        user_id: doc.user_id,
        title: doc.title,
        content: doc.content,
        tags: doc.tags,
        created_at: doc.created_at,
        updated_at: doc.updated_at,
        username: doc.username,
        first_name: doc.first_name,
        last_name: doc.last_name,
        sharedWith: doc.shared_emails.map((email: string, index: number) => ({
          email,
          permission: doc.shared_permissions[index]
        }))
      }));

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

  async addShare(documentId: number, email: string, permission: boolean): Promise<DocumentRepositoryResult<{ id: number }>> {
    try {
      const result = await this.query<{ id: number }>(
        `INSERT INTO shares (id_doc, email, permission)
         VALUES ($1, lower(trim($2)), $3)
         ON CONFLICT (id_doc, email) DO UPDATE SET permission = EXCLUDED.permission
         RETURNING id`,
        [documentId, email, permission]
      );

      if (result.rows.length === 0) {
        return { success: false, error: "Erreur lors de l'ajout du partage" };
      }

      return { success: true, data: { id: result.rows[0].id } };
    } catch (error) {
      console.error("❌ Erreur ajout partage:", error);
      return { success: false, error: error instanceof Error ? error.message : "Erreur inconnue" };
    }
  }

  async getAccessList(documentId: number): Promise<DocumentRepositoryResult<{ accessList: any[] }>> {
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
      const seen = new Set<string>();
      const accessList: any[] = [];
      for (const rowRaw of result.rows) {
        const row = rowRaw as any;
        const email = row.email || null;
        const normalized = email ? String(email).trim().toLowerCase() : '';
        if (!normalized || seen.has(normalized)) continue;
        seen.add(normalized);
        accessList.push({
          id: row.id || null,
          email: row.email,
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
}  