import API_URL_BASE from "../config/api";

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
    const response = await fetch(
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
      let message = "Failed to generate AI analysis.";

      try {
        const errorData = await response.json();

        if (typeof errorData.detail === "string") {
          message = errorData.detail;
        }
      } catch {
        // Keep the default error message.
      }

      throw new Error(message);
    }

    return response.json();
  },
};