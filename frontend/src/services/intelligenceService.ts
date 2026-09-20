import API_URL_BASE from "../config/api";

const API_URL = `${API_URL_BASE}/projects`;

export type SignalCategory =
  | "issues"
  | "cicd"
  | "github"
  | "delivery";

export type SignalType =
  | "risk"
  | "warning"
  | "positive"
  | "observation";

export type SignalSeverity =
  | "risk"
  | "warning"
  | "positive"
  | "neutral";

export interface EngineeringSignal {
  category: SignalCategory;
  type: SignalType;
  severity: SignalSeverity;
  title: string;
  description: string;
  value: string;
  evidence: string[];
  recommendation: string;
}

export interface EngineeringSignals {
  project_id: number;
  generated_at: string;
  signals: EngineeringSignal[];
}

export interface HealthComponent {
  score: number;
  weight: number;
  weighted_score: number;
  calculation_basis: string[];
}

export interface HealthEvidence {
  label: string;
  value: string;
  impact: "positive" | "negative" | "neutral";
}

export interface EngineeringHealth {
  project_id: number;
  score: number;
  status: string;
  generated_at: string;
  lookback_days: number;
  issue_health: HealthComponent;
  cicd_reliability: HealthComponent;
  delivery_activity: HealthComponent;
  github_activity: HealthComponent;
  evidence: HealthEvidence[];
}

export interface MetricBasis {
  label: string;
  value: string;
}

export interface IssueEngineeringMetrics {
  total: number;
  open: number;
  completed: number;
  completion_rate: number;
  todo: number;
  in_progress: number;
  in_review: number;
  critical: number;
  high_priority: number;
  unassigned: number;
  stale_open: number;
  calculation_basis: MetricBasis[];
}

export interface CICDEngineeringMetrics {
  total_runs: number;
  completed_runs: number;
  successful_runs: number;
  failed_runs: number;
  running_runs: number;
  success_rate: number;
  failure_rate: number;
  failed_jobs: number;
  recent_runs: number;
  recent_failures: number;
  calculation_basis: MetricBasis[];
}

export interface GitHubEngineeringMetrics {
  connected: boolean;
  fetched: boolean;
  commits: number;
  pull_requests: number;
  open_pull_requests: number;
  merged_pull_requests: number;
  closed_pull_requests: number;
  calculation_basis: MetricBasis[];
  error: string | null;
}

export interface ActivityEngineeringMetrics {
  active_work: number;
  blocked_or_review_work: number;
  completed_work: number;
  recent_cicd_activity: number;
  calculation_basis: MetricBasis[];
}

export interface EngineeringMetrics {
  project_id: number;
  generated_at: string;
  lookback_days: number;
  github_limit: number;
  issues: IssueEngineeringMetrics;
  cicd: CICDEngineeringMetrics;
  github: GitHubEngineeringMetrics;
  activity: ActivityEngineeringMetrics;
}


export interface EngineeringHealthHistoryItem {
  generated_at: string;
  score: number;
  status: string;
  issue_health: number;
  cicd_reliability: number;
  delivery_activity: number;
  github_activity: number;
}

export interface EngineeringHealthHistory {
  project_id: number;
  days: number;
  snapshots: EngineeringHealthHistoryItem[];
}

export interface EngineeringIntelligenceContext {
  project_id: number;
  generated_at: string;
  lookback_days: number;
  health: EngineeringHealth;
  metrics: EngineeringMetrics;
  signals: EngineeringSignals;
  context_facts: string[];
}

async function getJson<T>(url: string): Promise<T> {
  const response = await fetch(url);

  if (!response.ok) {
    let message = "Failed to load engineering intelligence.";

    try {
      const errorData = await response.json();

      if (typeof errorData.detail === "string") {
        message = errorData.detail;
      }
    } catch {
      // Keep the default message.
    }

    throw new Error(message);
  }

  return response.json();
}

export const intelligenceService = {
  async getSignals(
    projectId: string,
    lookbackDays = 14,
    githubLimit = 25,
  ): Promise<EngineeringSignals> {
    const params = new URLSearchParams({
      lookback_days: String(lookbackDays),
      github_limit: String(githubLimit),
      include_github: "true",
    });

    return getJson<EngineeringSignals>(
      `${API_URL}/${projectId}/engineering-signals?${params.toString()}`,
    );
  },

  async getHealthHistory(
    projectId: string,
    days = 30,
    limit = 30,
  ): Promise<EngineeringHealthHistory> {
    const params = new URLSearchParams({
      days: String(days),
      limit: String(limit),
    });

    return getJson<EngineeringHealthHistory>(
      `${API_URL}/${projectId}/engineering-health/history?${params.toString()}`,
    );
  },

  async getContext(
    projectId: string,
    lookbackDays = 14,
    githubLimit = 25,
  ): Promise<EngineeringIntelligenceContext> {
    const params = new URLSearchParams({
      lookback_days: String(lookbackDays),
      github_limit: String(githubLimit),
    });

    return getJson<EngineeringIntelligenceContext>(
      `${API_URL}/${projectId}/intelligence-context?${params.toString()}`,
    );
  },
};
