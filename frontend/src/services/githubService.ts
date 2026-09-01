import type { ProjectGitHub } from "../types/github";

const API_URL = "http://127.0.0.1:8000/api/v1";

export const githubService = {
  async getProjectGitHub(
    projectId: string,
  ): Promise<ProjectGitHub> {
    const response = await fetch(
      `${API_URL}/projects/${projectId}/github`,
    );

    if (!response.ok) {
      throw new Error(
        "Failed to load GitHub data",
      );
    }

    return response.json();
  },
};