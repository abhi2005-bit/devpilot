export type ProjectRisk = "HIGH" | "MEDIUM" | "LOW";

export type ProjectMemberRole =
  | "OWNER"
  | "ENGINEER"
  | "DESIGNER"
  | "PRODUCT"
  | "QA";

export interface ProjectMember {
  id: string;
  name: string;
  avatar?: string;
  role: ProjectMemberRole;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  ownerId: string;
  risk: ProjectRisk;
  progress: number;
  openIssues: number;
  prsPending: number;
  members: ProjectMember[];
  aiInsight?: string;
  github_owner?: string | null;
  github_repo?: string | null;
  github_url?: string | null;
  github_sync_status?: string;
  github_last_synced_at?: string | null;
  github_sync_error?: string | null;
}