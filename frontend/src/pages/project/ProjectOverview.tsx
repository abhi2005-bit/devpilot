import {
  Link,
  NavLink,
  Outlet,
  useParams,
} from "react-router-dom";
import { useEffect, useState } from "react";

import { projectService } from "../../services/projectService";
import { healthService } from "../../services/healthService";
import { errorMessage } from "../../services/apiClient";

import type { Project } from "../../types/project";
import type { EngineeringHealth } from "../../types/health";

function ProjectOverview() {
  const { projectId } = useParams<{
    projectId: string;
  }>();

  const [project, setProject] =
    useState<Project | undefined>();

  const [health, setHealth] =
    useState<EngineeringHealth | undefined>();

  const [projectError, setProjectError] = useState("");
  const [healthError, setHealthError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  const [isLoading, setIsLoading] =
    useState(true);

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
        setProjectError("");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setProject(undefined);
      setProjectError("");

      try {
        const loadedProject =
          await projectService.getById(projectId);

        if (!cancelled) {
          setProject(loadedProject);
        }
      } catch (error) {
        if (!cancelled) {
          setProject(undefined);
          setProjectError(errorMessage(error, "Unable to load this project."));
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
  }, [projectId, reloadKey]);

  /*
   * Load real engineering health
   */
  useEffect(() => {
    let cancelled = false;

    async function loadHealth() {
      if (!projectId) {
        setHealth(undefined);
        setHealthError("");
        setIsHealthLoading(false);
        return;
      }

      setIsHealthLoading(true);
      setHealth(undefined);
      setHealthError("");

      try {
        const loadedHealth =
          await healthService.getProjectHealth(
            projectId,
          );

        if (!cancelled) {
          setHealth(loadedHealth);
        }
      } catch (error) {
        if (!cancelled) {
          setHealth(undefined);
          setHealthError(errorMessage(error, "Unable to load engineering health."));
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
  }, [projectId, reloadKey]);


  /*
   * Loading project
   */
  if (isLoading) {
    return (
      <main className="flex min-h-full items-center justify-center px-margin py-margin">
        <div className="text-center">
          <span className="material-symbols-outlined animate-spin text-5xl text-primary">
            progress_activity
          </span>

          <p className="mt-md text-body-md text-on-surface-variant">
            Loading project...
          </p>
        </div>
      </main>
    );
  }

  /*
   * Project not found
   */
  if (!project && projectError) {
    return (
      <main role="alert" className="flex min-h-full items-center justify-center px-margin py-margin">
        <div className="max-w-xl text-center">
          <h1 className="text-title-lg font-semibold text-on-surface">Project could not be loaded</h1>
          <p className="mt-sm break-words text-body-md text-on-surface-variant">{projectError}</p>
          <button
            type="button"
            onClick={() => setReloadKey((key) => key + 1)}
            className="mt-lg rounded-lg bg-primary px-md py-sm text-body-sm font-bold text-on-primary"
          >
            Retry
          </button>
        </div>
      </main>
    );
  }

  if (!project) {
    return (
      <main className="flex min-h-full items-center justify-center px-margin py-margin">
        <div className="text-center">
          <span className="material-symbols-outlined text-5xl text-on-surface-variant">
            folder_off
          </span>

          <h1 className="mt-md text-title-lg font-semibold text-on-surface">
            Project not found
          </h1>

          <p className="mt-sm text-body-md text-on-surface-variant">
            The project you're looking for doesn't exist.
          </p>

          <Link
            to="/projects"
            className="mt-lg inline-flex items-center gap-sm rounded-lg bg-primary px-md py-sm text-body-sm font-bold text-on-primary transition-colors hover:bg-primary-container"
          >
            <span className="material-symbols-outlined text-body-md">
              arrow_back
            </span>

            Back to Projects
          </Link>
        </div>
      </main>
    );
  }

  /*
   * Engineering health
   *
   * The new health model gives us an overall score
   * and four engineering-health components.
   */
  const healthScore = health?.score;

  const healthStatus =
    health?.status ?? "unknown";

  const healthLabel =
    healthStatus === "excellent"
      ? "EXCELLENT"
      : healthStatus === "healthy"
        ? "HEALTHY"
        : healthStatus === "needs_attention"
          ? "NEEDS ATTENTION"
          : healthStatus === "at_risk"
            ? "AT RISK"
            : "UNKNOWN";

  const healthStatusClass =
    healthStatus === "excellent"
      ? "bg-secondary-container text-on-secondary"
      : healthStatus === "healthy"
        ? "bg-secondary-container text-on-secondary"
        : healthStatus === "needs_attention"
          ? "bg-tertiary-container text-on-tertiary"
          : healthStatus === "at_risk"
            ? "bg-error-container text-on-error"
            : "bg-surface-container-highest text-on-surface-variant";

  /*
   * Navigation tabs
   */
  const tabs = [
    {
      label: "Overview",
      path: `/projects/${project.id}`,
      end: true,
      icon: "dashboard",
    },
    {
      label: "Goals",
      path: `/projects/${project.id}/goals`,
      icon: "target",
    },
    {
      label: "Issues",
      path: `/projects/${project.id}/issues`,
      icon: "bug_report",
    },
    {
      label: "Board",
      path: `/projects/${project.id}/board`,
      icon: "view_kanban",
    },
    {
      label: "Documents",
      path: `/projects/${project.id}/documents`,
      icon: "description",
    },
    {
      label: "Analytics",
      path: `/projects/${project.id}/analytics`,
      icon: "analytics",
    },
    {
      label: "AI",
      path: `/projects/${project.id}/ai`,
      icon: "auto_awesome",
    },
    {
      label: "Members",
      path: `/projects/${project.id}/members`,
      icon: "group",
    },
    {
      label: "Settings",
      path: `/projects/${project.id}/settings`,
      icon: "settings",
    },
  ];

  return (
    <main className="overflow-y-auto">
      {/* Project Header */}

      <section className="border-b border-outline-variant bg-surface-container">
        <div className="px-margin pb-lg pt-lg">
          {/* Back */}

          <Link
            to="/projects"
            className="mb-lg inline-flex items-center gap-xs text-body-sm text-on-surface-variant transition-colors hover:text-primary"
          >
            <span className="material-symbols-outlined text-body-md">
              arrow_back
            </span>

            Projects
          </Link>

          {/* Project information */}

          <div className="flex flex-col gap-lg lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-md">
                <h1 className="text-display-md font-bold text-on-surface">
                  {project.name}
                </h1>

                {/* REAL ENGINEERING HEALTH STATUS */}

                <span
                  className={`rounded-full px-sm py-xs text-caption font-semibold ${healthStatusClass}`}
                >
                  {isHealthLoading
                    ? "LOADING"
                    : healthLabel}
                </span>
              </div>

              <p className="mt-sm max-w-3xl text-body-md text-on-surface-variant">
                {project.description}
              </p>
            </div>

            {/* Project actions */}

            <div className="flex shrink-0 gap-sm">
              <Link
                to="/projects"
                className="flex items-center gap-sm rounded-lg border border-outline-variant bg-surface-container-high px-md py-sm text-body-sm font-medium text-on-surface transition-colors hover:bg-surface-container-highest"
              >
                <span className="material-symbols-outlined text-body-md">
                  edit
                </span>

                Edit
              </Link>

              <Link
                to={`/projects/${project.id}/issues`}
                className="flex items-center gap-sm rounded-lg bg-primary px-md py-sm text-body-sm font-bold text-on-primary transition-colors hover:bg-primary-container"
              >
                <span className="material-symbols-outlined text-body-md">
                  add
                </span>

                Create Issue
              </Link>
            </div>
          </div>

          {/* Engineering Health Metrics */}

          <div className="mt-xl grid grid-cols-1 gap-md sm:grid-cols-3">
            {/* Overall Health */}

            <div className="rounded-xl border border-outline-variant bg-surface-container-low p-md">
              <div className="mb-sm flex items-center justify-between">
                <span className="text-caption text-on-surface-variant">
                  Engineering Health
                </span>

                <span className="text-body-md font-bold text-on-surface">
                  {isHealthLoading
                    ? "..."
                    : health
                      ? `${healthScore!.toFixed(1)}/100`
                      : "—"}
                </span>
              </div>

              <div className="h-2 overflow-hidden rounded-full bg-surface-container-highest">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{
                    width: `${Math.min(
                      Math.max(healthScore ?? 0, 0),
                      100,
                    )}%`,
                  }}
                />
              </div>

              <p className="mt-sm text-caption text-on-surface-variant">
                Overall engineering health score
              </p>
            </div>

            {/* CI/CD Reliability */}

            <div className="rounded-xl border border-outline-variant bg-surface-container-low p-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-caption text-on-surface-variant">
                    CI/CD Reliability
                  </p>

                  <p className="mt-xs text-title-lg font-bold text-on-surface">
                    {isHealthLoading
                      ? "..."
                      : health
                        ? health.cicd_reliability.score.toFixed(1)
                        : "—"}
                  </p>
                </div>

                <span className="material-symbols-outlined text-secondary">
                  build_circle
                </span>
              </div>

              <p className="mt-sm text-caption text-on-surface-variant">
                Reliability component score
              </p>
            </div>

            {/* GitHub Activity */}

            <div className="rounded-xl border border-outline-variant bg-surface-container-low p-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-caption text-on-surface-variant">
                    GitHub Activity
                  </p>

                  <p className="mt-xs text-title-lg font-bold text-on-surface">
                    {isHealthLoading
                      ? "..."
                      : health
                        ? health.github_activity.score.toFixed(1)
                        : "—"}
                  </p>
                </div>

                <span className="material-symbols-outlined text-primary">
                  code
                </span>
              </div>

              <p className="mt-sm text-caption text-on-surface-variant">
                GitHub activity component score
              </p>
            </div>
          </div>
          {healthError && (
            <div role="alert" className="mt-md flex flex-wrap items-center justify-between gap-sm rounded-lg border border-error/30 bg-error-container px-md py-sm text-body-sm text-error">
              <span className="min-w-0 break-words">Engineering health unavailable: {healthError}</span>
              <button
                type="button"
                onClick={() => setReloadKey((key) => key + 1)}
                className="shrink-0 rounded-md border border-error/30 px-sm py-xs font-semibold hover:bg-error/10"
              >
                Retry
              </button>
            </div>
          )}
        </div>

        {/* Navigation Tabs */}

        <div className="overflow-x-auto">
          <nav className="flex min-w-max px-margin">
            {tabs.map((tab) => (
              <NavLink
                key={tab.label}
                to={tab.path}
                end={tab.end}
                className={({ isActive }) =>
                  `flex items-center gap-sm border-b-2 px-md py-md text-body-sm font-medium transition-colors ${
                    isActive
                      ? "border-primary text-primary"
                      : "border-transparent text-on-surface-variant hover:border-outline hover:text-on-surface"
                  }`
                }
              >
                <span className="material-symbols-outlined text-body-md">
                  {tab.icon}
                </span>

                {tab.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </section>

      {/* Main Content */}

      <section className="px-margin py-lg">
{/* Nested Route Content */}

        <Outlet />
      </section>
    </main>
  );
}

export default ProjectOverview;
