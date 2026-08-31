import type { ProjectHealth } from "../types/health";

const API_URL = "http://127.0.0.1:8000/api/v1";

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