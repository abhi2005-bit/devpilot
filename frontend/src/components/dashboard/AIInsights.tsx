import { useEffect, useState } from "react";

import { projectService } from "../../services/projectService";
import {
  aiService,
  type AIAnalysisType,
} from "../../services/aiService";

import type { Project } from "../../types/project";
import type {
  EngineeringHealth,
  HealthComponent,
  HealthEvidence,
} from "../../types/health";

type InsightSeverity =
  | "risk"
  | "warning"
  | "positive";

type Insight = {
  title: string;
  description: string;
  recommendation: string;
  icon: string;
  severity: InsightSeverity;
  projectName: string;
  score: number;
};

function getEvidenceValue(
  evidence: HealthEvidence[],
  label: string,
): string | undefined {
  return evidence.find(
    (item) => item.label === label,
  )?.value;
}

function getPrimaryInsight(
  project: Project,
  health: EngineeringHealth,
): Insight {
  const issueCompletion =
    getEvidenceValue(
      health.evidence,
      "Issue completion",
    );

  const completedWork =
    getEvidenceValue(
      health.evidence,
      "Completed work",
    );

  const activeWork =
    getEvidenceValue(
      health.evidence,
      "Active work",
    );

  const openPullRequests =
    getEvidenceValue(
      health.evidence,
      "Open pull requests",
    );

  const ciSuccessRate =
    getEvidenceValue(
      health.evidence,
      "CI/CD success rate",
    );

  const recentCICDFailures =
    getEvidenceValue(
      health.evidence,
      "Recent CI/CD failures",
    );

  const components: {
    name: string;
    component: HealthComponent;
  }[] = [
    {
      name: "Issue health",
      component: health.issue_health,
    },
    {
      name: "CI/CD reliability",
      component: health.cicd_reliability,
    },
    {
      name: "Delivery activity",
      component: health.delivery_activity,
    },
    {
      name: "GitHub activity",
      component: health.github_activity,
    },
  ];

  const weakestComponent =
    components.reduce(
      (current, candidate) =>
        candidate.component.score <
        current.component.score
          ? candidate
          : current,
    );

  if (
    weakestComponent.name ===
    "Issue health"
  ) {
    const completionText =
      issueCompletion ?? "0%";

    const completedText =
      completedWork ?? "0";

    const activeText =
      activeWork ?? "0";

    let description =
      `Issue throughput is currently the main engineering concern for ${project.name}. ` +
      `Issue completion is ${completionText}, with ${completedText} completed work item(s) ` +
      `and ${activeText} active work item(s).`;

    if (ciSuccessRate) {
      description +=
        ` CI/CD remains comparatively strong at ${ciSuccessRate} success rate.`;
    }

    if (openPullRequests) {
      description +=
        ` GitHub also shows ${openPullRequests} open pull request(s), which may add review pressure.`;
    }

    return {
      title:
        "Issue throughput is the main concern",
      description,
      recommendation:
        "Prioritize completing the active issue and reduce unfinished work before expanding the backlog.",
      icon: "gpp_maybe",
      severity: "risk",
      projectName: project.name,
      score: health.score,
    };
  }

  if (
    weakestComponent.name ===
    "CI/CD reliability"
  ) {
    let description =
      `CI/CD reliability is currently the weakest engineering signal for ${project.name}, ` +
      `with a component score of ${health.cicd_reliability.score.toFixed(2)}.`;

    if (ciSuccessRate) {
      description +=
        ` The current pipeline success rate is ${ciSuccessRate}.`;
    }

    if (recentCICDFailures) {
      description +=
        ` There have been ${recentCICDFailures} recent failure(s).`;
    }

    return {
      title:
        "CI/CD reliability needs attention",
      description,
      recommendation:
        "Investigate recent pipeline failures and confirm that the failing workflows are stable before increasing delivery volume.",
      icon: "build",
      severity: "warning",
      projectName: project.name,
      score: health.score,
    };
  }

  if (
    weakestComponent.name ===
    "Delivery activity"
  ) {
    return {
      title:
        "Delivery activity needs attention",
      description:
        `Delivery activity is currently the weakest engineering signal for ${project.name}, ` +
        `with a score of ${health.delivery_activity.score.toFixed(2)}. ` +
        `The project should focus on moving active work toward completion.`,
      recommendation:
        "Reduce unfinished work and improve delivery throughput before taking on additional work.",
      icon: "speed",
      severity: "warning",
      projectName: project.name,
      score: health.score,
    };
  }

  return {
    title:
      "GitHub activity needs attention",
    description:
      `GitHub activity is currently the weakest engineering signal for ${project.name}, ` +
      `with a score of ${health.github_activity.score.toFixed(2)}.` +
      (
        openPullRequests
          ? ` There are ${openPullRequests} open pull request(s) that may require review.`
          : ""
      ),
    recommendation:
      "Review the open pull-request queue and keep code-review throughput aligned with development activity.",
    icon: "code",
    severity: "warning",
    projectName: project.name,
    score: health.score,
  };
}

