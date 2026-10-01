import type { Sprint } from "../types/sprint";
import API_URL_BASE from "../config/api";
import { authenticatedFetch } from "./apiClient";

const API_URL = `${API_URL_BASE}`;

export const sprintService = {
  getSprints: async (projectId: string): Promise<Sprint[]> => {
    const response = await authenticatedFetch(`${API_URL}/projects/${projectId}/sprints`);
    if (!response.ok) throw new Error("Failed to load sprints");
    return response.json();
  },

  getSprint: async (sprintId: string): Promise<Sprint> => {
    const response = await authenticatedFetch(`${API_URL}/sprints/${sprintId}`);
    if (!response.ok) throw new Error("Failed to load sprint");
    return response.json();
  },

  createSprint: async (projectId: string, sprintData: Partial<Sprint>): Promise<Sprint> => {
    const response = await authenticatedFetch(`${API_URL}/projects/${projectId}/sprints`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(sprintData),
    });
    if (!response.ok) throw new Error("Failed to create sprint");
    return response.json();
  },

  updateSprint: async (sprintId: string, sprintData: Partial<Sprint>): Promise<Sprint> => {
    const response = await authenticatedFetch(`${API_URL}/sprints/${sprintId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(sprintData),
    });
    if (!response.ok) throw new Error("Failed to update sprint");
    return response.json();
  },
};
