'use server';

import { signIn } from '../../auth';
import { AuthError } from 'next-auth';
import { createUser } from './database';
import { validateRegistrationData } from './validation';
import { initializeTables } from './database';
import { generateVerificationToken, sendVerificationEmail, sendPasswordResetEmail } from './email';
import bcrypt from 'bcryptjs';
import { query, createDocument, createOrUpdateNote, createOrUpdateDocument, createOrUpdateDocumentById, getUserDocuments, getAllDocuments, getDocumentById, updateDocument, deleteDocument } from './database';

export async function authenticate(
  prevState: string | undefined,
  formData: FormData,
) {
  try {
    await signIn('credentials', formData);
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case 'CredentialsSignin':
          return 'Email ou mot de passe incorrect, ou email non vérifié.';
        default:
          return 'Une erreur est survenue.';
      }
    }
    throw error;
  }
}

export async function registerUser(
  prevState: string | undefined,
  formData: FormData,
) {
  try {
    const userData = {
      email: formData.get('email') as string,
      username: formData.get('username') as string,
      password: formData.get('password') as string,
      firstName: formData.get('firstName') as string,
      lastName: formData.get('lastName') as string,
    };

    // Validation côté serveur
    const validation = validateRegistrationData(userData);
    if (!validation.isValid) {
      return Object.values(validation.errors)[0] || 'Données invalides';
    }

    // Vérifier si la base de données est configurée
    if (!process.env.DATABASE_URL) {
      console.log('⚠️ Base de données non configurée - Mode simulation');
      console.log(`📧 Email de vérification à envoyer à: ${userData.email}`);
      console.log(`👤 Utilisateur simulé: ${userData.firstName} ${userData.lastName}`);
      
      return 'Inscription réussie (mode simulation). Configurez DATABASE_URL pour la persistance.';
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
      console.error('❌ Erreur envoi email:', emailResult.error);
      return 'Inscription réussie, mais erreur lors de l\'envoi de l\'email de vérification. Veuillez contacter le support.';
    }

    console.log(`👤 Utilisateur créé: ${(user as any).first_name} ${(user as any).last_name} (${(user as any).email})`);
    console.log(`📧 Email de vérification envoyé à: ${userData.email}`);

    return 'Inscription réussie ! Un email de vérification a été envoyé. Vérifiez votre boîte de réception.';
  } catch (error: any) {
    console.error('❌ Erreur lors de l\'inscription:', error);
    
    if (error.message.includes('déjà utilisé')) {
      return error.message;
    }
    
    if (error.code === 'ECONNRESET' || error.code === 'ECONNREFUSED') {
      return 'Base de données non accessible. Vérifiez la configuration PostgreSQL.';
    }
    
    return 'Erreur lors de l\'inscription. Veuillez réessayer.';
  }
}

export async function sendPasswordResetEmailAction(
  prevState: string | undefined,
  formData: FormData,
) {
  try {
    const email = formData.get('email') as string;

    if (!email) {
      return 'Veuillez entrer votre adresse email.';
    }

    // Validation basique de l'email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return 'Veuillez entrer une adresse email valide.';
    }

    // Vérifier si la base de données est configurée
    if (!process.env.DATABASE_URL) {
      console.log('⚠️ Base de données non configurée - Mode simulation');
      console.log(`📧 Email de réinitialisation à envoyer à: ${email}`);
      return 'Email de réinitialisation envoyé (mode simulation). Configurez DATABASE_URL pour la persistance.';
    }

    // Initialiser les tables si elles n'existent pas
    await initializeTables();

    // Vérifier si l'utilisateur existe
    const result = await query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    // Pour des raisons de sécurité, on ne révèle pas si l'email existe ou non
    // On envoie toujours le même message de succès
    if (result.rows.length === 0) {
      console.log(`📧 Tentative de réinitialisation pour un email inexistant: ${email}`);
      return 'Si un compte existe avec cette adresse email, un lien de réinitialisation a été envoyé.';
    }

    const user = result.rows[0];

    // Vérifier si une demande de réinitialisation a déjà été faite récemment (dans les 5 dernières minutes)
    const recentReset = await query(
      'SELECT reset_token_expiry FROM users WHERE email = $1 AND reset_token_expiry > NOW() - INTERVAL \'5 minutes\'',
      [email]
    );

    if (recentReset.rows.length > 0) {
      console.log(`📧 Demande de réinitialisation trop fréquente pour: ${email}`);
      return 'Si un compte existe avec cette adresse email, un lien de réinitialisation a été envoyé.';
    }

    // Générer un token de réinitialisation
    const resetToken = generateVerificationToken();
    const resetTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 heures

    // Sauvegarder le token en base
    await query(
      'UPDATE users SET reset_token = $1, reset_token_expiry = $2 WHERE id = $3',
      [resetToken, resetTokenExpiry, (user as any).id]
    );

    // Envoyer l'email de réinitialisation
    const emailResult = await sendPasswordResetEmail(
      email,
      resetToken,
      (user as any).first_name
    );

    if (!emailResult.success) {
      console.error('❌ Erreur envoi email:', emailResult.error);
      return 'Erreur lors de l\'envoi de l\'email. Veuillez réessayer.';
    }

    console.log(`📧 Email de réinitialisation envoyé à: ${email}`);

    return 'Un email de réinitialisation a été envoyé. Vérifiez votre boîte de réception.';
  } catch (error: any) {
    console.error('❌ Erreur lors de l\'envoi de l\'email de réinitialisation:', error);
    
    if (error.code === 'ECONNRESET' || error.code === 'ECONNREFUSED') {
      return 'Base de données non accessible. Vérifiez la configuration PostgreSQL.';
    }
    
    return 'Erreur lors de l\'envoi de l\'email. Veuillez réessayer.';
  }
}

