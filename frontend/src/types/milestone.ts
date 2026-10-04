export interface Milestone {
  id: string;
  goalId: string;
  title: string;
  description?: string;
  status: string;
  targetDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MilestoneCreate {
  title: string;
  description?: string;
  status?: string;
  target_date?: string;
}

export interface MilestoneUpdate {
  title?: string;
  description?: string;
  status?: string;
  target_date?: string;
}
