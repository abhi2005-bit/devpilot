import { useNavigate } from "react-router-dom";

import type { EngineeringSignal } from "../../services/intelligenceService";

interface EngineeringActionCenterProps {
  projectId: string;
  signals: EngineeringSignal[];
}

function getAction(projectId: string, signal: EngineeringSignal) {
  switch (signal.category) {
    case "issues":
      return {
        label: "View Issues",
        icon: "assignment",
        path: `/projects/${projectId}/issues`,
      };

    case "delivery":
      return {
        label: "Open Issues Board",
        icon: "view_kanban",
        path: `/projects/${projectId}/issues`,
      };

    case "cicd":
      return {
        label: "View Analytics",
        icon: "analytics",
        path: `/projects/${projectId}/analytics`,
      };

    case "github":
    default:
      return {
        label: "Review Project",
        icon: "open_in_new",
        path: `/projects/${projectId}`,
      };
  }
}

function EngineeringActionCenter({
  projectId,
  signals,
}: EngineeringActionCenterProps) {
  const navigate = useNavigate();

  const actionableSignals = signals.filter(
    (signal) =>
      signal.severity === "risk" ||
      signal.severity === "warning",
  );

  const prioritizedSignals = [
    ...actionableSignals.filter(
      (signal) => signal.severity === "risk",
    ),
    ...actionableSignals.filter(
      (signal) => signal.severity === "warning",
    ),
  ].slice(0, 3);

  if (prioritizedSignals.length === 0) {
    return (
      <section className="rounded-xl border border-secondary/30 bg-surface-container p-lg">
        <div className="flex items-start gap-md">
          <span className="material-symbols-outlined text-secondary">
            task_alt
          </span>

          <div>
            <h3 className="text-title-sm font-semibold text-on-surface">
              Action Center
            </h3>

            <p className="mt-xs text-body-sm text-on-surface-variant">
              No urgent engineering actions are currently identified.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-outline-variant bg-surface-container p-lg">
      <div className="flex items-start justify-between gap-md">
        <div className="flex items-start gap-sm">
          <span className="material-symbols-outlined text-primary">
            bolt
          </span>

          <div>
            <h3 className="text-title-sm font-semibold text-on-surface">
              Action Center
            </h3>

            <p className="mt-xs text-caption text-on-surface-variant">
              Highest-priority engineering actions based on current
              project signals.
            </p>
          </div>
        </div>

        <span className="rounded-full bg-surface-container-high px-sm py-xs text-caption font-medium text-on-surface-variant">
          {prioritizedSignals.length} actions
        </span>
      </div>

      <div className="mt-lg space-y-md">
        {prioritizedSignals.map((signal) => {
          const action = getAction(projectId, signal);
          const isRisk = signal.severity === "risk";

          return (
            <div
              key={`${signal.category}-${signal.title}`}
              className={`rounded-lg border p-md ${
                isRisk
                  ? "border-error/30 bg-error-container/10"
                  : "border-tertiary/30 bg-tertiary-container/10"
              }`}
            >
              <div className="flex flex-col gap-md lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-sm">
                    <span
                      className={`material-symbols-outlined ${
                        isRisk
                          ? "text-error"
                          : "text-tertiary"
                      }`}
                    >
                      {isRisk ? "priority_high" : "warning"}
                    </span>

                    <h4 className="text-body-md font-semibold text-on-surface">
                      {signal.title}
                    </h4>

                    <span className="rounded-full bg-surface-container px-sm py-xs text-caption capitalize text-on-surface-variant">
                      {signal.category}
                    </span>
                  </div>

                  <p className="mt-sm text-body-sm leading-6 text-on-surface-variant">
                    {signal.description}
                  </p>

                  <div className="mt-sm">
                    <p className="text-caption font-semibold text-on-surface">
                      Next step
                    </p>

                    <p className="mt-xs text-caption leading-5 text-on-surface-variant">
                      {signal.recommendation}
                    </p>
                  </div>

                  <p className="mt-sm text-caption text-on-surface-variant">
                    Current value:{" "}
                    <span className="font-medium text-on-surface">
                      {signal.value}
                    </span>
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => navigate(action.path)}
                  className="flex shrink-0 items-center justify-center gap-xs rounded-lg bg-primary px-md py-sm text-caption font-semibold text-on-primary transition-opacity hover:opacity-90"
                >
                  <span className="material-symbols-outlined text-base">
                    {action.icon}
                  </span>

                  {action.label}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default EngineeringActionCenter;
