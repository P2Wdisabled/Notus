import { prisma } from '../prisma';
import { Document, DocumentRepositoryResult, CreateDocumentData } from '../types';

export class PrismaDocumentRepository {
  async createDocument(data: CreateDocumentData): Promise<DocumentRepositoryResult<Document>> {
    try {
      const document = await prisma.document.create({
        data: {
          user_id: data.userId,
          title: data.title,
          content: data.content,
          tags: data.tags,
        },
      });

      return {
        success: true,
        document,
      };
    } catch (error: unknown) {
      console.error('❌ Erreur création document:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue',
      };
    }
  }

  async getDocumentById(id: number): Promise<DocumentRepositoryResult<Document>> {
    try {
      const document = await prisma.document.findUnique({
        where: { id },
        include: {
          user: {
            select: {
              username: true,
              first_name: true,
              last_name: true,
            },
          },
        },
      });

      if (!document) {
        return {
          success: false,
          error: 'Document non trouvé',
        };
      }

      // Transformer le document pour correspondre à notre interface
      const transformedDocument: Document = {
        id: document.id,
        user_id: document.user_id,
        title: document.title,
        content: document.content,
        tags: document.tags,
        created_at: document.created_at,
        updated_at: document.updated_at,
        username: document.user.username || undefined,
        first_name: document.user.first_name || undefined,
        last_name: document.user.last_name || undefined,
      };

      return {
        success: true,
        document: transformedDocument,
      };
    } catch (error: unknown) {
      console.error('❌ Erreur récupération document:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue',
      };
    }
  }

  async getUserDocuments(userId: number, limit: number = 20, offset: number = 0): Promise<DocumentRepositoryResult<Document[]>> {
    try {
      const documents = await prisma.document.findMany({
        where: { user_id: userId },
        include: {
          user: {
            select: {
              username: true,
              first_name: true,
              last_name: true,
            },
          },
        },
        orderBy: { created_at: 'desc' },
        take: limit,
        skip: offset,
      });

      // Transformer les documents pour correspondre à notre interface
      const transformedDocuments: Document[] = documents.map(doc => ({
        id: doc.id,
        user_id: doc.user_id,
        title: doc.title,
        content: doc.content,
        tags: doc.tags,
        created_at: doc.created_at,
        updated_at: doc.updated_at,
        username: doc.user.username ?? undefined,
        first_name: doc.user.first_name ?? undefined,
        last_name: doc.user.last_name ?? undefined,
      }));

      return {
        success: true,
        documents: transformedDocuments,
      };
    } catch (error: unknown) {
      console.error('❌ Erreur récupération documents utilisateur:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue',
        documents: [],
      };
    }
  }

  async updateDocument(id: number, userId: number, title: string, content: string, tags: string[]): Promise<DocumentRepositoryResult<Document>> {
    try {
      const document = await prisma.document.update({
        where: { id },
        data: {
          title,
          content,
          tags,
        },
        include: {
          user: {
            select: {
              username: true,
              first_name: true,
              last_name: true,
            },
          },
        },
      });

      // Vérifier que le document appartient à l'utilisateur
      if (document.user_id !== userId) {
        return {
          success: false,
          error: 'Vous n\'êtes pas autorisé à modifier ce document',
        };
      }

      // Transformer le document pour correspondre à notre interface
      const transformedDocument: Document = {
        id: document.id,
        user_id: document.user_id,
        title: document.title,
        content: document.content,
        tags: document.tags,
        created_at: document.created_at,
        updated_at: document.updated_at,
        username: document.user.username || undefined,
        first_name: document.user.first_name || undefined,
        last_name: document.user.last_name || undefined,
      };

      return {
        success: true,
        document: transformedDocument,
      };
    } catch (error: unknown) {
      console.error('❌ Erreur mise à jour document:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue',
      };
    }
  }

