import { getServerSession } from "next-auth";
import { authOptions } from "../../../../lib/auth";
import { DocumentService as BaseDocumentService } from "../../services/DocumentService";
import { DocumentValidator } from "../../validators/DocumentValidator";
import { ActionResult } from "../../types";

export class DocumentManagementService {
  private documentService: BaseDocumentService;

  constructor() {
    this.documentService = new BaseDocumentService();
  }

  async createDocument(prevState: unknown, formData: FormData): Promise<ActionResult | string> {
    try {
      const title = formData.get("title") as string;
      const content = formData.get("content") as string;
      const userId = formData.get("userId") as string;
      const rawTags = formData.get("tags") as string;

      if (!userId) {
        return "Utilisateur requis.";
      }

      // Gérer les différents types d'IDs utilisateur
      let userIdNumber: number;

      // Si l'ID utilisateur est undefined ou null
      if (
        !userId ||
        userId === "undefined" ||
        userId === "null" ||
        userId === "unknown"
      ) {
        console.error("❌ ID utilisateur non défini dans la session");
        return "Session utilisateur invalide. Veuillez vous reconnecter.";
      }

      // Si c'est un ID de simulation OAuth
      if (userId === "oauth-simulated-user") {
        userIdNumber = 1; // ID de simulation
      } else {
        // Vérifier que l'ID utilisateur est un nombre valide
        userIdNumber = parseInt(userId);
        if (isNaN(userIdNumber) || userIdNumber <= 0) {
          console.error(
            "❌ ID utilisateur invalide:",
            userId,
            "Parsed as:",
            userIdNumber
          );
          return "ID utilisateur invalide. Veuillez vous reconnecter.";
        }
      }

      // Parser les tags
      let tags: string[] = [];
      try {
        if (rawTags) {
          tags = typeof rawTags === "string" ? JSON.parse(rawTags) : rawTags;
        }
      } catch (e) {
        console.warn("Failed to parse tags payload", e);
        tags = [];
      }

      // Validation des données
      const validation = DocumentValidator.validateDocumentData({
        title: title || "",
        content: content || "",
        tags,
      });

      if (!validation.isValid) {
        return Object.values(validation.errors)[0] || "Données invalides";
      }

      // Vérifier si la base de données est configurée
      if (!process.env.DATABASE_URL) {
        return "Document créé avec succès (mode simulation). Configurez DATABASE_URL pour la persistance.";
      }

      // Initialiser les tables si elles n'existent pas
      await this.documentService.initializeTables();

      // Créer un nouveau document
      const result = await this.documentService.createDocument({
        userId: userIdNumber,
        title: title.trim(),
        content: content || "",
        tags,
      });

      if (!result.success) {
        console.error("❌ Erreur création document:", result.error);
        return "Erreur lors de la création du document. Veuillez réessayer.";
      }

      return {
        success: true,
        message: "Document créé avec succès !",
        documentId: result.document!.id,
      };
    } catch (error: unknown) {
      console.error("❌ Erreur lors de la création du document:", error);

      if (error && typeof error === 'object' && 'code' in error && 
          (error.code === "ECONNRESET" || error.code === "ECONNREFUSED")) {
        return "Base de données non accessible. Vérifiez la configuration PostgreSQL.";
      }

      return "Erreur lors de la création du document. Veuillez réessayer.";
    }
  }

  async getUserDocuments(userId: number, limit: number = 20, offset: number = 0): Promise<ActionResult> {
    try {
      // Validation des paramètres de pagination
      const paginationValidation = DocumentValidator.validatePaginationParams(limit, offset);
      if (!paginationValidation.isValid) {
        return {
          success: false,
          error: Object.values(paginationValidation.errors)[0] || "Paramètres de pagination invalides",
          documents: [],
        };
      }

      // Vérifier si la base de données est configurée
      if (!process.env.DATABASE_URL) {
        return {
          success: true,
          documents: [
            {
              id: 1,
              user_id: 1,
              title: "Document de simulation",
              content: "Configurez DATABASE_URL pour la persistance.",
              tags: [],
              created_at: new Date(),
              updated_at: new Date(),
              username: "simulation",
              first_name: "Test",
              last_name: "User",
            },
          ],
        };
      }

      // Initialiser les tables si elles n'existent pas
      await this.documentService.initializeTables();

      // Récupérer les documents
      const result = await this.documentService.getUserDocuments(userId, limit, offset);

      if (!result.success) {
        console.error("❌ Erreur récupération documents:", result.error);
        return {
          success: false,
          error: "Erreur lors de la récupération des documents.",
          documents: [],
        };
      }

      return {
        success: true,
        documents: result.documents || [],
      };
    } catch (error: unknown) {
      console.error("❌ Erreur lors de la récupération des documents:", error);
      return {
        success: false,
        error: "Erreur lors de la récupération des documents.",
        documents: [],
      };
    }
  }

