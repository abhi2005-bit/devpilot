import { useParams } from "react-router-dom";
import { projectService } from "../../services/projectService";

function ProjectHome() {
  const { projectId } = useParams<{
    projectId: string;
  }>();

  const project = projectId
    ? projectService.getById(projectId)
    : undefined;

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

                <p className="mt-xs text-title-lg font-bold text-on-surface">
                  {project.risk}
                </p>
              </div>

              <span
                className={`material-symbols-outlined ${
                  project.risk === "HIGH"
                    ? "text-error"
                    : project.risk === "MEDIUM"
                      ? "text-tertiary"
                      : "text-secondary"
                }`}
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
                  {project.progress}%
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
            <div className="flex items-center justify-between">
              <span className="text-body-sm text-on-surface-variant">
                Open Issues
              </span>

              <span className="font-semibold text-on-surface">
                {project.openIssues}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-body-sm text-on-surface-variant">
                Pending PRs
              </span>

              <span className="font-semibold text-on-surface">
                {project.prsPending}
              </span>
            </div>

            <div className="h-px bg-outline-variant" />

            <div className="flex items-center justify-between">
              <span className="text-body-sm font-medium text-on-surface">
                Overall Risk
              </span>

              <span
                className={`rounded-full px-sm py-xs text-caption font-semibold ${
                  project.risk === "HIGH"
                    ? "bg-error-container text-on-error"
                    : project.risk === "MEDIUM"
                      ? "bg-tertiary-container text-on-tertiary"
                      : "bg-secondary-container text-on-secondary"
                }`}
              >
                {project.risk}
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
              {project.progress}%
            </span>
          </div>

          <div className="mt-lg h-3 overflow-hidden rounded-full bg-surface-container-highest">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{
                width: `${project.progress}%`,
              }}
            />
          </div>
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
            {project.members.map((member) => (
              <div
                key={member.id}
                className="flex items-center gap-sm rounded-lg bg-surface-container-low px-sm py-sm"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-container-highest text-caption font-semibold text-on-surface">
                  {member.name.charAt(0).toUpperCase()}
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
            ))}
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