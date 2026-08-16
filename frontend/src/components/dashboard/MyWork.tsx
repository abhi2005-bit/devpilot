interface WorkItem {
  id: string;
  title: string;
  priority: "P0" | "P1" | "P2";
}

const workItems: WorkItem[] = [
  {
    id: "DEV-4092",
    title: "Fix JWT token expiration bug",
    priority: "P0",
  },
  {
    id: "DEV-4105",
    title: "Update Redis cache configuration",
    priority: "P1",
  },
  {
    id: "DEV-4112",
    title: "Refactor user settings endpoint",
    priority: "P2",
  },
];

const priorityStyles = {
  P0: "text-error bg-[#93000a] bg-opacity-20",
  P1: "text-tertiary bg-[#ca8100] bg-opacity-20",
  P2: "text-on-surface-variant bg-[#242830]",
};

function MyWork() {
  return (
    <section className="flex-1 rounded-lg border border-outline-variant bg-surface-container p-md">
      <div className="mb-md flex items-center justify-between border-b border-[#242830] pb-sm">
        <h2 className="font-title-sm text-title-sm text-on-surface">
          My Work
        </h2>

        <span className="rounded-full bg-[#242830] px-sm py-xs font-caption text-caption text-on-surface-variant">
          3 Due
        </span>
      </div>

      <div className="space-y-sm">
        {workItems.map((item) => (
          <button
            key={item.id}
            type="button"
            className="block w-full rounded-DEFAULT border border-outline-variant bg-surface-container-highest p-sm text-left transition-colors hover:border-primary"
          >
            <div className="mb-xs flex items-start justify-between">
              <span className="font-code-label text-code-label text-primary">
                {item.id}
              </span>

              <span
                className={`rounded-DEFAULT px-xs font-caption text-caption ${
                  priorityStyles[item.priority]
                }`}
              >
                {item.priority}
              </span>
            </div>

            <p className="font-body-sm text-body-sm text-on-surface">
              {item.title}
            </p>
          </button>
        ))}
      </div>
    </section>
  );
}

export default MyWork;