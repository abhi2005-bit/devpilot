import { Link } from "react-router-dom";
import { useEffect, useState } from "react";

import { projectService } from "../../services/projectService";
import type { Project } from "../../types/project";
import type {
  EngineeringHealth,
  EngineeringHealthStatus,
} from "../../types/health";

interface ProjectHealthItem {
  project: Project;
  health: EngineeringHealth;
}

type RiskLabel =
  | "LOW RISK"
  | "MED RISK"
  | "HIGH RISK";

function getRiskLabel(
  status: EngineeringHealthStatus,
): RiskLabel {
  switch (status) {
    case "excellent":
      return "LOW RISK";

    case "healthy":
      return "LOW RISK";

    case "needs_attention":
      return "MED RISK";

    case "at_risk":
      return "HIGH RISK";
  }
}

const riskStyles = {
  "LOW RISK": {
    dot: "bg-secondary",
    progress: "bg-secondary",
    text: "text-secondary",
    badge: "bg-[#00311f]",
  },

  "MED RISK": {
    dot: "bg-tertiary",
    progress: "bg-tertiary",
    text: "text-tertiary",
    badge: "bg-[#ca8100] bg-opacity-20",
  },

  "HIGH RISK": {
    dot: "bg-error",
    progress: "bg-error",
    text: "text-error",
    badge: "bg-[#93000a]",
  },
};

function ProjectHealth() {
  const [projects, setProjects] =
    useState<ProjectHealthItem[]>([]);

  const [isLoading, setIsLoading] =
    useState(true);

  const [error, setError] =
    useState<string | undefined>();

  useEffect(() => {
    let cancelled = false;

    async function loadProjectHealth() {
      setIsLoading(true);
      setError(undefined);

      try {
        const loadedProjects =
          await projectService.getAll();

        const healthResults =
          await Promise.all(
            loadedProjects.map(
              async (project) => {
                try {
                  const health =
                    await projectService.getHealth(
                      String(project.id),
                    );

                  return {
                    project,
                    health,
                  };
                } catch {
                  return undefined;
                }
              },
            ),
          );

        if (!cancelled) {
          setProjects(
            healthResults.filter(
              (
                item,
              ): item is ProjectHealthItem =>
                item !== undefined,
            ),
          );
        }
      } catch {
        if (!cancelled) {
          setProjects([]);
          setError(
            "Unable to load project health.",
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    loadProjectHealth();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="rounded-lg border border-outline-variant bg-surface-container p-md">
      <div className="mb-md flex items-center justify-between border-b border-[#242830] pb-sm">
        <h2 className="font-title-sm text-title-sm text-on-surface">
          Project Health
        </h2>

        <Link
          to="/projects"
          className="font-body-sm text-body-sm text-primary hover:underline"
        >
          View All
        </Link>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-lg">
          <span className="material-symbols-outlined animate-spin text-2xl text-primary">
            progress_activity
          </span>

          <span className="ml-sm text-body-sm text-on-surface-variant">
            Loading project health...
          </span>
        </div>
      )}

      {!isLoading && error && (
        <div className="rounded-lg border border-outline-variant bg-surface-container-low p-md">
          <p className="text-body-sm text-error">
            {error}
          </p>
        </div>
      )}

      {!isLoading &&
        !error &&
        projects.length === 0 && (
          <div className="py-lg">
            <p className="text-body-sm text-on-surface-variant">
              No project health data is available yet.
            </p>
          </div>
        )}

      {!isLoading &&
        !error &&
        projects.length > 0 && (
          <div className="space-y-md">
            {projects.slice(0, 5).map(
              ({ project, health }) => {
                const risk =
                  getRiskLabel(health.status);

                const styles =
                  riskStyles[risk];

                const score = Math.round(
                  health.score,
                );

                return (
                  <Link
                    key={project.id}
                    to={`/projects/${project.id}`}
                    className="flex items-center justify-between rounded-lg px-xs py-xs transition-colors hover:bg-surface-container-high"
                  >
                    {/* Project name */}

                    <div className="flex min-w-0 items-center gap-sm">
                      <div
                        className={`h-2 w-2 shrink-0 rounded-full ${styles.dot}`}
                      />

                      <span className="truncate font-body-md text-body-md text-on-surface">
                        {project.name}
                      </span>
                    </div>

                    {/* Health score */}

                    <div className="flex w-1/2 items-center gap-md">
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-[#242830]">
                        <div
                          className={`h-full ${styles.progress} transition-all`}
                          style={{
                            width: `${score}%`,
                          }}
                        />
                      </div>

                      <span className="w-12 text-right font-code-label text-code-label text-on-surface-variant">
                        {score}%
                      </span>

                      <span
                        className={`rounded-DEFAULT px-xs py-[2px] font-code-label text-code-label ${styles.badge} ${styles.text}`}
                      >
                        {risk}
                      </span>
                    </div>
                  </Link>
                );
              },
            )}
          </div>
        )}
    </section>
  );
}

export default ProjectHealth;