  async deleteDocument(id: number, userId: number): Promise<DocumentRepositoryResult<boolean>> {
    try {
      // Vérifier que le document appartient à l'utilisateur
      const document = await prisma.document.findUnique({
        where: { id },
        select: { user_id: true },
      });

      if (!document) {
        return {
          success: false,
          error: 'Document non trouvé',
        };
      }

      if (document.user_id !== userId) {
        return {
          success: false,
          error: 'Vous n\'êtes pas autorisé à supprimer ce document',
        };
      }

      await prisma.document.delete({
        where: { id },
      });

      return {
        success: true,
        data: true,
      };
    } catch (error: unknown) {
      console.error('❌ Erreur suppression document:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue',
      };
    }
  }

  async deleteDocumentsBulk(userId: number, documentIds: string[]): Promise<DocumentRepositoryResult<{ deletedCount: number }>> {
    try {
      const ids = documentIds.map(id => parseInt(id)).filter(id => !isNaN(id));

      if (ids.length === 0) {
        return {
          success: false,
          error: 'Aucun ID de document valide fourni',
        };
      }

      // Vérifier que tous les documents appartiennent à l'utilisateur
      const documents = await prisma.document.findMany({
        where: {
          id: { in: ids },
          user_id: userId,
        },
        select: { id: true },
      });

      if (documents.length !== ids.length) {
        return {
          success: false,
          error: 'Certains documents n\'appartiennent pas à cet utilisateur',
        };
      }

      const result = await prisma.document.deleteMany({
        where: {
          id: { in: ids },
          user_id: userId,
        },
      });

      return {
        success: true,
        data: { deletedCount: result.count },
      };
    } catch (error: unknown) {
      console.error('❌ Erreur suppression multiple documents:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue',
      };
    }
  }

  async createOrUpdateDocumentById(id: number, userId: number, title: string, content: string, tags: string[]): Promise<DocumentRepositoryResult<Document>> {
    try {
      // Essayer de mettre à jour d'abord
      const existingDocument = await prisma.document.findUnique({
        where: { id },
        include: {
          user: {
            select: {
              username: true,
              first_name: true,
              last_name: true,
            },
          },
        },
      });

      if (existingDocument) {
        // Vérifier que le document appartient à l'utilisateur
        if (existingDocument.user_id !== userId) {
          return {
            success: false,
            error: 'Vous n\'êtes pas autorisé à modifier ce document',
          };
        }

        // Mettre à jour le document existant
        const updatedDocument = await prisma.document.update({
          where: { id },
          data: {
            title,
            content,
            tags,
          },
          include: {
            user: {
              select: {
                username: true,
                first_name: true,
                last_name: true,
              },
            },
          },
        });

        // Transformer le document pour correspondre à notre interface
        const transformedDocument: Document = {
          id: updatedDocument.id,
          user_id: updatedDocument.user_id,
          title: updatedDocument.title,
          content: updatedDocument.content,
          tags: updatedDocument.tags,
          created_at: updatedDocument.created_at,
          updated_at: updatedDocument.updated_at,
          username: updatedDocument.user.username ?? undefined,
          first_name: updatedDocument.user.first_name ?? undefined,
          last_name: updatedDocument.user.last_name ?? undefined,
        };

        return {
          success: true,
          document: transformedDocument,
        };
      } else {
        // Créer un nouveau document
        const newDocument = await prisma.document.create({
          data: {
            id,
            user_id: userId,
            title,
            content,
            tags,
          },
          include: {
            user: {
              select: {
                username: true,
                first_name: true,
                last_name: true,
              },
            },
          },
        });

        // Transformer le document pour correspondre à notre interface
        const transformedDocument: Document = {
          id: newDocument.id,
          user_id: newDocument.user_id,
          title: newDocument.title,
          content: newDocument.content,
          tags: newDocument.tags,
          created_at: newDocument.created_at,
          updated_at: newDocument.updated_at,
          username: newDocument.user.username ?? undefined,
          first_name: newDocument.user.first_name ?? undefined,
          last_name: newDocument.user.last_name ?? undefined,
        };

        return {
          success: true,
          document: transformedDocument,
        };
      }
    } catch (error: unknown) {
      console.error('❌ Erreur création/mise à jour document:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue',
      };
    }
  }

  async initializeTables(): Promise<void> {
    // Prisma gère automatiquement la création des tables via les migrations
    // Cette méthode est conservée pour la compatibilité
    return Promise.resolve();
  }
}
