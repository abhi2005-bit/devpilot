import type { ProjectHealth } from "../types/health";
import API_URL_BASE from "../config/api";

const API_URL = API_URL_BASE;

export const healthService = {
  async getProjectHealth(
    projectId: string,
  ): Promise<ProjectHealth> {
    const response = await fetch(
      `${API_URL}/projects/${projectId}/health`,
    );

    if (!response.ok) {
      throw new Error(
        "Failed to load project health",
      );
    }

    return response.json();
  },
};