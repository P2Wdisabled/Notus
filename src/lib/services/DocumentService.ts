import { DocumentRepository } from "../repositories/DocumentRepository";
import { CreateDocumentData, UpdateDocumentData, Document, DocumentRepositoryResult } from "../types";

export class DocumentService {
  private documentRepository: DocumentRepository;

  constructor() {
    this.documentRepository = new DocumentRepository();
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

  async getUserDocuments(userId: number, limit: number = 20, offset: number = 0): Promise<DocumentRepositoryResult<Document[]>> {
    try {
      return await this.documentRepository.getUserDocuments(userId, limit, offset);
    } catch (error) {
      console.error("❌ Erreur récupération documents:", error);
      return { success: false, error: error instanceof Error ? error.message : "Erreur inconnue" };
    }
  }

  async getDocumentById(documentId: number): Promise<DocumentRepositoryResult<Document>> {
    try {
      return await this.documentRepository.getDocumentById(documentId);
    } catch (error) {
      console.error("❌ Erreur récupération document:", error);
      return { success: false, error: error instanceof Error ? error.message : "Erreur inconnue" };
    }
  }

  async updateDocument(data: UpdateDocumentData): Promise<DocumentRepositoryResult<Document>> {
    try {
      return await this.documentRepository.updateDocument(data);
    } catch (error) {
      console.error("❌ Erreur mise à jour document:", error);
      return { success: false, error: error instanceof Error ? error.message : "Erreur inconnue" };
    }
  }

  async createOrUpdateDocumentById(
    documentId: number | null,
    userId: number,
    userEmail: string,
    title: string,
    content: string,
    tags: string[] | undefined = undefined
  ): Promise<DocumentRepositoryResult<Document>> {
    try {
      return await this.documentRepository.createOrUpdateDocumentById(documentId, userId, title, content, tags);
    } catch (error) {
      console.error("❌ Erreur création/mise à jour document par ID:", error);
      return { success: false, error: error instanceof Error ? error.message : "Erreur inconnue" };
    }
  }

  async deleteDocument(documentId: number, userId: number): Promise<DocumentRepositoryResult<{ id: number }>> {
    try {
      return await this.documentRepository.deleteDocument(documentId, userId);
    } catch (error) {
      console.error("❌ Erreur suppression document:", error);
      return { success: false, error: error instanceof Error ? error.message : "Erreur inconnue" };
    }
  }

  async deleteDocumentsBulk(userId: number, documentIds: (string | number)[]): Promise<DocumentRepositoryResult<{ deletedIds: number[]; deletedCount: number }>> {
    try {
      return await this.documentRepository.deleteDocumentsBulk(userId, documentIds);
    } catch (error) {
      console.error("❌ Erreur suppression multiple documents:", error);
      return { success: false, error: error instanceof Error ? error.message : "Erreur inconnue" };
    }
  }

  // Share-related wrappers
  async fetchSharedWithUser(email: string): Promise<DocumentRepositoryResult<Document[]>> {
    try {
      return await this.documentRepository.fetchSharedWithUser(email);
    } catch (error) {
      console.error("❌ Erreur récupération documents partagés:", error);
      return { success: false, error: error instanceof Error ? error.message : "Erreur inconnue" };
    }
  }

  async getSharePermission(documentId: number, email: string): Promise<DocumentRepositoryResult<{ permission: boolean }>> {
    try {
      return await this.documentRepository.getSharePermission(documentId, email);
    } catch (error) {
      console.error("❌ Erreur récupération permission de partage:", error);
      return { success: false, error: error instanceof Error ? error.message : "Erreur inconnue" };
    }
  }

  async addShare(documentId: number, email: string, permission: boolean): Promise<DocumentRepositoryResult<{ id: number }>> {
    try {
      return await this.documentRepository.addShare(documentId, email, permission);
    } catch (error) {
      console.error("❌ Erreur ajout partage:", error);
      return { success: false, error: error instanceof Error ? error.message : "Erreur inconnue" };
    }
  }

  async fetchDocumentAccessList(documentId: number): Promise<DocumentRepositoryResult<{ accessList: any[] }>> {
    try {
      return await this.documentRepository.getAccessList(documentId);
    } catch (error) {
      console.error('❌ Erreur récupération access list:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Erreur inconnue' };
    }
  }

  // Méthodes utilitaires pour la validation des données
  validateDocumentTitle(title: string): { isValid: boolean; error?: string } {
    if (!title || title.trim().length === 0) {
      return { isValid: false, error: "Le titre du document ne peut pas être vide" };
    }

    if (title.length > 255) {
      return { isValid: false, error: "Le titre ne peut pas dépasser 255 caractères" };
    }

    return { isValid: true };
  }


  validateDocumentTags(tags: string[]): { isValid: boolean; error?: string } {
    if (!Array.isArray(tags)) {
      return { isValid: false, error: "Les tags doivent être un tableau" };
    }

    if (tags.length > 20) {
      return { isValid: false, error: "Vous ne pouvez pas avoir plus de 20 tags" };
    }

    for (const tag of tags) {
      if (typeof tag !== 'string') {
        return { isValid: false, error: "Tous les tags doivent être des chaînes de caractères" };
      }

      if (tag.length > 50) {
        return { isValid: false, error: "Chaque tag ne peut pas dépasser 50 caractères" };
      }

      if (tag.trim().length === 0) {
        return { isValid: false, error: "Les tags ne peuvent pas être vides" };
      }
    }

    return { isValid: true };
  }

  validateDocumentData(data: { title: string; content: string; tags: string[] }): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    const titleValidation = this.validateDocumentTitle(data.title);
    if (!titleValidation.isValid) {
      errors.push(titleValidation.error!);
    }

    const tagsValidation = this.validateDocumentTags(data.tags);
    if (!tagsValidation.isValid) {
      errors.push(tagsValidation.error!);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}
