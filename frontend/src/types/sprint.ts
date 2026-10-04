export type SprintStatus = "PLANNED" | "ACTIVE" | "COMPLETED";

export interface Sprint {
  id: string;
  projectId: string;
  name: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  status: SprintStatus;
  milestoneId?: string | null;
  createdAt: string;
  updatedAt: string;
}