export async function resetPasswordAction(
  prevState: string | undefined,
  formData: FormData,
) {
  try {
    const token = formData.get('token') as string;
    const password = formData.get('password') as string;
    const confirmPassword = formData.get('confirmPassword') as string;

    if (!token || !password || !confirmPassword) {
      return 'Tous les champs sont requis.';
    }

    if (password !== confirmPassword) {
      return 'Les mots de passe ne correspondent pas.';
    }

    if (password.length < 6) {
      return 'Le mot de passe doit contenir au moins 6 caractères.';
    }

    // Vérifier si la base de données est configurée
    if (!process.env.DATABASE_URL) {
      console.log('⚠️ Base de données non configurée - Mode simulation');
      console.log(`🔑 Mot de passe simulé pour token: ${token}`);
      return 'Mot de passe modifié avec succès (mode simulation). Configurez DATABASE_URL pour la persistance.';
    }

    // Initialiser les tables si elles n'existent pas
    await initializeTables();

    // Vérifier le token et sa validité
    const result = await query(
      'SELECT * FROM users WHERE reset_token = $1 AND reset_token_expiry > NOW()',
      [token]
    );

    if (result.rows.length === 0) {
      return 'Token invalide ou expiré. Veuillez demander un nouveau lien de réinitialisation.';
    }

    const user = result.rows[0];

    // Hasher le nouveau mot de passe
    const hashedPassword = await bcrypt.hash(password, 12);

    // Mettre à jour le mot de passe et supprimer le token
    await query(
      'UPDATE users SET password_hash = $1, reset_token = NULL, reset_token_expiry = NULL WHERE id = $2',
      [hashedPassword, (user as any).id]
    );

    console.log(`🔑 Mot de passe modifié pour: ${(user as any).email}`);

    return 'Mot de passe modifié avec succès. Vous pouvez maintenant vous connecter.';
  } catch (error: any) {
    console.error('❌ Erreur lors de la réinitialisation du mot de passe:', error);
    
    if (error.code === 'ECONNRESET' || error.code === 'ECONNREFUSED') {
      return 'Base de données non accessible. Vérifiez la configuration PostgreSQL.';
    }
    
    return 'Erreur lors de la réinitialisation. Veuillez réessayer.';
  }
}

