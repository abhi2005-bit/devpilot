import type { Milestone } from './milestone';

export interface Goal {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  status: string;
  targetDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface GoalWithMilestones extends Goal {
  milestones: Milestone[];
}

export interface GoalCreate {
  title: string;
  description?: string;
  status?: string;
  target_date?: string;
}

export interface GoalUpdate {
  title?: string;
  description?: string;
  status?: string;
  target_date?: string;
}
