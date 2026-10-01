import type { EngineeringHealth } from "../types/health";
import API_URL_BASE from "../config/api";
import { authenticatedFetch } from "./apiClient";

const API_URL = API_URL_BASE;

export const healthService = {
  async getProjectHealth(
    projectId: string,
  ): Promise<EngineeringHealth> {
    const response = await authenticatedFetch(
      `${API_URL}/projects/${projectId}/engineering-health`,
    );

    if (!response.ok) {
      throw new Error(
        "Failed to load engineering health",
      );
    }

    return response.json();
  },
};
