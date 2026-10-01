import type { ProjectGitHub } from "../types/github";
import API_URL_BASE from "../config/api";
import { authenticatedFetch } from "./apiClient";

const API_URL = API_URL_BASE;

export const githubService = {
  async getProjectGitHub(
    projectId: string,
  ): Promise<ProjectGitHub> {
    const response = await authenticatedFetch(
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