import type { ProjectGitHub, GitHubRepository } from "../types/github";
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

  async getAuthUrl(): Promise<{url: string}> {
    const res = await authenticatedFetch(`${API_URL}/github/authorize`);
    if (!res.ok) throw new Error("Failed to get authorization url");
    return res.json();
  },

  async authorizeCallback(code: string): Promise<void> {
    const res = await authenticatedFetch(`${API_URL}/github/callback`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });
    if (!res.ok) throw new Error("Failed to authorize GitHub");
  },

  async getAvailableRepositories(): Promise<GitHubRepository[]> {
    const res = await authenticatedFetch(`${API_URL}/github/repositories`);
    if (!res.ok) {
        if (res.status === 401) throw new Error("GitHub account not connected or expired");
        throw new Error("Failed to load repositories");
    }
    return res.json();
  },

  async connectRepository(projectId: string, owner: string, repo: string): Promise<void> {
    const res = await authenticatedFetch(`${API_URL}/github/projects/${projectId}/connect`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ owner, repo }),
    });
    if (!res.ok) throw new Error("Failed to connect repository");
  },

  async syncRepository(projectId: string): Promise<{status: string, last_synced_at: string}> {
    const res = await authenticatedFetch(`${API_URL}/github/projects/${projectId}/sync`, {
      method: "POST",
    });
    if (!res.ok) throw new Error("Failed to sync repository");
    return res.json();
  },

  async disconnectRepository(projectId: string): Promise<void> {
    const res = await authenticatedFetch(`${API_URL}/github/projects/${projectId}/disconnect`, {
      method: "POST",
    });
    if (!res.ok) throw new Error("Failed to disconnect repository");
  }
};