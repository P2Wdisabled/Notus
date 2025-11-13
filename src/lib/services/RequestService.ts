import { RequestRepository, CreateRequestData, UpdateRequestData, Request, RequestRepositoryResult } from "../repositories/RequestRepository";

export class RequestService {
  private requestRepository: RequestRepository;

  constructor() {
    this.requestRepository = new RequestRepository();
  }

  async initializeTables(): Promise<void> {
    await this.requestRepository.initializeTables();
  }

  async createRequest(data: CreateRequestData): Promise<RequestRepositoryResult<Request>> {
    try {
      return await this.requestRepository.createRequest(data);
    } catch (error) {
      console.error("❌ Erreur création requête:", error);
      return { success: false, error: error instanceof Error ? error.message : "Erreur inconnue" };
    }
  }

  async getRequestById(id: number): Promise<RequestRepositoryResult<Request>> {
    try {
      return await this.requestRepository.getRequestById(id);
    } catch (error) {
      console.error("❌ Erreur récupération requête:", error);
      return { success: false, error: error instanceof Error ? error.message : "Erreur inconnue" };
    }
  }

  async getAllRequests(limit: number = 100, offset: number = 0): Promise<RequestRepositoryResult<Request[]>> {
    try {
      return await this.requestRepository.getAllRequests(limit, offset);
    } catch (error) {
      console.error("❌ Erreur récupération requêtes:", error);
      return { success: false, error: error instanceof Error ? error.message : "Erreur inconnue", requests: [] };
    }
  }

  async getRequestsByUser(userId: number): Promise<RequestRepositoryResult<Request[]>> {
    try {
      return await this.requestRepository.getRequestsByUser(userId);
    } catch (error) {
      console.error("❌ Erreur récupération requêtes utilisateur:", error);
      return { success: false, error: error instanceof Error ? error.message : "Erreur inconnue", requests: [] };
    }
  }

  async updateRequest(id: number, data: UpdateRequestData): Promise<RequestRepositoryResult<Request>> {
    try {
      return await this.requestRepository.updateRequest(id, data);
    } catch (error) {
      console.error("❌ Erreur mise à jour requête:", error);
      return { success: false, error: error instanceof Error ? error.message : "Erreur inconnue" };
    }
  }

  async validateRequest(id: number, adminId: number): Promise<RequestRepositoryResult<Request>> {
    try {
      return await this.requestRepository.updateRequest(id, {
        status: "in_progress",
        validated: true,
        validated_by: adminId,
        validated_at: new Date(),
      });
    } catch (error) {
      console.error("❌ Erreur validation requête:", error);
      return { success: false, error: error instanceof Error ? error.message : "Erreur inconnue" };
    }
  }

  async rejectRequest(id: number, adminId: number): Promise<RequestRepositoryResult<Request>> {
    try {
      return await this.requestRepository.updateRequest(id, {
        status: "rejected",
        validated: false,
        validated_by: adminId,
        validated_at: new Date(),
      });
    } catch (error) {
      console.error("❌ Erreur rejet requête:", error);
      return { success: false, error: error instanceof Error ? error.message : "Erreur inconnue" };
    }
  }

  async resolveRequest(id: number, adminId: number): Promise<RequestRepositoryResult<Request>> {
    try {
      return await this.requestRepository.updateRequest(id, {
        status: "resolved",
        validated: true,
        validated_by: adminId,
        validated_at: new Date(),
      });
    } catch (error) {
      console.error("❌ Erreur résolution requête:", error);
      return { success: false, error: error instanceof Error ? error.message : "Erreur inconnue" };
    }
  }

  async deleteRequest(id: number): Promise<RequestRepositoryResult<void>> {
    try {
      return await this.requestRepository.deleteRequest(id);
    } catch (error) {
      console.error("❌ Erreur suppression requête:", error);
      return { success: false, error: error instanceof Error ? error.message : "Erreur inconnue" };
    }
  }
}

