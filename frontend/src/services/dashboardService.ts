import type { DashboardSummary } from "../types/dashboard";
import API_URL_BASE from "../config/api";

const API_URL =
  `${API_URL_BASE}/dashboard`;

export const dashboardService = {
  async getSummary(): Promise<DashboardSummary> {
    const response = await fetch(
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