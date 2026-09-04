import type { ProjectMember, User } from "../types/member";
import API_URL_BASE from "../config/api";

const API_URL = API_URL_BASE;

export const memberService = {
  async getMembers(
    projectId: string,
  ): Promise<ProjectMember[]> {
    const response = await fetch(
      `${API_URL}/projects/${projectId}/members`,
    );

    if (!response.ok) {
      throw new Error(
        "Failed to load project members",
      );
    }

    return response.json();
  },

  async getUsers(): Promise<User[]> {
    const response = await fetch(
      `${API_URL}/users`,
    );

    if (!response.ok) {
      throw new Error("Failed to load users");
    }

    return response.json();
  },

  async addMember(
    projectId: string,
    userId: number,
  ): Promise<ProjectMember> {
    const response = await fetch(
      `${API_URL}/projects/${projectId}/members`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: userId,
        }),
      },
    );

    if (response.status === 409) {
      throw new Error(
        "This user is already a member of the project.",
      );
    }

    if (response.status === 404) {
      throw new Error(
        "Project or user not found.",
      );
    }

    if (!response.ok) {
      throw new Error(
        "Failed to add project member",
      );
    }

    return response.json();
  },

  async removeMember(
    projectId: string,
    userId: string,
  ): Promise<void> {
    const response = await fetch(
      `${API_URL}/projects/${projectId}/members/${userId}`,
      {
        method: "DELETE",
      },
    );

    if (response.status === 404) {
      throw new Error(
        "Project member not found.",
      );
    }

    if (!response.ok) {
      throw new Error(
        "Failed to remove project member",
      );
    }
  },
};