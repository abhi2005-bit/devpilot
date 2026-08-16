interface ProjectHealthItem {
  name: string;
  progress: number;
  risk: "LOW RISK" | "MED RISK" | "HIGH RISK";
}

const projects: ProjectHealthItem[] = [
  {
    name: "Core API v2",
    progress: 85,
    risk: "LOW RISK",
  },
  {
    name: "Auth Migration",
    progress: 42,
    risk: "HIGH RISK",
  },
  {
    name: "Payment Gateway",
    progress: 68,
    risk: "MED RISK",
  },
];

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
  return (
    <section className="rounded-lg border border-outline-variant bg-surface-container p-md">
      <div className="mb-md flex items-center justify-between border-b border-[#242830] pb-sm">
        <h2 className="font-title-sm text-title-sm text-on-surface">
          Project Health
        </h2>

        <button
          type="button"
          className="font-body-sm text-body-sm text-primary hover:underline"
        >
          View All
        </button>
      </div>

      <div className="space-y-md">
        {projects.map((project) => {
          const styles = riskStyles[project.risk];

          return (
            <div
              key={project.name}
              className="flex items-center justify-between"
            >
              {/* Project name */}
              <div className="flex items-center gap-sm">
                <div className={`h-2 w-2 rounded-full ${styles.dot}`} />

                <span className="font-body-md text-body-md text-on-surface">
                  {project.name}
                </span>
              </div>

              {/* Progress */}
              <div className="flex w-1/2 items-center gap-md">
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-[#242830]">
                  <div
                    className={`h-full ${styles.progress}`}
                    style={{ width: `${project.progress}%` }}
                  />
                </div>

                <span className="w-12 text-right font-code-label text-code-label text-on-surface-variant">
                  {project.progress}%
                </span>

                <span
                  className={`rounded-DEFAULT px-xs py-[2px] font-code-label text-code-label ${styles.badge} ${styles.text}`}
                >
                  {project.risk}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default ProjectHealth;