// Action pour créer un document
export async function createDocumentAction(
  prevState: string | undefined,
  formData: FormData,
) {
  try {
    const title = formData.get('title') as string;
    const content = formData.get('content') as string;
    const userId = formData.get('userId') as string;

    if (!userId) {
      return 'Utilisateur requis.';
    }

    // Debug: Afficher l'ID utilisateur reçu
    console.log('🔍 Debug createDocumentAction - ID utilisateur reçu:', userId, 'Type:', typeof userId);
    
    // Gérer les différents types d'IDs utilisateur
    let userIdNumber: number;
    
    // Si l'ID utilisateur est undefined ou null
    if (!userId || userId === 'undefined' || userId === 'null' || userId === 'unknown') {
      console.error('❌ ID utilisateur non défini dans la session');
      return 'Session utilisateur invalide. Veuillez vous reconnecter.';
    }
    
    // Si c'est un ID de simulation OAuth
    if (userId === 'oauth-simulated-user') {
      userIdNumber = 1; // ID de simulation
      console.log('🔍 Mode simulation OAuth détecté, utilisation de l\'ID:', userIdNumber);
    } else {
      // Vérifier que l'ID utilisateur est un nombre valide
      userIdNumber = parseInt(userId);
      if (isNaN(userIdNumber) || userIdNumber <= 0) {
        console.error('❌ ID utilisateur invalide:', userId, 'Parsed as:', userIdNumber);
        return 'ID utilisateur invalide. Veuillez vous reconnecter.';
      }
    }

    if (!title || title.trim().length === 0) {
      return 'Le titre du document ne peut pas être vide.';
    }

    if (title.length > 255) {
      return 'Le titre ne peut pas dépasser 255 caractères.';
    }

    // Vérifier si la base de données est configurée
    if (!process.env.DATABASE_URL) {
      console.log('⚠️ Base de données non configurée - Mode simulation');
      console.log(`📄 Document simulé pour utilisateur ${userIdNumber}: ${title}`);
      return 'Document créé avec succès (mode simulation). Configurez DATABASE_URL pour la persistance.';
    }

    // Initialiser les tables si elles n'existent pas
    await initializeTables();

    // Créer ou mettre à jour le document (évite les doublons)
    const result = await createOrUpdateDocument(userIdNumber, title.trim(), content || '');

    if (!result.success) {
      console.error('❌ Erreur création/mise à jour document:', result.error);
      return 'Erreur lors de la création du document. Veuillez réessayer.';
    }

    if (result.isUpdate) {
      console.log(`📄 Document mis à jour: ${result.document.id} par utilisateur ${userIdNumber}`);
      return 'Document mis à jour avec succès !';
    } else {
      console.log(`📄 Document créé: ${result.document.id} par utilisateur ${userIdNumber}`);
      return 'Document créé avec succès !';
    }
  } catch (error: any) {
    console.error('❌ Erreur lors de la création du document:', error);
    
    if (error.code === 'ECONNRESET' || error.code === 'ECONNREFUSED') {
      return 'Base de données non accessible. Vérifiez la configuration PostgreSQL.';
    }
    
    return 'Erreur lors de la création du document. Veuillez réessayer.';
  }
}

// Action pour récupérer les documents d'un utilisateur
export async function getUserDocumentsAction(userId: number, limit = 20, offset = 0) {
  try {
    // Vérifier si la base de données est configurée
    if (!process.env.DATABASE_URL) {
      console.log('⚠️ Base de données non configurée - Mode simulation');
      return {
        success: true,
        documents: [
          {
            id: 1,
            title: 'Document de simulation',
            content: 'Configurez DATABASE_URL pour la persistance.',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            username: 'simulation',
            first_name: 'Test',
            last_name: 'User'
          }
        ]
      };
    }

    // Initialiser les tables si elles n'existent pas
    await initializeTables();

    // Récupérer les documents
    const result = await getUserDocuments(userId, limit, offset);

    if (!result.success) {
      console.error('❌ Erreur récupération documents:', result.error);
      return {
        success: false,
        error: 'Erreur lors de la récupération des documents.',
        documents: []
      };
    }

    return result;
  } catch (error: any) {
    console.error('❌ Erreur lors de la récupération des documents:', error);
    return {
      success: false,
      error: 'Erreur lors de la récupération des documents.',
      documents: []
    };
  }
}

// Action pour récupérer tous les documents (fil d'actualité)
export async function getAllDocumentsAction(limit = 20, offset = 0) {
  try {
    // Vérifier si la base de données est configurée
    if (!process.env.DATABASE_URL) {
      console.log('⚠️ Base de données non configurée - Mode simulation');
      return {
        success: true,
        documents: [
          {
            id: 1,
            title: 'Document de simulation',
            content: 'Configurez DATABASE_URL pour la persistance.',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            username: 'simulation',
            first_name: 'Test',
            last_name: 'User'
          }
        ]
      };
    }

    // Initialiser les tables si elles n'existent pas
    await initializeTables();

    // Récupérer tous les documents
    const result = await getAllDocuments(limit, offset);

    if (!result.success) {
      console.error('❌ Erreur récupération tous les documents:', result.error);
      return {
        success: false,
        error: 'Erreur lors de la récupération des documents.',
        documents: []
      };
    }

    return result;
  } catch (error: any) {
    console.error('❌ Erreur lors de la récupération des documents:', error);
    return {
      success: false,
      error: 'Erreur lors de la récupération des documents.',
      documents: []
    };
  }
}

