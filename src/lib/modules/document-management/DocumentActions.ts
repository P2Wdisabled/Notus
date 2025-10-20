"use server";

import { DocumentManagementService } from "./DocumentService";

const documentService = new DocumentManagementService();

export const createDocumentAction = documentService.createDocument.bind(documentService);
export const getUserDocumentsAction = documentService.getUserDocuments.bind(documentService);
export const getDocumentByIdAction = documentService.getDocumentById.bind(documentService);
export const updateDocumentAction = documentService.updateDocument.bind(documentService);
export const deleteDocumentAction = documentService.deleteDocument.bind(documentService);
export const deleteMultipleDocumentsAction = documentService.deleteMultipleDocuments.bind(documentService);
