import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";

import { projectService } from "../../../services/projectService";
import { issueService } from "../../../services/issueService";

import type { Project } from "../../../types/project";
import type { Issue } from "../../../types/issue";

type AnalysisResult = {
  title: string;
  summary: string;
  points: string[];
  recommendation: string;
};

function AI() {
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

  const [activeAnalysis, setActiveAnalysis] =
    useState<AnalysisResult | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadAIData() {
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
            "Unable to load AI engineering intelligence.",
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    loadAIData();

    return () => {
      cancelled = true;
    };
  }, [projectId]);

  const metrics = useMemo(() => {
    const total = projectIssues.length;

    const done = projectIssues.filter(
      (issue) => issue.status === "DONE",
    ).length;

    const todo = projectIssues.filter(
      (issue) => issue.status === "TODO",
    ).length;

    const inProgress = projectIssues.filter(
      (issue) => issue.status === "IN_PROGRESS",
    ).length;

    const inReview = projectIssues.filter(
      (issue) => issue.status === "IN_REVIEW",
    ).length;

    const critical = projectIssues.filter(
      (issue) => issue.priority === "CRITICAL",
    ).length;

    const high = projectIssues.filter(
      (issue) => issue.priority === "HIGH",
    ).length;

    const medium = projectIssues.filter(
      (issue) => issue.priority === "MEDIUM",
    ).length;

    const low = projectIssues.filter(
      (issue) => issue.priority === "LOW",
    ).length;

    const open = projectIssues.filter(
      (issue) => issue.status !== "DONE",
    ).length;

    const completionRate =
      total > 0
        ? Math.round((done / total) * 100)
        : 0;

    return {
      total,
      done,
      todo,
      inProgress,
      inReview,
      critical,
      high,
      medium,
      low,
      open,
      completionRate,
    };
  }, [projectIssues]);

  const healthScore = useMemo(() => {
    if (!project) {
      return 0;
    }

    if (metrics.total === 0) {
      return project.progress;
    }

    const backlogPenalty = Math.min(
      metrics.open * 5,
      30,
    );

    const criticalPenalty = Math.min(
      metrics.critical * 15,
      30,
    );

    const reviewPenalty = Math.min(
      metrics.inReview * 5,
      20,
    );

    const progressScore =
      project.progress * 0.35;

    const completionScore =
      metrics.completionRate * 0.35;

    const stabilityScore =
      40 -
      backlogPenalty -
      criticalPenalty -
      reviewPenalty;

    return Math.max(
      0,
      Math.min(
        100,
        Math.round(
          progressScore +
            completionScore +
            Math.max(stabilityScore, 0),
        ),
      ),
    );
  }, [project, metrics]);

  const healthLabel =
    healthScore >= 80
      ? "Healthy"
      : healthScore >= 60
        ? "Needs Attention"
        : "At Risk";

  const aiSummary = useMemo(() => {
    if (!project) {
      return "";
    }

    if (metrics.total === 0) {
      return `There is not enough issue activity yet to make a strong engineering assessment for ${project.name}. The project currently has no tracked issues.`;
    }

    if (metrics.critical > 0) {
      return `The project requires immediate attention because ${metrics.critical} critical ${
        metrics.critical === 1
          ? "issue is"
          : "issues are"
      } currently open. These should be prioritized before expanding the active workload.`;
    }

    if (
      metrics.open >= 10 &&
      metrics.completionRate < 50
    ) {
      return `The project has a growing backlog with ${metrics.open} open issues and a ${metrics.completionRate}% completion rate. Reducing unfinished work should be the primary delivery focus.`;
    }

    if (metrics.inReview >= 3) {
      return `Engineering work appears to be accumulating in review. ${metrics.inReview} issues are waiting for review, which may become a delivery bottleneck if the queue continues growing.`;
    }

    if (metrics.completionRate >= 70) {
      return `The project shows healthy delivery momentum. ${metrics.completionRate}% of tracked issues are complete and there are no major risk signals requiring immediate intervention.`;
    }

    return `The project is progressing with ${metrics.open} open ${
      metrics.open === 1 ? "issue" : "issues"
    }. Continue monitoring priority work and review throughput as development progresses.`;
  }, [project, metrics]);

  const signals = useMemo(() => {
    const result: {
      icon: string;
      type: string;
      title: string;
      description: string;
    }[] = [];

    if (metrics.critical > 0) {
      result.push({
        icon: "error",
        type: "RISK",
        title: "Critical issue detected",
        description: `${metrics.critical} critical ${
          metrics.critical === 1
            ? "issue requires"
            : "issues require"
        } immediate attention.`,
      });
    }

    if (metrics.high > 0) {
      result.push({
        icon: "priority_high",
        type: "WARNING",
        title: "High-priority work detected",
        description: `${metrics.high} high-priority ${
          metrics.high === 1
            ? "issue"
            : "issues"
        } are currently tracked.`,
      });
    }

    if (metrics.inReview > 0) {
      result.push({
        icon: "rate_review",
        type: "BOTTLENECK",
        title: "Review queue detected",
        description: `${metrics.inReview} ${
          metrics.inReview === 1
            ? "issue is"
            : "issues are"
        } waiting for engineering review.`,
      });
    }

    if (metrics.open >= 10) {
      result.push({
        icon: "warning",
        type: "RISK",
        title: "Large open backlog",
        description: `There are currently ${metrics.open} open issues in the project.`,
      });
    }

    if (
      project &&
      project.prsPending >= 4
    ) {
      result.push({
        icon: "merge",
        type: "BOTTLENECK",
        title: "Pull request queue is growing",
        description: `${project.prsPending} pull requests are currently pending.`,
      });
    }

    if (
      metrics.total > 0 &&
      metrics.completionRate >= 70
    ) {
      result.push({
        icon: "check_circle",
        type: "POSITIVE",
        title: "Strong issue completion",
        description: `${metrics.completionRate}% of tracked issues have been completed.`,
      });
    }

    if (result.length === 0) {
      result.push({
        icon: "check_circle",
        type: "INFO",
        title: "No major anomalies detected",
        description:
          "Current project signals do not indicate an immediate engineering risk.",
      });
    }

    return result;
  }, [project, metrics]);

  const runAnalysis = (
    type:
      | "health"
      | "risks"
      | "bottlenecks"
      | "summary",
  ) => {
    if (!project) {
      return;
    }

    if (type === "health") {
      setActiveAnalysis({
        title: "Project Health Analysis",
        summary: `Current project health is ${healthScore}/100 — ${healthLabel}.`,
        points: [
          `Project progress is ${project.progress}%.`,
          `Issue completion rate is ${metrics.completionRate}%.`,
          `${metrics.open} ${
            metrics.open === 1
              ? "issue remains"
              : "issues remain"
          } open.`,
          `${metrics.critical} critical ${
            metrics.critical === 1
              ? "issue"
              : "issues"
          } detected.`,
        ],
        recommendation:
          healthScore < 60
            ? "Focus on reducing risk and completing the highest-impact open work."
            : "Continue monitoring delivery velocity and priority issues.",
      });

      return;
    }

    if (type === "risks") {
      const riskPoints: string[] = [];

      if (metrics.critical > 0) {
        riskPoints.push(
          `${metrics.critical} critical issue(s) require immediate attention.`,
        );
      }

      if (metrics.high > 0) {
        riskPoints.push(
          `${metrics.high} high-priority issue(s) are currently open.`,
        );
      }

      if (metrics.open >= 10) {
        riskPoints.push(
          `The project has a large backlog of ${metrics.open} open issues.`,
        );
      }

      if (
        project.prsPending >= 4
      ) {
        riskPoints.push(
          `${project.prsPending} pull requests are waiting for review/merge.`,
        );
      }

      if (riskPoints.length === 0) {
        riskPoints.push(
          "No significant delivery risk was detected from the available project data.",
        );
      }

      setActiveAnalysis({
        title: "Risk Analysis",
        summary:
          "The analysis focuses on the highest-impact delivery risks.",
        points: riskPoints,
        recommendation:
          metrics.critical > 0
            ? "Prioritize critical issues before lower-priority work."
            : metrics.open >= 10
              ? "Reduce the open backlog and establish clear ownership."
              : "Continue monitoring priority issues and delivery signals.",
      });

      return;
    }

    if (type === "bottlenecks") {
      const bottlenecks: string[] = [];

      if (metrics.inReview > 0) {
        bottlenecks.push(
          `${metrics.inReview} issue(s) are currently waiting for review.`,
        );
      }

      if (project.prsPending > 0) {
        bottlenecks.push(
          `${project.prsPending} pull request(s) are pending.`,
        );
      }

      if (
        metrics.inProgress > 0 &&
        metrics.inReview > metrics.inProgress
      ) {
        bottlenecks.push(
          "The review queue is larger than the active development queue.",
        );
      }

      if (bottlenecks.length === 0) {
        bottlenecks.push(
          "No obvious workflow bottleneck was detected from the current project data.",
        );
      }

      setActiveAnalysis({
        title: "Bottleneck Analysis",
        summary:
          "The analysis focuses on work waiting for review, merge, or progression.",
        points: bottlenecks,
        recommendation:
          metrics.inReview > 0
            ? "Increase review throughput before taking on excessive new work."
            : "Maintain the current workflow and monitor review queues.",
      });

      return;
    }

    setActiveAnalysis({
      title: "Project Summary",
      summary: aiSummary,
      points: [
        `${metrics.total} total issues tracked.`,
        `${metrics.done} completed.`,
        `${metrics.inProgress} currently in progress.`,
        `${metrics.inReview} currently in review.`,
        `${metrics.critical} critical issues.`,
      ],
      recommendation:
        healthScore >= 80
          ? "Maintain the current delivery momentum."
          : "Focus on the highest-impact engineering signals first.",
    });
  };

  if (isLoading) {
    return (
      <div className="flex min-h-64 items-center justify-center rounded-xl border border-outline-variant bg-surface-container">
        <div className="text-center">
          <span className="material-symbols-outlined animate-spin text-4xl text-primary">
            progress_activity
          </span>

          <p className="mt-md text-body-sm text-on-surface-variant">
            Analyzing project signals...
          </p>
        </div>
      </div>
    );
  }

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

  if (!project) {
    return (
      <div className="flex min-h-64 items-center justify-center rounded-xl border border-outline-variant bg-surface-container">
        <div className="text-center">
          <span className="material-symbols-outlined text-5xl text-on-surface-variant">
            auto_awesome
          </span>

          <h2 className="mt-md text-title-sm font-semibold text-on-surface">
            Project not found
          </h2>

          <p className="mt-xs text-body-sm text-on-surface-variant">
            AI insights are unavailable for
            this project.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-lg">

      {/* Header */}
      <section className="flex flex-col gap-lg lg:flex-row lg:items-end lg:justify-between">

        <div>
          <div className="flex items-center gap-sm">

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-secondary-container">
              <span className="material-symbols-outlined text-secondary">
                auto_awesome
              </span>
            </div>

            <div>
              <h2 className="text-title-lg font-bold text-on-surface">
                AI Engineering Intelligence
              </h2>

              <p className="mt-xs text-body-sm text-on-surface-variant">
                Project-aware engineering analysis for{" "}
                <span className="font-semibold text-on-surface">
                  {project.name}
                </span>
                .
              </p>
            </div>

          </div>
        </div>

        <div className="flex items-center gap-sm rounded-lg border border-outline-variant bg-surface-container px-md py-sm">

          <span className="material-symbols-outlined text-secondary">
            psychology
          </span>

          <span className="text-caption text-on-surface-variant">
            DevPilot Intelligence
          </span>

          <span className="h-2 w-2 rounded-full bg-secondary" />

          <span className="text-caption font-medium text-secondary">
            Active
          </span>

        </div>

      </section>

      {/* Health + Summary */}
      <section className="grid grid-cols-1 gap-lg lg:grid-cols-[280px_1fr]">

        <div className="rounded-xl border border-outline-variant bg-surface-container p-lg">

          <div className="text-center">

            <p className="text-caption font-medium text-on-surface-variant">
              Project Health
            </p>

            <div className="mt-lg flex justify-center">

              <div
                className={`flex h-40 w-40 flex-col items-center justify-center rounded-full border-8 ${
                  healthScore >= 80
                    ? "border-secondary-container"
                    : healthScore >= 60
                      ? "border-tertiary-container"
                      : "border-error-container"
                }`}
              >

                <span className="text-display-sm font-bold text-on-surface">
                  {healthScore}
                </span>

                <span className="text-caption text-on-surface-variant">
                  / 100
                </span>

              </div>

            </div>

            <div className="mt-lg">

              <span
                className={`rounded-full px-md py-sm text-body-sm font-semibold ${
                  healthScore >= 80
                    ? "bg-secondary-container text-secondary"
                    : healthScore >= 60
                      ? "bg-tertiary-container text-tertiary"
                      : "bg-error-container text-error"
                }`}
              >
                {healthLabel}
              </span>

            </div>

          </div>

        </div>

        <div className="rounded-xl border border-outline-variant bg-surface-container p-lg">

          <div className="flex items-start gap-md">

            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-secondary-container">

              <span className="material-symbols-outlined text-secondary">
                auto_awesome
              </span>

            </div>

            <div>

              <h3 className="text-title-sm font-semibold text-on-surface">
                AI Project Summary
              </h3>

              <p className="mt-xs text-caption text-on-surface-variant">
                Generated from the current project's
                engineering signals.
              </p>

            </div>

          </div>

          <div className="mt-lg rounded-xl bg-surface-container-low p-lg">

            <p className="text-body-sm leading-7 text-on-surface">
              {aiSummary}
            </p>

          </div>

        </div>

      </section>

      {/* Quick Analysis */}
      <section className="rounded-xl border border-outline-variant bg-surface-container p-lg">

        <div>

          <h3 className="text-title-sm font-semibold text-on-surface">
            Ask DevPilot AI
          </h3>

          <p className="mt-xs text-caption text-on-surface-variant">
            Run a focused analysis against the current
            project data.
          </p>

        </div>

        <div className="mt-lg grid grid-cols-1 gap-md sm:grid-cols-2 lg:grid-cols-4">

          <button
            type="button"
            onClick={() => runAnalysis("health")}
            className="group rounded-xl border border-outline-variant bg-surface-container-low p-md text-left transition-colors hover:border-primary hover:bg-surface-container-high"
          >
            <span className="material-symbols-outlined text-primary">
              health_and_safety
            </span>

            <h4 className="mt-md text-body-sm font-semibold text-on-surface">
              Analyze Health
            </h4>

            <p className="mt-xs text-caption text-on-surface-variant">
              Evaluate overall engineering health.
            </p>
          </button>

          <button
            type="button"
            onClick={() => runAnalysis("risks")}
            className="group rounded-xl border border-outline-variant bg-surface-container-low p-md text-left transition-colors hover:border-error hover:bg-surface-container-high"
          >
            <span className="material-symbols-outlined text-error">
              warning
            </span>

            <h4 className="mt-md text-body-sm font-semibold text-on-surface">
              Find Risks
            </h4>

            <p className="mt-xs text-caption text-on-surface-variant">
              Identify critical delivery risks.
            </p>
          </button>

          <button
            type="button"
            onClick={() =>
              runAnalysis("bottlenecks")
            }
            className="group rounded-xl border border-outline-variant bg-surface-container-low p-md text-left transition-colors hover:border-tertiary hover:bg-surface-container-high"
          >
            <span className="material-symbols-outlined text-tertiary">
              speed
            </span>

            <h4 className="mt-md text-body-sm font-semibold text-on-surface">
              Find Bottlenecks
            </h4>

            <p className="mt-xs text-caption text-on-surface-variant">
              Detect workflow slowdowns.
            </p>
          </button>

          <button
            type="button"
            onClick={() => runAnalysis("summary")}
            className="group rounded-xl border border-outline-variant bg-surface-container-low p-md text-left transition-colors hover:border-secondary hover:bg-surface-container-high"
          >
            <span className="material-symbols-outlined text-secondary">
              summarize
            </span>

            <h4 className="mt-md text-body-sm font-semibold text-on-surface">
              Summarize Project
            </h4>

            <p className="mt-xs text-caption text-on-surface-variant">
              Generate an engineering summary.
            </p>
          </button>

        </div>

      </section>

      {/* Analysis Result */}
      {activeAnalysis && (
        <section className="rounded-xl border border-primary/30 bg-surface-container p-lg">

          <div className="flex items-start justify-between gap-md">

            <div className="flex items-start gap-md">

              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-container">

                <span className="material-symbols-outlined text-primary">
                  auto_awesome
                </span>

              </div>

              <div>

                <h3 className="text-title-sm font-semibold text-on-surface">
                  {activeAnalysis.title}
                </h3>

                <p className="mt-xs text-caption text-on-surface-variant">
                  DevPilot analysis result
                </p>

              </div>

            </div>

            <button
              type="button"
              onClick={() =>
                setActiveAnalysis(null)
              }
              className="flex h-8 w-8 items-center justify-center rounded-lg text-on-surface-variant hover:bg-surface-container-high"
              aria-label="Close analysis"
            >
              <span className="material-symbols-outlined">
                close
              </span>
            </button>

          </div>

          <div className="mt-lg rounded-lg bg-surface-container-low p-md">

            <p className="text-body-sm leading-6 text-on-surface">
              {activeAnalysis.summary}
            </p>

          </div>

          <div className="mt-lg">

            <h4 className="text-body-sm font-semibold text-on-surface">
              Findings
            </h4>

            <div className="mt-sm space-y-sm">

              {activeAnalysis.points.map(
                (point, index) => (
                  <div
                    key={`${point}-${index}`}
                    className="flex items-start gap-sm rounded-lg border border-outline-variant bg-surface-container-low p-md"
                  >
                    <span className="material-symbols-outlined text-body-md text-primary">
                      arrow_right
                    </span>

                    <p className="text-caption leading-6 text-on-surface-variant">
                      {point}
                    </p>
                  </div>
                ),
              )}

            </div>

          </div>

          <div className="mt-lg rounded-lg bg-primary-container p-md">

            <div className="flex items-start gap-sm">

              <span className="material-symbols-outlined text-primary">
                lightbulb
              </span>

              <div>

                <p className="text-caption font-semibold text-primary">
                  Recommended Action
                </p>

                <p className="mt-xs text-caption leading-6 text-on-surface">
                  {activeAnalysis.recommendation}
                </p>

              </div>

            </div>

          </div>

        </section>
      )}

      {/* Signals */}
      <section className="rounded-xl border border-outline-variant bg-surface-container p-lg">

        <h3 className="text-title-sm font-semibold text-on-surface">
          Detected Engineering Signals
        </h3>

        <p className="mt-xs text-caption text-on-surface-variant">
          Risks, bottlenecks, and positive signals
          identified from project activity.
        </p>

        <div className="mt-lg space-y-sm">

          {signals.map(
            (signal, index) => (
              <div
                key={`${signal.title}-${index}`}
                className="flex flex-col gap-md rounded-lg bg-surface-container-low p-md md:flex-row md:items-center"
              >

                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                    signal.type === "RISK"
                      ? "bg-error-container text-error"
                      : signal.type === "BOTTLENECK"
                        ? "bg-tertiary-container text-tertiary"
                        : signal.type === "POSITIVE"
                          ? "bg-secondary-container text-secondary"
                          : "bg-primary-container text-primary"
                  }`}
                >
                  <span className="material-symbols-outlined">
                    {signal.icon}
                  </span>
                </div>

                <div className="min-w-0 flex-1">

                  <div className="flex flex-wrap items-center gap-sm">

                    <h4 className="text-body-sm font-semibold text-on-surface">
                      {signal.title}
                    </h4>

                    <span className="rounded-full bg-surface-container-high px-sm py-xs text-caption text-on-surface-variant">
                      {signal.type}
                    </span>

                  </div>

                  <p className="mt-xs text-caption leading-relaxed text-on-surface-variant">
                    {signal.description}
                  </p>

                </div>

              </div>
            ),
          )}

        </div>

      </section>

      {/* Metrics */}
      <section className="rounded-xl border border-outline-variant bg-surface-container p-lg">

        <div>

          <h3 className="text-title-sm font-semibold text-on-surface">
            Engineering Metrics
          </h3>

          <p className="mt-xs text-caption text-on-surface-variant">
            Current project data available to DevPilot
            Intelligence.
          </p>

        </div>

        <div className="mt-lg grid grid-cols-2 gap-md md:grid-cols-4">

          <div className="rounded-lg bg-surface-container-low p-md">
            <p className="text-caption text-on-surface-variant">
              Total Issues
            </p>
            <p className="mt-xs text-title-sm font-bold text-on-surface">
              {metrics.total}
            </p>
          </div>

          <div className="rounded-lg bg-surface-container-low p-md">
            <p className="text-caption text-on-surface-variant">
              Completed
            </p>
            <p className="mt-xs text-title-sm font-bold text-on-surface">
              {metrics.done}
            </p>
          </div>

          <div className="rounded-lg bg-surface-container-low p-md">
            <p className="text-caption text-on-surface-variant">
              In Progress
            </p>
            <p className="mt-xs text-title-sm font-bold text-on-surface">
              {metrics.inProgress}
            </p>
          </div>

          <div className="rounded-lg bg-surface-container-low p-md">
            <p className="text-caption text-on-surface-variant">
              Critical
            </p>
            <p className="mt-xs text-title-sm font-bold text-error">
              {metrics.critical}
            </p>
          </div>

        </div>

      </section>

    </div>
  );
}

export default AI;