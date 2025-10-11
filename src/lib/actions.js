"use server";

import { signIn } from "next-auth/react";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../lib/auth";
import { auth } from "../../auth";
import { AuthError } from "next-auth";
import { validateRegistrationData, validateProfileData } from "./validation";
import {
  generateVerificationToken,
  sendVerificationEmail,
  sendPasswordResetEmail,
} from "./email";
import bcrypt from "bcryptjs";
import {
  createUser,
  initializeTables,
  query,
  createDocument,
  createOrUpdateNote,
  createOrUpdateDocument,
  createOrUpdateDocumentById,
  getUserDocuments,
  getAllDocuments,
  getDocumentById,
  deleteDocument,
  deleteDocumentsBulk,
  updateUserProfile,
} from "./database";

// Try to resolve getServerSession/authOptions at runtime (optional)
let getServerSessionFn = undefined;
let authOptionsModule = undefined;
try {
  const nextAuthNext = require("next-auth/next");
  getServerSessionFn =
    nextAuthNext?.getServerSession ?? nextAuthNext?.unstable_getServerSession;
} catch (e) {
  // not available or not installed — fallback will be used
  console.warn(
    "next-auth getServerSession not available via require()",
    e?.message ?? e
  );
}
try {
  authOptionsModule = require("../../auth")?.authOptions;
} catch (e) {
  // file may not exist or path differs — that's fine for now
  // console.warn('authOptions not found at "../../auth"', e?.message ?? e);
}

export async function authenticate(prevState, formData) {
  try {
    const email = formData.get("email");

    // Vérifier si l'utilisateur est banni avant la tentative de connexion
    if (email && process.env.DATABASE_URL) {
      try {
        const result = await query(
          "SELECT is_banned FROM users WHERE email = $1 OR username = $1",
          [email]
        );

        if (result.rows.length > 0 && result.rows[0].is_banned) {
          return "Ce compte a été banni. Contactez un administrateur pour plus d'informations.";
        }
      } catch (dbError) {
        console.error(
          "Erreur lors de la vérification du statut banni:",
          dbError
        );
        // Continuer avec la connexion normale si erreur de base de données
      }
    }

    await signIn("credentials", formData);
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return "Email ou mot de passe incorrect, ou email non vérifié.";
        default:
          return "Une erreur est survenue.";
      }
    }

    throw error;
  }
}

export async function registerUser(prevState, formData) {
  try {
    const userData = {
      email: formData.get("email"),
      username: formData.get("username"),
      password: formData.get("password"),
      firstName: formData.get("firstName"),
      lastName: formData.get("lastName"),
    };

    // Vérifier l'acceptation des conditions d'utilisation
    const acceptTerms = formData.get("acceptTerms");
    if (!acceptTerms) {
      return "Vous devez accepter les conditions d'utilisation et les mentions légales pour vous inscrire.";
    }

    // Validation côté serveur
    const validation = validateRegistrationData(userData);
    if (!validation.isValid) {
      return Object.values(validation.errors)[0] || "Données invalides";
    }

    // Vérifier si la base de données est configurée
    if (!process.env.DATABASE_URL) {
      return "Inscription réussie (mode simulation). Configurez DATABASE_URL pour la persistance.";
    }

    // Initialiser les tables si elles n'existent pas
    await initializeTables();

    // Générer un token de vérification
    const verificationToken = generateVerificationToken();

    // Créer l'utilisateur avec le token
    const user = await createUser({
      ...userData,
      verificationToken,
    });

    // Envoyer l'email de vérification
    const emailResult = await sendVerificationEmail(
      userData.email,
      verificationToken,
      userData.firstName
    );

    if (!emailResult.success) {
      console.error("❌ Erreur envoi email:", emailResult.error);
      return "Inscription réussie, mais erreur lors de l'envoi de l'email de vérification. Veuillez contacter le support.";
    }

    return "Inscription réussie ! Un email de vérification a été envoyé. Vérifiez votre boîte de réception.";
  } catch (error) {
    console.error("❌ Erreur lors de l'inscription:", error);

    if (error.message.includes("déjà utilisé")) {
      return error.message;
    }

    if (error.code === "ECONNRESET" || error.code === "ECONNREFUSED") {
      return "Base de données non accessible. Vérifiez la configuration PostgreSQL.";
    }

    return "Erreur lors de l'inscription. Veuillez réessayer.";
  }
}

