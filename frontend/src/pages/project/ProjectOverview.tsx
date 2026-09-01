import {
  Link,
  NavLink,
  Outlet,
  useParams,
} from "react-router-dom";
import { useEffect, useState } from "react";

import { projectService } from "../../services/projectService";
import { healthService } from "../../services/healthService";
import { githubService } from "../../services/githubService";

import type { Project } from "../../types/project";
import type { ProjectHealth } from "../../types/health";
import type { ProjectGitHub } from "../../types/github";

function ProjectOverview() {
  const { projectId } = useParams<{
    projectId: string;
  }>();

  const [project, setProject] =
    useState<Project | undefined>();

  const [health, setHealth] =
    useState<ProjectHealth | undefined>();

  const [github, setGithub] =
    useState<ProjectGitHub | undefined>();

  const [isLoading, setIsLoading] =
    useState(true);

  const [isHealthLoading, setIsHealthLoading] =
    useState(true);

  const [isGithubLoading, setIsGithubLoading] =
    useState(true);

  const [githubError, setGithubError] =
    useState<string | undefined>();

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
   * Load GitHub data
   */
  useEffect(() => {
    let cancelled = false;

    async function loadGithub() {
      if (!projectId) {
        setGithub(undefined);
        setGithubError(undefined);
        setIsGithubLoading(false);
        return;
      }

      setIsGithubLoading(true);
      setGithubError(undefined);

      try {
        const loadedGithub =
          await githubService.getProjectGitHub(
            projectId,
          );

        if (!cancelled) {
          setGithub(loadedGithub);
        }
      } catch {
        if (!cancelled) {
          setGithub(undefined);
          setGithubError(
            "Unable to load GitHub data.",
          );
        }
      } finally {
        if (!cancelled) {
          setIsGithubLoading(false);
        }
      }
    }

    loadGithub();

    return () => {
      cancelled = true;
    };
  }, [projectId]);

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
   * Calculate progress from real issue data
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
   * Health status
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

                {/* REAL HEALTH STATUS */}

                <span
                  className={`rounded-full px-sm py-xs text-caption font-semibold ${
                    healthStatus === "CRITICAL"
                      ? "bg-error-container text-on-error"
                      : healthStatus === "AT_RISK"
                        ? "bg-tertiary-container text-on-tertiary"
                        : healthStatus === "HEALTHY"
                          ? "bg-secondary-container text-on-secondary"
                          : "bg-surface-container-highest text-on-surface-variant"
                  }`}
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

          {/* Project Metrics */}

          <div className="mt-xl grid grid-cols-1 gap-md sm:grid-cols-3">

            {/* Progress */}

            <div className="rounded-xl border border-outline-variant bg-surface-container-low p-md">

              <div className="mb-sm flex items-center justify-between">

                <span className="text-caption text-on-surface-variant">
                  Progress
                </span>

                <span className="text-body-md font-bold text-on-surface">
                  {isHealthLoading
                    ? "..."
                    : `${progress}%`}
                </span>

              </div>

              <div className="h-2 overflow-hidden rounded-full bg-surface-container-highest">

                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{
                    width: `${progress}%`,
                  }}
                />

              </div>

            </div>

            {/* Open Issues */}

            <div className="rounded-xl border border-outline-variant bg-surface-container-low p-md">

              <div className="flex items-center justify-between">

                <div>

                  <p className="text-caption text-on-surface-variant">
                    Open Issues
                  </p>

                  <p className="mt-xs text-title-lg font-bold text-on-surface">

                    {isHealthLoading
                      ? "..."
                      : health?.issues.open ?? 0}

                  </p>

                </div>

                <span className="material-symbols-outlined text-error">
                  bug_report
                </span>

              </div>

            </div>

            {/* PRs */}

            <div className="rounded-xl border border-outline-variant bg-surface-container-low p-md">

              <div className="flex items-center justify-between">

                <div>

                  <p className="text-caption text-on-surface-variant">
                    PRs Pending
                  </p>

                  <p className="mt-xs text-title-lg font-bold text-on-surface">
                    {project.prsPending}
                  </p>

                </div>

                <span className="material-symbols-outlined text-secondary">
                  merge
                </span>

              </div>

            </div>

          </div>

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

        {/* GitHub Integration */}

        <section className="mb-xl">

          <div className="mb-md flex items-center justify-between">

            <div>
              <h2 className="text-title-lg font-bold text-on-surface">
                GitHub
              </h2>

              <p className="mt-xs text-body-sm text-on-surface-variant">
                Repository activity and development progress
              </p>
            </div>

            {github?.repository.url && (
              <a
                href={github.repository.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-sm rounded-lg border border-outline-variant bg-surface-container-high px-md py-sm text-body-sm font-medium text-on-surface transition-colors hover:bg-surface-container-highest"
              >
                <span className="material-symbols-outlined text-body-md">
                  open_in_new
                </span>

                Open GitHub
              </a>
            )}

          </div>

          {isGithubLoading && (
            <div className="flex items-center justify-center rounded-xl border border-outline-variant bg-surface-container-low p-xl">

              <div className="text-center">

                <span className="material-symbols-outlined animate-spin text-4xl text-primary">
                  progress_activity
                </span>

                <p className="mt-sm text-body-sm text-on-surface-variant">
                  Loading GitHub data...
                </p>

              </div>

            </div>
          )}

          {!isGithubLoading && githubError && (
            <div className="rounded-xl border border-outline-variant bg-surface-container-low p-lg">

              <div className="flex items-start gap-md">

                <span className="material-symbols-outlined text-error">
                  error
                </span>

                <div>

                  <p className="text-body-md font-semibold text-on-surface">
                    GitHub data unavailable
                  </p>

                  <p className="mt-xs text-body-sm text-on-surface-variant">
                    {githubError}
                  </p>

                </div>

              </div>

            </div>
          )}

          {!isGithubLoading && !githubError && github && (

            <div className="space-y-lg">

              {/* Repository */}

              <div className="rounded-xl border border-outline-variant bg-surface-container-low p-lg">

                <div className="flex flex-col gap-lg lg:flex-row lg:items-start lg:justify-between">

                  <div className="min-w-0">

                    <div className="flex items-center gap-sm">

                      <span className="material-symbols-outlined text-on-surface">
                        code
                      </span>

                      <h3 className="text-title-md font-bold text-on-surface">
                        {github.repository.full_name}
                      </h3>

                    </div>

                    <p className="mt-sm max-w-3xl text-body-sm text-on-surface-variant">
                      {github.repository.description ||
                        "No repository description available."}
                    </p>

                  </div>

                  <span className="shrink-0 rounded-full bg-secondary-container px-sm py-xs text-caption font-semibold text-on-secondary">
                    {github.repository.default_branch}
                  </span>

                </div>

                {/* Repository stats */}

                <div className="mt-lg grid grid-cols-1 gap-md sm:grid-cols-3">

                  <div className="rounded-lg bg-surface-container-high p-md">

                    <div className="flex items-center gap-sm">

                      <span className="material-symbols-outlined text-tertiary">
                        star
                      </span>

                      <span className="text-caption text-on-surface-variant">
                        Stars
                      </span>

                    </div>

                    <p className="mt-sm text-title-lg font-bold text-on-surface">
                      {github.repository.stars.toLocaleString()}
                    </p>

                  </div>

                  <div className="rounded-lg bg-surface-container-high p-md">

                    <div className="flex items-center gap-sm">

                      <span className="material-symbols-outlined text-primary">
                        call_split
                      </span>

                      <span className="text-caption text-on-surface-variant">
                        Forks
                      </span>

                    </div>

                    <p className="mt-sm text-title-lg font-bold text-on-surface">
                      {github.repository.forks.toLocaleString()}
                    </p>

                  </div>

                  <div className="rounded-lg bg-surface-container-high p-md">

                    <div className="flex items-center gap-sm">

                      <span className="material-symbols-outlined text-error">
                        bug_report
                      </span>

                      <span className="text-caption text-on-surface-variant">
                        GitHub Issues
                      </span>

                    </div>

                    <p className="mt-sm text-title-lg font-bold text-on-surface">
                      {github.repository.open_issues.toLocaleString()}
                    </p>

                  </div>

                </div>

              </div>

              {/* Recent Activity */}

              <div className="grid grid-cols-1 gap-lg xl:grid-cols-2">

                {/* Commits */}

                <div className="rounded-xl border border-outline-variant bg-surface-container-low p-lg">

                  <div className="mb-lg flex items-center justify-between">

                    <div className="flex items-center gap-sm">

                      <span className="material-symbols-outlined text-primary">
                        commit
                      </span>

                      <h3 className="text-title-md font-bold text-on-surface">
                        Recent Commits
                      </h3>

                    </div>

                    <span className="text-caption text-on-surface-variant">
                      {github.commits.length}
                    </span>

                  </div>

                  {github.commits.length === 0 ? (

                    <p className="text-body-sm text-on-surface-variant">
                      No recent commits found.
                    </p>

                  ) : (

                    <div className="space-y-sm">

                      {github.commits.slice(0, 5).map((commit) => (

                        <a
                          key={commit.sha}
                          href={commit.url}
                          target="_blank"
                          rel="noreferrer"
                          className="block rounded-lg border border-outline-variant bg-surface-container-high p-md transition-colors hover:bg-surface-container-highest"
                        >

                          <p className="line-clamp-2 text-body-sm font-medium text-on-surface">
                            {commit.message.split("\n")[0]}
                          </p>

                          <div className="mt-sm flex items-center justify-between gap-sm">

                            <span className="truncate text-caption text-on-surface-variant">
                              {commit.author || "Unknown author"}
                            </span>

                            <span className="shrink-0 font-mono text-caption text-on-surface-variant">
                              {commit.sha.slice(0, 7)}
                            </span>

                          </div>

                        </a>

                      ))}

                    </div>

                  )}

                </div>

                {/* Pull Requests */}

                <div className="rounded-xl border border-outline-variant bg-surface-container-low p-lg">

                  <div className="mb-lg flex items-center justify-between">

                    <div className="flex items-center gap-sm">

                      <span className="material-symbols-outlined text-secondary">
                        merge
                      </span>

                      <h3 className="text-title-md font-bold text-on-surface">
                        Recent Pull Requests
                      </h3>

                    </div>

                    <span className="text-caption text-on-surface-variant">
                      {github.pull_requests.length}
                    </span>

                  </div>

                  {github.pull_requests.length === 0 ? (

                    <p className="text-body-sm text-on-surface-variant">
                      No recent pull requests found.
                    </p>

                  ) : (

                    <div className="space-y-sm">

                      {github.pull_requests.slice(0, 5).map((pullRequest) => (

                        <a
                          key={pullRequest.number}
                          href={pullRequest.url}
                          target="_blank"
                          rel="noreferrer"
                          className="block rounded-lg border border-outline-variant bg-surface-container-high p-md transition-colors hover:bg-surface-container-highest"
                        >

                          <div className="flex items-start justify-between gap-md">

                            <p className="line-clamp-2 text-body-sm font-medium text-on-surface">
                              #{pullRequest.number}{" "}
                              {pullRequest.title}
                            </p>

                            <span
                              className={`shrink-0 rounded-full px-sm py-xs text-caption font-semibold ${
                                pullRequest.merged
                                  ? "bg-secondary-container text-on-secondary"
                                  : pullRequest.state === "open"
                                    ? "bg-tertiary-container text-on-tertiary"
                                    : "bg-surface-container-highest text-on-surface-variant"
                              }`}
                            >
                              {pullRequest.merged
                                ? "MERGED"
                                : pullRequest.state.toUpperCase()}
                            </span>

                          </div>

                          <div className="mt-sm flex items-center justify-between gap-sm">

                            <span className="truncate text-caption text-on-surface-variant">
                              {pullRequest.author ||
                                "Unknown author"}
                            </span>

                            <span className="shrink-0 text-caption text-on-surface-variant">
                              #{pullRequest.number}
                            </span>

                          </div>

                        </a>

                      ))}

                    </div>

                  )}

                </div>

              </div>

            </div>

          )}

        </section>

        {/* Nested Route Content */}

        <Outlet />

      </section>

    </main>
  );
}

export default ProjectOverview;