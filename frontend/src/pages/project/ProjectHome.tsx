import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import { projectService } from "../../services/projectService";
import { healthService } from "../../services/healthService";

import type { Project } from "../../types/project";
import type { ProjectHealth } from "../../types/health";

function ProjectHome() {
  const { projectId } = useParams<{
    projectId: string;
  }>();

  const [project, setProject] =
    useState<Project | undefined>();

  const [health, setHealth] =
    useState<ProjectHealth | undefined>();

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
   * Load real project health
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
   * Calculate real progress
   */
  const progress =
    health && health.issues.total > 0
      ? Math.round(
          (health.issues.done /
            health.issues.total) *
            100,
        )
      : 0;

  /*
   * Real health status
   */
  const healthStatus =
    health?.health ?? "UNKNOWN";

  const healthLabel =
    healthStatus === "HEALTHY"
      ? "HEALTHY"
      : healthStatus === "AT_RISK"
        ? "AT RISK"
        : healthStatus === "CRITICAL"
          ? "CRITICAL"
          : "UNKNOWN";

  /*
   * Health styling
   */
  const healthTextColor =
    healthStatus === "CRITICAL"
      ? "text-error"
      : healthStatus === "AT_RISK"
        ? "text-tertiary"
        : healthStatus === "HEALTHY"
          ? "text-secondary"
          : "text-on-surface-variant";

  const healthBadgeClass =
    healthStatus === "CRITICAL"
      ? "bg-error-container text-on-error"
      : healthStatus === "AT_RISK"
        ? "bg-tertiary-container text-on-tertiary"
        : healthStatus === "HEALTHY"
          ? "bg-secondary-container text-on-secondary"
          : "bg-surface-container-highest text-on-surface-variant";

  return (
    <div className="space-y-lg">

      {/* Project Health */}

      <section>

        <div className="mb-md">

          <h2 className="text-title-lg font-bold text-on-surface">
            Project Health
          </h2>

          <p className="mt-xs text-body-sm text-on-surface-variant">
            Current engineering health and project signals.
          </p>

        </div>

        <div className="grid grid-cols-1 gap-md md:grid-cols-3">

          {/* Risk */}

          <div className="rounded-xl border border-outline-variant bg-surface-container p-lg">

            <div className="flex items-center justify-between">

              <div>

                <p className="text-caption text-on-surface-variant">
                  Risk Level
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

          {/* Progress */}

          <div className="rounded-xl border border-outline-variant bg-surface-container p-lg">

            <div className="flex items-center justify-between">

              <div>

                <p className="text-caption text-on-surface-variant">
                  Completion
                </p>

                <p className="mt-xs text-title-lg font-bold text-on-surface">
                  {isHealthLoading
                    ? "..."
                    : `${progress}%`}
                </p>

              </div>

              <span className="material-symbols-outlined text-primary">
                trending_up
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
            Risk Summary
          </h2>

          <div className="mt-lg space-y-md">

            {/* Open Issues */}

            <div className="flex items-center justify-between">

              <span className="text-body-sm text-on-surface-variant">
                Open Issues
              </span>

              <span className="font-semibold text-on-surface">
                {isHealthLoading
                  ? "..."
                  : health?.issues.open ?? 0}
              </span>

            </div>

            {/* Critical Issues */}

            <div className="flex items-center justify-between">

              <span className="text-body-sm text-on-surface-variant">
                Critical Issues
              </span>

              <span className="font-semibold text-error">
                {isHealthLoading
                  ? "..."
                  : health?.issues.critical ?? 0}
              </span>

            </div>

            {/* High Priority */}

            <div className="flex items-center justify-between">

              <span className="text-body-sm text-on-surface-variant">
                High Priority
              </span>

              <span className="font-semibold text-tertiary">
                {isHealthLoading
                  ? "..."
                  : health?.issues.high_priority ?? 0}
              </span>

            </div>

            {/* Unassigned */}

            <div className="flex items-center justify-between">

              <span className="text-body-sm text-on-surface-variant">
                Unassigned
              </span>

              <span className="font-semibold text-on-surface">
                {isHealthLoading
                  ? "..."
                  : health?.issues.unassigned ?? 0}
              </span>

            </div>

            <div className="h-px bg-outline-variant" />

            {/* Overall Risk */}

            <div className="flex items-center justify-between">

              <span className="text-body-sm font-medium text-on-surface">
                Overall Risk
              </span>

              <span
                className={`rounded-full px-sm py-xs text-caption font-semibold ${healthBadgeClass}`}
              >
                {isHealthLoading
                  ? "LOADING"
                  : healthLabel}
              </span>

            </div>

            {/* Health Score */}

            <div className="flex items-center justify-between">

              <span className="text-body-sm text-on-surface-variant">
                Health Score
              </span>

              <span className="font-semibold text-on-surface">
                {isHealthLoading
                  ? "..."
                  : `${health?.health_score ?? 0}/100`}
              </span>

            </div>

          </div>

        </div>

      </section>

      {/* Progress + Team */}

      <section className="grid grid-cols-1 gap-lg lg:grid-cols-2">

        {/* Development Progress */}

        <div className="rounded-xl border border-outline-variant bg-surface-container p-lg">

          <div className="flex items-center justify-between">

            <div>

              <h2 className="text-title-sm font-semibold text-on-surface">
                Development Progress
              </h2>

              <p className="mt-xs text-caption text-on-surface-variant">
                Overall project completion
              </p>

            </div>

            <span className="text-title-sm font-bold text-primary">
              {isHealthLoading
                ? "..."
                : `${progress}%`}
            </span>

          </div>

          <div className="mt-lg h-3 overflow-hidden rounded-full bg-surface-container-highest">

            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{
                width: `${progress}%`,
              }}
            />

          </div>

          {!isHealthLoading && health && (
            <div className="mt-md flex justify-between text-caption text-on-surface-variant">
              <span>
                {health.issues.done} completed
              </span>

              <span>
                {health.issues.total} total
              </span>
            </div>
          )}

        </div>

        {/* Project Team */}

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
            Recent Activity
          </h2>

          <p className="mt-xs text-caption text-on-surface-variant">
            Latest engineering activity in this project
          </p>

        </div>

        <div className="space-y-md">

          <div className="flex items-start gap-md">

            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-container">
              <span className="material-symbols-outlined text-primary">
                commit
              </span>
            </div>

            <div>

              <p className="text-body-sm text-on-surface">
                New commits were pushed to the project.
              </p>

              <p className="mt-xs text-caption text-on-surface-variant">
                Recently
              </p>

            </div>

          </div>

          <div className="flex items-start gap-md">

            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary-container">
              <span className="material-symbols-outlined text-secondary">
                merge
              </span>
            </div>

            <div>

              <p className="text-body-sm text-on-surface">
                A pull request is waiting for review.
              </p>

              <p className="mt-xs text-caption text-on-surface-variant">
                Recently
              </p>

            </div>

          </div>

          <div className="flex items-start gap-md">

            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-tertiary-container">
              <span className="material-symbols-outlined text-tertiary">
                bug_report
              </span>
            </div>

            <div>

              <p className="text-body-sm text-on-surface">
                Engineering issues are being tracked for this project.
              </p>

              <p className="mt-xs text-caption text-on-surface-variant">
                Recently
              </p>

            </div>

          </div>

        </div>

      </section>

    </div>
  );
}

export default ProjectHome;