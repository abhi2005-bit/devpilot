export interface CICDRun {
  id: number;
  project_id: number;
  github_run_id: number | null;
  workflow_name: string;
  branch: string;
  commit_sha: string | null;
  status: string;
  conclusion: string | null;
  failed_tests: number;
  started_at: string;
  completed_at: string | null;
  url: string | null;
}

export interface CICDJob {
  id: number;
  project_id: number;
  cicd_run_id: number;
  github_job_id: number;
  name: string;
  status: string;
  conclusion: string | null;
  started_at: string | null;
  completed_at: string | null;
  url: string | null;
}

export interface CICDHealth {
  total_runs: number;
  successful_runs: number;
  failed_runs: number;
  running_runs: number;
  success_rate: number;
  failure_rate: number;
  total_failed_tests: number;
  failed_jobs: number;
}

export type CICDRunsResponse = CICDRun[];
export type CICDSyncResponse = CICDRun[];