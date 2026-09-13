import { useEffect, useState } from "react";

import { issueService } from "../../services/issueService";
import type {
  Issue,
  IssuePriority,
} from "../../types/issue";

type WorkPriority = "P0" | "P1" | "P2";

function getWorkPriority(
  priority: IssuePriority,
): WorkPriority {
  if (priority === "CRITICAL") {
    return "P0";
  }

  if (priority === "HIGH") {
    return "P1";
  }

  return "P2";
}

const priorityStyles: Record<
  WorkPriority,
  string
> = {
  P0: "text-error bg-[#93000a] bg-opacity-20",
  P1: "text-tertiary bg-[#ca8100] bg-opacity-20",
  P2: "text-on-surface-variant bg-[#242830]",
};

function MyWork() {
  const [workItems, setWorkItems] =
    useState<Issue[]>([]);

  const [isLoading, setIsLoading] =
    useState(true);

  const [error, setError] =
    useState<string | undefined>();

  useEffect(() => {
    let cancelled = false;

    async function loadMyWork() {
      setIsLoading(true);
      setError(undefined);

      try {
        const issues =
          await issueService.getAll();

        const assignedOpenIssues =
          issues.filter(
            (issue) =>
              issue.assignee !== undefined &&
              issue.status !== "DONE",
          );

        if (!cancelled) {
          setWorkItems(
            assignedOpenIssues.slice(0, 5),
          );
        }
      } catch {
        if (!cancelled) {
          setWorkItems([]);
          setError(
            "Unable to load your work.",
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    loadMyWork();

    return () => {
      cancelled = true;
    };
  }, []);

  const openWorkCount =
    workItems.length;

  return (
    <section className="flex-1 rounded-lg border border-outline-variant bg-surface-container p-md">
      <div className="mb-md flex items-center justify-between border-b border-[#242830] pb-sm">
        <h2 className="font-title-sm text-title-sm text-on-surface">
          My Work
        </h2>

        <span className="rounded-full bg-[#242830] px-sm py-xs font-caption text-caption text-on-surface-variant">
          {isLoading
            ? "..."
            : `${openWorkCount} Open`}
        </span>
      </div>

      {error && (
        <div className="rounded-DEFAULT border border-outline-variant bg-surface-container-highest p-sm">
          <p className="font-body-sm text-body-sm text-error">
            {error}
          </p>
        </div>
      )}

      {!error && isLoading && (
        <div className="py-md">
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            Loading your work...
          </p>
        </div>
      )}

      {!error &&
        !isLoading &&
        workItems.length === 0 && (
          <div className="py-md">
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              No assigned open issues.
            </p>
          </div>
        )}

      {!error &&
        !isLoading &&
        workItems.length > 0 && (
          <div className="space-y-sm">
            {workItems.map((item) => {
              const priority =
                getWorkPriority(
                  item.priority,
                );

              return (
                <button
                  key={item.id}
                  type="button"
                  className="block w-full rounded-DEFAULT border border-outline-variant bg-surface-container-highest p-sm text-left transition-colors hover:border-primary"
                >
                  <div className="mb-xs flex items-start justify-between">
                    <span className="font-code-label text-code-label text-primary">
                      ISSUE-{item.id}
                    </span>

                    <span
                      className={`rounded-DEFAULT px-xs font-caption text-caption ${
                        priorityStyles[
                          priority
                        ]
                      }`}
                    >
                      {priority}
                    </span>
                  </div>

                  <p className="font-body-sm text-body-sm text-on-surface">
                    {item.title}
                  </p>
                </button>
              );
            })}
          </div>
        )}
    </section>
  );
}

export default MyWork;