// Action pour supprimer une note
export async function deleteNoteAction(
  prevState: string | undefined,
  formData: FormData,
) {
  try {
    const noteId = formData.get('noteId') as string;
    const userId = formData.get('userId') as string;

    if (!noteId || !userId) {
      return 'ID de note et utilisateur requis.';
    }

    // Vérifier si la base de données est configurée
    if (!process.env.DATABASE_URL) {
      console.log('⚠️ Base de données non configurée - Mode simulation');
      console.log(`🗑️ Note simulée supprimée: ${noteId} par utilisateur ${userId}`);
      return 'Note supprimée avec succès (mode simulation). Configurez DATABASE_URL pour la persistance.';
    }

    // Initialiser les tables si elles n'existent pas
    await initializeTables();

    // Gérer les différents types d'IDs utilisateur
    let userIdNumber: number;
    
    // Si c'est un ID de simulation OAuth
    if (userId === 'oauth-simulated-user') {
      userIdNumber = 1; // ID de simulation
      console.log('🔍 Mode simulation OAuth détecté, utilisation de l\'ID:', userIdNumber);
    } else {
      // Vérifier que l'ID utilisateur est un nombre valide
      userIdNumber = parseInt(userId);
      if (isNaN(userIdNumber) || userIdNumber <= 0) {
        console.error('❌ ID utilisateur invalide:', userId, 'Parsed as:', userIdNumber);
        return 'ID utilisateur invalide. Veuillez vous reconnecter.';
      }
    }

    // Supprimer la note
    const result = await deleteNote(parseInt(noteId), userIdNumber);

    if (!result.success) {
      console.error('❌ Erreur suppression note:', result.error);
      return result.error;
    }

    console.log(`🗑️ Note supprimée: ${noteId} par utilisateur ${userId}`);

    return result.message;
  } catch (error: any) {
    console.error('❌ Erreur lors de la suppression de la note:', error);
    
    if (error.code === 'ECONNRESET' || error.code === 'ECONNREFUSED') {
      return 'Base de données non accessible. Vérifiez la configuration PostgreSQL.';
    }
    
    return 'Erreur lors de la suppression de la note. Veuillez réessayer.';
  }
}

// Action pour récupérer un document par ID
export async function getDocumentByIdAction(documentId: string) {
  try {
    // Vérifier si la base de données est configurée
    if (!process.env.DATABASE_URL) {
      console.log('⚠️ Base de données non configurée - Mode simulation');
      return {
        success: true,
        document: {
          id: parseInt(documentId),
          title: 'Document de simulation',
          content: 'Configurez DATABASE_URL pour la persistance.',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          username: 'simulation',
          first_name: 'Test',
          last_name: 'User',
          user_id: 1
        }
      };
    }

    // Initialiser les tables si elles n'existent pas
    await initializeTables();

    // Récupérer le document
    const result = await getDocumentById(parseInt(documentId));

    if (!result.success) {
      console.error('❌ Erreur récupération document:', result.error);
      return {
        success: false,
        error: 'Erreur lors de la récupération du document.',
        document: null
      };
    }

    return result;
  } catch (error: any) {
    console.error('❌ Erreur lors de la récupération du document:', error);
    return {
      success: false,
      error: 'Erreur lors de la récupération du document.',
      document: null
    };
  }
}

