import {
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  useNavigate,
  useParams,
} from "react-router-dom";
import Modal from "../../../components/common/Modal";
import CreateIssueForm from "../../../components/issues/CreateIssueForm";
import { issueService } from "../../../services/issueService";
import type {
  Issue,
  IssuePriority,
  IssueStatus,
} from "../../../types/issue";

const statusLabels: Record<IssueStatus, string> = {
  TODO: "To Do",
  IN_PROGRESS: "In Progress",
  IN_REVIEW: "In Review",
  DONE: "Done",
};

const statusIcons: Record<IssueStatus, string> = {
  TODO: "radio_button_unchecked",
  IN_PROGRESS: "pending",
  IN_REVIEW: "rate_review",
  DONE: "check_circle",
};

const priorityLabels: Record<IssuePriority, string> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
  CRITICAL: "Critical",
};

const statuses: IssueStatus[] = [
  "TODO",
  "IN_PROGRESS",
  "IN_REVIEW",
  "DONE",
];

function getStatusClass(status: IssueStatus) {
  switch (status) {
    case "IN_PROGRESS":
      return "bg-primary-container text-primary";

    case "IN_REVIEW":
      return "bg-tertiary-container text-tertiary";

    case "DONE":
      return "bg-secondary-container text-secondary";

    case "TODO":
    default:
      return "bg-surface-container-high text-on-surface";
  }
}

function getPriorityClass(priority: IssuePriority) {
  switch (priority) {
    case "CRITICAL":
    case "HIGH":
      return "bg-error-container text-error";

    case "MEDIUM":
      return "bg-tertiary-container text-tertiary";

    case "LOW":
      return "bg-secondary-container text-secondary";

    default:
      return "bg-surface-container-high text-on-surface";
  }
}

