import type {
  IssueComment,
  CreateIssueComment,
} from "../types/comment";
import API_URL_BASE from "../config/api";
import { authenticatedFetch } from "./apiClient";

const API_URL = API_URL_BASE;

export const commentService = {
  async getComments(
    issueId: string,
  ): Promise<IssueComment[]> {
    const response = await authenticatedFetch(
      `${API_URL}/issues/${issueId}/comments`,
    );

    if (!response.ok) {
      throw new Error(
        "Failed to load issue comments",
      );
    }

    return response.json();
  },

  async createComment(
    issueId: string,
    data: CreateIssueComment,
  ): Promise<IssueComment> {
    const response = await authenticatedFetch(
      `${API_URL}/issues/${issueId}/comments`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      },
    );

    if (!response.ok) {
      throw new Error(
        "Failed to create issue comment",
      );
    }

    return response.json();
  },
};