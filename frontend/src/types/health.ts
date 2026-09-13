export type EngineeringHealthStatus =
  | "excellent"
  | "healthy"
  | "needs_attention"
  | "at_risk";

export type HealthImpact =
  | "positive"
  | "negative"
  | "neutral";

export interface HealthEvidence {
  label: string;
  value: string;
  impact: HealthImpact;
}

export interface HealthComponent {
  score: number;
  weight: number;
  weighted_score: number;
  calculation_basis: string[];
}

export interface EngineeringHealth {
  project_id: number;
  score: number;
  status: EngineeringHealthStatus;
  generated_at: string;
  lookback_days: number;

  issue_health: HealthComponent;
  cicd_reliability: HealthComponent;
  delivery_activity: HealthComponent;
  github_activity: HealthComponent;

  evidence: HealthEvidence[];
}