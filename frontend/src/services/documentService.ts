import { authenticatedFetch } from "./apiClient";
import API_URL_BASE from "../config/api";

export interface DocumentItem {
  id: number;
  project_id: number;
  author_id: number | null;
  title: string;
  description: string | null;
  category: string;
  content: string | null;
  created_at: string;
  updated_at: string;
}

export interface DocumentCreate {
  title: string;
  description?: string;
  category: string;
  content?: string;
}

export interface DocumentUpdate {
  title?: string;
  description?: string;
  category?: string;
  content?: string;
}

export const documentService = {
  getProjectDocuments: async (projectId: string | number): Promise<DocumentItem[]> => {
    const response = await authenticatedFetch(`${API_URL_BASE}/projects/${projectId}/documents`);
    if (!response.ok) throw new Error("Failed to get project documents");
    return response.json();
  },

  getDocument: async (projectId: string | number, documentId: string | number): Promise<DocumentItem> => {
    const response = await authenticatedFetch(`${API_URL_BASE}/projects/${projectId}/documents/${documentId}`);
    if (!response.ok) throw new Error("Failed to get document");
    return response.json();
  },

  createDocument: async (projectId: string | number, data: DocumentCreate): Promise<DocumentItem> => {
    const response = await authenticatedFetch(`${API_URL_BASE}/projects/${projectId}/documents`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error("Failed to create document");
    return response.json();
  },

  updateDocument: async (projectId: string | number, documentId: string | number, data: DocumentUpdate): Promise<DocumentItem> => {
    const response = await authenticatedFetch(`${API_URL_BASE}/projects/${projectId}/documents/${documentId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error("Failed to update document");
    return response.json();
  },

  deleteDocument: async (projectId: string | number, documentId: string | number): Promise<void> => {
    const response = await authenticatedFetch(`${API_URL_BASE}/projects/${projectId}/documents/${documentId}`, {
      method: "DELETE",
    });
    if (!response.ok) throw new Error("Failed to delete document");
  }
};
