import type { Project } from "../types/project";
import type { EngineeringHealth } from "../types/health";

import API_URL_BASE from "../config/api";
import { authenticatedFetch, responseError } from "./apiClient";

const API_URL = `${API_URL_BASE}/projects`;

export const projectService = {
  async getAll(): Promise<Project[]> {
    const response = await authenticatedFetch(API_URL);

    if (!response.ok) {
      throw await responseError(response, "Failed to load projects");
    }

    return response.json();
  },

  async getById(
    id: string,
  ): Promise<Project | undefined> {
    const response = await authenticatedFetch(
      `${API_URL}/${id}`,
    );

    if (response.status === 404) {
      return undefined;
    }

    if (!response.ok) {
      throw await responseError(response, "Failed to load project");
    }

    return response.json();
  },

  async getHealth(
    id: string,
  ): Promise<EngineeringHealth> {
    const response = await authenticatedFetch(
      `${API_URL}/${id}/engineering-health`,
    );

    if (response.status === 404) {
      throw await responseError(response, "Project not found");
    }

    if (!response.ok) {
      throw await responseError(response, "Failed to load engineering health");
    }

    return response.json();
  },

  async create(
    project: Project,
  ): Promise<Project> {
    const response = await authenticatedFetch(
      API_URL,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: project.name,
          description: project.description,
          github_owner: project.github_owner?.trim() || null,
          github_repo: project.github_repo?.trim() || null,
          risk: project.risk,
          progress: project.progress,
        }),
      },
    );

    if (!response.ok) {
      throw await responseError(response, "Failed to create project");
    }

    return response.json();
  },

  async update(
    project: Project,
  ): Promise<Project> {
    const response = await authenticatedFetch(
      `${API_URL}/${project.id}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: project.name,
          description: project.description,
          github_owner: project.github_owner?.trim() || null,
          github_repo: project.github_repo?.trim() || null,
          risk: project.risk,
          progress: project.progress,
        }),
      },
    );

    if (!response.ok) {
      throw await responseError(response, "Failed to update project");
    }

    return response.json();
  },

  async delete(
    id: string,
  ): Promise<void> {
    const response = await authenticatedFetch(
      `${API_URL}/${id}`,
      {
        method: "DELETE",
      },
    );

    if (!response.ok) {
      throw await responseError(response, "Failed to delete project");
    }
  },
};
