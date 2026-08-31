export interface IssueMetrics {
  total: number;
  open: number;
  todo: number;
  in_progress: number;
  in_review: number;
  done: number;
  critical: number;
  high_priority: number;
  unassigned: number;
}

export type ProjectHealthStatus =
  | "HEALTHY"
  | "AT_RISK"
  | "CRITICAL";

export interface ProjectHealth {
  project_id: number;
  health: ProjectHealthStatus;
  health_score: number;
  issues: IssueMetrics;
}