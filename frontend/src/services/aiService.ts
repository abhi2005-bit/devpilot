import API_URL_BASE from "../config/api";
import { authenticatedFetch, responseError } from "./apiClient";

const API_URL = `${API_URL_BASE}/projects`;

export type AIAnalysisType =
  | "summary"
  | "health"
  | "risks"
  | "bottlenecks";

export type AISeverity =
  | "positive"
  | "warning"
  | "risk";

export interface AIInsight {
  title: string;
  summary: string;
  severity: AISeverity;
  recommendation: string;
  evidence: string[];
}

export const aiService = {
  async analyzeProject(
    projectId: string,
    analysisType: AIAnalysisType,
  ): Promise<AIInsight> {
    const response = await authenticatedFetch(
      `${API_URL}/${projectId}/ai/analyze`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          analysis_type: analysisType,
        }),
      },
    );

    if (!response.ok) {
      throw await responseError(response, "Failed to generate AI analysis");
    }

    return response.json();
  },
};