  async getDocumentById(documentId: number): Promise<ActionResult> {
    try {
      // Validation de l'ID du document
      const idValidation = DocumentValidator.validateDocumentId(documentId);
      if (!idValidation.isValid) {
        return {
          success: false,
          error: Object.values(idValidation.errors)[0] || "ID de document invalide",
          document: undefined,
        };
      }

      // Vérifier si la base de données est configurée
      if (!process.env.DATABASE_URL) {
        return {
          success: true,
          document: {
            id: parseInt(documentId.toString()),
            user_id: 1,
            title: "Document de simulation",
            content: "Configurez DATABASE_URL pour la persistance.",
            tags: [],
            created_at: new Date(),
            updated_at: new Date(),
            username: "simulation",
            first_name: "Test",
            last_name: "User",
          },
        };
      }

      // Initialiser les tables si elles n'existent pas
      await this.documentService.initializeTables();

      // Récupérer le document
      const result = await this.documentService.getDocumentById(parseInt(documentId.toString()));

      if (!result.success) {
        console.error("❌ Erreur récupération document:", result.error);
        return {
          success: false,
          error: "Erreur lors de la récupération du document.",
          document: undefined,
        };
      }

      return {
        success: true,
        document: result.document,
      };
    } catch (error: unknown) {
      console.error("❌ Erreur lors de la récupération du document:", error);
      return {
        success: false,
        error: "Erreur lors de la récupération du document.",
        document: undefined,
      };
    }
  }

  async updateDocument(prevState: unknown, formDataOrObj: FormData | Record<string, any>): Promise<ActionResult> {
    try {
      // Vérifier que formDataOrObj existe et est valide
      if (!formDataOrObj) {
        return { ok: false, error: "No data provided" };
      }

      const fd = formDataOrObj.get ? formDataOrObj : null;
      const documentId = fd
        ? String(fd.get("documentId") || "")
        : String((formDataOrObj as Record<string, any>).documentId || "");
      
      if (!documentId) return { ok: false, error: "Missing documentId" };

      // Validation de l'ID du document
      const idValidation = DocumentValidator.validateDocumentId(documentId);
      if (!idValidation.isValid) {
        return { ok: false, error: Object.values(idValidation.errors)[0] || "ID de document invalide" };
      }

      // Try server session (if available)
      let serverUserId: number | undefined;
      try {
        const session = await getServerSession(authOptions);
        serverUserId = session?.user?.id ? Number(session.user.id) : undefined;
      } catch (e: unknown) {
        console.warn("getServerSession failed at runtime, falling back to client userId", e instanceof Error ? e.message : e);
      }

      // If no server session, try client-sent userId
      let clientUserId: number | undefined;
      if (fd) {
        const u = fd.get("userId");
        if (u) clientUserId = Number(String(u));
      } else if ((formDataOrObj as Record<string, any>).userId) {
        clientUserId = Number((formDataOrObj as Record<string, any>).userId);
      }

      const userIdToUse = serverUserId ?? clientUserId;

      if (!userIdToUse) {
        return { ok: false, error: "Not authenticated" };
      }

      const idNum = Number(documentId);

      // Parse title/content/drawings/tags
      let title = "";
      let contentStr = "";
      let rawDrawings: unknown = null;
      let rawTags: unknown = null;
      
      if (fd) {
        title = String(fd.get("title") || "");
        contentStr = String(fd.get("content") || "");
        rawDrawings = fd.get("drawings") || null;
        rawTags = fd.get("tags") || null;
      } else {
        const obj = formDataOrObj as Record<string, any>;
        title = obj.title || "";
        contentStr = obj.content || "";
        rawDrawings = obj.drawings || null;
        rawTags = obj.tags || null;
      }

      let drawings: unknown[] = [];
      let tags: string[] = [];
      
      try {
        if (rawDrawings) {
          drawings = typeof rawDrawings === "string" ? JSON.parse(rawDrawings) : rawDrawings;
        }
      } catch (e) {
        console.warn("Failed to parse drawings payload", e);
        drawings = [];
      }

      try {
        if (rawTags) {
          tags = typeof rawTags === "string" ? JSON.parse(rawTags) : rawTags;
        }
      } catch (e) {
        console.warn("Failed to parse tags payload", e);
        tags = [];
      }

      // Validation des données
      const validation = DocumentValidator.validateDocumentData({
        title,
        content: contentStr,
        tags,
      });

      if (!validation.isValid) {
        return { ok: false, error: Object.values(validation.errors)[0] || "Données invalides" };
      }

      // Actually update the document in the database
      const updateResult = await this.documentService.createOrUpdateDocumentById(
        idNum,
        userIdToUse,
        title,
        contentStr,
        tags
      );

      if (!updateResult.success) {
        console.error("❌ Erreur mise à jour document:", updateResult.error);
        return {
          ok: false,
          error: updateResult.error || "Erreur lors de la mise à jour du document.",
        };
      }

      return {
        ok: true,
        id: idNum,
        dbResult: updateResult,
      };
    } catch (err: unknown) {
      console.error(err);
      return { ok: false, error: String(err instanceof Error ? err.message : err) };
    }
  }

