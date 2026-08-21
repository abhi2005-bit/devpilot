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

  /*
   * These values represent the current sprint/project signals.
   * They are kept here for now so the overview can be wired to
   * real backend/Git/issue data later.
   */
  const sprint = {
    name: "Sprint 42: Checkout Optimization",
    storyPointsCompleted: 84,
    storyPointsTotal: 120,
    issuesCompleted: 26,
    issuesTotal: 45,
    velocityChange: 12,
    completion: 70,
  };

  const aiRisk = "MEDIUM";
  const aiRiskScore = 65;

  return (
    <div className="w-full space-y-lg">

      {/* ====================================================== */}
      {/* SPRINT SUMMARY + AI INSIGHT */}
      {/* ====================================================== */}

      <section className="grid w-full grid-cols-1 gap-lg xl:grid-cols-12">

        {/* Sprint Summary */}
        <div className="rounded-xl border border-outline-variant bg-surface-container p-lg xl:col-span-8">

          <div className="flex items-start justify-between gap-md">

            <div>
              <p className="text-caption font-semibold uppercase tracking-wide text-primary">
                Current Sprint
              </p>

              <h2 className="mt-xs text-title-lg font-bold text-on-surface">
                {sprint.name}
              </h2>

              <p className="mt-xs text-body-sm text-on-surface-variant">
                Current delivery progress and engineering workload.
              </p>
            </div>

            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-container">
              <span className="material-symbols-outlined text-primary">
                sprint
              </span>
            </div>

          </div>

          {/* Sprint Metrics */}
          <div className="mt-xl grid grid-cols-1 gap-md sm:grid-cols-2 lg:grid-cols-4">

            {/* Story Points */}
            <div className="rounded-lg border border-outline-variant bg-surface-container-low p-md">
              <p className="text-caption text-on-surface-variant">
                Story Points
              </p>

              <p className="mt-xs text-title-lg font-bold text-on-surface">
                {sprint.storyPointsCompleted}
                <span className="text-body-md font-medium text-on-surface-variant">
                  {" "}
                  / {sprint.storyPointsTotal}
                </span>
              </p>

              <p className="mt-xs text-caption text-on-surface-variant">
                Completed
              </p>
            </div>

            {/* Issues */}
            <div className="rounded-lg border border-outline-variant bg-surface-container-low p-md">
              <p className="text-caption text-on-surface-variant">
                Issues Done
              </p>

              <p className="mt-xs text-title-lg font-bold text-on-surface">
                {sprint.issuesCompleted}
                <span className="text-body-md font-medium text-on-surface-variant">
                  {" "}
                  / {sprint.issuesTotal}
                </span>
              </p>

              <p className="mt-xs text-caption text-on-surface-variant">
                Completed
              </p>
            </div>

            {/* Velocity */}
            <div className="rounded-lg border border-outline-variant bg-surface-container-low p-md">
              <p className="text-caption text-on-surface-variant">
                Velocity
              </p>

              <div className="mt-xs flex items-center gap-xs">
                <span className="material-symbols-outlined text-secondary">
                  trending_up
                </span>

                <p className="text-title-lg font-bold text-secondary">
                  +{sprint.velocityChange}%
                </p>
              </div>

              <p className="mt-xs text-caption text-on-surface-variant">
                Compared with previous sprint
              </p>
            </div>

            {/* Completion */}
            <div className="rounded-lg border border-outline-variant bg-surface-container-low p-md">
              <p className="text-caption text-on-surface-variant">
                Sprint Completion
              </p>

              <p className="mt-xs text-title-lg font-bold text-on-surface">
                {sprint.completion}%
              </p>

              <div className="mt-sm h-2 overflow-hidden rounded-full bg-surface-container-highest">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{
                    width: `${sprint.completion}%`,
                  }}
                />
              </div>
            </div>

          </div>

        </div>

        {/* AI Project Insight */}
        <div className="rounded-xl border border-outline-variant bg-surface-container p-lg xl:col-span-4">

          <div className="flex items-start justify-between gap-md">

            <div className="flex items-center gap-sm">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-secondary-container">
                <span className="material-symbols-outlined text-secondary">
                  auto_awesome
                </span>
              </div>

              <div>
                <h2 className="text-title-sm font-semibold text-on-surface">
                  AI Project Insight
                </h2>

                <p className="text-caption text-on-surface-variant">
                  Engineering intelligence
                </p>
              </div>
            </div>

          </div>

          {/* Risk */}
          <div className="mt-lg rounded-lg bg-tertiary-container p-md">

            <div className="flex items-center justify-between gap-md">

              <div>
                <p className="text-caption text-on-tertiary">
                  Current Risk
                </p>

                <p className="mt-xs text-title-md font-bold text-on-tertiary">
                  {aiRisk}
                </p>
              </div>

              <div className="text-right">
                <p className="text-caption text-on-tertiary">
                  Confidence
                </p>

                <p className="mt-xs text-title-md font-bold text-on-tertiary">
                  {aiRiskScore}%
                </p>
              </div>

            </div>

          </div>

          {/* Insight */}
          <div className="mt-md">

            <p className="text-body-sm leading-6 text-on-surface">
              Sprint progress is healthy, but the current issue workload
              indicates that delivery risk should be monitored closely.
              Review outstanding checkout issues and keep high-priority
              work moving through review.
            </p>

          </div>

          {/* Recommendation */}
          <div className="mt-md rounded-lg border border-outline-variant bg-surface-container-low p-md">

            <div className="flex items-start gap-sm">

              <span className="material-symbols-outlined text-primary">
                lightbulb
              </span>

              <div>
                <p className="text-caption font-semibold uppercase tracking-wide text-primary">
                  Recommended Action
                </p>

                <p className="mt-xs text-body-sm leading-6 text-on-surface">
                  Prioritize unresolved checkout work and reduce review
                  bottlenecks before taking on additional sprint scope.
                </p>
              </div>

            </div>

          </div>

        </div>

      </section>

      {/* ====================================================== */}
      {/* RECENT ACTIVITY */}
      {/* ====================================================== */}

      <section className="w-full rounded-xl border border-outline-variant bg-surface-container p-lg">

        <div className="mb-lg flex items-start justify-between gap-md">

          <div>
            <h2 className="text-title-sm font-semibold text-on-surface">
              Recent Activity
            </h2>

            <p className="mt-xs text-caption text-on-surface-variant">
              Latest engineering activity in this project.
            </p>
          </div>

          <span className="material-symbols-outlined text-on-surface-variant">
            history
          </span>

        </div>

        <div className="space-y-md">

          {/* Activity 1 */}
          <div className="flex items-start gap-md rounded-lg border border-outline-variant bg-surface-container-low p-md">

            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-container">
              <span className="material-symbols-outlined text-primary">
                merge
              </span>
            </div>

            <div className="min-w-0">
              <p className="text-body-sm font-medium text-on-surface">
                Pull request merged into the checkout workflow.
              </p>

              <p className="mt-xs text-caption text-on-surface-variant">
                Recent activity
              </p>
            </div>

          </div>

          {/* Activity 2 */}
          <div className="flex items-start gap-md rounded-lg border border-outline-variant bg-surface-container-low p-md">

            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-tertiary-container">
              <span className="material-symbols-outlined text-tertiary">
                bug_report
              </span>
            </div>

            <div className="min-w-0">
              <p className="text-body-sm font-medium text-on-surface">
                A new engineering issue was created for the project.
              </p>

              <p className="mt-xs text-caption text-on-surface-variant">
                Recent activity
              </p>
            </div>

          </div>

          {/* Activity 3 */}
          <div className="flex items-start gap-md rounded-lg border border-outline-variant bg-surface-container-low p-md">

            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary-container">
              <span className="material-symbols-outlined text-secondary">
                rocket_launch
              </span>
            </div>

            <div className="min-w-0">
              <p className="text-body-sm font-medium text-on-surface">
                Project deployment completed successfully.
              </p>

              <p className="mt-xs text-caption text-on-surface-variant">
                Recent activity
              </p>
            </div>

          </div>

        </div>

      </section>

    </div>
  );
}

export default ProjectHome;