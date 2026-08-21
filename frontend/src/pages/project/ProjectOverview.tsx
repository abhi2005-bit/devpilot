import { Link, NavLink, Outlet, useParams } from "react-router-dom";
import { projectService } from "../../services/projectService";

function ProjectOverview() {
  const { projectId } = useParams<{
    projectId: string;
  }>();

  const project = projectId
    ? projectService.getById(projectId)
    : undefined;

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
      label: "Board",
      path: `/projects/${project.id}/board`,
      icon: "view_kanban",
      disabled: true,
    },
    {
      label: "Issues",
      path: `/projects/${project.id}/issues`,
      icon: "bug_report",
    },
    {
      label: "Documents",
      path: `/projects/${project.id}/documents`,
      icon: "description",
      disabled: true,
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
      label: "Activity",
      path: `/projects/${project.id}/activity`,
      icon: "history",
      disabled: true,
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
      disabled: true,
    },
  ];

  const riskStyles =
    project.risk === "HIGH"
      ? "bg-error-container text-error"
      : project.risk === "MEDIUM"
        ? "bg-tertiary-container text-tertiary"
        : "bg-secondary-container text-secondary";

  return (
    <main className="w-full overflow-y-auto">

      {/* ====================================================== */}
      {/* PROJECT HEADER */}
      {/* ====================================================== */}

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

          {/* Main Header */}
          <div className="flex flex-col gap-lg xl:flex-row xl:items-start xl:justify-between">

            {/* Project Identity */}
            <div className="min-w-0">

              <div className="flex flex-wrap items-center gap-sm">

                {/* Project Icon */}
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-container">
                  <span className="material-symbols-outlined text-2xl text-primary">
                    folder_open
                  </span>
                </div>

                <div className="min-w-0">

                  {/* Project ID */}
                  <p className="text-caption font-medium uppercase tracking-wide text-on-surface-variant">
                    Project / {project.id}
                  </p>

                  {/* Project Name */}
                  <h1 className="mt-xs break-words text-display-md font-bold text-on-surface">
                    {project.name}
                  </h1>

                </div>

                {/* Health */}
                <span className="inline-flex items-center gap-xs rounded-full bg-secondary-container px-sm py-xs text-caption font-semibold text-secondary">
                  <span className="h-2 w-2 rounded-full bg-secondary" />
                  HEALTHY
                </span>

                {/* Risk */}
                <span
                  className={`inline-flex items-center gap-xs rounded-full px-sm py-xs text-caption font-semibold ${riskStyles}`}
                >
                  <span className="material-symbols-outlined text-[15px]">
                    warning
                  </span>

                  {project.risk} RISK
                </span>

              </div>

              {/* Description */}
              <p className="mt-md max-w-4xl text-body-md leading-7 text-on-surface-variant">
                {project.description}
              </p>

            </div>

            {/* Actions */}
            <div className="flex shrink-0 items-center gap-sm">

              <button
                type="button"
                className="flex h-10 w-10 items-center justify-center rounded-lg border border-outline-variant bg-surface-container-high text-on-surface-variant transition-colors hover:bg-surface-container-highest hover:text-on-surface"
                aria-label="More project options"
              >
                <span className="material-symbols-outlined">
                  more_vert
                </span>
              </button>

              <Link
                to="/projects"
                className="flex items-center gap-sm rounded-lg border border-outline-variant bg-surface-container-high px-md py-sm text-body-sm font-medium text-on-surface transition-colors hover:bg-surface-container-highest"
              >
                <span className="material-symbols-outlined text-body-md">
                  edit
                </span>

                Edit Details
              </Link>

            </div>

          </div>

          {/* ================================================== */}
          {/* PROJECT SIGNALS */}
          {/* ================================================== */}

          <div className="mt-xl grid grid-cols-2 gap-md md:grid-cols-4">

            {/* Progress */}
            <div className="rounded-xl border border-outline-variant bg-surface-container-low p-md">

              <div className="flex items-center justify-between gap-sm">

                <p className="text-caption text-on-surface-variant">
                  Progress
                </p>

                <span className="material-symbols-outlined text-primary">
                  trending_up
                </span>

              </div>

              <p className="mt-sm text-title-lg font-bold text-on-surface">
                {project.progress}%
              </p>

              <div className="mt-sm h-2 overflow-hidden rounded-full bg-surface-container-highest">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{
                    width: `${project.progress}%`,
                  }}
                />
              </div>

            </div>

            {/* Open Issues */}
            <div className="rounded-xl border border-outline-variant bg-surface-container-low p-md">

              <div className="flex items-center justify-between gap-sm">

                <p className="text-caption text-on-surface-variant">
                  Open Issues
                </p>

                <span className="material-symbols-outlined text-error">
                  bug_report
                </span>

              </div>

              <p className="mt-sm text-title-lg font-bold text-on-surface">
                {project.openIssues}
              </p>

              <p className="mt-xs text-caption text-on-surface-variant">
                Requires attention
              </p>

            </div>

            {/* Pending PRs */}
            <div className="rounded-xl border border-outline-variant bg-surface-container-low p-md">

              <div className="flex items-center justify-between gap-sm">

                <p className="text-caption text-on-surface-variant">
                  PRs Pending
                </p>

                <span className="material-symbols-outlined text-secondary">
                  merge
                </span>

              </div>

              <p className="mt-sm text-title-lg font-bold text-on-surface">
                {project.prsPending}
              </p>

              <p className="mt-xs text-caption text-on-surface-variant">
                Awaiting review
              </p>

            </div>

            {/* Team */}
            <div className="rounded-xl border border-outline-variant bg-surface-container-low p-md">

              <div className="flex items-center justify-between gap-sm">

                <p className="text-caption text-on-surface-variant">
                  Team Members
                </p>

                <span className="material-symbols-outlined text-secondary">
                  group
                </span>

              </div>

              <p className="mt-sm text-title-lg font-bold text-on-surface">
                {project.members.length}
              </p>

              <p className="mt-xs text-caption text-on-surface-variant">
                Active contributors
              </p>

            </div>

          </div>

        </div>

        {/* ==================================================== */}
        {/* PROJECT NAVIGATION */}
        {/* ==================================================== */}

        <div className="overflow-x-auto border-t border-outline-variant">

          <nav className="flex min-w-max px-margin">

            {tabs.map((tab) => {

              if (tab.disabled) {
                return (
                  <span
                    key={tab.label}
                    className="flex cursor-not-allowed items-center gap-sm border-b-2 border-transparent px-md py-md text-body-sm font-medium text-on-surface-variant/50"
                    title={`${tab.label} is coming soon`}
                  >
                    <span className="material-symbols-outlined text-body-md">
                      {tab.icon}
                    </span>

                    {tab.label}
                  </span>
                );
              }

              return (
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
              );
            })}

          </nav>

        </div>

      </section>

      {/* ====================================================== */}
      {/* NESTED PAGE CONTENT */}
      {/* ====================================================== */}

      <section className="w-full px-margin py-lg">
        <Outlet />
      </section>

    </main>
  );
}

export default ProjectOverview;