export async function sendPasswordResetEmailAction(prevState, formData) {
  try {
    const email = formData.get("email");

    if (!email) {
      return "Veuillez entrer votre adresse email.";
    }

    // Validation basique de l'email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return "Veuillez entrer une adresse email valide.";
    }

    // Vérifier si la base de données est configurée
    if (!process.env.DATABASE_URL) {
      return "Email de réinitialisation envoyé (mode simulation). Configurez DATABASE_URL pour la persistance.";
    }

    // Initialiser les tables si elles n'existent pas
    await initializeTables();

    // Vérifier si l'utilisateur existe
    const result = await query("SELECT * FROM users WHERE email = $1", [email]);

    // Pour des raisons de sécurité, on ne révèle pas si l'email existe ou non
    // On envoie toujours le même message de succès
    if (result.rows.length === 0) {
      return "Si un compte existe avec cette adresse email, un lien de réinitialisation a été envoyé.";
    }

    const user = result.rows[0];

    // Vérifier si une demande de réinitialisation a déjà été faite récemment (dans les 5 dernières minutes)
    const recentReset = await query(
      "SELECT reset_token_expiry FROM users WHERE email = $1 AND reset_token_expiry > NOW() - INTERVAL '5 minutes'",
      [email]
    );

    if (recentReset.rows.length > 0) {
      return "Si un compte existe avec cette adresse email, un lien de réinitialisation a été envoyé.";
    }

    // Générer un token de réinitialisation
    const resetToken = generateVerificationToken();
    const resetTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 heures

    // Sauvegarder le token en base
    await query(
      "UPDATE users SET reset_token = $1, reset_token_expiry = $2 WHERE id = $3",
      [resetToken, resetTokenExpiry, user.id]
    );

    // Envoyer l'email de réinitialisation
    const emailResult = await sendPasswordResetEmail(
      email,
      resetToken,
      user.first_name
    );

    if (!emailResult.success) {
      console.error("❌ Erreur envoi email:", emailResult.error);
      return "Erreur lors de l'envoi de l'email. Veuillez réessayer.";
    }

    return "Un email de réinitialisation a été envoyé. Vérifiez votre boîte de réception.";
  } catch (error) {
    console.error(
      "❌ Erreur lors de l'envoi de l'email de réinitialisation:",
      error
    );

    if (error.code === "ECONNRESET" || error.code === "ECONNREFUSED") {
      return "Base de données non accessible. Vérifiez la configuration PostgreSQL.";
    }

    return "Erreur lors de l'envoi de l'email. Veuillez réessayer.";
  }
}

export async function resetPasswordAction(prevState, formData) {
  try {
    const token = formData.get("token");
    const password = formData.get("password");
    const confirmPassword = formData.get("confirmPassword");

    if (!token || !password || !confirmPassword) {
      return "Tous les champs sont requis.";
    }

    if (password !== confirmPassword) {
      return "Les mots de passe ne correspondent pas.";
    }

    if (password.length < 6) {
      return "Le mot de passe doit contenir au moins 6 caractères.";
    }

    // Vérifier si la base de données est configurée
    if (!process.env.DATABASE_URL) {
      return "Mot de passe modifié avec succès (mode simulation). Configurez DATABASE_URL pour la persistance.";
    }

    // Initialiser les tables si elles n'existent pas
    await initializeTables();

    // Vérifier le token et sa validité
    const result = await query(
      "SELECT * FROM users WHERE reset_token = $1 AND reset_token_expiry > NOW()",
      [token]
    );

    if (result.rows.length === 0) {
      return "Token invalide ou expiré. Veuillez demander un nouveau lien de réinitialisation.";
    }

    const user = result.rows[0];

    // Hasher le nouveau mot de passe
    const hashedPassword = await bcrypt.hash(password, 12);

    // Mettre à jour le mot de passe et supprimer le token
    await query(
      "UPDATE users SET password_hash = $1, reset_token = NULL, reset_token_expiry = NULL WHERE id = $2",
      [hashedPassword, user.id]
    );

    return "Mot de passe modifié avec succès. Vous pouvez maintenant vous connecter.";
  } catch (error) {
    console.error(
      "❌ Erreur lors de la réinitialisation du mot de passe:",
      error
    );

    if (error.code === "ECONNRESET" || error.code === "ECONNREFUSED") {
      return "Base de données non accessible. Vérifiez la configuration PostgreSQL.";
    }

    return "Erreur lors de la réinitialisation. Veuillez réessayer.";
  }
}

