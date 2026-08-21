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
  role?: ProjectMemberRole;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  risk: ProjectRisk;
  progress: number;
  openIssues: number;
  prsPending: number;
  members: ProjectMember[];
  aiInsight?: string;
}