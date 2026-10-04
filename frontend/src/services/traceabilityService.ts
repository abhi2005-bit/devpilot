import API_URL_BASE from "../config/api";
import { authenticatedFetch } from "./apiClient";

export interface TraceabilityContext {
  pull_requests: any[];
  commits: any[];
  ci_runs: any[];
}

export interface PlanningTraceability {
  sprints: Record<string, any>;
  milestones: Record<string, any>;
  goals: Record<string, any>;
}

export const traceabilityService = {
  getIssueTraceability: async (issueId: number | string): Promise<TraceabilityContext> => {
    const res = await authenticatedFetch(`${API_URL_BASE}/issues/${issueId}/traceability`);
    return res.json();
  },

  getProjectEngineeringProgress: async (projectId: string): Promise<any> => {
    const res = await authenticatedFetch(`${API_URL_BASE}/projects/${projectId}/engineering-progress`);
    return res.json();
  },

  getProjectPlanningTraceability: async (projectId: string): Promise<PlanningTraceability> => {
    const res = await authenticatedFetch(`${API_URL_BASE}/projects/${projectId}/planning-traceability`);
    return res.json();
  },
  
  getProjectTraceabilityMatrix: async (projectId: string): Promise<Record<string, TraceabilityContext>> => {
    const res = await authenticatedFetch(`${API_URL_BASE}/projects/${projectId}/traceability-matrix`);
    return res.json();
  }
};


