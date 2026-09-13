import { useEffect, useState } from "react";

import SummaryCard from "../components/dashboard/SummaryCard";
import AIInsights from "../components/dashboard/AIInsights";
import ProjectHealth from "../components/dashboard/ProjectHealth";
import MyWork from "../components/dashboard/MyWork";

import { dashboardService } from "../services/dashboardService";
import type { DashboardSummary } from "../types/dashboard";

function Dashboard() {
  const [summary, setSummary] =
    useState<DashboardSummary | undefined>();

  const [isLoading, setIsLoading] =
    useState(true);

  const [error, setError] =
    useState<string | undefined>();

  useEffect(() => {
    let cancelled = false;

    async function loadSummary() {
      setIsLoading(true);
      setError(undefined);

      try {
        const data =
          await dashboardService.getSummary();

        if (!cancelled) {
          setSummary(data);
        }
      } catch {
        if (!cancelled) {
          setSummary(undefined);
          setError(
            "Unable to load dashboard summary.",
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    loadSummary();

    return () => {
      cancelled = true;
    };
  }, []);

  const activeProjects =
    summary?.active_projects ?? 0;

  const openIssues =
    summary?.open_issues ?? 0;

  const completedIssues =
    summary?.completed_issues ?? 0;

  const blockedOrReview =
    summary?.blocked_or_review ?? 0;

  const criticalIssues =
    summary?.critical_issues ?? 0;

  return (
    <main className="overflow-y-auto px-margin pb-margin pt-8">
      {/* Summary Cards */}

      <section className="mb-margin grid grid-cols-1 gap-gutter md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          title="Active Projects"
          value={
            isLoading
              ? "..."
              : activeProjects
          }
          icon="folder"
          description="Currently active"
          variant="primary"
        />

        <SummaryCard
          title="Open Issues"
          value={
            isLoading
              ? "..."
              : openIssues
          }
          icon="bug_report"
          description={`${criticalIssues} critical`}
          variant="error"
        />

        <SummaryCard
          title="Completed"
          value={
            isLoading
              ? "..."
              : completedIssues
          }
          icon="task_alt"
          description="Completed issues"
          variant="secondary"
        />

        <SummaryCard
          title="Blocked"
          value={
            isLoading
              ? "..."
              : blockedOrReview
          }
          icon="block"
          description="Requires attention"
          variant="tertiary"
        />
      </section>

      {error && (
        <div className="mb-margin rounded-lg border border-outline-variant bg-surface-container p-md">
          <p className="text-body-sm text-error">
            {error}
          </p>
        </div>
      )}

      {/* Main Dashboard */}

      <section className="grid grid-cols-1 gap-gutter xl:grid-cols-12">
        {/* Left */}

        <div className="flex flex-col gap-gutter xl:col-span-8">
          <AIInsights />
          <ProjectHealth />
        </div>

        {/* Right */}

        <div className="flex flex-col gap-gutter xl:col-span-4">
          <MyWork />
        </div>
      </section>
    </main>
  );
}

export default Dashboard;