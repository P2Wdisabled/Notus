import { prisma } from '../prisma';
import type { Document, DocumentRepositoryResult, CreateDocumentData, TrashDocument } from '../types';

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
        favori: (document as any).favori ?? null,
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
        orderBy: { updated_at: 'desc' },
        take: limit,
        skip: offset,
      });

      // Transformer les documents pour correspondre à notre interface
      const transformedDocuments: Document[] = documents.map((doc: {
        id: number;
        user_id: number;
        title: string;
        content: string;
        tags: string[];
        favori?: boolean | null;
        created_at: Date;
        updated_at: Date;
        user: {
          username: string | null;
          first_name: string | null;
          last_name: string | null;
        };
      }) => ({
        id: doc.id,
        user_id: doc.user_id,
        title: doc.title,
        content: doc.content,
        tags: doc.tags,
        favori: (doc as any).favori ?? null,
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
        favori: (document as any).favori ?? null,
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
        select: { 
          id: true,
          user_id: true,
          title: true,
          content: true,
          tags: true,
          created_at: true,
          updated_at: true,
        },
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

      // 2. Insérer dans la table de corbeille
    await prisma.trashDocument.create({
      data: {
        user_id: document.user_id,
        title: document.title,
        content: document.content,
        tags: document.tags,
        created_at: document.created_at,
        updated_at: document.updated_at,
        deleted_at: new Date(),
        original_id: document.id,
      },
    });

    // 3. Supprimer de la table principale
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
        select: { 
          id: true, 
          user_id: true, 
          title: true, 
          content: true, 
          tags: true, 
          created_at: true, 
          updated_at: true 
        },
      });

      if (documents.length !== ids.length) {
        return {
          success: false,
          error: 'Certains documents n\'appartiennent pas à cet utilisateur',
        };
      }

      // 2. Insérer tous les documents dans la table de corbeille
      const trashDocuments = documents.map((doc: {
        id: number;
        user_id: number;
        title: string;
        content: string;
        tags: string[];
        created_at: Date;
        updated_at: Date;
      }) => ({
        user_id: doc.user_id,
        title: doc.title,
        content: doc.content,
        tags: doc.tags,
        created_at: doc.created_at,
        updated_at: doc.updated_at,
        deleted_at: new Date(),
        original_id: doc.id,
      }));

      await prisma.trashDocument.createMany({
        data: trashDocuments,
      });

      // 3. Supprimer tous les documents de la table principale
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

  async createOrUpdateDocumentById(id: number, userId: number, title: string, content: string, tags: string[], userEmail?: string): Promise<DocumentRepositoryResult<Document>> {
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
          Share: true,
        },
      });

      if (existingDocument) {
        // Vérifier que le document appartient à l'utilisateur OU qu'il a des permissions de partage
        const isOwner = existingDocument.user_id === userId;
        let hasSharePermission = false;
        
        if (!isOwner && userEmail) {
          // Vérifier les permissions de partage
          hasSharePermission = existingDocument.Share.some(
            share => share.email.toLowerCase().trim() === userEmail.toLowerCase().trim() && share.permission === true
          );
        }
        
        if (!isOwner && !hasSharePermission) {
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
          favori: (updatedDocument as any).favori ?? null,
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
          favori: (newDocument as any).favori ?? null,
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
  async getUserTrashedDocuments(userId: number, limit: number = 20, offset: number = 0): Promise<DocumentRepositoryResult<TrashDocument[]>> {
    try {
      const trashed = await prisma.trashDocument.findMany({
        where: { user_id: userId },
        orderBy: { deleted_at: 'desc' },
        take: limit,
        skip: offset,
      });

      const mapped: TrashDocument[] = trashed.map((t) => ({
        id: t.id,
        original_id: (t as any).original_id ?? null,
        user_id: t.user_id,
        title: t.title,
        content: t.content,
        tags: t.tags as any,
        created_at: t.created_at as any,
        updated_at: t.updated_at as any,
        deleted_at: t.deleted_at as any,
      }));

      return { success: true, documents: mapped as unknown as any } as any;
    } catch (error: unknown) {
      console.error('❌ Erreur récupération corbeille:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue',
        documents: [],
      } as any;
    }
  }

  async restoreDocumentFromTrash(trashId: number, userId: number): Promise<DocumentRepositoryResult<{ id: number }>> {
    try {
      // Vérifier le document en corbeille et sa propriété
      const trashed = await prisma.trashDocument.findUnique({ where: { id: trashId } });
      if (!trashed) {
        return { success: false, error: 'Élément introuvable dans la corbeille' };
      }
      if (trashed.user_id !== userId) {
        return { success: false, error: "Vous n'êtes pas autorisé à restaurer cet élément" };
      }

      // Restaurer en recréant un document (nouvel id)
      const created = await prisma.document.create({
        data: {
          user_id: trashed.user_id,
          title: trashed.title,
          content: trashed.content,
          tags: trashed.tags as any,
          created_at: trashed.created_at,
          updated_at: new Date(),
        },
      });

      // Supprimer l'entrée de corbeille
      await prisma.trashDocument.delete({ where: { id: trashed.id } });

      return { success: true, data: { id: created.id } };
    } catch (error: unknown) {
      console.error('❌ Erreur restauration corbeille:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Erreur inconnue' };
    }
  }
  async fetchSharedWithUser(email: string): Promise<DocumentRepositoryResult<Document[]>> {
    try {
      const documents = await prisma.document.findMany({
        where: {
          Share: {
            some: {
              email: email,
            },
          },
        },
        include: {
          user: {
            select: {
              username: true,
              first_name: true,
              last_name: true,
            },
          },
          Share: {
            where: { email: email },
            select: ({ email: true, permission: true, favori: true } as any),
          },
        },
        orderBy: { updated_at: 'desc' },
      });

      // Transformer les documents pour correspondre à notre interface
      const transformedDocuments: Document[] = documents.map((doc: any) => ({
        id: doc.id,
        user_id: doc.user_id,
        title: doc.title,
        content: doc.content,
        tags: doc.tags,
        // pour les documents partagés, utiliser le favori du lien de partage
        favori: (doc.Share && doc.Share[0] ? doc.Share[0].favori : null),
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
      console.error('❌ Erreur récupération documents partagés avec utilisateur:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue',
        documents: [],
      };
    }
  }

  async fetchSharedByUser(userId: number): Promise<DocumentRepositoryResult<Document[]>> {
    try {
      const documents = await prisma.document.findMany({
        where: {
          user_id: userId,
          Share: {
            some: {},
          },
        },
        include: {
          user: {
            select: {
              username: true,
              first_name: true,
              last_name: true,
            },
          },
          Share: {
            select: ({
              email: true,
              permission: true,
              favori: true,
            } as any),
          },
        },
        orderBy: { updated_at: 'desc' },
      });

      // Transformer les documents pour correspondre à notre interface
      const transformedDocuments: Document[] = documents.map((doc: any) => ({
        id: doc.id,
        user_id: doc.user_id,
        title: doc.title,
        content: doc.content,
        tags: doc.tags,
        favori: (doc as any).favori ?? null,
        created_at: doc.created_at,
        updated_at: doc.updated_at,
        username: doc.user.username ?? undefined,
        first_name: doc.user.first_name ?? undefined,
        last_name: doc.user.last_name ?? undefined,
        // Ajouter les informations de partage
        sharedWith: doc.Share.map((share: any) => ({
          email: share.email,
          permission: share.permission,
        })),
      }));

      return {
        success: true,
        documents: transformedDocuments,
      };
    } catch (error: unknown) {
      console.error('❌ Erreur récupération documents partagés par utilisateur:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue',
        documents: [],
      };
    }
  }

  async toggleFavoriteForDocument(
    documentId: number,
    userId: number,
    value: boolean | null
  ): Promise<DocumentRepositoryResult<{ id: number; favori: boolean | null }>> {
    try {
      const doc = await prisma.document.findUnique({ where: { id: documentId }, select: { id: true, user_id: true } });
      if (!doc) return { success: false, error: 'Document non trouvé' };
      if (doc.user_id !== userId) return { success: false, error: "Vous n'êtes pas autorisé à modifier ce favori" };

      const updated = await prisma.document.update({ where: { id: documentId }, data: ({ favori: value } as any) });
      return { success: true, data: { id: updated.id, favori: (updated as any).favori ?? null } };
    } catch (e: unknown) {
      return { success: false, error: e instanceof Error ? e.message : 'Erreur inconnue' };
    }
  }

  async toggleFavoriteForShare(
    documentId: number,
    email: string,
    value: boolean | null
  ): Promise<DocumentRepositoryResult<{ id: number; favori: boolean | null }>> {
    try {
      const share = await prisma.share.findFirst({ where: { id_doc: documentId, email: email } });
      if (!share) return { success: false, error: 'Partage introuvable pour cet utilisateur' };
      const updated = await prisma.share.update({ where: { id: share.id }, data: ({ favori: value } as any) });
      return { success: true, data: { id: updated.id, favori: (updated as any).favori ?? null } };
    } catch (e: unknown) {
      return { success: false, error: e instanceof Error ? e.message : 'Erreur inconnue' };
    }
  }

  async getFavorites(userId: number, email: string): Promise<DocumentRepositoryResult<Document[]>> {
    try {
      const own = await prisma.document.findMany({
        where: ({ user_id: userId, favori: true } as any),
        include: {
          user: { select: { username: true, first_name: true, last_name: true } },
        },
        orderBy: { updated_at: 'desc' },
      });

      const shared = await prisma.document.findMany({
        where: ({ Share: { some: { email: email, favori: true } } } as any),
        include: {
          user: { select: { username: true, first_name: true, last_name: true } },
          Share: ({ where: { email: email }, select: { favori: true } } as any),
        },
        orderBy: { updated_at: 'desc' },
      });

      const mappedOwn: Document[] = own.map((d: any) => ({
        id: d.id,
        user_id: d.user_id,
        title: d.title,
        content: d.content,
        tags: d.tags,
        favori: d.favori ?? null,
        created_at: d.created_at,
        updated_at: d.updated_at,
        username: d.user?.username ?? undefined,
        first_name: d.user?.first_name ?? undefined,
        last_name: d.user?.last_name ?? undefined,
      }));

      const mappedShared: Document[] = shared.map((d: any) => ({
        id: d.id,
        user_id: d.user_id,
        title: d.title,
        content: d.content,
        tags: d.tags,
        favori: d.Share?.[0]?.favori ?? null,
        created_at: d.created_at,
        updated_at: d.updated_at,
        username: d.user?.username ?? undefined,
        first_name: d.user?.first_name ?? undefined,
        last_name: d.user?.last_name ?? undefined,
      }));

      const byId = new Map<number, Document>();
      [...mappedOwn, ...mappedShared].forEach(doc => { byId.set(doc.id, doc); });
      return { success: true, documents: Array.from(byId.values()) };
    } catch (e: unknown) {
      return { success: false, error: e instanceof Error ? e.message : 'Erreur inconnue', documents: [] };
    }
  }

  async initializeTables(): Promise<void> {
    // Prisma gère automatiquement la création des tables via les migrations
    // Cette méthode est conservée pour la compatibilité
    return Promise.resolve();
  }

}