import { PrismaDocumentRepository } from "../repositories/PrismaDocumentRepository";
import { CreateDocumentData, Document, DocumentRepositoryResult, TrashDocument } from "../types";

export class PrismaDocumentService {
  private documentRepository: PrismaDocumentRepository;

  constructor() {
    this.documentRepository = new PrismaDocumentRepository();
  }

  async initializeTables(): Promise<void> {
    await this.documentRepository.initializeTables();
  }

  async createDocument(data: CreateDocumentData): Promise<DocumentRepositoryResult<Document>> {
    try {
      return await this.documentRepository.createDocument(data);
    } catch (error) {
      console.error("❌ Erreur création document:", error);
      return { success: false, error: error instanceof Error ? error.message : "Erreur inconnue" };
    }
  }

  async getDocumentById(id: number): Promise<DocumentRepositoryResult<Document>> {
    try {
      return await this.documentRepository.getDocumentById(id);
    } catch (error) {
      console.error("❌ Erreur récupération document:", error);
      return { success: false, error: error instanceof Error ? error.message : "Erreur inconnue" };
    }
  }

  async getUserDocuments(userId: number, limit: number = 20, offset: number = 0): Promise<DocumentRepositoryResult<Document[]>> {
    try {
      return await this.documentRepository.getUserDocuments(userId, limit, offset);
    } catch (error) {
      console.error("❌ Erreur récupération documents utilisateur:", error);
      return { success: false, error: error instanceof Error ? error.message : "Erreur inconnue" };
    }
  }

  async updateDocument(id: number, userId: number, title: string, content: string, tags: string[]): Promise<DocumentRepositoryResult<Document>> {
    try {
      return await this.documentRepository.updateDocument(id, userId, title, content, tags);
    } catch (error) {
      console.error("❌ Erreur mise à jour document:", error);
      return { success: false, error: error instanceof Error ? error.message : "Erreur inconnue" };
    }
  }

  async deleteDocument(id: number, userId: number): Promise<DocumentRepositoryResult<boolean>> {
    try {
      return await this.documentRepository.deleteDocument(id, userId);
    } catch (error) {
      console.error("❌ Erreur suppression document:", error);
      return { success: false, error: error instanceof Error ? error.message : "Erreur inconnue" };
    }
  }

  async deleteDocumentsBulk(userId: number, documentIds: string[]): Promise<DocumentRepositoryResult<{ deletedCount: number }>> {
    try {
      return await this.documentRepository.deleteDocumentsBulk(userId, documentIds);
    } catch (error) {
      console.error("❌ Erreur suppression multiple documents:", error);
      return { success: false, error: error instanceof Error ? error.message : "Erreur inconnue" };
    }
  }

  async createOrUpdateDocumentById(id: number, userId: number, userEmail: string, title: string, content: string, tags: string[]): Promise<DocumentRepositoryResult<Document>> {
    try {
      return await this.documentRepository.createOrUpdateDocumentById(id, userId, title, content, tags, userEmail);
    } catch (error) {
      console.error("❌ Erreur création/mise à jour document:", error);
      return { success: false, error: error instanceof Error ? error.message : "Erreur inconnue" };
    }
  }

  async getUserTrashedDocuments(userId: number, limit: number = 20, offset: number = 0): Promise<DocumentRepositoryResult<TrashDocument[]>> {
    try {
      return await this.documentRepository.getUserTrashedDocuments(userId, limit, offset) as any;
    } catch (error) {
      console.error("❌ Erreur récupération corbeille:", error);
      return { success: false, error: error instanceof Error ? error.message : "Erreur inconnue" } as any;
    }
  }

  async restoreDocumentFromTrash(trashId: number, userId: number): Promise<DocumentRepositoryResult<{ id: number }>> {
    try {
      return await this.documentRepository.restoreDocumentFromTrash(trashId, userId);
    } catch (error) {
      console.error("❌ Erreur restauration corbeille:", error);
      return { success: false, error: error instanceof Error ? error.message : "Erreur inconnue" };
    }
  }
}
