import type { DashboardSummary } from "../types/dashboard";
import API_URL_BASE from "../config/api";
import { authenticatedFetch } from "./apiClient";

const API_URL =
  `${API_URL_BASE}/dashboard`;

export const dashboardService = {
  async getSummary(): Promise<DashboardSummary> {
    const response = await authenticatedFetch(
      `${API_URL}/summary`,
    );

    if (!response.ok) {
      throw new Error(
        "Failed to load dashboard summary",
      );
    }

    return response.json();
  },
};