// Mettre à jour le profil utilisateur
export async function updateUserProfileAction(prevState, formData) {
  try {
    const session = await auth();
    const userIdRaw = session?.user?.id;

    if (!userIdRaw) {
      return "Vous devez être connecté pour modifier votre profil.";
    }

    const email = formData.get("email") || undefined;
    const username = formData.get("username") || undefined;
    const firstName = formData.get("firstName") || undefined;
    const lastName = formData.get("lastName") || undefined;
    const profileImage = formData.get("profileImage") || undefined;
    const bannerImage = formData.get("bannerImage") || undefined;

    // Validation des données de profil (inclut les images)
    const profileData = {
      email: email?.trim(),
      username: username?.trim(),
      firstName: firstName?.trim(),
      lastName: lastName?.trim(),
      profileImage,
      bannerImage,
    };

    const validation = validateProfileData(profileData);
    if (!validation.isValid) {
      return Object.values(validation.errors)[0] || "Données invalides";
    }

    const fields = {};
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

    await initializeTables();

    const userId = parseInt(String(userIdRaw));
    const result = await updateUserProfile(userId, fields);

    if (!result.success) {
      return result.error || "Erreur lors de la mise à jour du profil.";
    }

    return "Profil mis à jour avec succès !";
  } catch (error) {
    console.error("❌ Erreur mise à jour profil:", error);
    if (error.code === "ECONNRESET" || error.code === "ECONNREFUSED") {
      return "Base de données non accessible. Vérifiez la configuration PostgreSQL.";
    }
    return "Erreur lors de la mise à jour du profil. Veuillez réessayer.";
  }
}

// Action pour créer un document
export async function createDocumentAction(prevState, formData) {
  try {
    const title = formData.get("title");
    const content = formData.get("content");
    const userId = formData.get("userId");
    const rawTags = formData.get("tags");

    if (!userId) {
      return "Utilisateur requis.";
    }

    // Debug: Afficher l'ID utilisateur reçu

    // Gérer les différents types d'IDs utilisateur
    let userIdNumber;

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

    if (!title || title.trim().length === 0) {
      return "Le titre du document ne peut pas être vide.";
    }

    if (title.length > 255) {
      return "Le titre ne peut pas dépasser 255 caractères.";
    }

    // Vérifier si la base de données est configurée
    if (!process.env.DATABASE_URL) {
      return "Document créé avec succès (mode simulation). Configurez DATABASE_URL pour la persistance.";
    }

    // Initialiser les tables si elles n'existent pas
    await initializeTables();

    // Parser les tags
    let tags = [];
    try {
      if (rawTags)
        tags = typeof rawTags === "string" ? JSON.parse(rawTags) : rawTags;
    } catch (e) {
      console.warn("Failed to parse tags payload", e);
      tags = [];
    }

    // Créer un nouveau document avec un ID unique
    const result = await createDocument(
      userIdNumber,
      title.trim(),
      content || "",
      tags
    );

    if (!result.success) {
      console.error("❌ Erreur création document:", result.error);
      return "Erreur lors de la création du document. Veuillez réessayer.";
    }

    return {
      success: true,
      message: "Document créé avec succès !",
      documentId: result.document.id,
    };
  } catch (error) {
    console.error("❌ Erreur lors de la création du document:", error);

    if (error.code === "ECONNRESET" || error.code === "ECONNREFUSED") {
      return "Base de données non accessible. Vérifiez la configuration PostgreSQL.";
    }

    return "Erreur lors de la création du document. Veuillez réessayer.";
  }
}

