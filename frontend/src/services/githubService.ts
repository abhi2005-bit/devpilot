import type { ProjectGitHub } from "../types/github";
import API_URL_BASE from "../config/api";

const API_URL = API_URL_BASE;

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