  async deleteDocument(prevState: unknown, formData: FormData): Promise<string> {
    try {
      const documentId = formData.get("documentId") as string;
      const userId = formData.get("userId") as string;

      if (!documentId || !userId) {
        return "ID de document et utilisateur requis.";
      }

      // Validation des IDs
      const documentIdValidation = DocumentValidator.validateDocumentId(documentId);
      if (!documentIdValidation.isValid) {
        return Object.values(documentIdValidation.errors)[0] || "ID document invalide";
      }

      const userIdValidation = DocumentValidator.validateUserId(userId);
      if (!userIdValidation.isValid) {
        return Object.values(userIdValidation.errors)[0] || "ID utilisateur invalide";
      }

      const documentIdNumber = parseInt(documentId);
      const userIdNumber = parseInt(userId);

      // Vérifier si la base de données est configurée
      if (!process.env.DATABASE_URL) {
        return "Document supprimé avec succès (mode simulation). Configurez DATABASE_URL pour la persistance.";
      }

      // Initialiser les tables si elles n'existent pas
      await this.documentService.initializeTables();

      // Supprimer le document
      const result = await this.documentService.deleteDocument(documentIdNumber, userIdNumber);

      if (!result.success) {
        console.error("❌ Erreur suppression document:", result.error);
        return result.error!;
      }

      return "Document supprimé avec succès";
    } catch (error: unknown) {
      console.error("❌ Erreur lors de la suppression du document:", error);

      if (error && typeof error === 'object' && 'code' in error && 
          (error.code === "ECONNRESET" || error.code === "ECONNREFUSED")) {
        return "Base de données non accessible. Vérifiez la configuration PostgreSQL.";
      }

      return "Erreur lors de la suppression du document. Veuillez réessayer.";
    }
  }

  async deleteMultipleDocuments(prevState: unknown, formData: FormData): Promise<string> {
    try {
      const userId = formData.get("userId") as string;
      const idsRaw = formData.getAll("documentIds") as string[];

      if (!userId) {
        return "ID utilisateur requis.";
      }

      // Validation de l'ID utilisateur
      const userIdValidation = DocumentValidator.validateUserId(userId);
      if (!userIdValidation.isValid) {
        return Object.values(userIdValidation.errors)[0] || "ID utilisateur invalide";
      }

      // Validation des IDs de documents
      const documentIdsValidation = DocumentValidator.validateDocumentIds(idsRaw);
      if (!documentIdsValidation.isValid) {
        return Object.values(documentIdsValidation.errors)[0] || "IDs de documents invalides";
      }

      const userIdNumber = parseInt(userId);

      // Vérifier si la base de données est configurée
      if (!process.env.DATABASE_URL) {
        return `${idsRaw.length} document(s) supprimé(s) (mode simulation). Configurez DATABASE_URL pour la persistance.`;
      }

      await this.documentService.initializeTables();

      const result = await this.documentService.deleteDocumentsBulk(userIdNumber, idsRaw);

      if (!result.success) {
        return result.error || "Erreur lors de la suppression multiple.";
      }

      return `${result.data?.deletedCount || 0} document(s) supprimé(s) avec succès`;
    } catch (error: unknown) {
      console.error("❌ Erreur lors de la suppression multiple:", error);
      if (error && typeof error === 'object' && 'code' in error && 
          (error.code === "ECONNRESET" || error.code === "ECONNREFUSED")) {
        return "Base de données non accessible. Vérifiez la configuration PostgreSQL.";
      }
      return "Erreur lors de la suppression multiple. Veuillez réessayer.";
    }
  }
}
