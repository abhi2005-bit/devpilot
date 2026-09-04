import type { Project } from "../types/project";
import type { ProjectHealth } from "../types/health";

import API_URL_BASE from "../config/api";

const API_URL =
  `${API_URL_BASE}/projects`;

export const projectService = {

  async getAll(): Promise<Project[]> {
    const response = await fetch(API_URL);

    if (!response.ok) {
      throw new Error("Failed to load projects");
    }

    return response.json();
  },

  async getById(
    id: string,
  ): Promise<Project | undefined> {
    const response = await fetch(
      `${API_URL}/${id}`,
    );

    if (response.status === 404) {
      return undefined;
    }

    if (!response.ok) {
      throw new Error("Failed to load project");
    }

    return response.json();
  },

  async getHealth(
    id: string,
  ): Promise<ProjectHealth> {
    const response = await fetch(
      `${API_URL}/${id}/health`,
    );

    if (response.status === 404) {
      throw new Error("Project not found");
    }

    if (!response.ok) {
      throw new Error(
        "Failed to load project health",
      );
    }

    return response.json();
  },

  async create(
    project: Project,
  ): Promise<Project> {

    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: project.name,
        description: project.description,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to create project");
    }

    return response.json();
  },

  async update(
    project: Project,
  ): Promise<Project> {

    const response = await fetch(
      `${API_URL}/${project.id}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: project.name,
          description: project.description,
        }),
      },
    );

    if (!response.ok) {
      throw new Error("Failed to update project");
    }

    return response.json();
  },

  async delete(
    id: string,
  ): Promise<void> {

    const response = await fetch(
      `${API_URL}/${id}`,
      {
        method: "DELETE",
      },
    );

    if (!response.ok) {
      throw new Error("Failed to delete project");
    }
  },
};