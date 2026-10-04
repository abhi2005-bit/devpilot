import type { Milestone, MilestoneCreate, MilestoneUpdate } from '../types/milestone';
import API_URL_BASE from '../config/api';
import { authenticatedFetch } from './apiClient';

const API_URL = `${API_URL_BASE}`;

export const milestoneService = {
  getMilestones: async (goalId: string): Promise<Milestone[]> => {
    const response = await authenticatedFetch(`${API_URL}/goals/${goalId}/milestones`);
    if (!response.ok) throw new Error("Failed to fetch milestones");
    const data = await response.json();
    return data.map(mapMilestone);
  },
  getMilestone: async (milestoneId: string): Promise<Milestone> => {
    const response = await authenticatedFetch(`${API_URL}/milestones/${milestoneId}`);
    if (!response.ok) throw new Error("Failed to fetch milestone");
    const data = await response.json();
    return mapMilestone(data);
  },
  createMilestone: async (goalId: string, data: MilestoneCreate): Promise<Milestone> => {
    const response = await authenticatedFetch(`${API_URL}/goals/${goalId}/milestones`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error("Failed to create milestone");
    const resData = await response.json();
    return mapMilestone(resData);
  },
  updateMilestone: async (milestoneId: string, data: MilestoneUpdate): Promise<Milestone> => {
    const response = await authenticatedFetch(`${API_URL}/milestones/${milestoneId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error("Failed to update milestone");
    const resData = await response.json();
    return mapMilestone(resData);
  }
};

const mapMilestone = (data: any): Milestone => ({
  id: String(data.id),
  goalId: String(data.goal_id),
  title: data.title,
  description: data.description,
  status: data.status,
  targetDate: data.target_date,
  createdAt: data.created_at,
  updatedAt: data.updated_at,
});
