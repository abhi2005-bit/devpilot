import API_URL_BASE from "../config/api";
import { authenticatedFetch, responseError } from "./apiClient";

export type Notification = {
  id: number;
  user_id: number;
  type: string;
  title: string;
  message: string;
  project_id?: number;
  entity_id?: string;
  entity_type?: string;
  is_read: boolean;
  created_at: string;
};

const NOTIFICATIONS_URL = `${API_URL_BASE}/notifications`;

async function ensureSuccess(response: Response, fallback: string): Promise<void> {
  if (!response.ok) {
    throw await responseError(response, fallback);
  }
}

export const notificationService = {
  async list(): Promise<Notification[]> {
    const response = await authenticatedFetch(NOTIFICATIONS_URL);
    await ensureSuccess(response, "Failed to load notifications.");
    return response.json() as Promise<Notification[]>;
  },

  async markRead(notificationId: number): Promise<void> {
    const response = await authenticatedFetch(
      `${NOTIFICATIONS_URL}/${notificationId}/read`,
      { method: "POST" },
    );
    await ensureSuccess(response, "Failed to mark notification as read.");
  },

  async markAllRead(): Promise<void> {
    const response = await authenticatedFetch(`${NOTIFICATIONS_URL}/read-all`, {
      method: "POST",
    });
    await ensureSuccess(response, "Failed to mark notifications as read.");
  },
};
