import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";

import { projectService } from "../../../services/projectService";
import { issueService } from "../../../services/issueService";

import type { Project } from "../../../types/project";
import type {
  Issue,
  IssuePriority,
  IssueStatus,
} from "../../../types/issue";

const statuses: IssueStatus[] = [
  "TODO",
  "IN_PROGRESS",
  "IN_REVIEW",
  "DONE",
];

const priorities: IssuePriority[] = [
  "LOW",
  "MEDIUM",
  "HIGH",
  "CRITICAL",
];

const statusLabels: Record<IssueStatus, string> = {
  TODO: "To Do",
  IN_PROGRESS: "In Progress",
  IN_REVIEW: "In Review",
  DONE: "Done",
};

const priorityLabels: Record<
  IssuePriority,
  string
> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
  CRITICAL: "Critical",
};

function Analytics() {
  const { projectId } = useParams<{
    projectId: string;
  }>();

  const [project, setProject] =
    useState<Project | undefined>();

  const [projectIssues, setProjectIssues] =
    useState<Issue[]>([]);

  const [isLoading, setIsLoading] =
    useState(true);

  const [error, setError] = useState("");

  /*
   * ============================================
   * LOAD PROJECT ANALYTICS DATA
   * ============================================
   */

  useEffect(() => {
    let cancelled = false;

    async function loadAnalytics() {
      if (!projectId) {
        setProject(undefined);
        setProjectIssues([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError("");

      try {
        const [
          loadedProject,
          loadedIssues,
        ] = await Promise.all([
          Promise.resolve(
            projectService.getById(projectId),
          ),
          issueService.getByProject(projectId),
        ]);

        if (cancelled) {
          return;
        }

        setProject(loadedProject);
        setProjectIssues(loadedIssues);
      } catch {
        if (!cancelled) {
          setError(
            "Unable to load analytics for this project.",
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    loadAnalytics();

    return () => {
      cancelled = true;
    };
  }, [projectId]);

  /*
   * ============================================
   * BASIC METRICS
   * ============================================
   */

  const totalIssues = projectIssues.length;

  const completedIssues = useMemo(
    () =>
      projectIssues.filter(
        (issue) => issue.status === "DONE",
      ).length,
    [projectIssues],
  );

  const openIssues = useMemo(
    () =>
      projectIssues.filter(
        (issue) => issue.status !== "DONE",
      ).length,
    [projectIssues],
  );

  const inProgressIssues = useMemo(
    () =>
      projectIssues.filter(
        (issue) =>
          issue.status === "IN_PROGRESS",
      ).length,
    [projectIssues],
  );

  const reviewIssues = useMemo(
    () =>
      projectIssues.filter(
        (issue) =>
          issue.status === "IN_REVIEW",
      ).length,
    [projectIssues],
  );

  const highPriorityIssues = useMemo(
    () =>
      projectIssues.filter(
        (issue) =>
          issue.priority === "HIGH" ||
          issue.priority === "CRITICAL",
      ).length,
    [projectIssues],
  );

  const criticalIssues = useMemo(
    () =>
      projectIssues.filter(
        (issue) =>
          issue.priority === "CRITICAL",
      ).length,
    [projectIssues],
  );

  const completionRate =
    totalIssues > 0
      ? Math.round(
          (completedIssues / totalIssues) * 100,
        )
      : 0;

  /*
   * ============================================
   * STATUS DISTRIBUTION
   * ============================================
   */

  const statusCounts = useMemo(() => {
    return statuses.map((status) => ({
      status,
      count: projectIssues.filter(
        (issue) => issue.status === status,
      ).length,
    }));
  }, [projectIssues]);

  /*
   * ============================================
   * PRIORITY DISTRIBUTION
   * ============================================
   */

  const priorityCounts = useMemo(() => {
    return priorities.map((priority) => ({
      priority,
      count: projectIssues.filter(
        (issue) =>
          issue.priority === priority,
      ).length,
    }));
  }, [projectIssues]);

  /*
   * ============================================
   * TEAM WORKLOAD
   * ============================================
   */

  const memberWorkloads = useMemo(() => {
    if (!project) {
      return [];
    }

    return project.members
      .map((member) => {
        const memberIssues =
          projectIssues.filter(
            (issue) =>
              issue.assignee?.id === member.id,
          );

        const activeIssues =
          memberIssues.filter(
            (issue) =>
              issue.status !== "DONE",
          );

        const completed =
          memberIssues.filter(
            (issue) =>
              issue.status === "DONE",
          ).length;

        const critical =
          memberIssues.filter(
            (issue) =>
              issue.priority ===
              "CRITICAL",
          ).length;

        const workload = Math.min(
          activeIssues.length * 25,
          100,
        );

        return {
          member,
          total: memberIssues.length,
          active: activeIssues.length,
          completed,
          critical,
          workload,
        };
      })
      .sort(
        (a, b) =>
          b.active - a.active,
      );
  }, [project, projectIssues]);

  /*
   * ============================================
   * PROJECT RISK
   * ============================================
   */

  const calculatedRisk = useMemo(() => {
    if (
      criticalIssues >= 2 ||
      openIssues >= 15
    ) {
      return "HIGH";
    }

    if (
      criticalIssues >= 1 ||
      highPriorityIssues >= 4 ||
      openIssues >= 8
    ) {
      return "MEDIUM";
    }

    return "LOW";
  }, [
    criticalIssues,
    highPriorityIssues,
    openIssues,
  ]);

  /*
   * ============================================
   * AI-STYLE PROJECT SIGNAL
   * ============================================
   */

  const engineeringSignal = useMemo(() => {
    if (criticalIssues > 0) {
      return {
        icon: "warning",
        title: "Critical attention required",
        text:
          "Critical issues are currently present in this project. Prioritize them before taking on additional work.",
        className:
          "bg-error-container text-error",
      };
    }

    if (
      openIssues > 0 &&
      completionRate < 40
    ) {
      return {
        icon: "trending_down",
        title: "Delivery velocity needs attention",
        text:
          "The project has a relatively large open backlog compared with completed work.",
        className:
          "bg-tertiary-container text-tertiary",
      };
    }

    if (
      completionRate >= 70
    ) {
      return {
        icon: "trending_up",
        title: "Healthy delivery momentum",
        text:
          "A strong percentage of tracked issues are completed, indicating positive delivery momentum.",
        className:
          "bg-secondary-container text-secondary",
      };
    }

    return {
      icon: "insights",
      title: "Project is progressing",
      text:
        "The project is actively moving through its engineering workflow. Continue monitoring open and high-priority issues.",
      className:
        "bg-primary-container text-primary",
    };
  }, [
    criticalIssues,
    openIssues,
    completionRate,
  ]);

  /*
   * ============================================
   * LOADING
   * ============================================
   */

  if (isLoading) {
    return (
      <div className="flex min-h-64 items-center justify-center rounded-xl border border-outline-variant bg-surface-container">
        <div className="text-center">
          <span className="material-symbols-outlined animate-spin text-4xl text-primary">
            progress_activity
          </span>

          <p className="mt-md text-body-sm text-on-surface-variant">
            Loading analytics...
          </p>
        </div>
      </div>
    );
  }

  /*
   * ============================================
   * ERROR
   * ============================================
   */

  if (error) {
    return (
      <div className="flex min-h-64 items-center justify-center rounded-xl border border-error/30 bg-error-container">
        <div className="text-center">
          <span className="material-symbols-outlined text-4xl text-error">
            error
          </span>

          <p className="mt-md text-body-sm text-error">
            {error}
          </p>
        </div>
      </div>
    );
  }

  /*
   * ============================================
   * PROJECT NOT FOUND
   * ============================================
   */

  if (!project) {
    return (
      <div className="flex min-h-64 items-center justify-center rounded-xl border border-outline-variant bg-surface-container">
        <div className="text-center">
          <span className="material-symbols-outlined text-5xl text-on-surface-variant">
            analytics
          </span>

          <h2 className="mt-md text-title-sm font-semibold text-on-surface">
            Project not found
          </h2>

          <p className="mt-xs text-body-sm text-on-surface-variant">
            Analytics are unavailable for
            this project.
          </p>
        </div>
      </div>
    );
  }

  /*
   * ============================================
   * MAIN ANALYTICS PAGE
   * ============================================
   */

  return (
    <div className="space-y-lg">

      {/* ====================================== */}
      {/* HEADER */}
      {/* ====================================== */}

      <section className="flex flex-col gap-md md:flex-row md:items-end md:justify-between">

        <div>
          <div className="flex items-center gap-sm">

            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-container">
              <span className="material-symbols-outlined text-primary">
                analytics
              </span>
            </div>

            <div>
              <h2 className="text-title-lg font-bold text-on-surface">
                Engineering Analytics
              </h2>

              <p className="mt-xs text-body-sm text-on-surface-variant">
                Engineering health and delivery
                signals for{" "}
                <span className="font-medium text-on-surface">
                  {project.name}
                </span>
                .
              </p>
            </div>

          </div>
        </div>

        <div className="flex items-center gap-sm rounded-lg border border-outline-variant bg-surface-container px-md py-sm">

          <span className="material-symbols-outlined text-body-md text-primary">
            monitoring
          </span>

          <span className="text-caption text-on-surface-variant">
            Live project signals
          </span>

        </div>

      </section>

      {/* ====================================== */}
      {/* KPI CARDS */}
      {/* ====================================== */}

      <section className="grid grid-cols-1 gap-md sm:grid-cols-2 xl:grid-cols-5">

        {/* Progress */}
        <div className="rounded-xl border border-outline-variant bg-surface-container p-lg">

          <p className="text-caption text-on-surface-variant">
            Project Progress
          </p>

          <p className="mt-xs text-title-lg font-bold text-on-surface">
            {project.progress}%
          </p>

          <div className="mt-md h-2 overflow-hidden rounded-full bg-surface-container-highest">

            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{
                width: `${project.progress}%`,
              }}
            />

          </div>

        </div>

        {/* Total */}
        <div className="rounded-xl border border-outline-variant bg-surface-container p-lg">

          <p className="text-caption text-on-surface-variant">
            Total Issues
          </p>

          <p className="mt-xs text-title-lg font-bold text-on-surface">
            {totalIssues}
          </p>

          <p className="mt-md text-caption text-on-surface-variant">
            Currently tracked
          </p>

        </div>

        {/* Open */}
        <div className="rounded-xl border border-outline-variant bg-surface-container p-lg">

          <p className="text-caption text-on-surface-variant">
            Open Issues
          </p>

          <p className="mt-xs text-title-lg font-bold text-on-surface">
            {openIssues}
          </p>

          <p className="mt-md text-caption text-on-surface-variant">
            Not yet completed
          </p>

        </div>

        {/* Completion */}
        <div className="rounded-xl border border-outline-variant bg-surface-container p-lg">

          <p className="text-caption text-on-surface-variant">
            Issue Completion
          </p>

          <p className="mt-xs text-title-lg font-bold text-on-surface">
            {completionRate}%
          </p>

          <p className="mt-md text-caption text-on-surface-variant">
            {completedIssues} of{" "}
            {totalIssues} completed
          </p>

        </div>

        {/* Risk */}
        <div className="rounded-xl border border-outline-variant bg-surface-container p-lg">

          <p className="text-caption text-on-surface-variant">
            Calculated Risk
          </p>

          <p className="mt-xs text-title-lg font-bold text-on-surface">
            {calculatedRisk}
          </p>

          <p className="mt-md text-caption text-on-surface-variant">
            Based on issue signals
          </p>

        </div>

      </section>

      {/* ====================================== */}
      {/* STATUS + PRIORITY */}
      {/* ====================================== */}

      <section className="grid grid-cols-1 gap-lg xl:grid-cols-2">

        {/* Status */}
        <div className="rounded-xl border border-outline-variant bg-surface-container p-lg">

          <h3 className="text-title-sm font-semibold text-on-surface">
            Issue Distribution
          </h3>

          <p className="mt-xs text-caption text-on-surface-variant">
            Issues grouped by workflow status.
          </p>

          <div className="mt-xl space-y-lg">

            {statusCounts.map((item) => {

              const percentage =
                totalIssues > 0
                  ? Math.round(
                      (item.count /
                        totalIssues) *
                        100,
                    )
                  : 0;

              return (
                <div key={item.status}>

                  <div className="mb-xs flex items-center justify-between">

                    <span className="text-body-sm text-on-surface">
                      {statusLabels[item.status]}
                    </span>

                    <span className="text-body-sm font-semibold text-on-surface">
                      {item.count}
                    </span>

                  </div>

                  <div className="h-2 overflow-hidden rounded-full bg-surface-container-highest">

                    <div
                      className={`h-full rounded-full transition-all ${
                        item.status === "DONE"
                          ? "bg-secondary"
                          : item.status ===
                              "IN_PROGRESS"
                            ? "bg-primary"
                            : item.status ===
                                "IN_REVIEW"
                              ? "bg-tertiary"
                              : "bg-outline"
                      }`}
                      style={{
                        width: `${percentage}%`,
                      }}
                    />

                  </div>

                  <p className="mt-xs text-caption text-on-surface-variant">
                    {percentage}% of tracked
                    issues
                  </p>

                </div>
              );
            })}

          </div>

        </div>

        {/* Priority */}
        <div className="rounded-xl border border-outline-variant bg-surface-container p-lg">

          <h3 className="text-title-sm font-semibold text-on-surface">
            Priority Distribution
          </h3>

          <p className="mt-xs text-caption text-on-surface-variant">
            Current issues grouped by priority.
          </p>

          <div className="mt-xl space-y-lg">

            {priorityCounts.map((item) => {

              const percentage =
                totalIssues > 0
                  ? Math.round(
                      (item.count /
                        totalIssues) *
                        100,
                    )
                  : 0;

              const barClass =
                item.priority ===
                "CRITICAL"
                  ? "bg-error"
                  : item.priority ===
                      "HIGH"
                    ? "bg-tertiary"
                    : item.priority ===
                        "MEDIUM"
                      ? "bg-primary"
                      : "bg-secondary";

              return (
                <div key={item.priority}>

                  <div className="mb-xs flex items-center justify-between">

                    <span className="text-body-sm text-on-surface">
                      {
                        priorityLabels[
                          item.priority
                        ]
                      }
                    </span>

                    <span className="text-body-sm font-semibold text-on-surface">
                      {item.count}
                    </span>

                  </div>

                  <div className="h-2 overflow-hidden rounded-full bg-surface-container-highest">

                    <div
                      className={`h-full rounded-full transition-all ${barClass}`}
                      style={{
                        width: `${percentage}%`,
                      }}
                    />

                  </div>

                  <p className="mt-xs text-caption text-on-surface-variant">
                    {percentage}% of tracked
                    issues
                  </p>

                </div>
              );
            })}

          </div>

        </div>

      </section>

      {/* ====================================== */}
      {/* DELIVERY HEALTH */}
      {/* ====================================== */}

      <section className="grid grid-cols-1 gap-lg xl:grid-cols-2">

        <div className="rounded-xl border border-outline-variant bg-surface-container p-lg">

          <h3 className="text-title-sm font-semibold text-on-surface">
            Delivery Health
          </h3>

          <p className="mt-xs text-caption text-on-surface-variant">
            Signals indicating current engineering
            workload.
          </p>

          <div className="mt-xl space-y-md">

            {/* In Progress */}
            <div className="flex items-center justify-between rounded-lg bg-surface-container-low p-md">

              <div className="flex items-center gap-sm">

                <span className="material-symbols-outlined text-primary">
                  pending
                </span>

                <div>

                  <p className="text-body-sm font-medium text-on-surface">
                    In Progress
                  </p>

                  <p className="text-caption text-on-surface-variant">
                    Actively being worked on
                  </p>

                </div>

              </div>

              <span className="text-title-sm font-bold text-on-surface">
                {inProgressIssues}
              </span>

            </div>

            {/* Review */}
            <div className="flex items-center justify-between rounded-lg bg-surface-container-low p-md">

              <div className="flex items-center gap-sm">

                <span className="material-symbols-outlined text-tertiary">
                  rate_review
                </span>

                <div>

                  <p className="text-body-sm font-medium text-on-surface">
                    In Review
                  </p>

                  <p className="text-caption text-on-surface-variant">
                    Waiting for review
                  </p>

                </div>

              </div>

              <span className="text-title-sm font-bold text-on-surface">
                {reviewIssues}
              </span>

            </div>

            {/* High Priority */}
            <div className="flex items-center justify-between rounded-lg bg-surface-container-low p-md">

              <div className="flex items-center gap-sm">

                <span className="material-symbols-outlined text-error">
                  priority_high
                </span>

                <div>

                  <p className="text-body-sm font-medium text-on-surface">
                    High Priority
                  </p>

                  <p className="text-caption text-on-surface-variant">
                    High or critical issues
                  </p>

                </div>

              </div>

              <span className="text-title-sm font-bold text-on-surface">
                {highPriorityIssues}
              </span>

            </div>

            {/* Risk */}
            <div className="flex items-center justify-between rounded-lg border border-outline-variant p-md">

              <div className="flex items-center gap-sm">

                <span className="material-symbols-outlined text-error">
                  warning
                </span>

                <div>

                  <p className="text-body-sm font-medium text-on-surface">
                    Overall Risk
                  </p>

                  <p className="text-caption text-on-surface-variant">
                    Calculated from issue signals
                  </p>

                </div>

              </div>

              <span
                className={`rounded-full px-sm py-xs text-caption font-semibold ${
                  calculatedRisk === "HIGH"
                    ? "bg-error-container text-error"
                    : calculatedRisk ===
                        "MEDIUM"
                      ? "bg-tertiary-container text-tertiary"
                      : "bg-secondary-container text-secondary"
                }`}
              >
                {calculatedRisk}
              </span>

            </div>

          </div>

        </div>

        {/* Engineering Signal */}
        <div className="rounded-xl border border-outline-variant bg-surface-container p-lg">

          <h3 className="text-title-sm font-semibold text-on-surface">
            Engineering Signal
          </h3>

          <p className="mt-xs text-caption text-on-surface-variant">
            Automated interpretation of current project
            signals.
          </p>

          <div className="mt-xl">

            <div
              className={`flex items-start gap-md rounded-xl p-lg ${engineeringSignal.className}`}
            >

              <span className="material-symbols-outlined text-2xl">
                {engineeringSignal.icon}
              </span>

              <div>

                <h4 className="text-body-md font-bold">
                  {engineeringSignal.title}
                </h4>

                <p className="mt-sm text-body-sm leading-6 opacity-90">
                  {engineeringSignal.text}
                </p>

              </div>

            </div>

          </div>

        </div>

      </section>

      {/* ====================================== */}
      {/* TEAM WORKLOAD */}
      {/* ====================================== */}

      <section className="rounded-xl border border-outline-variant bg-surface-container p-lg">

        <div className="flex flex-col gap-sm md:flex-row md:items-end md:justify-between">

          <div>

            <h3 className="text-title-sm font-semibold text-on-surface">
              Team Workload
            </h3>

            <p className="mt-xs text-caption text-on-surface-variant">
              Current issue distribution across project
              members.
            </p>

          </div>

          <span className="text-caption text-on-surface-variant">
            {project.members.length} team members
          </span>

        </div>

        {memberWorkloads.length > 0 ? (

          <div className="mt-lg space-y-md">

            {memberWorkloads.map(
              ({
                member,
                total,
                active,
                completed,
                critical,
                workload,
              }) => (

                <div
                  key={member.id}
                  className="rounded-lg border border-outline-variant bg-surface-container-low p-md"
                >

                  <div className="flex flex-col gap-md md:flex-row md:items-center">

                    {/* Member */}
                    <div className="flex min-w-48 items-center gap-sm">

                      {member.avatar ? (

                        <img
                          src={member.avatar}
                          alt={member.name}
                          className="h-9 w-9 rounded-full object-cover"
                        />

                      ) : (

                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-container text-caption font-bold text-primary">
                          {member.name
                            .charAt(0)
                            .toUpperCase()}
                        </div>

                      )}

                      <div>

                        <p className="text-body-sm font-semibold text-on-surface">
                          {member.name}
                        </p>

                        <p className="text-caption text-on-surface-variant">
                          {total} assigned
                        </p>

                      </div>

                    </div>

                    {/* Workload */}
                    <div className="flex-1">

                      <div className="flex items-center justify-between">

                        <span className="text-caption text-on-surface-variant">
                          Active workload
                        </span>

                        <span className="text-caption font-semibold text-on-surface">
                          {workload}%
                        </span>

                      </div>

                      <div className="mt-xs h-2 overflow-hidden rounded-full bg-surface-container-highest">

                        <div
                          className={`h-full rounded-full ${
                            workload >= 75
                              ? "bg-error"
                              : workload >=
                                  50
                                ? "bg-tertiary"
                                : "bg-primary"
                          }`}
                          style={{
                            width: `${workload}%`,
                          }}
                        />

                      </div>

                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-lg text-right">

                      <div>

                        <p className="text-caption text-on-surface-variant">
                          Active
                        </p>

                        <p className="mt-xs text-body-sm font-bold text-on-surface">
                          {active}
                        </p>

                      </div>

                      <div>

                        <p className="text-caption text-on-surface-variant">
                          Done
                        </p>

                        <p className="mt-xs text-body-sm font-bold text-on-surface">
                          {completed}
                        </p>

                      </div>

                      <div>

                        <p className="text-caption text-on-surface-variant">
                          Critical
                        </p>

                        <p className="mt-xs text-body-sm font-bold text-error">
                          {critical}
                        </p>

                      </div>

                    </div>

                  </div>

                </div>

              ),
            )}

          </div>

        ) : (

          <div className="mt-lg rounded-lg border border-dashed border-outline-variant p-xl text-center">

            <span className="material-symbols-outlined text-4xl text-on-surface-variant">
              group
            </span>

            <p className="mt-sm text-body-sm text-on-surface-variant">
              No team workload data available.
            </p>

          </div>

        )}

      </section>

      {/* ====================================== */}
      {/* AI INSIGHT */}
      {/* ====================================== */}

      <section className="rounded-xl border border-outline-variant bg-surface-container p-lg">

        <div className="flex items-start gap-md">

          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-secondary-container">

            <span className="material-symbols-outlined text-secondary">
              auto_awesome
            </span>

          </div>

          <div className="min-w-0">

            <h3 className="text-title-sm font-semibold text-on-surface">
              AI Engineering Insight
            </h3>

            <p className="mt-xs text-caption text-on-surface-variant">
              Current signal from the project intelligence
              layer.
            </p>

            <div className="mt-md rounded-lg bg-surface-container-low p-md">

              <p className="text-body-sm leading-6 text-on-surface">
                {project.aiInsight ??
                  engineeringSignal.text}
              </p>

            </div>

          </div>

        </div>

      </section>

      {/* ====================================== */}
      {/* PROJECT SNAPSHOT */}
      {/* ====================================== */}

      <section className="rounded-xl border border-outline-variant bg-surface-container p-lg">

        <div className="mb-lg">

          <h3 className="text-title-sm font-semibold text-on-surface">
            Project Snapshot
          </h3>

          <p className="mt-xs text-caption text-on-surface-variant">
            Current engineering metrics at a glance.
          </p>

        </div>

        <div className="grid grid-cols-1 gap-md sm:grid-cols-2 lg:grid-cols-5">

          <div className="rounded-lg bg-surface-container-low p-md">

            <p className="text-caption text-on-surface-variant">
              Team Members
            </p>

            <p className="mt-xs text-title-sm font-bold text-on-surface">
              {project.members.length}
            </p>

          </div>

          <div className="rounded-lg bg-surface-container-low p-md">

            <p className="text-caption text-on-surface-variant">
              Open Issues
            </p>

            <p className="mt-xs text-title-sm font-bold text-on-surface">
              {openIssues}
            </p>

          </div>

          <div className="rounded-lg bg-surface-container-low p-md">

            <p className="text-caption text-on-surface-variant">
              PRs Pending
            </p>

            <p className="mt-xs text-title-sm font-bold text-on-surface">
              {project.prsPending}
            </p>

          </div>

          <div className="rounded-lg bg-surface-container-low p-md">

            <p className="text-caption text-on-surface-variant">
              Completed Issues
            </p>

            <p className="mt-xs text-title-sm font-bold text-on-surface">
              {completedIssues}
            </p>

          </div>

          <div className="rounded-lg bg-surface-container-low p-md">

            <p className="text-caption text-on-surface-variant">
              Critical Issues
            </p>

            <p className="mt-xs text-title-sm font-bold text-on-surface">
              {criticalIssues}
            </p>

          </div>

        </div>

      </section>

    </div>
  );
}

export default Analytics;