// Action pour récupérer les documents d'un utilisateur
export async function getUserDocumentsAction(userId, limit = 20, offset = 0) {
  try {
    // Vérifier si la base de données est configurée
    if (!process.env.DATABASE_URL) {
      return {
        success: true,
        documents: [
          {
            id: 1,
            title: "Document de simulation",
            content: "Configurez DATABASE_URL pour la persistance.",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            username: "simulation",
            first_name: "Test",
            last_name: "User",
          },
        ],
      };
    }

    // Initialiser les tables si elles n'existent pas
    await initializeTables();

    // Récupérer les documents
    const result = await getUserDocuments(userId, limit, offset);

    if (!result.success) {
      console.error("❌ Erreur récupération documents:", result.error);
      return {
        success: false,
        error: "Erreur lors de la récupération des documents.",
        documents: [],
      };
    }

    return result;
  } catch (error) {
    console.error("❌ Erreur lors de la récupération des documents:", error);
    return {
      success: false,
      error: "Erreur lors de la récupération des documents.",
      documents: [],
    };
  }
}

// Action pour récupérer tous les documents (fil d'actualité)
export async function getAllDocumentsAction(limit = 20, offset = 0) {
  try {
    // Vérifier si la base de données est configurée
    if (!process.env.DATABASE_URL) {
      return {
        success: true,
        documents: [
          {
            id: 1,
            title: "Document de simulation",
            content: "Configurez DATABASE_URL pour la persistance.",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            username: "simulation",
            first_name: "Test",
            last_name: "User",
          },
        ],
      };
    }

    // Initialiser les tables si elles n'existent pas
    await initializeTables();

    // Récupérer tous les documents
    const result = await getAllDocuments(limit, offset);

    if (!result.success) {
      console.error("❌ Erreur récupération tous les documents:", result.error);
      return {
        success: false,
        error: "Erreur lors de la récupération des documents.",
        documents: [],
      };
    }

    return result;
  } catch (error) {
    console.error("❌ Erreur lors de la récupération des documents:", error);
    return {
      success: false,
      error: "Erreur lors de la récupération des documents.",
      documents: [],
    };
  }
}

// Action pour supprimer une note
export async function deleteNoteAction(prevState, formData) {
  try {
    const noteId = formData.get("noteId");
    const userId = formData.get("userId");

    if (!noteId || !userId) {
      return "ID de note et utilisateur requis.";
    }

    // Vérifier si la base de données est configurée
    if (!process.env.DATABASE_URL) {
      return "Note supprimée avec succès (mode simulation). Configurez DATABASE_URL pour la persistance.";
    }

    // Initialiser les tables si elles n'existent pas
    await initializeTables();

    // Gérer les différents types d'IDs utilisateur
    let userIdNumber;

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

    // Supprimer la note
    const result = await deleteNote(parseInt(noteId), userIdNumber);

    if (!result.success) {
      console.error("❌ Erreur suppression note:", result.error);
      return result.error;
    }

    return result.message;
  } catch (error) {
    console.error("❌ Erreur lors de la suppression de la note:", error);

    if (error.code === "ECONNRESET" || error.code === "ECONNREFUSED") {
      return "Base de données non accessible. Vérifiez la configuration PostgreSQL.";
    }

    return "Erreur lors de la suppression de la note. Veuillez réessayer.";
  }
}

