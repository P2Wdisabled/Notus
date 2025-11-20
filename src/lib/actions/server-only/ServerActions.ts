"use server";

// Actions serveur uniquement - pas d'imports de base de données côté client
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../lib/auth";
import { revalidatePath } from "next/cache";

// Import dynamique des services uniquement côté serveur
async function getUserService() {
  const { PrismaUserService } = await import("../../services/PrismaUserService");
  return new PrismaUserService();
}

async function getDocumentService() {
  const { PrismaDocumentService } = await import("../../services/PrismaDocumentService");
  return new PrismaDocumentService();
}

async function getEmailService() {
  const { EmailService } = await import("../../services/EmailService");
  return new EmailService();
}

// Actions d'authentification
export async function authenticate(prevState: unknown, formData: FormData): Promise<string> {
  try {
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    if (!email || !password) {
      return "Email et mot de passe requis";
    }

    const userService = await getUserService();
    
    // Vérifier si l'utilisateur est banni avant la tentative de connexion
    const userResult = await userService.getUserByEmail(email);
    if (userResult.success && userResult.user?.is_banned) {
      return "Ce compte a été banni. Contactez un administrateur pour plus d'informations.";
    }

    const { signIn } = await import("next-auth/react");
    await signIn("credentials", {
      email,
      password,
    });

    return "";
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'type' in error && error.type === "CredentialsSignin") {
      return "Email ou mot de passe incorrect, ou email non vérifié.";
    }
    return "Une erreur est survenue.";
  }
}

