import { useEffect, useState } from "react";

import {
  intelligenceService,
} from "../../services/intelligenceService";

import {
  aiService,
} from "../../services/aiService";

import type {
  EngineeringIntelligenceContext,
  EngineeringSignal,
} from "../../services/intelligenceService";

import type {
  AIAnalysisType,
  AIInsight,
} from "../../services/aiService";

interface EngineeringIntelligenceProps {
  projectId: string;
}

function getSignalIcon(signal: EngineeringSignal) {
  if (signal.severity === "risk") {
    return "error";
  }

  if (signal.severity === "warning") {
    return "warning";
  }

  if (signal.severity === "positive") {
    return "check_circle";
  }

  return "info";
}

function getSignalClasses(signal: EngineeringSignal) {
  if (signal.severity === "risk") {
    return {
      border: "border-error/30",
      icon: "text-error",
      background: "bg-error-container/20",
    };
  }

  if (signal.severity === "warning") {
    return {
      border: "border-tertiary/30",
      icon: "text-tertiary",
      background: "bg-tertiary-container/20",
    };
  }

  if (signal.severity === "positive") {
    return {
      border: "border-secondary/30",
      icon: "text-secondary",
      background: "bg-secondary-container/20",
    };
  }

  return {
    border: "border-outline-variant",
    icon: "text-on-surface-variant",
    background: "bg-surface-container-low",
  };
}

function getAISeverityClasses(severity: AIInsight["severity"]) {
  if (severity === "risk") {
    return {
      border: "border-error/30",
      icon: "text-error",
      background: "bg-error-container/20",
      badge: "bg-error-container text-on-error",
    };
  }

  if (severity === "warning") {
    return {
      border: "border-tertiary/30",
      icon: "text-tertiary",
      background: "bg-tertiary-container/20",
      badge: "bg-tertiary-container text-on-tertiary",
    };
  }

  return {
    border: "border-secondary/30",
    icon: "text-secondary",
    background: "bg-secondary-container/20",
    badge: "bg-secondary-container text-on-secondary",
  };
}

function getAIIcon(severity: AIInsight["severity"]) {
  if (severity === "risk") {
    return "priority_high";
  }

  if (severity === "warning") {
    return "warning";
  }

  return "check_circle";
}

import EngineeringActionCenter from "./EngineeringActionCenter";