// Action pour récupérer un document par ID
export async function getDocumentByIdAction(documentId) {
  try {
    // Vérifier si la base de données est configurée
    if (!process.env.DATABASE_URL) {
      return {
        success: true,
        document: {
          id: parseInt(documentId),
          title: "Document de simulation",
          content: "Configurez DATABASE_URL pour la persistance.",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          username: "simulation",
          first_name: "Test",
          last_name: "User",
          user_id: 1,
        },
      };
    }

    // Initialiser les tables si elles n'existent pas
    await initializeTables();

    // Récupérer le document
    const result = await getDocumentById(parseInt(documentId));

    if (!result.success) {
      console.error("❌ Erreur récupération document:", result.error);
      return {
        success: false,
        error: "Erreur lors de la récupération du document.",
        document: null,
      };
    }

    return result;
  } catch (error) {
    console.error("❌ Erreur lors de la récupération du document:", error);
    return {
      success: false,
      error: "Erreur lors de la récupération du document.",
      document: null,
    };
  }
}

// Action pour mettre à jour un document
export async function updateDocumentAction(prevState, formDataOrObj) {
  try {
    // Vérifier que formDataOrObj existe et est valide
    if (!formDataOrObj) {
      return { ok: false, error: "No data provided" };
    }

    const fd = formDataOrObj.get ? formDataOrObj : null;
    const documentId = fd
      ? String(fd.get("documentId") || "")
      : String(formDataOrObj.documentId || "");
    if (!documentId) return { ok: false, error: "Missing documentId" };

    // Try server session (if available)
    let serverUserId;
    try {
      if (typeof getServerSessionFn === "function" && authOptionsModule) {
        const session = await getServerSessionFn(authOptionsModule);
        serverUserId = session?.user?.id ? Number(session.user.id) : undefined;
      }
    } catch (e) {
      console.warn(
        "getServerSession failed at runtime, falling back to client userId",
        e?.message ?? e
      );
    }

    // If no server session, try client-sent userId
    let clientUserId;
    if (fd) {
      const u = fd.get("userId");
      if (u) clientUserId = Number(String(u));
    } else if (formDataOrObj.userId) {
      clientUserId = Number(formDataOrObj.userId);
    }

    const userIdToUse = serverUserId ?? clientUserId;
    console.log(
      "updateDocumentAction DEBUG: documentId=",
      documentId,
      "serverUserId=",
      serverUserId,
      "clientUserId=",
      clientUserId,
      "userIdToUse=",
      userIdToUse
    );

    if (!userIdToUse) {
      return { ok: false, error: "Not authenticated" };
    }

    const idNum = Number(documentId);

    // use rich lookup (returns { success, document })
    const docResult = await getDocumentById(idNum);
    if (!docResult || docResult.success !== true || !docResult.document) {
      console.warn(
        "updateDocumentAction: document lookup failed for id",
        idNum,
        docResult
      );
      return { ok: false, error: "Document not found" };
    }

    // docResult.document may be an object or an array of rows — normalize to a single object and cast to any
    let existingAny = docResult.document;
    if (Array.isArray(existingAny)) {
      existingAny = existingAny.length > 0 ? existingAny[0] : null;
    }
    if (!existingAny) {
      console.warn(
        "updateDocumentAction: document result empty after normalization",
        docResult
      );
      return { ok: false, error: "Document not found" };
    }

    console.log(
      "updateDocumentAction DEBUG: existing document owner (raw):",
      existingAny
    );
    // support plusieurs noms de champs possibles pour le propriétaire
    const ownerCandidate =
      existingAny.user_id ??
      existingAny.userId ??
      existingAny.owner_id ??
      existingAny.ownerId ??
      existingAny.user?.id;
    const ownerId = Number(ownerCandidate);
    // userIdToUse was already set above (serverUserId ?? clientUserId)
    const userIdToUseNum = Number(userIdToUse);

    console.log("updateDocumentAction DEBUG:", {
      documentId: idNum,
      ownerCandidate,
      ownerId,
      userIdToUse: userIdToUseNum,
      ownerType: typeof ownerCandidate,
      userIdType: typeof userIdToUseNum,
    });

    // parse title/content/drawings/tags and call updateRichDocument(...)
    // --- keep your existing parsing & update logic here ---
    // Example (adapt to your code):
    let title = "";
    let contentStr = "";
    let rawDrawings = null;
    let rawTags = null;
    if (fd) {
      title = String(fd.get("title") || "");
      contentStr = String(fd.get("content") || "");
      rawDrawings = fd.get("drawings") || null;
      rawTags = fd.get("tags") || null;
    } else {
      title = formDataOrObj.title || "";
      contentStr = formDataOrObj.content || "";
      rawDrawings = formDataOrObj.drawings || null;
      rawTags = formDataOrObj.tags || null;
    }

    let drawings = [];
    let tags = [];
    try {
      if (rawDrawings)
        drawings =
          typeof rawDrawings === "string"
            ? JSON.parse(rawDrawings)
            : rawDrawings;
    } catch (e) {
      console.warn("Failed to parse drawings payload", e);
      drawings = [];
    }

    try {
      if (rawTags)
        tags = typeof rawTags === "string" ? JSON.parse(rawTags) : rawTags;
    } catch (e) {
      console.warn("Failed to parse tags payload", e);
      tags = [];
    }

    // Actually update the document in the database
    // Use your existing update function
    const updateResult = await createOrUpdateDocumentById(
      idNum,
      userIdToUseNum,
      title,
      contentStr,
      tags
    );

    if (!updateResult.success) {
      console.error("❌ Erreur mise à jour document:", updateResult.error);
      return {
        ok: false,
        error:
          updateResult.error || "Erreur lors de la mise à jour du document.",
      };
    }

    return {
      ok: true,
      id: idNum,
      dbResult: updateResult,
    };
  } catch (err) {
    console.error(err);
    return { ok: false, error: String(err?.message || err) };
  }
}

