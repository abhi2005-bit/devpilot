import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import { projectService } from "../../services/projectService";
import { healthService } from "../../services/healthService";
import EngineeringIntelligence from "../../components/dashboard/EngineeringIntelligence";

import type { Project } from "../../types/project";
import type { EngineeringHealth } from "../../types/health";

function ProjectHome() {
  const { projectId } = useParams<{
    projectId: string;
  }>();

  const [project, setProject] =
    useState<Project | undefined>();

  const [health, setHealth] =
    useState<EngineeringHealth | undefined>();

  const [isLoading, setIsLoading] = useState(true);

  const [isHealthLoading, setIsHealthLoading] =
    useState(true);

  /*
   * Load project
   */
  useEffect(() => {
    let cancelled = false;

    async function loadProject() {
      if (!projectId) {
        setProject(undefined);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);

      try {
        const loadedProject =
          await projectService.getById(projectId);

        if (!cancelled) {
          setProject(loadedProject);
        }
      } catch {
        if (!cancelled) {
          setProject(undefined);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    loadProject();

    return () => {
      cancelled = true;
    };
  }, [projectId]);

  /*
   * Load real engineering health
   */
  useEffect(() => {
    let cancelled = false;

    async function loadHealth() {
      if (!projectId) {
        setHealth(undefined);
        setIsHealthLoading(false);
        return;
      }

      setIsHealthLoading(true);

      try {
        const loadedHealth =
          await healthService.getProjectHealth(
            projectId,
          );

        if (!cancelled) {
          setHealth(loadedHealth);
        }
      } catch {
        if (!cancelled) {
          setHealth(undefined);
        }
      } finally {
        if (!cancelled) {
          setIsHealthLoading(false);
        }
      }
    }

    loadHealth();

    return () => {
      cancelled = true;
    };
  }, [projectId]);

  /*
   * Loading project
   */
  if (isLoading) {
    return (
      <div className="flex min-h-64 items-center justify-center rounded-xl border border-outline-variant bg-surface-container">
        <div className="text-center">
          <span className="material-symbols-outlined animate-spin text-5xl text-primary">
            progress_activity
          </span>

          <p className="mt-md text-body-sm text-on-surface-variant">
            Loading project...
          </p>
        </div>
      </div>
    );
  }

  /*
   * Project not found
   */
  if (!project) {
    return (
      <div className="flex min-h-64 items-center justify-center rounded-xl border border-outline-variant bg-surface-container">
        <div className="text-center">
          <span className="material-symbols-outlined text-5xl text-on-surface-variant">
            folder_off
          </span>

          <h2 className="mt-md text-title-sm font-semibold text-on-surface">
            Project not found
          </h2>

          <p className="mt-xs text-body-sm text-on-surface-variant">
            This project could not be loaded.
          </p>
        </div>
      </div>
    );
  }

  /*
   * Engineering health status
   */
  const healthStatus =
    health?.status ?? "at_risk";

  const healthLabel =
    healthStatus === "excellent"
      ? "EXCELLENT"
      : healthStatus === "healthy"
        ? "HEALTHY"
        : healthStatus === "needs_attention"
          ? "NEEDS ATTENTION"
          : "AT RISK";

  /*
   * Health styling
   */
  const healthTextColor =
    healthStatus === "excellent" ||
    healthStatus === "healthy"
      ? "text-secondary"
      : healthStatus === "needs_attention"
        ? "text-tertiary"
        : "text-error";

  const healthBadgeClass =
    healthStatus === "excellent" ||
    healthStatus === "healthy"
      ? "bg-secondary-container text-on-secondary"
      : healthStatus === "needs_attention"
        ? "bg-tertiary-container text-on-tertiary"
        : "bg-error-container text-on-error";

  /*
   * Component scores
   */
  const issueScore =
    health?.issue_health.score ?? 0;

  const cicdScore =
    health?.cicd_reliability.score ?? 0;

  const deliveryScore =
    health?.delivery_activity.score ?? 0;

  const githubScore =
    health?.github_activity.score ?? 0;

  return (
    <div className="space-y-lg">

      {/* Engineering Intelligence */}
      <EngineeringIntelligence projectId={projectId!} />


      {/* Engineering Health */}
      <section>

        <div className="mb-md">

          <h2 className="text-title-lg font-bold text-on-surface">
            Engineering Health
          </h2>

          <p className="mt-xs text-body-sm text-on-surface-variant">
            Current engineering health and project signals.
          </p>

        </div>

        <div className="grid grid-cols-1 gap-md md:grid-cols-3">

          {/* Overall Health */}
          <div className="rounded-xl border border-outline-variant bg-surface-container p-lg">

            <div className="flex items-center justify-between">

              <div>

                <p className="text-caption text-on-surface-variant">
                  Health Score
                </p>

                <p
                  className={`mt-xs text-title-lg font-bold ${healthTextColor}`}
                >
                  {isHealthLoading
                    ? "..."
                    : `${health?.score ?? 0}/100`}
                </p>

              </div>

              <span
                className={`material-symbols-outlined ${healthTextColor}`}
              >
                health_and_safety
              </span>

            </div>

          </div>

          {/* Status */}
          <div className="rounded-xl border border-outline-variant bg-surface-container p-lg">

            <div className="flex items-center justify-between">

              <div>

                <p className="text-caption text-on-surface-variant">
                  Status
                </p>

                <p
                  className={`mt-xs text-title-lg font-bold ${healthTextColor}`}
                >
                  {isHealthLoading
                    ? "..."
                    : healthLabel}
                </p>

              </div>

              <span
                className={`material-symbols-outlined ${healthTextColor}`}
              >
                warning
              </span>

            </div>

          </div>

          {/* Team */}
          <div className="rounded-xl border border-outline-variant bg-surface-container p-lg">

            <div className="flex items-center justify-between">

              <div>

                <p className="text-caption text-on-surface-variant">
                  Team Members
                </p>

                <p className="mt-xs text-title-lg font-bold text-on-surface">
                  {project.members.length}
                </p>

              </div>

              <span className="material-symbols-outlined text-secondary">
                group
              </span>

            </div>

          </div>

        </div>

      </section>

      {/* Health Components */}
      <section>

        <div className="mb-md">

          <h2 className="text-title-sm font-semibold text-on-surface">
            Engineering Signals
          </h2>

          <p className="mt-xs text-caption text-on-surface-variant">
            Health scores calculated from current project signals.
          </p>

        </div>

        <div className="grid grid-cols-1 gap-md md:grid-cols-2">

          {/* Issues */}
          <div className="rounded-xl border border-outline-variant bg-surface-container p-lg">

            <div className="flex items-center justify-between">

              <span className="text-body-sm text-on-surface-variant">
                Issue Health
              </span>

              <span className="font-semibold text-on-surface">
                {isHealthLoading
                  ? "..."
                  : `${issueScore}/100`}
              </span>

            </div>

            <div className="mt-md h-2 overflow-hidden rounded-full bg-surface-container-highest">

              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{
                  width: `${issueScore}%`,
                }}
              />

            </div>

          </div>

          {/* CI/CD */}
          <div className="rounded-xl border border-outline-variant bg-surface-container p-lg">

            <div className="flex items-center justify-between">

              <span className="text-body-sm text-on-surface-variant">
                CI/CD Reliability
              </span>

              <span className="font-semibold text-on-surface">
                {isHealthLoading
                  ? "..."
                  : `${cicdScore}/100`}
              </span>

            </div>

            <div className="mt-md h-2 overflow-hidden rounded-full bg-surface-container-highest">

              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{
                  width: `${cicdScore}%`,
                }}
              />

            </div>

          </div>

          {/* Delivery */}
          <div className="rounded-xl border border-outline-variant bg-surface-container p-lg">

            <div className="flex items-center justify-between">

              <span className="text-body-sm text-on-surface-variant">
                Delivery Activity
              </span>

              <span className="font-semibold text-on-surface">
                {isHealthLoading
                  ? "..."
                  : `${deliveryScore}/100`}
              </span>

            </div>

            <div className="mt-md h-2 overflow-hidden rounded-full bg-surface-container-highest">

              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{
                  width: `${deliveryScore}%`,
                }}
              />

            </div>

          </div>

          {/* GitHub */}
          <div className="rounded-xl border border-outline-variant bg-surface-container p-lg">

            <div className="flex items-center justify-between">

              <span className="text-body-sm text-on-surface-variant">
                GitHub Activity
              </span>

              <span className="font-semibold text-on-surface">
                {isHealthLoading
                  ? "..."
                  : `${githubScore}/100`}
              </span>

            </div>

            <div className="mt-md h-2 overflow-hidden rounded-full bg-surface-container-highest">

              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{
                  width: `${githubScore}%`,
                }}
              />

            </div>

          </div>

        </div>

      </section>

      {/* AI + Risk */}
      <section className="grid grid-cols-1 gap-lg xl:grid-cols-3">

        {/* AI Insight */}
        <div className="rounded-xl border border-outline-variant bg-surface-container p-lg xl:col-span-2">

          <div className="mb-md flex items-center gap-sm">

            <span className="material-symbols-outlined text-secondary">
              auto_awesome
            </span>

            <div>

              <h2 className="text-title-sm font-semibold text-on-surface">
                AI Engineering Insight
              </h2>

              <p className="text-caption text-on-surface-variant">
                Generated from current project signals
              </p>

            </div>

          </div>

          <div className="rounded-lg bg-surface-container-low p-md">

            <p className="text-body-md leading-7 text-on-surface">
              {project.aiInsight ??
                "No AI insights are available for this project yet."}
            </p>

          </div>

        </div>

        {/* Risk Summary */}
        <div className="rounded-xl border border-outline-variant bg-surface-container p-lg">

          <h2 className="text-title-sm font-semibold text-on-surface">
            Health Summary
          </h2>

          <div className="mt-lg space-y-md">

            <div className="flex items-center justify-between">

              <span className="text-body-sm text-on-surface-variant">
                Issue Health
              </span>

              <span className="font-semibold text-on-surface">
                {isHealthLoading
                  ? "..."
                  : `${issueScore}/100`}
              </span>

            </div>

            <div className="flex items-center justify-between">

              <span className="text-body-sm text-on-surface-variant">
                CI/CD Reliability
              </span>

              <span className="font-semibold text-on-surface">
                {isHealthLoading
                  ? "..."
                  : `${cicdScore}/100`}
              </span>

            </div>

            <div className="flex items-center justify-between">

              <span className="text-body-sm text-on-surface-variant">
                Delivery Activity
              </span>

              <span className="font-semibold text-on-surface">
                {isHealthLoading
                  ? "..."
                  : `${deliveryScore}/100`}
              </span>

            </div>

            <div className="flex items-center justify-between">

              <span className="text-body-sm text-on-surface-variant">
                GitHub Activity
              </span>

              <span className="font-semibold text-on-surface">
                {isHealthLoading
                  ? "..."
                  : `${githubScore}/100`}
              </span>

            </div>

            <div className="h-px bg-outline-variant" />

            <div className="flex items-center justify-between">

              <span className="text-body-sm font-medium text-on-surface">
                Overall Status
              </span>

              <span
                className={`rounded-full px-sm py-xs text-caption font-semibold ${healthBadgeClass}`}
              >
                {isHealthLoading
                  ? "LOADING"
                  : healthLabel}
              </span>

            </div>

            <div className="flex items-center justify-between">

              <span className="text-body-sm text-on-surface-variant">
                Health Score
              </span>

              <span className="font-semibold text-on-surface">
                {isHealthLoading
                  ? "..."
                  : `${health?.score ?? 0}/100`}
              </span>

            </div>

          </div>

        </div>

      </section>

      {/* Project Team */}
      <section>

        <div className="rounded-xl border border-outline-variant bg-surface-container p-lg">

          <div className="flex items-center justify-between">

            <div>

              <h2 className="text-title-sm font-semibold text-on-surface">
                Project Team
              </h2>

              <p className="mt-xs text-caption text-on-surface-variant">
                Members currently working on this project
              </p>

            </div>

            <span className="material-symbols-outlined text-secondary">
              group
            </span>

          </div>

          <div className="mt-lg flex flex-wrap gap-sm">

            {project.members.length === 0 ? (
              <p className="text-body-sm text-on-surface-variant">
                No team members assigned yet.
              </p>
            ) : (
              project.members.map((member) => (

                <div
                  key={member.id}
                  className="flex items-center gap-sm rounded-lg bg-surface-container-low px-sm py-sm"
                >

                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-container-highest text-caption font-semibold text-on-surface">
                    {member.name
                      .charAt(0)
                      .toUpperCase()}
                  </div>

                  <div>

                    <span className="block text-body-sm font-medium text-on-surface">
                      {member.name}
                    </span>

                    {member.role && (
                      <span className="block text-caption text-on-surface-variant">
                        {member.role}
                      </span>
                    )}

                  </div>

                </div>

              ))
            )}

          </div>

        </div>

      </section>

      {/* Recent Activity */}
      <section className="rounded-xl border border-outline-variant bg-surface-container p-lg">

        <div className="mb-lg">

          <h2 className="text-title-sm font-semibold text-on-surface">
            Engineering Activity
          </h2>

          <p className="mt-xs text-caption text-on-surface-variant">
            Current signals available to DevPilot
          </p>

        </div>

        <div className="grid grid-cols-1 gap-md sm:grid-cols-2 lg:grid-cols-4">

          <div className="rounded-lg bg-surface-container-low p-md">

            <p className="text-caption text-on-surface-variant">
              Issue Health
            </p>

            <p className="mt-xs text-title-md font-bold text-on-surface">
              {isHealthLoading
                ? "..."
                : `${issueScore}/100`}
            </p>

          </div>

          <div className="rounded-lg bg-surface-container-low p-md">

            <p className="text-caption text-on-surface-variant">
              CI/CD
            </p>

            <p className="mt-xs text-title-md font-bold text-on-surface">
              {isHealthLoading
                ? "..."
                : `${cicdScore}/100`}
            </p>

          </div>

          <div className="rounded-lg bg-surface-container-low p-md">

            <p className="text-caption text-on-surface-variant">
              Delivery
            </p>

            <p className="mt-xs text-title-md font-bold text-on-surface">
              {isHealthLoading
                ? "..."
                : `${deliveryScore}/100`}
            </p>

          </div>

          <div className="rounded-lg bg-surface-container-low p-md">

            <p className="text-caption text-on-surface-variant">
              GitHub
            </p>

            <p className="mt-xs text-title-md font-bold text-on-surface">
              {isHealthLoading
                ? "..."
                : `${githubScore}/100`}
            </p>

          </div>

        </div>

      </section>

    </div>
  );
}

export default ProjectHome;