// Action pour mettre à jour un document
export async function updateDocumentAction(
  prevState: string | undefined,
  formData: FormData,
) {
  try {
    const documentId = formData.get('documentId') as string;
    const userId = formData.get('userId') as string;
    const title = formData.get('title') as string;
    const content = formData.get('content') as string;

    if (!documentId || !userId || !title) {
      return 'ID de document, utilisateur et titre requis.';
    }

    // Debug: Afficher les IDs reçus
    console.log('🔍 Debug updateDocumentAction - ID utilisateur reçu:', userId, 'Type:', typeof userId);
    console.log('🔍 Debug updateDocumentAction - ID document reçu:', documentId, 'Type:', typeof documentId);

    // Vérifier que l'ID document est un nombre valide
    const documentIdNumber = parseInt(documentId);
    if (isNaN(documentIdNumber) || documentIdNumber <= 0) {
      console.error('❌ ID document invalide:', documentId, 'Parsed as:', documentIdNumber);
      return 'ID document invalide.';
    }
    
    // Gérer les différents types d'IDs utilisateur
    let userIdNumber: number;
    
    // Si l'ID utilisateur est undefined ou null
    if (!userId || userId === 'undefined' || userId === 'null' || userId === 'unknown') {
      console.error('❌ ID utilisateur non défini dans la session');
      return 'Session utilisateur invalide. Veuillez vous reconnecter.';
    }
    
    // Si c'est un ID de simulation OAuth
    if (userId === 'oauth-simulated-user') {
      userIdNumber = 1; // ID de simulation
      console.log('🔍 Mode simulation OAuth détecté, utilisation de l\'ID:', userIdNumber);
    } else {
      // Vérifier que l'ID utilisateur est un nombre valide
      userIdNumber = parseInt(userId);
      if (isNaN(userIdNumber) || userIdNumber <= 0) {
        console.error('❌ ID utilisateur invalide:', userId, 'Parsed as:', userIdNumber);
        return 'ID utilisateur invalide. Veuillez vous reconnecter.';
      }
    }

    if (title.trim().length === 0) {
      return 'Le titre du document ne peut pas être vide.';
    }

    if (title.length > 255) {
      return 'Le titre ne peut pas dépasser 255 caractères.';
    }

    // Vérifier si la base de données est configurée
    if (!process.env.DATABASE_URL) {
      console.log('⚠️ Base de données non configurée - Mode simulation');
      console.log(`📄 Document simulé mis à jour: ${documentIdNumber} par utilisateur ${userIdNumber}`);
      return 'Document sauvegardé avec succès (mode simulation). Configurez DATABASE_URL pour la persistance.';
    }

    // Initialiser les tables si elles n'existent pas
    await initializeTables();

    // Créer ou mettre à jour le document avec ID spécifique
    const result = await createOrUpdateDocumentById(documentIdNumber, userIdNumber, title.trim(), content || '');

    if (!result.success) {
      console.error('❌ Erreur création/mise à jour document:', result.error);
      return result.error;
    }

    if (result.isUpdate) {
      console.log(`📄 Document mis à jour: ${documentIdNumber} par utilisateur ${userIdNumber}`);
      return 'Document sauvegardé avec succès !';
    } else {
      console.log(`📄 Document créé: ${result.document.id} par utilisateur ${userIdNumber}`);
      return 'Document créé avec succès !';
    }
  } catch (error: any) {
    console.error('❌ Erreur lors de la mise à jour du document:', error);
    
    if (error.code === 'ECONNRESET' || error.code === 'ECONNREFUSED') {
      return 'Base de données non accessible. Vérifiez la configuration PostgreSQL.';
    }
    
    return 'Erreur lors de la sauvegarde du document. Veuillez réessayer.';
  }
}

// Action pour supprimer un document
export async function deleteDocumentAction(
  prevState: string | undefined,
  formData: FormData,
) {
  try {
    const documentId = formData.get('documentId') as string;
    const userId = formData.get('userId') as string;

    if (!documentId || !userId) {
      return 'ID de document et utilisateur requis.';
    }

    // Vérifier que les IDs sont des nombres valides
    const documentIdNumber = parseInt(documentId);
    const userIdNumber = parseInt(userId);
    
    if (isNaN(documentIdNumber) || documentIdNumber <= 0) {
      console.error('❌ ID document invalide:', documentId);
      return 'ID document invalide.';
    }
    
    if (isNaN(userIdNumber) || userIdNumber <= 0) {
      console.error('❌ ID utilisateur invalide:', userId);
      return 'ID utilisateur invalide. Veuillez vous reconnecter.';
    }

    // Vérifier si la base de données est configurée
    if (!process.env.DATABASE_URL) {
      console.log('⚠️ Base de données non configurée - Mode simulation');
      console.log(`🗑️ Document simulé supprimé: ${documentIdNumber} par utilisateur ${userIdNumber}`);
      return 'Document supprimé avec succès (mode simulation). Configurez DATABASE_URL pour la persistance.';
    }

    // Initialiser les tables si elles n'existent pas
    await initializeTables();

    // Supprimer le document
    const result = await deleteDocument(documentIdNumber, userIdNumber);

    if (!result.success) {
      console.error('❌ Erreur suppression document:', result.error);
      return result.error;
    }

    console.log(`🗑️ Document supprimé: ${documentIdNumber} par utilisateur ${userIdNumber}`);

    return result.message;
  } catch (error: any) {
    console.error('❌ Erreur lors de la suppression du document:', error);
    
    if (error.code === 'ECONNRESET' || error.code === 'ECONNREFUSED') {
      return 'Base de données non accessible. Vérifiez la configuration PostgreSQL.';
    }
    
    return 'Erreur lors de la suppression du document. Veuillez réessayer.';
  }
}