function getAIInsight(
  project: Project,
  health: EngineeringHealth,
  result: {
    title: string;
    summary: string;
    severity:
      | "positive"
      | "warning"
      | "risk";
    recommendation: string;
  },
): Insight {
  return {
    title: result.title,
    description: result.summary,
    recommendation: result.recommendation,
    icon:
      result.severity === "risk"
        ? "gpp_maybe"
        : result.severity === "warning"
          ? "warning"
          : "check_circle",
    severity: result.severity,
    projectName: project.name,
    score: health.score,
  };
}

function AIInsights() {
  const [insight, setInsight] =
    useState<Insight | undefined>();

  const [selectedProject, setSelectedProject] =
    useState<Project | undefined>();

  const [selectedHealth, setSelectedHealth] =
    useState<EngineeringHealth | undefined>();

  const [isLoading, setIsLoading] =
    useState(true);

  const [isAnalyzing, setIsAnalyzing] =
    useState(false);

  const [error, setError] =
    useState<string | undefined>();

  const [analysisError, setAnalysisError] =
    useState<string | undefined>();

  useEffect(() => {
    let cancelled = false;

    async function loadInsight() {
      setIsLoading(true);
      setError(undefined);

      try {
        const projects =
          await projectService.getAll();

        if (projects.length === 0) {
          if (!cancelled) {
            setInsight(undefined);
            setSelectedProject(undefined);
            setSelectedHealth(undefined);
          }

          return;
        }

        const healthResults =
          await Promise.all(
            projects.map(
              async (project) => {
                try {
                  const health =
                    await projectService.getHealth(
                      project.id,
                    );

                  return {
                    project,
                    health,
                  };
                } catch {
                  return undefined;
                }
              },
            ),
          );

        const availableResults =
          healthResults.filter(
            (
              result,
            ): result is {
              project: Project;
              health: EngineeringHealth;
            } =>
              result !== undefined,
          );

        if (
          availableResults.length === 0
        ) {
          throw new Error(
            "No engineering health data available.",
          );
        }

        const highestRisk =
          availableResults.reduce(
            (current, candidate) =>
              candidate.health.score <
              current.health.score
                ? candidate
                : current,
          );

        const generatedInsight =
          getPrimaryInsight(
            highestRisk.project,
            highestRisk.health,
          );

        if (!cancelled) {
          setSelectedProject(
            highestRisk.project,
          );

          setSelectedHealth(
            highestRisk.health,
          );

          setInsight(
            generatedInsight,
          );
        }
      } catch {
        if (!cancelled) {
          setInsight(undefined);
          setSelectedProject(undefined);
          setSelectedHealth(undefined);
          setError(
            "Unable to generate engineering insight.",
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    loadInsight();

    return () => {
      cancelled = true;
    };
  }, []);

  const runAIAnalysis = async (
    analysisType: AIAnalysisType = "summary",
  ) => {
    if (
      !selectedProject ||
      !selectedHealth
    ) {
      return;
    }

    setIsAnalyzing(true);
    setAnalysisError(undefined);

    try {
      const result =
        await aiService.analyzeProject(
          selectedProject.id,
          analysisType,
        );

      const generatedInsight =
        getAIInsight(
          selectedProject,
          selectedHealth,
          result,
        );

      setInsight(generatedInsight);
    } catch (err) {
      setAnalysisError(
        err instanceof Error
          ? err.message
          : "Failed to generate AI analysis.",
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  const borderClass =
    insight?.severity === "risk"
      ? "border-error"
      : insight?.severity === "warning"
        ? "border-tertiary"
        : "border-[#10B981]";

  const iconContainerClass =
    insight?.severity === "risk"
      ? "border-error bg-[#93000a] bg-opacity-20"
      : insight?.severity === "warning"
        ? "border-tertiary bg-[#ca8100] bg-opacity-20"
        : "border-[#10B981] bg-[#10B981] bg-opacity-10";

  const iconClass =
    insight?.severity === "risk"
      ? "text-error"
      : insight?.severity === "warning"
        ? "text-tertiary"
        : "text-[#10B981]";

  const buttonClass =
    insight?.severity === "risk"
      ? "border-error text-error hover:bg-error hover:bg-opacity-10"
      : insight?.severity === "warning"
        ? "border-tertiary text-tertiary hover:bg-tertiary hover:bg-opacity-10"
        : "border-[#10B981] text-[#10B981] hover:bg-[#10B981] hover:bg-opacity-10";

  return (
    <section
      className={`relative overflow-hidden rounded-lg border ${borderClass} bg-surface-container p-md shadow-[inset_0_0_8px_rgba(16,185,129,0.2)]`}
    >
      {/* AI indicator */}

      <div className="absolute right-0 top-0 p-sm">
        <span className="material-symbols-outlined animate-pulse text-[#10B981]">
          auto_awesome
        </span>
      </div>

      {/* Header */}

      <div className="mb-md border-b border-[#242830] pb-sm">
        <h2 className="flex items-center font-title-sm text-title-sm text-on-surface">
          AI Insights
        </h2>
      </div>

      {/* Loading */}

      {isLoading && (
        <div className="flex items-center gap-md py-sm">
          <span className="material-symbols-outlined animate-spin text-primary">
            progress_activity
          </span>

          <p className="font-body-sm text-body-sm text-on-surface-variant">
            Analyzing engineering signals...
          </p>
        </div>
      )}

      {/* Error */}

      {!isLoading && error && (
        <div className="flex items-start gap-md">
          <div className="rounded-DEFAULT border border-error bg-[#93000a] bg-opacity-20 p-sm">
            <span className="material-symbols-outlined text-error">
              error
            </span>
          </div>

          <div>
            <h3 className="font-body-md text-body-md font-bold text-on-surface">
              Engineering insight unavailable
            </h3>

            <p className="mt-xs font-body-sm text-body-sm text-on-surface-variant">
              {error}
            </p>
          </div>
        </div>
      )}

      {/* No projects */}

      {!isLoading &&
        !error &&
        !insight && (
          <div className="flex items-start gap-md">
            <div className="rounded-DEFAULT border border-outline-variant bg-surface-container-highest p-sm">
              <span className="material-symbols-outlined text-on-surface-variant">
                info
              </span>
            </div>

            <div>
              <h3 className="font-body-md text-body-md font-bold text-on-surface">
                No engineering signals available
              </h3>

              <p className="mt-xs font-body-sm text-body-sm text-on-surface-variant">
                Create a project and add engineering activity to generate insights.
              </p>
            </div>
          </div>
        )}

      {/* Insight */}

      {!isLoading &&
        !error &&
        insight && (
          <div className="flex items-start gap-md">
            <div
              className={`rounded-DEFAULT border p-sm ${iconContainerClass}`}
            >
              <span
                className={`material-symbols-outlined ${iconClass}`}
              >
                {insight.icon}
              </span>
            </div>

            <div className="flex-1">
              <div className="mb-xs flex flex-wrap items-center gap-sm">
                <h3 className="font-body-md text-body-md font-bold text-on-surface">
                  {insight.title}
                </h3>

                <span className="rounded-full bg-surface-container-high px-sm py-xs text-caption text-on-surface-variant">
                  Health {insight.score.toFixed(0)}/100
                </span>
              </div>

              <p className="mb-md font-body-sm text-body-sm text-on-surface-variant">
                {insight.description}
              </p>

              <div className="mb-md rounded-lg bg-surface-container-low p-sm">
                <p className="text-caption text-on-surface-variant">
                  <span className="font-semibold text-on-surface">
                    Recommended action:
                  </span>{" "}
                  {insight.recommendation}
                </p>
              </div>

              {/* AI Analysis Error */}

              {analysisError && (
                <div className="mb-md rounded-lg border border-error/30 bg-error-container p-sm">
                  <div className="flex items-start gap-sm">
                    <span className="material-symbols-outlined text-error">
                      error
                    </span>

                    <p className="text-caption text-on-surface">
                      {analysisError}
                    </p>
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={() =>
                  runAIAnalysis("summary")
                }
                disabled={
                  isAnalyzing ||
                  !selectedProject
                }
                className={`flex items-center rounded-lg border px-md py-xs font-code-label text-code-label transition-colors ${buttonClass} disabled:cursor-not-allowed disabled:opacity-60`}
              >
                <span
                  className={`material-symbols-outlined mr-xs text-[16px] ${
                    isAnalyzing
                      ? "animate-spin"
                      : ""
                  }`}
                >
                  {isAnalyzing
                    ? "progress_activity"
                    : "troubleshoot"}
                </span>

                {isAnalyzing
                  ? "Analyzing..."
                  : "Analyze Project"}
              </button>
            </div>
          </div>
        )}
    </section>
  );
}

export default AIInsights;