// Action pour supprimer un document
export async function deleteDocumentAction(prevState, formData) {
  try {
    const documentId = formData.get("documentId");
    const userId = formData.get("userId");

    if (!documentId || !userId) {
      return "ID de document et utilisateur requis.";
    }

    // Vérifier que les IDs sont des nombres valides
    const documentIdNumber = parseInt(documentId);
    const userIdNumber = parseInt(userId);

    if (isNaN(documentIdNumber) || documentIdNumber <= 0) {
      console.error("❌ ID document invalide:", documentId);
      return "ID document invalide.";
    }

    if (isNaN(userIdNumber) || userIdNumber <= 0) {
      console.error("❌ ID utilisateur invalide:", userId);
      return "ID utilisateur invalide. Veuillez vous reconnecter.";
    }

    // Vérifier si la base de données est configurée
    if (!process.env.DATABASE_URL) {
      return "Document supprimé avec succès (mode simulation). Configurez DATABASE_URL pour la persistance.";
    }

    // Initialiser les tables si elles n'existent pas
    await initializeTables();

    // Supprimer le document
    const result = await deleteDocument(documentIdNumber, userIdNumber);

    if (!result.success) {
      console.error("❌ Erreur suppression document:", result.error);
      return result.error;
    }

    return result.message;
  } catch (error) {
    console.error("❌ Erreur lors de la suppression du document:", error);

    if (error.code === "ECONNRESET" || error.code === "ECONNREFUSED") {
      return "Base de données non accessible. Vérifiez la configuration PostgreSQL.";
    }

    return "Erreur lors de la suppression du document. Veuillez réessayer.";
  }
}

