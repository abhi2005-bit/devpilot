import { Link, NavLink, Outlet, useParams } from "react-router-dom";
import { projects } from "../../data/projects";

function ProjectOverview() {
  const { projectId } = useParams<{ projectId: string }>();

  const project = projects.find(
    (item) => item.id === projectId,
  );

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

                <span
                  className={`rounded-full px-sm py-xs text-caption font-semibold ${
                    project.risk === "HIGH"
                      ? "bg-error-container text-on-error"
                      : project.risk === "MEDIUM"
                        ? "bg-tertiary-container text-on-tertiary"
                        : "bg-secondary-container text-on-secondary"
                  }`}
                >
                  {project.risk} RISK
                </span>
              </div>

              <p className="mt-sm max-w-3xl text-body-md text-on-surface-variant">
                {project.description}
              </p>
            </div>

            {/* Project actions */}
            <div className="flex shrink-0 gap-sm">
              <button
                type="button"
                className="flex items-center gap-sm rounded-lg border border-outline-variant bg-surface-container-high px-md py-sm text-body-sm font-medium text-on-surface transition-colors hover:bg-surface-container-highest"
              >
                <span className="material-symbols-outlined text-body-md">
                  edit
                </span>

                Edit
              </button>

              <button
                type="button"
                className="flex items-center gap-sm rounded-lg bg-primary px-md py-sm text-body-sm font-bold text-on-primary transition-colors hover:bg-primary-container"
              >
                <span className="material-symbols-outlined text-body-md">
                  add
                </span>

                Create Issue
              </button>
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
                  {project.progress}%
                </span>
              </div>

              <div className="h-2 overflow-hidden rounded-full bg-surface-container-highest">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{
                    width: `${project.progress}%`,
                  }}
                />
              </div>
            </div>

            {/* Issues */}
            <div className="rounded-xl border border-outline-variant bg-surface-container-low p-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-caption text-on-surface-variant">
                    Open Issues
                  </p>

                  <p className="mt-xs text-title-lg font-bold text-on-surface">
                    {project.openIssues}
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

      {/* Nested Route Content */}
      <section className="px-margin py-lg">
        <Outlet />
      </section>
    </main>
  );
}

export default ProjectOverview;