// Documents partagés (utilise PrismaDocumentService)
export async function fetchSharedDocumentsAction() {
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

    const documentService = await getDocumentService();
    await documentService.initializeTables();

    const sharedWithResult = await documentService.fetchSharedWithUser(email);
    if (!sharedWithResult.success) {
      return { success: false, error: sharedWithResult.error || "Erreur lors de la récupération des documents partagés", documents: [] };
    }

    const sharedByResult = await documentService.fetchSharedByUser(userId);
    if (!sharedByResult.success) {
      return { success: false, error: sharedByResult.error || "Erreur lors de la récupération des documents partagés", documents: [] };
    }

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

export async function registerUser(prevState: unknown, formData: FormData): Promise<string> {
  try {
    const userData = {
      email: formData.get("email") as string,
      username: formData.get("username") as string,
      password: formData.get("password") as string,
      firstName: formData.get("firstName") as string,
      lastName: formData.get("lastName") as string,
    };

    // Vérifier l'acceptation des conditions d'utilisation
    const acceptTerms = formData.get("acceptTerms");
    if (!acceptTerms) {
      return "Vous devez accepter les conditions d'utilisation et les mentions légales pour vous inscrire.";
    }

    // Validation côté serveur
    const { UserValidator } = await import("../../validators/UserValidator");
    const validation = UserValidator.validateRegistrationData(userData);
    if (!validation.isValid) {
      return Object.values(validation.errors)[0] || "Données invalides";
    }

    // Vérifier si la base de données est configurée
    if (!process.env.DATABASE_URL) {
      return "Inscription réussie (mode simulation). Configurez DATABASE_URL pour la persistance.";
    }

    const userService = await getUserService();
    
    // Initialiser les tables si elles n'existent pas
    await userService.initializeTables();

    // Créer l'utilisateur
    const result = await userService.createUser(userData);

    if (!result.success) {
      return result.error || "Erreur lors de l'inscription";
    }

    return "Inscription réussie ! Un email de vérification a été envoyé. Vérifiez votre boîte de réception.";
  } catch (error: unknown) {
    console.error("❌ Erreur lors de l'inscription:", error);

    if (error instanceof Error && (error.message.includes("déjà utilisé") || error.message.includes("existe déjà"))) {
      return error.message;
    }

    if (error && typeof error === 'object' && 'code' in error && 
        (error.code === "ECONNRESET" || error.code === "ECONNREFUSED")) {
      return "Base de données non accessible. Vérifiez la configuration PostgreSQL.";
    }

    return "Erreur lors de l'inscription. Veuillez réessayer.";
  }
}

// Actions de gestion des documents
export async function createDocumentAction(prevState: unknown, formData: FormData) {
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

    if (!userId || userId === "undefined" || userId === "null" || userId === "unknown") {
      console.error("❌ ID utilisateur non défini dans la session");
      return "Session utilisateur invalide. Veuillez vous reconnecter.";
    }

    if (userId === "oauth-simulated-user") {
      userIdNumber = 1; // ID de simulation
    } else {
      userIdNumber = parseInt(userId);
      if (isNaN(userIdNumber) || userIdNumber <= 0) {
        console.error("❌ ID utilisateur invalide:", userId, "Parsed as:", userIdNumber);
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
    const { DocumentValidator } = await import("../../validators/DocumentValidator");
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

    const documentService = await getDocumentService();
    
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

export async function getUserDocumentsAction(userId: number, limit: number = 20, offset: number = 0) {
  try {
    // Validation des paramètres de pagination
    const { DocumentValidator } = await import("../../validators/DocumentValidator");
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

    const documentService = await getDocumentService();
    
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

// Corbeille: récupérer les documents supprimés de l'utilisateur
export async function getUserTrashDocumentsAction(userId: number, limit: number = 20, offset: number = 0) {
  try {
    const { DocumentValidator } = await import("../../validators/DocumentValidator");
    const paginationValidation = DocumentValidator.validatePaginationParams(limit, offset);
    if (!paginationValidation.isValid) {
      return {
        success: false,
        error: Object.values(paginationValidation.errors)[0] || "Paramètres de pagination invalides",
        documents: [],
      };
    }

    if (!process.env.DATABASE_URL) {
      return {
        success: true,
        documents: [],
      };
    }

    const documentService = await getDocumentService();
    const result = await documentService.getUserTrashedDocuments(userId, limit, offset);
    if (!result.success) {
      return { success: false, error: result.error || "Erreur lors de la récupération de la corbeille", documents: [] };
    }
    return { success: true, documents: result.documents || [] };
  } catch (error: unknown) {
    console.error("❌ Erreur corbeille:", error);
    return { success: false, error: "Erreur lors de la récupération de la corbeille", documents: [] };
  }
}

// Corbeille: restaurer un document supprimé
export async function restoreTrashedDocumentAction(prevState: unknown, formData: FormData): Promise<string> {
  try {
    const trashIdRaw = formData.get("trashId");
    if (!trashIdRaw) {
      return "Identifiant de corbeille manquant";
    }
    const trashId = parseInt(String(trashIdRaw));
    if (isNaN(trashId) || trashId <= 0) {
      return "Identifiant invalide";
    }

    if (!process.env.DATABASE_URL) {
      return "Document restauré (mode simulation). Configurez DATABASE_URL pour la persistance.";
    }

    const session = await getServerSession(authOptions);
    const userId = session?.user?.id ? parseInt(String(session.user.id)) : undefined;
    if (!userId) {
      return "Non authentifié";
    }

    const documentService = await getDocumentService();
    const result = await documentService.restoreDocumentFromTrash(trashId, userId);
    if (!result.success) {
      return result.error || "Erreur lors de la restauration";
    }
    // Revalidate trash page so UI reflects changes immediately
    try {
      revalidatePath("/trash");
    } catch {}
    return "Document restauré avec succès";
  } catch (error: unknown) {
    console.error("❌ Erreur restauration corbeille:", error);
    return "Erreur lors de la restauration. Veuillez réessayer.";
  }
}

// Wrapper pour utilisation directe dans <form action={...}>
export async function restoreTrashedDocumentFormAction(formData: FormData): Promise<void> {
  await restoreTrashedDocumentAction(undefined, formData);
}

// Actions de profil utilisateur
export async function updateUserProfileAction(prevState: unknown, formData: FormData): Promise<string> {
  try {
    const session = await getServerSession(authOptions);
    const userIdRaw = session?.user?.id;

    if (!userIdRaw) {
      return "Vous devez être connecté pour modifier votre profil.";
    }

    const email = formData.get("email") as string || undefined;
    const username = formData.get("username") as string || undefined;
    const firstName = formData.get("firstName") as string || undefined;
    const lastName = formData.get("lastName") as string || undefined;
    const profileImage = formData.get("profileImage") as string || undefined;
    const bannerImage = formData.get("bannerImage") as string || undefined;

    // Validation des données de profil
    const { UserValidator } = await import("../../validators/UserValidator");
    const profileData = {
      email: email?.trim(),
      username: username?.trim(),
      firstName: firstName?.trim(),
      lastName: lastName?.trim(),
      profileImage,
      bannerImage,
    };

    const validation = UserValidator.validateProfileData(profileData);
    if (!validation.isValid) {
      return Object.values(validation.errors)[0] || "Données invalides";
    }

    const fields: Record<string, string> = {};
    if (email !== undefined) fields.email = email.trim();
    if (username !== undefined) fields.username = username.trim();
    if (firstName !== undefined) fields.firstName = firstName.trim();
    if (lastName !== undefined) fields.lastName = lastName.trim();
    if (profileImage !== undefined) fields.profileImage = profileImage;
    if (bannerImage !== undefined) fields.bannerImage = bannerImage;

    if (Object.keys(fields).length === 0) {
      return "Aucun changement détecté.";
    }

    if (!process.env.DATABASE_URL) {
      return "Profil mis à jour (mode simulation). Configurez DATABASE_URL pour la persistance.";
    }

    const userService = await getUserService();
    await userService.initializeTables();

    const userId = parseInt(String(userIdRaw));
    const result = await userService.updateUserProfile(userId, fields);

    if (!result.success) {
      return result.error || "Erreur lors de la mise à jour du profil.";
    }

    return "Profil mis à jour avec succès !";
  } catch (error: unknown) {
    console.error("❌ Erreur mise à jour profil:", error);
    if (error && typeof error === 'object' && 'code' in error && 
        (error.code === "ECONNRESET" || error.code === "ECONNREFUSED")) {
      return "Base de données non accessible. Vérifiez la configuration PostgreSQL.";
    }
    return "Erreur lors de la mise à jour du profil. Veuillez réessayer.";
  }
}

// Actions de gestion des mots de passe
export async function sendPasswordResetEmailAction(prevState: unknown, formData: FormData): Promise<string> {
  try {
    const email = formData.get("email") as string;

    if (!email) {
      return "Veuillez entrer votre adresse email.";
    }

    // Validation basique de l'email
    const { UserValidator } = await import("../../validators/UserValidator");
    const emailValidation = UserValidator.validateEmail(email);
    if (!emailValidation.isValid) {
      return "Veuillez entrer une adresse email valide.";
    }

    // Vérifier si la base de données est configurée
    if (!process.env.DATABASE_URL) {
      return "Email de réinitialisation envoyé (mode simulation). Configurez DATABASE_URL pour la persistance.";
    }

    const userService = await getUserService();
    
    // Initialiser les tables si elles n'existent pas
    await userService.initializeTables();

    // Envoyer l'email de réinitialisation
    const result = await userService.sendPasswordResetEmail(email);

    if (!result.success) {
      return result.error || "Erreur lors de l'envoi de l'email";
    }

    return "Si un compte existe avec cette adresse email, un lien de réinitialisation a été envoyé.";
  } catch (error: unknown) {
    console.error("❌ Erreur lors de l'envoi de l'email de réinitialisation:", error);

    if (error && typeof error === 'object' && 'code' in error && 
        (error.code === "ECONNRESET" || error.code === "ECONNREFUSED")) {
      return "Base de données non accessible. Vérifiez la configuration PostgreSQL.";
    }

    return "Erreur lors de l'envoi de l'email. Veuillez réessayer.";
  }
}

export async function resetPasswordAction(prevState: unknown, formData: FormData): Promise<string> {
  try {
    const token = formData.get("token") as string;
    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    if (!token || !password || !confirmPassword) {
      return "Tous les champs sont requis.";
    }

    // Validation des mots de passe
    const { UserValidator } = await import("../../validators/UserValidator");
    const passwordValidation = UserValidator.validatePasswordResetData(password, confirmPassword);
    if (!passwordValidation.isValid) {
      return Object.values(passwordValidation.errors)[0] || "Données invalides";
    }

    // Vérifier si la base de données est configurée
    if (!process.env.DATABASE_URL) {
      return "Mot de passe modifié avec succès (mode simulation). Configurez DATABASE_URL pour la persistance.";
    }

    const userService = await getUserService();
    
    // Initialiser les tables si elles n'existent pas
    await userService.initializeTables();

    // Réinitialiser le mot de passe
    const result = await userService.resetPassword(token, password);

    if (!result.success) {
      return result.error || "Erreur lors de la réinitialisation du mot de passe";
    }

    return "Mot de passe modifié avec succès. Vous pouvez maintenant vous connecter.";
  } catch (error: unknown) {
    console.error("❌ Erreur lors de la réinitialisation du mot de passe:", error);

    if (error && typeof error === 'object' && 'code' in error && 
        (error.code === "ECONNRESET" || error.code === "ECONNREFUSED")) {
      return "Base de données non accessible. Vérifiez la configuration PostgreSQL.";
    }

    return "Erreur lors de la réinitialisation. Veuillez réessayer.";
  }
}

// Actions de gestion des documents supplémentaires
export async function getDocumentByIdAction(documentId: number) {
  try {
    // Validation de l'ID du document
    const { DocumentValidator } = await import("../../validators/DocumentValidator");
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

    const documentService = await getDocumentService();
    
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

export async function updateDocumentAction(prevState: unknown, formDataOrObj: FormData | UpdateDocumentPayload) {
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
    const { DocumentValidator } = await import("../../validators/DocumentValidator");
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

    const documentService = await getDocumentService();
    
    // Actually update the document in the database
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
    const { DocumentValidator } = await import("../../validators/DocumentValidator");
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

    const documentService = await getDocumentService();
    
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
    const { DocumentValidator } = await import("../../validators/DocumentValidator");
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

    const documentService = await getDocumentService();
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

// Actions de profil utilisateur supplémentaires
export async function getUserProfileAction(userId: number) {
  try {
    // Vérifier si la base de données est configurée
    if (!process.env.DATABASE_URL) {
      return {
        success: true,
        user: {
          id: userId,
          email: "test@example.com",
          username: "simulation",
          password_hash: undefined,
          first_name: "Test",
          last_name: "User",
          email_verified: true,
          email_verification_token: undefined,
          provider: undefined,
          provider_id: undefined,
          created_at: new Date(),
          updated_at: new Date(),
          reset_token: undefined,
          reset_token_expiry: undefined,
          is_admin: false,
          is_banned: false,
          terms_accepted_at: new Date(),
          profile_image: undefined,
          banner_image: undefined,
        },
      };
    }

    const userService = await getUserService();
    
    // Initialiser les tables si elles n'existent pas
    await userService.initializeTables();

    // Récupérer les données complètes de l'utilisateur
    const result = await userService.getUserById(userId);

    if (!result.success) {
      return {
        success: false,
        error: result.error || "Utilisateur non trouvé",
      };
    }

    return {
      success: true,
      user: result.user,
    };
  } catch (error: unknown) {
    console.error("❌ Erreur lors de la récupération du profil utilisateur:", error);
    return {
      success: false,
      error: "Erreur lors de la récupération du profil",
    };
  }
}

export async function getUserIdByEmailAction(email: string) {
  try {
    // Vérifier si la base de données est configurée
    if (!process.env.DATABASE_URL) {
      return {
        success: true,
        userId: "1", // ID de simulation
      };
    }

    const userService = await getUserService();
    
    // Initialiser les tables si elles n'existent pas
    await userService.initializeTables();

    // Récupérer l'ID utilisateur par email
    const result = await userService.getUserByEmail(email);

    if (!result.success) {
      return {
        success: false,
        error: "Utilisateur non trouvé",
      };
    }

    return {
      success: true,
      userId: result.user!.id.toString(),
    };
  } catch (error: unknown) {
    console.error("❌ Erreur lors de la récupération de l'ID utilisateur:", error);
    return {
      success: false,
      error: "Erreur lors de la récupération de l'ID utilisateur",
    };
  }
}

// Actions administrateur
export async function getAllUsersAction() {
  try {
    // Vérifier si la base de données est configurée
    if (!process.env.DATABASE_URL) {
      return {
        success: true,
        users: [
          {
            id: 1,
            email: "admin@example.com",
            username: "admin",
            first_name: "Admin",
            last_name: "User",
            email_verified: true,
            is_admin: true,
            is_banned: false,
            created_at: new Date(),
            updated_at: new Date(),
          },
        ],
      };
    }

    const userService = await getUserService();
    
    // Initialiser les tables si elles n'existent pas
    await userService.initializeTables();

    // Récupérer tous les utilisateurs
    const result = await userService.getAllUsers();

    if (!result.success) {
      console.error("❌ Erreur récupération utilisateurs:", result.error);
      return {
        success: false,
        error: "Erreur lors de la récupération des utilisateurs.",
        users: [],
      };
    }

    return {
      success: true,
      users: result.users || [],
    };
  } catch (error: unknown) {
    console.error("❌ Erreur lors de la récupération des utilisateurs:", error);
    return {
      success: false,
      error: "Erreur lors de la récupération des utilisateurs.",
      users: [],
    };
  }
}

// --- Favoris ---
export async function toggleFavoriteAction(prevState: unknown, formData: FormData) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id ? Number(session.user.id) : undefined;
    const email = session?.user?.email as string | undefined;
    if (!userId || !email) {
      return { success: false, error: "Utilisateur non authentifié" };
    }

    const documentIdRaw = formData.get("documentId");
    const valueRaw = formData.get("value");
    if (!documentIdRaw) return { success: false, error: "documentId requis" };
    const documentId = parseInt(String(documentIdRaw), 10);
    if (isNaN(documentId) || documentId <= 0) return { success: false, error: "ID de document invalide" };
    const value = valueRaw === "1" || valueRaw === "true" ? true : null;

    if (!process.env.DATABASE_URL) {
      return { success: true, message: "Favori simulé (DATABASE_URL non configurée)" };
    }

    const docSvc = await getDocumentService();
    await docSvc.initializeTables();

    const docRes = await docSvc.getDocumentById(documentId);
    if (!docRes.success || !docRes.document) {
      return { success: false, error: docRes.error || "Document introuvable" };
    }

    if (docRes.document.user_id === userId) {
      const res = await docSvc.toggleFavoriteForDocument(documentId, userId, value);
      if (!res.success) return { success: false, error: res.error || "Erreur lors de la mise à jour du favori" };
      return { success: true };
    } else {
      const res = await docSvc.toggleFavoriteForShare(documentId, email, value);
      if (!res.success) return { success: false, error: res.error || "Erreur lors de la mise à jour du favori" };
      return { success: true };
    }
  } catch (error: unknown) {
    return { success: false, error: String(error instanceof Error ? error.message : error) };
  }
}

export async function getFavoritesAction() {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id ? Number(session.user.id) : undefined;
    const email = session?.user?.email as string | undefined;
    if (!userId || !email) {
      return { success: false, error: "Utilisateur non authentifié", documents: [] };
    }

    if (!process.env.DATABASE_URL) {
      return { success: true, documents: [] };
    }

    const docSvc = await getDocumentService();
    const res = await docSvc.getFavorites(userId, email);
    if (!res.success) return { success: false, error: res.error || "Erreur favoris", documents: [] };
    return { success: true, documents: res.documents };
  } catch (error: unknown) {
    return { success: false, error: String(error instanceof Error ? error.message : error), documents: [] };
  }
}