// Action pour récupérer l'ID utilisateur depuis la base de données
export async function getUserIdByEmailAction(email) {
  try {
    // Vérifier si la base de données est configurée
    if (!process.env.DATABASE_URL) {
      return {
        success: true,
        userId: "1", // ID de simulation
      };
    }

    // Initialiser les tables si elles n'existent pas
    await initializeTables();

    // Récupérer l'ID utilisateur par email
    const result = await query("SELECT id FROM users WHERE email = $1", [
      email,
    ]);

    if (result.rows.length > 0) {
      return {
        success: true,
        userId: result.rows[0].id.toString(),
      };
    }

    return {
      success: false,
      error: "Utilisateur non trouvé",
    };
  } catch (error) {
    console.error(
      "❌ Erreur lors de la récupération de l'ID utilisateur:",
      error
    );
    return {
      success: false,
      error: "Erreur lors de la récupération de l'ID utilisateur",
    };
  }
}
// Action pour supprimer plusieurs documents d'un coup
export async function deleteMultipleDocumentsAction(prevState, formData) {
  try {
    const userId = formData.get("userId");
    const idsRaw = formData.getAll("documentIds");

    if (!userId) {
      return "ID utilisateur requis.";
    }

    const userIdNumber = parseInt(userId);
    if (isNaN(userIdNumber) || userIdNumber <= 0) {
      return "ID utilisateur invalide. Veuillez vous reconnecter.";
    }

    // Vérifier si la base de données est configurée
    if (!process.env.DATABASE_URL) {
      return `${idsRaw.length} document(s) supprimé(s) (mode simulation). Configurez DATABASE_URL pour la persistance.`;
    }

    await initializeTables();

    const result = await deleteDocumentsBulk(userIdNumber, idsRaw);

    if (!result.success) {
      return result.error || "Erreur lors de la suppression multiple.";
    }

    return result.message;
  } catch (error) {
    console.error("❌ Erreur lors de la suppression multiple:", error);
    if (error.code === "ECONNRESET" || error.code === "ECONNREFUSED") {
      return "Base de données non accessible. Vérifiez la configuration PostgreSQL.";
    }
    return "Erreur lors de la suppression multiple. Veuillez réessayer.";
  }
}

export async function getUserProfileAction(userId) {
  try {
    // Vérifier si la base de données est configurée
    if (!process.env.DATABASE_URL) {
      return {
        success: true,
        user: {
          id: userId,
          username: "simulation",
          first_name: "Test",
          last_name: "User",
          email: "test@example.com",
          profile_image: null,
          banner_image: null,
          created_at: new Date().toISOString(),
        },
      };
    }

    // Initialiser les tables si elles n'existent pas
    await initializeTables();

    // Récupérer les données complètes de l'utilisateur
    const result = await query(
      `SELECT id, username, first_name, last_name, email, profile_image, banner_image, created_at
       FROM users WHERE id = $1`,
      [userId]
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
  } catch (error) {
    console.error(
      "❌ Erreur lors de la récupération du profil utilisateur:",
      error
    );
    return {
      success: false,
      error: "Erreur lors de la récupération du profil",
    };
  }
}

// Action pour créer une note (alias pour createDocumentAction)
export async function createNoteAction(prevState, formData) {
  try {
    const content = formData.get("content");
    const userId = formData.get("userId");

    if (!userId) {
      return "Utilisateur requis.";
    }

    // Debug: Afficher l'ID utilisateur reçu

    // Gérer les différents types d'IDs utilisateur
    let userIdNumber;

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

    if (!content || content.trim().length === 0) {
      return "Le contenu de la note ne peut pas être vide.";
    }

    if (content.length > 1000) {
      return "Le contenu ne peut pas dépasser 1000 caractères.";
    }

    // Vérifier si la base de données est configurée
    if (!process.env.DATABASE_URL) {
      return "Note publiée avec succès (mode simulation). Configurez DATABASE_URL pour la persistance.";
    }

    // Initialiser les tables si elles n'existent pas
    await initializeTables();

    // Créer ou mettre à jour la note (évite les doublons)
    const result = await createOrUpdateNote(userIdNumber, content.trim());

    if (!result.success) {
      console.error("❌ Erreur création/mise à jour note:", result.error);
      return "Erreur lors de la publication de la note. Veuillez réessayer.";
    }

    if (result.isUpdate) {
      return "Note mise à jour avec succès !";
    } else {
      return "Note publiée avec succès !";
    }
  } catch (error) {
    console.error("❌ Erreur lors de la création de la note:", error);

    if (error.code === "ECONNRESET" || error.code === "ECONNREFUSED") {
      return "Base de données non accessible. Vérifiez la configuration PostgreSQL.";
    }

    return "Erreur lors de la publication de la note. Veuillez réessayer.";
  }
}
