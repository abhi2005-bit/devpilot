export type ProjectRisk = "HIGH" | "MEDIUM" | "LOW";

export interface ProjectMember {
  id: string;
  name: string;
  avatar?: string;
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