function Issues() {
  const { projectId } = useParams<{
    projectId: string;
  }>();

  const navigate = useNavigate();

  const [projectIssues, setProjectIssues] =
    useState<Issue[]>([]);

  const [isLoading, setIsLoading] = useState(true);

  const [error, setError] = useState("");

  const [search, setSearch] = useState("");

  const [statusFilter, setStatusFilter] =
    useState<IssueStatus | "ALL">("ALL");

  const [priorityFilter, setPriorityFilter] =
    useState<IssuePriority | "ALL">("ALL");

  const [isCreateModalOpen, setIsCreateModalOpen] =
    useState(false);

  const [viewMode, setViewMode] =
    useState<"LIST" | "BOARD">("BOARD");

  const [updatingIssueId, setUpdatingIssueId] =
    useState<string | null>(null);

  const [draggedIssueId, setDraggedIssueId] =
    useState<string | null>(null);

  const [dragOverStatus, setDragOverStatus] =
    useState<IssueStatus | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadIssues() {
      if (!projectId) {
        setProjectIssues([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError("");

      try {
        const loadedIssues =
          await issueService.getByProject(projectId);

        if (!cancelled) {
          setProjectIssues(loadedIssues);
        }
      } catch {
        if (!cancelled) {
          setError("Unable to load project issues.");
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    loadIssues();

    return () => {
      cancelled = true;
    };
  }, [projectId]);

  const filteredIssues = useMemo(() => {
    const query = search.trim().toLowerCase();

    return projectIssues.filter((issue) => {
      const matchesSearch =
        query === "" ||
        issue.title.toLowerCase().includes(query) ||
        issue.description
          .toLowerCase()
          .includes(query) ||
        issue.labels.some((label) =>
          label.toLowerCase().includes(query),
        ) ||
        issue.assignee?.name
          .toLowerCase()
          .includes(query);

      const matchesStatus =
        statusFilter === "ALL" ||
        issue.status === statusFilter;

      const matchesPriority =
        priorityFilter === "ALL" ||
        issue.priority === priorityFilter;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesPriority
      );
    });
  }, [
    projectIssues,
    search,
    statusFilter,
    priorityFilter,
  ]);

  const issuesByStatus = useMemo(() => {
    return statuses.reduce(
      (groups, status) => {
        groups[status] = filteredIssues.filter(
          (issue) => issue.status === status,
        );

        return groups;
      },
      {} as Record<IssueStatus, Issue[]>,
    );
  }, [filteredIssues]);

  const handleCreateIssue = async (
    newIssue: Issue,
  ) => {
    try {
      setError("");

      const createdIssue =
        await issueService.createIssue({
          projectId: newIssue.projectId,
          title: newIssue.title,
          description: newIssue.description,
          status: newIssue.status,
          priority: newIssue.priority,
          assignee: newIssue.assignee,
          labels: newIssue.labels,
        });

      setProjectIssues((currentIssues) => [
        createdIssue,
        ...currentIssues,
      ]);

      setIsCreateModalOpen(false);
    } catch {
      setError("Unable to create the issue.");
    }
  };

  const handleStatusChange = async (
    issueId: string,
    newStatus: IssueStatus,
  ) => {
    const currentIssue = projectIssues.find(
      (issue) => issue.id === issueId,
    );

    if (
      !currentIssue ||
      currentIssue.status === newStatus
    ) {
      return;
    }

    setUpdatingIssueId(issueId);
    setError("");

    try {
      const updatedIssue =
        await issueService.updateIssueStatus(
          issueId,
          newStatus,
        );

      if (updatedIssue) {
        setProjectIssues((currentIssues) =>
          currentIssues.map((issue) =>
            issue.id === issueId
              ? updatedIssue
              : issue,
          ),
        );
      }
    } catch {
      setError("Unable to update issue status.");
    } finally {
      setUpdatingIssueId(null);
    }
  };

  const handleDragStart = (
    event: React.DragEvent<HTMLElement>,
    issueId: string,
  ) => {
    setDraggedIssueId(issueId);

    event.dataTransfer.effectAllowed = "move";

    event.dataTransfer.setData(
      "text/plain",
      issueId,
    );
  };

  const handleDragEnd = () => {
    setDraggedIssueId(null);
    setDragOverStatus(null);
  };

  const handleDragOver = (
    event: React.DragEvent<HTMLDivElement>,
    status: IssueStatus,
  ) => {
    event.preventDefault();

    event.dataTransfer.dropEffect = "move";

    setDragOverStatus(status);
  };

  const handleDragLeave = (
    event: React.DragEvent<HTMLDivElement>,
  ) => {
    if (event.currentTarget === event.target) {
      setDragOverStatus(null);
    }
  };

  const handleDrop = async (
    event: React.DragEvent<HTMLDivElement>,
    targetStatus: IssueStatus,
  ) => {
    event.preventDefault();

    const issueId =
      event.dataTransfer.getData("text/plain") ||
      draggedIssueId;

    setDragOverStatus(null);
    setDraggedIssueId(null);

    if (!issueId) {
      return;
    }

    const issue = projectIssues.find(
      (item) => item.id === issueId,
    );

    if (
      !issue ||
      issue.status === targetStatus
    ) {
      return;
    }

    await handleStatusChange(
      issueId,
      targetStatus,
    );
  };

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("ALL");
    setPriorityFilter("ALL");
  };

  const hasFilters =
    search !== "" ||
    statusFilter !== "ALL" ||
    priorityFilter !== "ALL";

  return (
    <div className="space-y-lg">
      {/* Header */}
      <section className="flex flex-col gap-lg lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-title-lg font-bold text-on-surface">
            Issues
          </h2>

          <p className="mt-xs text-body-sm text-on-surface-variant">
            Track bugs, tasks, and engineering work for
            this project.
          </p>
        </div>

        <div className="flex flex-wrap gap-sm">
          {/* View Toggle */}
          <div className="flex rounded-lg border border-outline-variant bg-surface-container-low p-xs">
            <button
              type="button"
              onClick={() =>
                setViewMode("BOARD")
              }
              className={`flex items-center gap-xs rounded-md px-sm py-xs text-body-sm font-medium transition-colors ${
                viewMode === "BOARD"
                  ? "bg-surface-container-high text-primary"
                  : "text-on-surface-variant hover:text-on-surface"
              }`}
            >
              <span className="material-symbols-outlined text-body-md">
                view_kanban
              </span>

              Board
            </button>

            <button
              type="button"
              onClick={() =>
                setViewMode("LIST")
              }
              className={`flex items-center gap-xs rounded-md px-sm py-xs text-body-sm font-medium transition-colors ${
                viewMode === "LIST"
                  ? "bg-surface-container-high text-primary"
                  : "text-on-surface-variant hover:text-on-surface"
              }`}
            >
              <span className="material-symbols-outlined text-body-md">
                view_list
              </span>

              List
            </button>
          </div>

          {/* Create */}
          <button
            type="button"
            onClick={() =>
              setIsCreateModalOpen(true)
            }
            className="flex w-fit items-center gap-sm rounded-lg bg-primary px-md py-sm text-body-sm font-bold text-on-primary transition-colors hover:bg-primary-container"
          >
            <span className="material-symbols-outlined text-body-md">
              add
            </span>

            Create Issue
          </button>
        </div>
      </section>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-sm rounded-lg border border-error/30 bg-error-container p-md text-error">
          <span className="material-symbols-outlined">
            error
          </span>

          <p className="text-body-sm">
            {error}
          </p>
        </div>
      )}

      {/* Toolbar */}
      <section className="rounded-xl border border-outline-variant bg-surface-container p-md">
        <div className="flex flex-col gap-md xl:flex-row xl:items-center xl:justify-between">
          {/* Search */}
          <div className="relative min-w-0 flex-1">
            <span className="material-symbols-outlined pointer-events-none absolute left-md top-1/2 -translate-y-1/2 text-body-md text-on-surface-variant">
              search
            </span>

            <input
              type="search"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search issues..."
              className="w-full rounded-lg border border-outline-variant bg-surface-container-low py-sm pl-10 pr-md text-body-sm text-on-surface outline-none transition-colors placeholder:text-on-surface-variant focus:border-primary"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-sm">
            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(
                  event.target.value as
                    | IssueStatus
                    | "ALL",
                )
              }
              className="rounded-lg border border-outline-variant bg-surface-container-low px-md py-sm text-body-sm text-on-surface outline-none focus:border-primary"
            >
              <option value="ALL">
                All Statuses
              </option>

              <option value="TODO">
                To Do
              </option>

              <option value="IN_PROGRESS">
                In Progress
              </option>

              <option value="IN_REVIEW">
                In Review
              </option>

              <option value="DONE">
                Done
              </option>
            </select>

            <select
              value={priorityFilter}
              onChange={(event) =>
                setPriorityFilter(
                  event.target.value as
                    | IssuePriority
                    | "ALL",
                )
              }
              className="rounded-lg border border-outline-variant bg-surface-container-low px-md py-sm text-body-sm text-on-surface outline-none focus:border-primary"
            >
              <option value="ALL">
                All Priorities
              </option>

              <option value="CRITICAL">
                Critical
              </option>

              <option value="HIGH">
                High
              </option>

              <option value="MEDIUM">
                Medium
              </option>

              <option value="LOW">
                Low
              </option>
            </select>

            {hasFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="rounded-lg px-md py-sm text-body-sm font-medium text-primary hover:bg-surface-container-high"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Loading */}
      {isLoading ? (
        <section className="flex min-h-72 items-center justify-center rounded-xl border border-outline-variant bg-surface-container">
          <div className="text-center">
            <span className="material-symbols-outlined animate-spin text-4xl text-primary">
              progress_activity
            </span>

            <p className="mt-md text-body-sm text-on-surface-variant">
              Loading issues...
            </p>
          </div>
        </section>
      ) : (
        <>
          {/* Summary */}
          <div className="flex items-center justify-between">
            <p className="text-body-sm text-on-surface-variant">
              Showing{" "}
              <span className="font-semibold text-on-surface">
                {filteredIssues.length}
              </span>{" "}
              {filteredIssues.length === 1
                ? "issue"
                : "issues"}
            </p>
          </div>

          {/* BOARD */}
          {viewMode === "BOARD" ? (
            <section className="overflow-x-auto pb-md">
              <div className="grid min-w-[1100px] grid-cols-4 gap-md">
                {statuses.map((status) => {
                  const columnIssues =
                    issuesByStatus[status];

                  const isDropTarget =
                    dragOverStatus === status;

                  return (
                    <div
                      key={status}
                      onDragOver={(event) =>
                        handleDragOver(
                          event,
                          status,
                        )
                      }
                      onDragLeave={
                        handleDragLeave
                      }
                      onDrop={(event) =>
                        handleDrop(
                          event,
                          status,
                        )
                      }
                      className={`min-h-[520px] rounded-xl border p-sm transition-all duration-200 ${
                        isDropTarget
                          ? "border-primary bg-primary-container/30 ring-2 ring-primary/30"
                          : "border-outline-variant bg-surface-container-low"
                      }`}
                    >
                      {/* Column Header */}
                      <div className="mb-sm flex items-center justify-between px-sm py-xs">
                        <div className="flex items-center gap-sm">
                          <span
                            className={`material-symbols-outlined text-body-md ${
                              status === "DONE"
                                ? "text-secondary"
                                : status ===
                                    "IN_PROGRESS"
                                  ? "text-primary"
                                  : status ===
                                      "IN_REVIEW"
                                    ? "text-tertiary"
                                    : "text-on-surface-variant"
                            }`}
                          >
                            {statusIcons[status]}
                          </span>

                          <h3 className="text-body-sm font-semibold text-on-surface">
                            {statusLabels[status]}
                          </h3>

                          <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-surface-container-high px-xs text-caption font-semibold text-on-surface-variant">
                            {columnIssues.length}
                          </span>
                        </div>
                      </div>

                      {/* Drop Hint */}
                      {isDropTarget &&
                        draggedIssueId && (
                          <div className="mb-sm rounded-lg border border-dashed border-primary bg-primary-container/40 px-sm py-md text-center">
                            <span className="material-symbols-outlined text-primary">
                              move_down
                            </span>

                            <p className="mt-xs text-caption font-semibold text-primary">
                              Drop here
                            </p>
                          </div>
                        )}

                      {/* Cards */}
                      <div className="space-y-sm">
                        {columnIssues.map(
                          (issue) => (
                            <article
                              key={issue.id}
                              draggable={
                                updatingIssueId !==
                                issue.id
                              }
                              onDragStart={(
                                event,
                              ) =>
                                handleDragStart(
                                  event,
                                  issue.id,
                                )
                              }
                              onDragEnd={
                                handleDragEnd
                              }
                              onClick={() =>
                                navigate(
                                  `/projects/${projectId}/issues/${issue.id}`,
                                )
                              }
                              className={`group cursor-grab rounded-lg border border-outline-variant bg-surface-container p-md transition-all duration-200 hover:-translate-y-0.5 hover:bg-surface-container-high active:cursor-grabbing ${
                                draggedIssueId ===
                                issue.id
                                  ? "scale-[0.98] opacity-40"
                                  : ""
                              } ${
                                updatingIssueId ===
                                issue.id
                                  ? "opacity-60"
                                  : ""
                              }`}
                            >
                              <div className="mb-sm flex items-center justify-between">
                                <span className="material-symbols-outlined text-body-md text-on-surface-variant opacity-0 transition-opacity group-hover:opacity-100">
                                  drag_indicator
                                </span>

                                <span className="text-caption text-on-surface-variant">
                                  #
                                  {issue.id.replace(
                                    "issue-",
                                    "",
                                  )}
                                </span>

                                <span
                                  className={`rounded-full px-sm py-xs text-caption font-semibold ${getPriorityClass(
                                    issue.priority,
                                  )}`}
                                >
                                  {
                                    priorityLabels[
                                      issue.priority
                                    ]
                                  }
                                </span>
                              </div>

                              <h4 className="text-body-sm font-semibold text-on-surface group-hover:text-primary">
                                {issue.title}
                              </h4>

                              <p className="mt-xs line-clamp-2 text-caption leading-relaxed text-on-surface-variant">
                                {issue.description}
                              </p>

                              {issue.labels
                                .length >
                                0 && (
                                <div className="mt-md flex flex-wrap gap-xs">
                                  {issue.labels
                                    .slice(
                                      0,
                                      3,
                                    )
                                    .map(
                                      (
                                        label,
                                      ) => (
                                        <span
                                          key={
                                            label
                                          }
                                          className="rounded-md bg-surface-container-low px-xs py-xs text-caption text-on-surface-variant"
                                        >
                                          {label}
                                        </span>
                                      ),
                                    )}
                                </div>
                              )}

                              <div className="mt-md flex items-center justify-between border-t border-outline-variant pt-sm">
                                {issue.assignee ? (
                                  <div className="flex items-center gap-xs">
                                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-surface-container-highest text-caption font-semibold text-on-surface">
                                      {issue.assignee.name
                                        .charAt(
                                          0,
                                        )
                                        .toUpperCase()}
                                    </div>

                                    <span className="max-w-24 truncate text-caption text-on-surface-variant">
                                      {
                                        issue
                                          .assignee
                                          .name
                                      }
                                    </span>
                                  </div>
                                ) : (
                                  <span className="text-caption text-on-surface-variant">
                                    Unassigned
                                  </span>
                                )}

                                <span className="material-symbols-outlined text-body-md text-on-surface-variant group-hover:text-primary">
                                  arrow_forward
                                </span>
                              </div>

                              {/* Status Controls */}
                              <div
                                className="mt-sm grid grid-cols-4 gap-xs border-t border-outline-variant pt-sm"
                                onClick={(
                                  event,
                                ) =>
                                  event.stopPropagation()
                                }
                              >
                                {statuses.map(
                                  (
                                    targetStatus,
                                  ) => (
                                    <button
                                      key={
                                        targetStatus
                                      }
                                      type="button"
                                      title={
                                        statusLabels[
                                          targetStatus
                                        ]
                                      }
                                      disabled={
                                        updatingIssueId ===
                                          issue.id ||
                                        targetStatus ===
                                          issue.status
                                      }
                                      onClick={() =>
                                        handleStatusChange(
                                          issue.id,
                                          targetStatus,
                                        )
                                      }
                                      className={`flex items-center justify-center rounded-md py-xs transition-colors ${
                                        targetStatus ===
                                        issue.status
                                          ? "bg-primary-container text-primary"
                                          : "text-on-surface-variant hover:bg-surface-container-high hover:text-primary"
                                      } disabled:cursor-default`}
                                    >
                                      <span className="material-symbols-outlined text-body-md">
                                        {
                                          statusIcons[
                                            targetStatus
                                          ]
                                        }
                                      </span>
                                    </button>
                                  ),
                                )}
                              </div>
                            </article>
                          ),
                        )}

                        {columnIssues.length ===
                          0 &&
                          !isDropTarget && (
                            <div className="flex min-h-32 items-center justify-center rounded-lg border border-dashed border-outline-variant px-md">
                              <p className="text-center text-caption text-on-surface-variant">
                                No issues
                              </p>
                            </div>
                          )}
                      </div>

                      {/* Add Issue */}
                      <button
                        type="button"
                        onClick={() =>
                          setIsCreateModalOpen(
                            true,
                          )
                        }
                        className="mt-sm flex w-full items-center justify-center gap-xs rounded-lg border border-dashed border-outline-variant py-sm text-caption font-medium text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-primary"
                      >
                        <span className="material-symbols-outlined text-body-md">
                          add
                        </span>

                        Add issue
                      </button>
                    </div>
                  );
                })}
              </div>
            </section>
          ) : (
            /* LIST */
            <>
              {filteredIssues.length > 0 ? (
                <section className="space-y-sm">
                  {filteredIssues.map(
                    (issue) => (
                      <article
                        key={issue.id}
                        onClick={() =>
                          navigate(
                            `/projects/${projectId}/issues/${issue.id}`,
                          )
                        }
                        className="group cursor-pointer rounded-xl border border-outline-variant bg-surface-container p-md transition-all duration-200 hover:-translate-y-0.5 hover:bg-surface-container-high"
                      >
                        <div className="flex flex-col gap-lg lg:flex-row lg:items-center lg:justify-between">
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-sm">
                              <span className="text-caption font-medium text-on-surface-variant">
                                #
                                {issue.id.replace(
                                  "issue-",
                                  "",
                                )}
                              </span>

                              <span
                                className={`rounded-full px-sm py-xs text-caption font-semibold ${getPriorityClass(
                                  issue.priority,
                                )}`}
                              >
                                {
                                  priorityLabels[
                                    issue.priority
                                  ]
                                }
                              </span>

                              <span
                                className={`rounded-full px-sm py-xs text-caption font-semibold ${getStatusClass(
                                  issue.status,
                                )}`}
                              >
                                {
                                  statusLabels[
                                    issue.status
                                  ]
                                }
                              </span>
                            </div>

                            <h3 className="mt-sm text-body-md font-semibold text-on-surface group-hover:text-primary">
                              {issue.title}
                            </h3>

                            <p className="mt-xs line-clamp-2 text-body-sm text-on-surface-variant">
                              {
                                issue.description
                              }
                            </p>

                            <div className="mt-md flex flex-wrap gap-xs">
                              {issue.labels.map(
                                (label) => (
                                  <span
                                    key={label}
                                    className="rounded-md bg-surface-container-low px-sm py-xs text-caption text-on-surface-variant"
                                  >
                                    {label}
                                  </span>
                                ),
                              )}
                            </div>
                          </div>

                          <div className="flex shrink-0 items-center justify-between gap-lg lg:justify-end">
                            {issue.assignee ? (
                              <div className="flex items-center gap-sm">
                                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-container-highest text-caption font-semibold text-on-surface">
                                  {issue.assignee.name
                                    .charAt(
                                      0,
                                    )
                                    .toUpperCase()}
                                </div>

                                <div>
                                  <p className="text-caption text-on-surface-variant">
                                    Assignee
                                  </p>

                                  <p className="text-body-sm font-medium text-on-surface">
                                    {
                                      issue
                                        .assignee
                                        .name
                                    }
                                  </p>
                                </div>
                              </div>
                            ) : (
                              <div>
                                <p className="text-caption text-on-surface-variant">
                                  Assignee
                                </p>

                                <p className="text-body-sm text-on-surface-variant">
                                  Unassigned
                                </p>
                              </div>
                            )}

                            <span className="material-symbols-outlined text-on-surface-variant transition-colors group-hover:text-primary">
                              arrow_forward
                            </span>
                          </div>
                        </div>
                      </article>
                    ),
                  )}
                </section>
              ) : (
                <section className="flex min-h-72 items-center justify-center rounded-xl border border-dashed border-outline-variant bg-surface-container-low">
                  <div className="max-w-md px-lg text-center">
                    <span className="material-symbols-outlined text-5xl text-on-surface-variant">
                      search_off
                    </span>

                    <h3 className="mt-md text-title-sm font-semibold text-on-surface">
                      No issues found
                    </h3>

                    <p className="mt-xs text-body-sm text-on-surface-variant">
                      Try changing your search
                      or filters.
                    </p>

                    <button
                      type="button"
                      onClick={clearFilters}
                      className="mt-md rounded-lg bg-primary px-md py-sm text-body-sm font-bold text-on-primary"
                    >
                      Clear Filters
                    </button>
                  </div>
                </section>
              )}
            </>
          )}
        </>
      )}

      {/* Create Issue Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() =>
          setIsCreateModalOpen(false)
        }
        title="Create Issue"
      >
        <CreateIssueForm
          projectId={projectId ?? ""}
          onCancel={() =>
            setIsCreateModalOpen(false)
          }
          onSubmit={handleCreateIssue}
        />
      </Modal>
    </div>
  );
}

export default Issues;