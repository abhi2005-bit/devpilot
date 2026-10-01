import API_URL_BASE from "../config/api";
import { authenticatedFetch } from "./apiClient";

import type {
  CICDHealth,
  CICDJob,
  CICDRun,
  CICDRunsResponse,
  CICDSyncResponse,
} from "../types/cicd";

function buildUrl(
  projectId: string,
  suffix = "",
  params?: URLSearchParams,
): string {
  const query = params?.toString();
  return `${API_URL_BASE}/projects/${projectId}/cicd${suffix}${
    query ? `?${query}` : ""
  }`;
}

async function getResponseError(
  response: Response,
  fallback: string,
): Promise<Error> {
  try {
    const errorData = await response.json();
    if (typeof errorData.detail === "string") {
      return new Error(errorData.detail);
    }
  } catch {
    return new Error(fallback);
  }

  return new Error(fallback);
}

async function requestJson<T>(
  url: string,
  fallback: string,
  init?: RequestInit,
): Promise<T> {
  const response = await authenticatedFetch(url, init);

  if (!response.ok) {
    throw await getResponseError(response, fallback);
  }

  return response.json();
}

export const cicdService = {
  async getRuns(
    projectId: string,
    limit = 50,
    offset = 0,
  ): Promise<CICDRunsResponse> {
    const params = new URLSearchParams({
      limit: String(limit),
      offset: String(offset),
    });

    return requestJson<CICDRunsResponse>(
      buildUrl(projectId, "", params),
      "Failed to load CI/CD runs.",
    );
  },

  async getHealth(projectId: string): Promise<CICDHealth> {
    return requestJson<CICDHealth>(
      buildUrl(projectId, "/health"),
      "Failed to load CI/CD health.",
    );
  },

  async getRun(
    projectId: string,
    runId: number,
  ): Promise<CICDRun> {
    return requestJson<CICDRun>(
      buildUrl(projectId, `/${runId}`),
      "Failed to load workflow run.",
    );
  },

  async getJobs(
    projectId: string,
    runId: number,
    limit = 100,
    offset = 0,
  ): Promise<CICDJob[]> {
    const params = new URLSearchParams({
      limit: String(limit),
      offset: String(offset),
    });

    return requestJson<CICDJob[]>(
      buildUrl(projectId, `/${runId}/jobs`, params),
      "Failed to load workflow jobs.",
    );
  },

  async sync(
    projectId: string,
    limit = 10,
  ): Promise<CICDSyncResponse> {
    const params = new URLSearchParams({
      limit: String(limit),
    });

    return requestJson<CICDSyncResponse>(
      buildUrl(projectId, "/sync", params),
      "Failed to sync GitHub Actions.",
      { method: "POST" },
    );
  },
};