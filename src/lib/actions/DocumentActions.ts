"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "../../../lib/auth";
import { DocumentService } from "../services/DocumentService";
import { DocumentValidator } from "../validators/DocumentValidator";
import { ActionResult } from "../types";
import { recordDocumentHistoryImmediate } from "../documentHistory";
import { recordDocumentHistory } from "../documentHistory";

const documentService = new DocumentService();

export async function createDocumentAction(prevState: unknown, formData: FormData): Promise<ActionResult | string> {
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
    await documentService.initializeTables();

    // Créer un nouveau document
    const result = await documentService.createDocument({
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

export async function getUserDocumentsAction(userId: number, limit: number = 20, offset: number = 0): Promise<ActionResult> {
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
            sharedWith: [],
            dossierIds: [],
            shared: false,
          },
        ],
      };
    }

    // Initialiser les tables si elles n'existent pas
    await documentService.initializeTables();

    // Récupérer les documents
    const result = await documentService.getUserDocuments(userId, limit, offset);

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

export async function getDocumentByIdAction(documentId: number): Promise<ActionResult> {
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
    await documentService.initializeTables();

    // Récupérer le document
    const result = await documentService.getDocumentById(parseInt(documentId.toString()));

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

interface UpdateDocumentPayload {
  documentId?: string | number;
  userId?: string | number;
  title?: string;
  content?: string;
  tags?: string | string[];
  email?: string;
}

export async function updateDocumentAction(prevState: unknown, formDataOrObj: FormData | UpdateDocumentPayload): Promise<ActionResult> {
  try {
    // Vérifier que formDataOrObj existe et est valide
    if (!formDataOrObj) {
      return { ok: false, error: "No data provided" };
    }

    const fd = formDataOrObj instanceof FormData ? formDataOrObj : null;
    const documentId = fd
      ? String(fd.get("documentId") || "")
      : String((formDataOrObj as UpdateDocumentPayload).documentId || "");
    
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
    } else if ((formDataOrObj as UpdateDocumentPayload).userId) {
      clientUserId = Number((formDataOrObj as UpdateDocumentPayload).userId);
    }

    const userIdToUse = serverUserId ?? clientUserId;

    if (!userIdToUse) {
      return { ok: false, error: "Not authenticated" };
    }

    const idNum = Number(documentId);

    // Parse title/content/tags
    let title = "";
    let contentStr = "";
    let rawTags: unknown = null;
    
    if (fd) {
      title = String(fd.get("title") || "");
      contentStr = String(fd.get("content") || "");
      rawTags = fd.get("tags") || null;
    } else {
      const obj = formDataOrObj as UpdateDocumentPayload;
      title = obj.title || "";
      contentStr = obj.content || "";
      rawTags = obj.tags || null;
    }

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
      title,
      content: contentStr,
      tags,
    });

    if (!validation.isValid) {
      return { ok: false, error: Object.values(validation.errors)[0] || "Données invalides" };
    }

    // Actually update the document in the database
    // Get user email from session or formData
    let userEmail: string | undefined = undefined;
    if (fd && fd.get("email")) {
      userEmail = String(fd.get("email"));
    } else if (typeof (formDataOrObj as UpdateDocumentPayload).email === "string") {
      userEmail = (formDataOrObj as UpdateDocumentPayload).email;
    } else {
      // Try to get from server session
      try {
        const session = await getServerSession(authOptions);
        userEmail = session?.user?.email || undefined;
      } catch {}
    }
    if (!userEmail) {
      return { ok: false, error: "Email utilisateur manquant pour la mise à jour." };
    }

    // Récupérer le contenu précédent pour enregistrer un historique lisible
    let previousContent: string | null = null;
    try {
      const existing = await documentService.getDocumentById(idNum);
      if (existing.success && existing.document) {
        previousContent = existing.document.content;
      }
    } catch {
      previousContent = null;
    }

    // Enregistrer l'historique immédiatement pour les sauvegardes HTTP explicites
    await recordDocumentHistoryImmediate({
      documentId: idNum,
      userId: userIdToUse,
      userEmail,
      previousContent,
      nextContent: contentStr,
    });

    const updateResult = await documentService.createOrUpdateDocumentById(
      idNum,
      userIdToUse,
      userEmail,
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

export async function deleteDocumentAction(prevState: unknown, formData: FormData): Promise<string> {
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
    await documentService.initializeTables();

    // Supprimer le document
    const result = await documentService.deleteDocument(documentIdNumber, userIdNumber);

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

export async function deleteMultipleDocumentsAction(prevState: unknown, formData: FormData): Promise<string> {
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

    await documentService.initializeTables();

    const result = await documentService.deleteDocumentsBulk(userIdNumber, idsRaw);

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

// --- Share-related server actions ---
export async function fetchSharedDocumentsAction(): Promise<ActionResult> {
  try {
    const session = await getServerSession(authOptions);
    const email = session?.user?.email as string | undefined;
    const userId = session?.user?.id ? Number(session.user.id) : undefined;

    if (!email || !userId) {
      return { success: false, error: "Utilisateur non authentifié", documents: [] };
    }

    if (!process.env.DATABASE_URL) {
      return { success: true, documents: [] };
    }

    await documentService.initializeTables();

    // Récupérer les documents partagés avec l'utilisateur
    const sharedWithResult = await documentService.fetchSharedWithUser(email);
    if (!sharedWithResult.success) {
      return { success: false, error: sharedWithResult.error || "Erreur lors de la récupération des documents partagés", documents: [] };
    }

    // Récupérer les documents partagés par l'utilisateur
    const sharedByResult = await documentService.fetchSharedByUser(userId);
    if (!sharedByResult.success) {
      return { success: false, error: sharedByResult.error || "Erreur lors de la récupération des documents partagés", documents: [] };
    }

    // Combiner les deux listes
    const allSharedDocuments = [
      ...(sharedWithResult.documents || []),
      ...(sharedByResult.documents || [])
    ];

    return { success: true, documents: allSharedDocuments };
  } catch (error: unknown) {
    console.error("❌ Erreur fetchSharedDocumentsAction:", error);
    return { success: false, error: "Erreur lors de la récupération des documents partagés", documents: [] };
  }
}

export async function getSharePermissionAction(documentId: number): Promise<ActionResult> {
  try {
    const idValidation = DocumentValidator.validateDocumentId(documentId);
    if (!idValidation.isValid) {
      return { success: false, error: Object.values(idValidation.errors)[0] || "ID de document invalide" };
    }

    const session = await getServerSession(authOptions);
    const email = session?.user?.email as string | undefined;

    if (!email) {
      return { success: false, error: "Utilisateur non authentifié" };
    }

    if (!process.env.DATABASE_URL) {
      return { success: true, data: { permission: false } } as ActionResult;
    }

    await documentService.initializeTables();

    const result = await documentService.getSharePermission(documentId, email);
    if (!result.success) {
      return { success: false, error: result.error || "Permission non trouvée" };
    }

    return { success: true, dbResult: { success: true, error: undefined, document: undefined }, data: result.data } as ActionResult;
  } catch (error: unknown) {
    console.error("❌ Erreur getSharePermissionAction:", error);
    return { success: false, error: "Erreur lors de la récupération de la permission" };
  }
}

export async function addShareAction(prevState: unknown, formData: FormData): Promise<ActionResult | string> {
  try {
    const documentIdRaw = formData.get("documentId") as string | null;
    const targetEmail = formData.get("email") as string | null;
    const permissionRaw = formData.get("permission") as string | null;

    if (!documentIdRaw || !targetEmail || permissionRaw === null) {
      return { success: false, error: "documentId, email et permission sont requis" };
    }

    const documentId = parseInt(documentIdRaw, 10);
    const permission = permissionRaw === "true" || permissionRaw === "1";

    const idValidation = DocumentValidator.validateDocumentId(documentId);
    if (!idValidation.isValid) {
      return { success: false, error: Object.values(idValidation.errors)[0] || "ID de document invalide" };
    }

    // Auth check and ownership/admin verification
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id ? Number(session.user.id) : undefined;
    const userEmail = session?.user?.email as string | undefined;

    if (!userId || !userEmail) {
      return { success: false, error: "Utilisateur non authentifié" };
    }

    // Préparer la persistance
    if (!process.env.DATABASE_URL) {
      return { success: true, message: "Partage simulé (DATABASE_URL non configurée)" };
    }

    await documentService.initializeTables();

    // Récupérer le document pour vérifier la propriété
    const docRes = await documentService.getDocumentById(documentId);
    if (!docRes.success || !docRes.document) {
      return { success: false, error: "Document introuvable" };
    }

    const isOwner = docRes.document.user_id === userId;
    const isAdmin = session?.user?.isAdmin === true;
  // Debug logging removed
    if (!isOwner && !isAdmin) {
      return { success: false, error: "Vous n'êtes pas autorisé à partager ce document" };
    }

    const addRes = await documentService.addShare(documentId, targetEmail, permission);
    if (!addRes.success) {
      return { success: false, error: addRes.error || "Erreur lors de l'ajout du partage" };
    }

    return { success: true, message: "Partage réussi.", id: addRes.data?.id };
  } catch (error: unknown) {
    console.error("❌ Erreur addShareAction:", error);
    return { success: false, error: "Erreur lors du partage" };
  }
}

export async function fetchDocumentAccessListAction(documentId: number): Promise<ActionResult> {
  try {
    const idValidation = DocumentValidator.validateDocumentId(documentId);
    if (!idValidation.isValid) {
      return { success: false, error: Object.values(idValidation.errors)[0] || 'ID de document invalide' };
    }

    if (!process.env.DATABASE_URL) {
      return { success: true, data: { accessList: [] } } as ActionResult;
    }

    await documentService.initializeTables();

    const res = await documentService.fetchDocumentAccessList(documentId);
    if (!res.success) {
      return { success: false, error: res.error || 'Erreur lors de la récupération de la liste d\'accès' };
    }

    return { success: true, data: res.data } as ActionResult;
  } catch (error: unknown) {
    console.error('❌ Erreur fetchDocumentAccessListAction:', error);
    return { success: false, error: 'Erreur lors de la récupération de la liste d\'accès' };
  }
}