function EngineeringIntelligence({
  projectId,
}: EngineeringIntelligenceProps) {
  const [context, setContext] =
    useState<EngineeringIntelligenceContext | undefined>();

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | undefined>();

  const [aiInsight, setAIInsight] =
    useState<AIInsight | undefined>();

  const [isAILoading, setIsAILoading] = useState(false);
  const [aiError, setAIError] = useState<string | undefined>();

  const [analysisType, setAnalysisType] =
    useState<AIAnalysisType>("summary");

  useEffect(() => {
    let cancelled = false;

    async function loadIntelligence() {
      setIsLoading(true);
      setError(undefined);

      try {
        const loadedContext =
          await intelligenceService.getContext(projectId);

        if (!cancelled) {
          setContext(loadedContext);
        }
      } catch (err) {
        if (!cancelled) {
          setContext(undefined);

          setError(
            err instanceof Error
              ? err.message
              : "Unable to load engineering intelligence.",
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    loadIntelligence();

    return () => {
      cancelled = true;
    };
  }, [projectId]);

  async function handleAnalyze() {
    setIsAILoading(true);
    setAIError(undefined);

    try {
      const insight = await aiService.analyzeProject(
        projectId,
        analysisType,
      );

      setAIInsight(insight);
    } catch (err) {
      setAIInsight(undefined);

      setAIError(
        err instanceof Error
          ? err.message
          : "Unable to generate AI analysis.",
      );
    } finally {
      setIsAILoading(false);
    }
  }

  if (isLoading) {
    return (
      <section className="rounded-xl border border-outline-variant bg-surface-container p-lg">
        <div className="flex items-center justify-center py-xl">
          <span className="material-symbols-outlined animate-spin text-3xl text-primary">
            progress_activity
          </span>

          <span className="ml-sm text-body-sm text-on-surface-variant">
            Analyzing engineering signals...
          </span>
        </div>
      </section>
    );
  }

  if (error || !context) {
    return (
      <section className="rounded-xl border border-outline-variant bg-surface-container p-lg">
        <div className="flex items-start gap-md">
          <span className="material-symbols-outlined text-error">
            error
          </span>

          <div>
            <h2 className="text-title-sm font-semibold text-on-surface">
              Engineering Intelligence
            </h2>

            <p className="mt-xs text-body-sm text-error">
              {error ?? "Engineering intelligence is unavailable."}
            </p>
          </div>
        </div>
      </section>
    );
  }

  const { metrics, signals, health } = context;

  const issueMetrics = metrics.issues;
  const cicdMetrics = metrics.cicd;
  const githubMetrics = metrics.github;
  const activityMetrics = metrics.activity;

  const riskSignals = signals.signals.filter(
    (signal) => signal.severity === "risk",
  );

  const warningSignals = signals.signals.filter(
    (signal) => signal.severity === "warning",
  );

  const positiveSignals = signals.signals.filter(
    (signal) => signal.severity === "positive",
  );

  const aiStyles = aiInsight
    ? getAISeverityClasses(aiInsight.severity)
    : undefined;

  return (
    <section className="space-y-lg">
      {/* Section header */}
      <div>
        <div className="flex items-center gap-sm">
          <span className="material-symbols-outlined text-secondary">
            psychology
          </span>

          <h2 className="text-title-lg font-bold text-on-surface">
            Engineering Intelligence
          </h2>
        </div>

        <p className="mt-xs text-body-sm text-on-surface-variant">
          Evidence-based engineering signals generated from issues,
          CI/CD, GitHub, and delivery activity.
        </p>
      </div>

      {/* Key metrics */}
      <div className="grid grid-cols-2 gap-md lg:grid-cols-4">
        <div className="rounded-xl border border-outline-variant bg-surface-container p-lg">
          <p className="text-caption text-on-surface-variant">
            Open Issues
          </p>

          <p className="mt-xs text-title-lg font-bold text-on-surface">
            {issueMetrics.open}
          </p>

          <p className="mt-xs text-caption text-on-surface-variant">
            {issueMetrics.completion_rate.toFixed(0)}% completion
          </p>
        </div>

        <div className="rounded-xl border border-outline-variant bg-surface-container p-lg">
          <p className="text-caption text-on-surface-variant">
            CI/CD Success
          </p>

          <p className="mt-xs text-title-lg font-bold text-on-surface">
            {cicdMetrics.success_rate.toFixed(1)}%
          </p>

          <p className="mt-xs text-caption text-on-surface-variant">
            {cicdMetrics.failed_runs} failed runs
          </p>
        </div>

        <div className="rounded-xl border border-outline-variant bg-surface-container p-lg">
          <p className="text-caption text-on-surface-variant">
            Open PRs
          </p>

          <p className="mt-xs text-title-lg font-bold text-on-surface">
            {githubMetrics.open_pull_requests}
          </p>

          <p className="mt-xs text-caption text-on-surface-variant">
            {githubMetrics.merged_pull_requests} merged
          </p>
        </div>

        <div className="rounded-xl border border-outline-variant bg-surface-container p-lg">
          <p className="text-caption text-on-surface-variant">
            Active Work
          </p>

          <p className="mt-xs text-title-lg font-bold text-on-surface">
            {activityMetrics.active_work}
          </p>

          <p className="mt-xs text-caption text-on-surface-variant">
            {activityMetrics.completed_work} completed
          </p>
        </div>
      </div>

      {/* Signal summary */}
      <div className="grid grid-cols-3 gap-md">
        <div className="rounded-xl border border-error/30 bg-error-container/10 p-md">
          <p className="text-caption text-on-surface-variant">
            Risks
          </p>

          <p className="mt-xs text-title-md font-bold text-error">
            {riskSignals.length}
          </p>
        </div>

        <div className="rounded-xl border border-tertiary/30 bg-tertiary-container/10 p-md">
          <p className="text-caption text-on-surface-variant">
            Warnings
          </p>

          <p className="mt-xs text-title-md font-bold text-tertiary">
            {warningSignals.length}
          </p>
        </div>

        <div className="rounded-xl border border-secondary/30 bg-secondary-container/10 p-md">
          <p className="text-caption text-on-surface-variant">
            Positive
          </p>

          <p className="mt-xs text-title-md font-bold text-secondary">
            {positiveSignals.length}
          </p>
        </div>
      </div>

      {/* Action Center */}

      {/* Action Center */}

      {/* Action Center */}
      <EngineeringActionCenter
        projectId={projectId}
        signals={signals.signals}
      />

      {/* Engineering signals */}
      <div className="rounded-xl border border-outline-variant bg-surface-container p-lg">
        <div className="mb-lg flex items-center justify-between">
          <div>
            <h3 className="text-title-sm font-semibold text-on-surface">
              Engineering Signals
            </h3>

            <p className="mt-xs text-caption text-on-surface-variant">
              Detected from the last {context.lookback_days} days
            </p>
          </div>

          <span className="rounded-full bg-surface-container-high px-sm py-xs text-caption text-on-surface-variant">
            {signals.signals.length} signals
          </span>
        </div>

        {signals.signals.length === 0 ? (
          <div className="rounded-lg bg-surface-container-low p-lg">
            <p className="text-body-sm text-on-surface-variant">
              No significant engineering signals detected.
            </p>
          </div>
        ) : (
          <div className="space-y-md">
            {signals.signals.map((signal) => {
              const styles = getSignalClasses(signal);

              return (
                <div
                  key={`${signal.category}-${signal.title}`}
                  className={`rounded-lg border ${styles.border} ${styles.background} p-md`}
                >
                  <div className="flex items-start gap-md">
                    <span
                      className={`material-symbols-outlined ${styles.icon}`}
                    >
                      {getSignalIcon(signal)}
                    </span>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center justify-between gap-sm">
                        <h4 className="text-body-md font-semibold text-on-surface">
                          {signal.title}
                        </h4>

                        <span className="rounded-full bg-surface-container px-sm py-xs text-caption capitalize text-on-surface-variant">
                          {signal.category}
                        </span>
                      </div>

                      <p className="mt-xs text-body-sm leading-6 text-on-surface-variant">
                        {signal.description}
                      </p>

                      <div className="mt-sm rounded-lg bg-surface-container-low p-sm">
                        <p className="text-caption font-medium text-on-surface">
                          Evidence
                        </p>

                        <ul className="mt-xs space-y-xs">
                          {signal.evidence.map((evidence) => (
                            <li
                              key={evidence}
                              className="text-caption text-on-surface-variant"
                            >
                              • {evidence}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="mt-sm">
                        <p className="text-caption font-medium text-on-surface">
                          Recommended action
                        </p>

                        <p className="mt-xs text-caption leading-5 text-on-surface-variant">
                          {signal.recommendation}
                        </p>
                      </div>

                      <p className="mt-sm text-caption font-medium text-on-surface">
                        Current value:{" "}
                        <span className="font-normal text-on-surface-variant">
                          {signal.value}
                        </span>
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* AI Engineering Analysis */}
      <div className="rounded-xl border border-secondary/30 bg-surface-container p-lg">
        <div className="flex flex-col gap-md lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-sm">
            <span className="material-symbols-outlined text-secondary">
              auto_awesome
            </span>

            <div>
              <h3 className="text-title-sm font-semibold text-on-surface">
                AI Engineering Analysis
              </h3>

              <p className="mt-xs text-caption text-on-surface-variant">
                Groq analyzes the project's current engineering signals
                and health.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-sm">
            {(
              [
                ["summary", "Summary"],
                ["health", "Health"],
                ["risks", "Risks"],
                ["bottlenecks", "Bottlenecks"],
              ] as [AIAnalysisType, string][]
            ).map(([type, label]) => (
              <button
                key={type}
                type="button"
                onClick={() => setAnalysisType(type)}
                className={`rounded-lg border px-sm py-xs text-caption font-medium transition-colors ${
                  analysisType === type
                    ? "border-primary bg-primary text-on-primary"
                    : "border-outline-variant bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high"
                }`}
              >
                {label}
              </button>
            ))}

            <button
              type="button"
              onClick={handleAnalyze}
              disabled={isAILoading}
              className="flex items-center gap-xs rounded-lg bg-primary px-md py-xs text-caption font-semibold text-on-primary transition-opacity disabled:cursor-not-allowed disabled:opacity-60"
            >
              <span className="material-symbols-outlined text-base">
                {isAILoading
                  ? "progress_activity"
                  : "auto_awesome"}
              </span>

              {isAILoading
                ? "Analyzing..."
                : "Analyze Project"}
            </button>
          </div>
        </div>

        {aiError && (
          <div className="mt-lg rounded-lg border border-error/30 bg-error-container/20 p-md">
            <div className="flex items-start gap-sm">
              <span className="material-symbols-outlined text-error">
                error
              </span>

              <div>
                <p className="text-body-sm font-medium text-error">
                  AI analysis failed
                </p>

                <p className="mt-xs text-caption text-on-surface-variant">
                  {aiError}
                </p>
              </div>
            </div>
          </div>
        )}

        {!aiInsight && !aiError && !isAILoading && (
          <div className="mt-lg rounded-lg bg-surface-container-low p-lg">
            <p className="text-body-sm text-on-surface-variant">
              Select an analysis type and click{" "}
              <span className="font-medium text-on-surface">
                Analyze Project
              </span>{" "}
              to generate an evidence-based engineering analysis.
            </p>
          </div>
        )}

        {isAILoading && (
          <div className="mt-lg flex items-center justify-center rounded-lg bg-surface-container-low py-xl">
            <span className="material-symbols-outlined animate-spin text-2xl text-secondary">
              progress_activity
            </span>

            <span className="ml-sm text-body-sm text-on-surface-variant">
              Groq is analyzing the current engineering context...
            </span>
          </div>
        )}

        {aiInsight && aiStyles && !isAILoading && (
          <div
            className={`mt-lg rounded-lg border ${aiStyles.border} ${aiStyles.background} p-lg`}
          >
            <div className="flex items-start gap-md">
              <span
                className={`material-symbols-outlined ${aiStyles.icon}`}
              >
                {getAIIcon(aiInsight.severity)}
              </span>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-sm">
                  <h4 className="text-body-md font-semibold text-on-surface">
                    {aiInsight.title}
                  </h4>

                  <span
                    className={`rounded-full px-sm py-xs text-caption font-semibold capitalize ${aiStyles.badge}`}
                  >
                    {aiInsight.severity}
                  </span>
                </div>

                <p className="mt-sm text-body-sm leading-6 text-on-surface">
                  {aiInsight.summary}
                </p>

                <div className="mt-lg rounded-lg bg-surface-container-low p-md">
                  <p className="text-caption font-semibold text-on-surface">
                    Recommended action
                  </p>

                  <p className="mt-xs text-body-sm leading-6 text-on-surface-variant">
                    {aiInsight.recommendation}
                  </p>
                </div>

                <div className="mt-lg">
                  <p className="text-caption font-semibold text-on-surface">
                    Evidence used
                  </p>

                  <ul className="mt-sm space-y-xs">
                    {aiInsight.evidence.map((evidence) => (
                      <li
                        key={evidence}
                        className="text-caption leading-5 text-on-surface-variant"
                      >
                        • {evidence}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Context facts */}
      <div className="rounded-xl border border-outline-variant bg-surface-container p-lg">
        <div className="flex items-center gap-sm">
          <span className="material-symbols-outlined text-primary">
            data_exploration
          </span>

          <div>
            <h3 className="text-title-sm font-semibold text-on-surface">
              Intelligence Context
            </h3>

            <p className="mt-xs text-caption text-on-surface-variant">
              Facts currently used by DevPilot's intelligence layer.
            </p>
          </div>
        </div>

        <div className="mt-lg grid grid-cols-1 gap-sm md:grid-cols-2">
          {context.context_facts.map((fact) => (
            <div
              key={fact}
              className="rounded-lg bg-surface-container-low px-md py-sm"
            >
              <p className="text-caption leading-5 text-on-surface-variant">
                {fact}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Health basis */}
      <div className="rounded-xl border border-outline-variant bg-surface-container p-lg">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-title-sm font-semibold text-on-surface">
              Health Calculation
            </h3>

            <p className="mt-xs text-caption text-on-surface-variant">
              Current overall engineering health
            </p>
          </div>

          <span className="text-title-md font-bold text-on-surface">
            {health.score.toFixed(1)}/100
          </span>
        </div>

        <div className="mt-lg grid grid-cols-2 gap-md lg:grid-cols-4">
          <div>
            <p className="text-caption text-on-surface-variant">
              Issues
            </p>

            <p className="mt-xs font-semibold text-on-surface">
              {health.issue_health.score.toFixed(1)}
            </p>
          </div>

          <div>
            <p className="text-caption text-on-surface-variant">
              CI/CD
            </p>

            <p className="mt-xs font-semibold text-on-surface">
              {health.cicd_reliability.score.toFixed(1)}
            </p>
          </div>

          <div>
            <p className="text-caption text-on-surface-variant">
              Delivery
            </p>

            <p className="mt-xs font-semibold text-on-surface">
              {health.delivery_activity.score.toFixed(1)}
            </p>
          </div>

          <div>
            <p className="text-caption text-on-surface-variant">
              GitHub
            </p>

            <p className="mt-xs font-semibold text-on-surface">
              {health.github_activity.score.toFixed(1)}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

export default EngineeringIntelligence;