// Action pour récupérer l'ID utilisateur depuis la base de données
export async function getUserIdByEmailAction(email: string) {
  try {
    // Vérifier si la base de données est configurée
    if (!process.env.DATABASE_URL) {
      console.log('⚠️ Base de données non configurée - Mode simulation');
      return {
        success: true,
        userId: "1" // ID de simulation
      };
    }

    // Initialiser les tables si elles n'existent pas
    await initializeTables();

    // Récupérer l'ID utilisateur par email
    const result = await query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length > 0) {
      return {
        success: true,
        userId: result.rows[0].id.toString()
      };
    }

    return {
      success: false,
      error: 'Utilisateur non trouvé'
    };
  } catch (error: any) {
    console.error('❌ Erreur lors de la récupération de l\'ID utilisateur:', error);
    return {
      success: false,
      error: 'Erreur lors de la récupération de l\'ID utilisateur'
    };
  }
}

// Action pour créer une note (alias pour createDocumentAction)
export async function createNoteAction(
  prevState: string | undefined,
  formData: FormData,
) {
  try {
    const content = formData.get('content') as string;
    const userId = formData.get('userId') as string;

    if (!userId) {
      return 'Utilisateur requis.';
    }

    // Debug: Afficher l'ID utilisateur reçu
    console.log('🔍 Debug createNoteAction - ID utilisateur reçu:', userId, 'Type:', typeof userId);
    
    // Gérer les différents types d'IDs utilisateur
    let userIdNumber: number;
    
    // Si l'ID utilisateur est undefined ou null
    if (!userId || userId === 'undefined' || userId === 'null' || userId === 'unknown') {
      console.error('❌ ID utilisateur non défini dans la session');
      return 'Session utilisateur invalide. Veuillez vous reconnecter.';
    }
    
    // Si c'est un ID de simulation OAuth
    if (userId === 'oauth-simulated-user') {
      userIdNumber = 1; // ID de simulation
      console.log('🔍 Mode simulation OAuth détecté, utilisation de l\'ID:', userIdNumber);
    } else {
      // Vérifier que l'ID utilisateur est un nombre valide
      userIdNumber = parseInt(userId);
      if (isNaN(userIdNumber) || userIdNumber <= 0) {
        console.error('❌ ID utilisateur invalide:', userId, 'Parsed as:', userIdNumber);
        return 'ID utilisateur invalide. Veuillez vous reconnecter.';
      }
    }

    if (!content || content.trim().length === 0) {
      return 'Le contenu de la note ne peut pas être vide.';
    }

    if (content.length > 1000) {
      return 'Le contenu ne peut pas dépasser 1000 caractères.';
    }

    // Vérifier si la base de données est configurée
    if (!process.env.DATABASE_URL) {
      console.log('⚠️ Base de données non configurée - Mode simulation');
      console.log(`📝 Note simulée pour utilisateur ${userIdNumber}: ${content.substring(0, 50)}...`);
      return 'Note publiée avec succès (mode simulation). Configurez DATABASE_URL pour la persistance.';
    }

    // Initialiser les tables si elles n'existent pas
    await initializeTables();

    // Créer ou mettre à jour la note (évite les doublons)
    const result = await createOrUpdateNote(userIdNumber, content.trim());

    if (!result.success) {
      console.error('❌ Erreur création/mise à jour note:', result.error);
      return 'Erreur lors de la publication de la note. Veuillez réessayer.';
    }

    if (result.isUpdate) {
      console.log(`📝 Note mise à jour: ${result.document.id} par utilisateur ${userIdNumber}`);
      return 'Note mise à jour avec succès !';
    } else {
      console.log(`📝 Note créée: ${result.document.id} par utilisateur ${userIdNumber}`);
      return 'Note publiée avec succès !';
    }
  } catch (error: any) {
    console.error('❌ Erreur lors de la création de la note:', error);
    
    if (error.code === 'ECONNRESET' || error.code === 'ECONNREFUSED') {
      return 'Base de données non accessible. Vérifiez la configuration PostgreSQL.';
    }
    
    return 'Erreur lors de la publication de la note. Veuillez réessayer.';
  }
}