import API_URL_BASE from "../config/api";
import { authenticatedFetch } from "./apiClient";

export interface TimelineEvent {
  timestamp: string;
  type: string;
  description: string;
  reference_id?: string;
  url?: string;
}

export interface ContributingFactor {
  title: string;
  description: string;
}

export interface Recommendation {
  title: string;
  action_type: string;
  target_id?: string;
  target_url?: string;
}

export interface EvidenceData {
  health_score?: number;
  health_change?: number;
  open_issues?: number;
  critical_issues?: number;
  stale_issues?: number;
  failed_ci_runs?: number;
  total_ci_runs?: number;
  linked_prs?: number;
  linked_commits?: number;
}

export interface ProblemSummary {
  title: string;
  severity: string;
  current_state: string;
  why_it_matters: string;
}

export interface AIInference {
  statement: string;
  confidence: string;
  supporting_evidence: string[];
}

export interface AIRecommendation {
  title: string;
  reason: string;
  priority: string;
}

export interface AIAnalysisResult {
  summary: string;
  facts: string[];
  inferences: AIInference[];
  recommendations: AIRecommendation[];
  uncertainty: string[];
}

export interface StructuredInvestigation {
  id: string;
  project_id: string;
  category: string;
  problem: ProblemSummary;
  confidence: string;
  evidence: EvidenceData;
  timeline: TimelineEvent[];
  contributing_factors: ContributingFactor[];
  recommendations: Recommendation[];
  ai_analysis?: AIAnalysisResult;
}

export const investigationService = {
  analyzeProblem: async (
    projectId: string,
    category: string,
    itemId: string,
    title: string,
    description: string
  ): Promise<StructuredInvestigation> => {
    const params = new URLSearchParams({
      category,
      item_id: itemId,
      title,
      description
    });
    
    const res = await authenticatedFetch(
      `${API_URL_BASE}/projects/${projectId}/investigations/analyze?${params.toString()}`
    );
    if (!res.ok) {
      throw new Error("Failed to analyze problem");
    }
    return res.json();
  },
  
  analyzeProblemWithAI: async (
    projectId: string,
    category: string,
    itemId: string,
    title: string,
    description: string
  ): Promise<StructuredInvestigation> => {
    const params = new URLSearchParams({
      category,
      item_id: itemId,
      title,
      description
    });
    
    const res = await authenticatedFetch(
      `${API_URL_BASE}/projects/${projectId}/investigations/analyze/ai?${params.toString()}`
    );
    if (!res.ok) {
      throw new Error("Failed to analyze problem with AI");
    }
    return res.json();
  }
};
