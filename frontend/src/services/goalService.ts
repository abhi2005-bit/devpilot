import type { Goal, GoalCreate, GoalUpdate, GoalWithMilestones } from '../types/goal';
import API_URL_BASE from '../config/api';
import { authenticatedFetch } from './apiClient';

const API_URL = `${API_URL_BASE}`;

export const goalService = {
  getGoals: async (projectId: string): Promise<GoalWithMilestones[]> => {
    const response = await authenticatedFetch(`${API_URL}/projects/${projectId}/goals`);
    if (!response.ok) throw new Error("Failed to fetch goals");
    const data = await response.json();
    return data.map(mapGoal);
  },
  getGoal: async (goalId: string): Promise<GoalWithMilestones> => {
    const response = await authenticatedFetch(`${API_URL}/goals/${goalId}`);
    if (!response.ok) throw new Error("Failed to fetch goal");
    const data = await response.json();
    return mapGoal(data);
  },
  createGoal: async (projectId: string, data: GoalCreate): Promise<Goal> => {
    const response = await authenticatedFetch(`${API_URL}/projects/${projectId}/goals`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error("Failed to create goal");
    const resData = await response.json();
    return mapGoalBase(resData);
  },
  updateGoal: async (goalId: string, data: GoalUpdate): Promise<Goal> => {
    const response = await authenticatedFetch(`${API_URL}/goals/${goalId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error("Failed to update goal");
    const resData = await response.json();
    return mapGoalBase(resData);
  }
};

const mapGoalBase = (data: any): Goal => ({
  id: String(data.id),
  projectId: String(data.project_id),
  title: data.title,
  description: data.description,
  status: data.status,
  targetDate: data.target_date,
  createdAt: data.created_at,
  updatedAt: data.updated_at,
});

const mapGoal = (data: any): GoalWithMilestones => ({
  ...mapGoalBase(data),
  milestones: data.milestones ? data.milestones.map((m: any) => ({
    id: String(m.id),
    goalId: String(m.goal_id),
    title: m.title,
    description: m.description,
    status: m.status,
    targetDate: m.target_date,
    createdAt: m.created_at,
    updatedAt: m.updated_at,
  })) : [],
});
