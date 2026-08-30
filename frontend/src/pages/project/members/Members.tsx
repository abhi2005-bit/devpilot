import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";

import { issues } from "../../../data/issues";
import { projectService } from "../../../services/projectService";
import { memberService } from "../../../services/memberService";

import type {
  Project,
  ProjectMemberRole,
} from "../../../types/project";

import type {
  ProjectMember as BackendProjectMember,
  User,
} from "../../../types/member";

const roleLabels: Record<ProjectMemberRole, string> = {
  OWNER: "Owner",
  ENGINEER: "Engineer",
  DESIGNER: "Designer",
  PRODUCT: "Product",
  QA: "QA",
};

const roles: ProjectMemberRole[] = [
  "ENGINEER",
  "DESIGNER",
  "PRODUCT",
  "QA",
];

function getRoleClass(role: ProjectMemberRole) {
  switch (role) {
    case "OWNER":
      return "bg-primary-container text-primary";

    case "ENGINEER":
      return "bg-secondary-container text-secondary";

    case "DESIGNER":
      return "bg-tertiary-container text-tertiary";

    case "PRODUCT":
      return "bg-surface-container-high text-on-surface";

    case "QA":
      return "bg-error-container text-error";

    default:
      return "bg-surface-container-high text-on-surface";
  }
}

function getWorkloadClass(workload: number) {
  if (workload >= 75) {
    return "bg-error";
  }

  if (workload >= 50) {
    return "bg-tertiary";
  }

  return "bg-primary";
}

function Members() {
  const { projectId } = useParams<{
    projectId: string;
  }>();

  const [project, setProject] =
    useState<Project | undefined>();

  const [members, setMembers] = useState<
    BackendProjectMember[]
  >([]);

  const [users, setUsers] = useState<User[]>([]);

  const [isLoading, setIsLoading] = useState(true);

  const [isSaving, setIsSaving] = useState(false);

  const [search, setSearch] = useState("");

  const [isAddOpen, setIsAddOpen] =
    useState(false);

  const [selectedUserId, setSelectedUserId] =
    useState("");

  const [newRole, setNewRole] =
    useState<ProjectMemberRole>("ENGINEER");

  const [error, setError] =
    useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      if (!projectId) {
        setProject(undefined);
        setMembers([]);
        setUsers([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError("");

      try {
        const [
          loadedProject,
          loadedMembers,
          loadedUsers,
        ] = await Promise.all([
          projectService.getById(projectId),
          memberService.getMembers(projectId),
          memberService.getUsers(),
        ]);

        if (!cancelled) {
          setProject(loadedProject);
          setMembers(loadedMembers);
          setUsers(loadedUsers);
        }
      } catch {
        if (!cancelled) {
          setProject(undefined);
          setMembers([]);
          setUsers([]);
          setError(
            "Unable to load project members.",
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    loadData();

    return () => {
      cancelled = true;
    };
  }, [projectId]);

  /*
   * Convert backend members into the frontend
   * member format.
   *
   * The project owner is determined from ownerId.
   */
  const displayMembers = useMemo(() => {
    return members.map((member) => ({
      id: member.id,
      name: member.name,
      email: member.email,
      role:
        member.id === project?.ownerId
          ? ("OWNER" as ProjectMemberRole)
          : ("ENGINEER" as ProjectMemberRole),
      avatar: undefined,
    }));
  }, [members, project?.ownerId]);

  const getMemberWorkload = (
    memberId: string,
  ) => {
    if (!projectId) {
      return {
        total: 0,
        todo: 0,
        inProgress: 0,
        inReview: 0,
        done: 0,
        highPriority: 0,
        active: 0,
        workload: 0,
      };
    }

    const memberIssues = issues.filter(
      (issue) =>
        issue.projectId === projectId &&
        issue.assignee?.id === memberId,
    );

    const total = memberIssues.length;

    const todo = memberIssues.filter(
      (issue) => issue.status === "TODO",
    ).length;

    const inProgress =
      memberIssues.filter(
        (issue) =>
          issue.status === "IN_PROGRESS",
      ).length;

    const inReview =
      memberIssues.filter(
        (issue) =>
          issue.status === "IN_REVIEW",
      ).length;

    const done = memberIssues.filter(
      (issue) => issue.status === "DONE",
    ).length;

    const highPriority =
      memberIssues.filter(
        (issue) =>
          issue.priority === "HIGH" ||
          issue.priority === "CRITICAL",
      ).length;

    const active = total - done;

    const workload = Math.min(
      active * 25,
      100,
    );

    return {
      total,
      todo,
      inProgress,
      inReview,
      done,
      highPriority,
      active,
      workload,
    };
  };

  const filteredMembers = useMemo(() => {
    const query =
      search.trim().toLowerCase();

    if (!query) {
      return displayMembers;
    }

    return displayMembers.filter(
      (member) => {
        const role =
          member.role ?? "ENGINEER";

        return (
          member.name
            .toLowerCase()
            .includes(query) ||
          member.email
            .toLowerCase()
            .includes(query) ||
          roleLabels[role]
            .toLowerCase()
            .includes(query)
        );
      },
    );
  }, [displayMembers, search]);

  const availableUsers = useMemo(() => {
    const memberIds = new Set(
      members.map((member) => member.id),
    );

    return users.filter(
      (user) => !memberIds.has(user.id),
    );
  }, [members, users]);

  const handleAddMember = async () => {
    if (!projectId || !project) {
      return;
    }

    if (!selectedUserId) {
      setError("Please select a user.");
      return;
    }

    const userId = Number(selectedUserId);

    if (!Number.isInteger(userId)) {
      setError("Invalid user selected.");
      return;
    }

    setIsSaving(true);
    setError("");

    try {
      const addedMember =
        await memberService.addMember(
          projectId,
          userId,
        );

      setMembers((current) => [
        ...current,
        addedMember,
      ]);

      setSelectedUserId("");
      setNewRole("ENGINEER");
      setIsAddOpen(false);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to add member.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  /*
   * Remove a project member.
   */
  const handleRemoveMember = async (
    memberId: string,
  ) => {
    if (!projectId || !project) {
      return;
    }

    const member = displayMembers.find(
      (item) => item.id === memberId,
    );

    if (!member) {
      return;
    }

    /*
     * Never allow the owner to be removed
     * from the frontend.
     *
     * The backend also protects this operation.
     */
    if (member.role === "OWNER") {
      setError(
        "The project owner cannot be removed.",
      );
      return;
    }

    setIsSaving(true);
    setError("");

    try {
      await memberService.removeMember(
        projectId,
        memberId,
      );

      /*
       * Only remove the member from the UI
       * after the backend confirms success.
       */
      setMembers((current) =>
        current.filter(
          (item) => item.id !== memberId,
        ),
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to remove member.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const closeModal = () => {
    if (isSaving) {
      return;
    }

    setIsAddOpen(false);
    setSelectedUserId("");
    setNewRole("ENGINEER");
    setError("");
  };

  if (isLoading) {
    return (
      <div className="flex min-h-64 items-center justify-center rounded-xl border border-outline-variant bg-surface-container">
        <div className="text-center">
          <span className="material-symbols-outlined animate-spin text-5xl text-primary">
            progress_activity
          </span>

          <p className="mt-md text-body-sm text-on-surface-variant">
            Loading project...
          </p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex min-h-64 items-center justify-center rounded-xl border border-outline-variant bg-surface-container">
        <div className="text-center">
          <span className="material-symbols-outlined text-5xl text-on-surface-variant">
            group
          </span>

          <h2 className="mt-md text-title-sm font-semibold text-on-surface">
            Project not found
          </h2>

          <p className="mt-xs text-body-sm text-on-surface-variant">
            Team members are unavailable for
            this project.
          </p>

          {error && (
            <p className="mt-sm text-body-sm text-error">
              {error}
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-lg">

      {/* HEADER */}

      <section className="flex flex-col gap-lg md:flex-row md:items-end md:justify-between">
        <div>
          <div className="flex items-center gap-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-container">
              <span className="material-symbols-outlined text-primary">
                group
              </span>
            </div>

            <div>
              <h2 className="text-title-lg font-bold text-on-surface">
                Project Members
              </h2>

              <p className="mt-xs text-body-sm text-on-surface-variant">
                People contributing to{" "}
                {project.name}.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-sm">
          <div className="flex items-center gap-sm rounded-lg border border-outline-variant bg-surface-container px-md py-sm">
            <span className="material-symbols-outlined text-body-md text-on-surface-variant">
              group
            </span>

            <span className="text-body-sm font-semibold text-on-surface">
              {displayMembers.length}
            </span>

            <span className="text-body-sm text-on-surface-variant">
              members
            </span>
          </div>

          <button
            type="button"
            disabled={isSaving}
            onClick={() => {
              setError("");
              setSelectedUserId("");
              setIsAddOpen(true);
            }}
            className="flex items-center gap-sm rounded-lg bg-primary px-md py-sm text-body-sm font-bold text-on-primary transition-colors hover:bg-primary-container disabled:cursor-not-allowed disabled:opacity-60"
          >
            <span className="material-symbols-outlined text-body-md">
              person_add
            </span>

            Add Member
          </button>
        </div>
      </section>

      {/* ERROR */}

      {error && !isAddOpen && (
        <div className="flex items-start gap-sm rounded-lg border border-error/30 bg-error-container p-md text-error">
          <span className="material-symbols-outlined">
            error
          </span>

          <p className="text-body-sm">
            {error}
          </p>
        </div>
      )}

      {/* SEARCH */}

      <section className="rounded-xl border border-outline-variant bg-surface-container p-md">
        <div className="relative">
          <span className="material-symbols-outlined pointer-events-none absolute left-md top-1/2 -translate-y-1/2 text-on-surface-variant">
            search
          </span>

          <input
            type="search"
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="Search members or roles..."
            className="w-full rounded-lg border border-outline-variant bg-surface-container-low py-sm pl-11 pr-md text-body-sm text-on-surface outline-none placeholder:text-on-surface-variant focus:border-primary"
          />
        </div>
      </section>

      {/* MEMBER CARDS */}

      {filteredMembers.length > 0 ? (
        <section className="grid grid-cols-1 gap-md md:grid-cols-2 xl:grid-cols-3">
          {filteredMembers.map(
            (member) => {
              const role =
                member.role ?? "ENGINEER";

              const workload =
                getMemberWorkload(
                  member.id,
                );

              return (
                <article
                  key={member.id}
                  className="rounded-xl border border-outline-variant bg-surface-container p-lg transition-colors hover:bg-surface-container-high"
                >

                  {/* Member Header */}

                  <div className="flex items-start gap-md">
                    {member.avatar ? (
                      <img
                        src={member.avatar}
                        alt={member.name}
                        className="h-12 w-12 shrink-0 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary-container text-title-sm font-bold text-primary">
                        {member.name
                          .charAt(0)
                          .toUpperCase()}
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <h3 className="truncate text-body-md font-semibold text-on-surface">
                        {member.name}
                      </h3>

                      <p className="mt-xs truncate text-caption text-on-surface-variant">
                        {member.email}
                      </p>

                      <p className="mt-xs text-caption text-on-surface-variant">
                        {roleLabels[role]}
                      </p>
                    </div>

                    <span
                      className={`rounded-full px-sm py-xs text-caption font-semibold ${getRoleClass(
                        role,
                      )}`}
                    >
                      {roleLabels[role]}
                    </span>
                  </div>

                  {/* Member Information */}

                  <div className="mt-lg grid grid-cols-2 gap-sm">
                    <div className="rounded-lg bg-surface-container-low p-sm">
                      <p className="text-caption text-on-surface-variant">
                        Role
                      </p>

                      <p className="mt-xs text-body-sm font-medium text-on-surface">
                        {roleLabels[role]}
                      </p>
                    </div>

                    <div className="rounded-lg bg-surface-container-low p-sm">
                      <p className="text-caption text-on-surface-variant">
                        Member ID
                      </p>

                      <p className="mt-xs truncate text-body-sm font-medium text-on-surface">
                        #{member.id}
                      </p>
                    </div>
                  </div>

                  {/* WORKLOAD */}

                  <div className="mt-lg rounded-lg border border-outline-variant bg-surface-container-low p-md">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-sm">
                        <span className="material-symbols-outlined text-body-md text-primary">
                          insights
                        </span>

                        <span className="text-body-sm font-semibold text-on-surface">
                          Workload
                        </span>
                      </div>

                      <span className="text-body-sm font-bold text-on-surface">
                        {workload.workload}%
                      </span>
                    </div>

                    <div className="mt-sm h-2 overflow-hidden rounded-full bg-surface-container-highest">
                      <div
                        className={`h-full rounded-full transition-all ${getWorkloadClass(
                          workload.workload,
                        )}`}
                        style={{
                          width: `${workload.workload}%`,
                        }}
                      />
                    </div>

                    <div className="mt-md grid grid-cols-2 gap-sm">
                      <div>
                        <p className="text-caption text-on-surface-variant">
                          Assigned
                        </p>

                        <p className="mt-xs text-body-sm font-bold text-on-surface">
                          {workload.total}
                        </p>
                      </div>

                      <div>
                        <p className="text-caption text-on-surface-variant">
                          Active
                        </p>

                        <p className="mt-xs text-body-sm font-bold text-on-surface">
                          {workload.active}
                        </p>
                      </div>

                      <div>
                        <p className="text-caption text-on-surface-variant">
                          In Progress
                        </p>

                        <p className="mt-xs text-body-sm font-bold text-on-surface">
                          {workload.inProgress}
                        </p>
                      </div>

                      <div>
                        <p className="text-caption text-on-surface-variant">
                          High Priority
                        </p>

                        <p className="mt-xs text-body-sm font-bold text-on-surface">
                          {workload.highPriority}
                        </p>
                      </div>
                    </div>

                    <div className="mt-md border-t border-outline-variant pt-md">
                      <div className="flex items-center justify-between text-caption">
                        <span className="text-on-surface-variant">
                          To Do
                        </span>

                        <span className="font-semibold text-on-surface">
                          {workload.todo}
                        </span>
                      </div>

                      <div className="mt-xs flex items-center justify-between text-caption">
                        <span className="text-on-surface-variant">
                          In Review
                        </span>

                        <span className="font-semibold text-on-surface">
                          {workload.inReview}
                        </span>
                      </div>

                      <div className="mt-xs flex items-center justify-between text-caption">
                        <span className="text-on-surface-variant">
                          Completed
                        </span>

                        <span className="font-semibold text-on-surface">
                          {workload.done}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* REMOVE MEMBER */}

                  {role !== "OWNER" && (
                    <button
                      type="button"
                      disabled={isSaving}
                      onClick={() =>
                        handleRemoveMember(
                          member.id,
                        )
                      }
                      className="mt-md flex w-full items-center justify-center gap-sm rounded-lg border border-outline-variant py-sm text-caption font-medium text-error transition-colors hover:bg-error-container disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <span className="material-symbols-outlined text-body-md">
                        person_remove
                      </span>

                      {isSaving
                        ? "Removing..."
                        : "Remove Member"}
                    </button>
                  )}
                </article>
              );
            },
          )}
        </section>
      ) : (
        <div className="flex min-h-56 items-center justify-center rounded-xl border border-dashed border-outline-variant bg-surface-container-low">
          <div className="text-center">
            <span className="material-symbols-outlined text-4xl text-on-surface-variant">
              person_search
            </span>

            <h3 className="mt-md text-title-sm font-semibold text-on-surface">
              No members found
            </h3>

            <p className="mt-xs text-body-sm text-on-surface-variant">
              Try a different name or role.
            </p>
          </div>
        </div>
      )}

      {/* ADD MEMBER MODAL */}

      {isAddOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 px-4 py-8"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              closeModal();
            }
          }}
        >
          <div
            className="relative flex w-[min(92vw,520px)] flex-col overflow-hidden rounded-2xl border border-outline-variant bg-surface-container shadow-2xl"
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >

            {/* Modal Header */}

            <div className="flex items-start justify-between border-b border-outline-variant px-6 py-5">
              <div className="flex items-center gap-sm">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-container">
                  <span className="material-symbols-outlined text-primary">
                    person_add
                  </span>
                </div>

                <div>
                  <h3 className="text-title-sm font-bold text-on-surface">
                    Add Project Member
                  </h3>

                  <p className="mt-1 text-caption text-on-surface-variant">
                    Add someone to the project team.
                  </p>
                </div>
              </div>

              <button
                type="button"
                disabled={isSaving}
                onClick={closeModal}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-on-surface disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Close"
              >
                <span className="material-symbols-outlined">
                  close
                </span>
              </button>
            </div>

            {/* Modal Body */}

            <div className="space-y-5 px-6 py-6">
              {error && (
                <div className="flex items-start gap-sm rounded-lg border border-error/30 bg-error-container p-md text-error">
                  <span className="material-symbols-outlined text-body-md">
                    error
                  </span>

                  <p className="text-caption">
                    {error}
                  </p>
                </div>
              )}

              {/* User */}

              <div className="space-y-2">
                <label
                  htmlFor="member-user"
                  className="block text-body-sm font-semibold text-on-surface"
                >
                  Member
                </label>

                <select
                  id="member-user"
                  autoFocus
                  value={selectedUserId}
                  onChange={(event) => {
                    setSelectedUserId(
                      event.target.value,
                    );
                    setError("");
                  }}
                  disabled={
                    isSaving ||
                    availableUsers.length === 0
                  }
                  className="w-full appearance-none rounded-lg border border-outline-variant bg-surface-container-low px-4 py-3 text-body-sm text-on-surface outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <option value="">
                    {availableUsers.length === 0
                      ? "No users available"
                      : "Select a user"}
                  </option>

                  {availableUsers.map(
                    (user) => (
                      <option
                        key={user.id}
                        value={user.id}
                      >
                        {user.name} —{" "}
                        {user.email}
                      </option>
                    ),
                  )}
                </select>
              </div>

              {/* Role */}

              <div className="space-y-2">
                <label
                  htmlFor="member-role"
                  className="block text-body-sm font-semibold text-on-surface"
                >
                  Role
                </label>

                <select
                  id="member-role"
                  value={newRole}
                  onChange={(event) => {
                    setNewRole(
                      event.target
                        .value as ProjectMemberRole,
                    );

                    setError("");
                  }}
                  disabled={isSaving}
                  className="w-full appearance-none rounded-lg border border-outline-variant bg-surface-container-low px-4 py-3 text-body-sm text-on-surface outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {roles.map((role) => (
                    <option
                      key={role}
                      value={role}
                    >
                      {roleLabels[role]}
                    </option>
                  ))}
                </select>
              </div>

              <p className="text-caption text-on-surface-variant">
                The selected user will be added to
                this project. Roles are currently
                displayed in the frontend and are
                not yet stored by the backend.
              </p>
            </div>

            {/* Modal Footer */}

            <div className="flex items-center justify-end gap-sm border-t border-outline-variant bg-surface-container-low px-6 py-4">
              <button
                type="button"
                disabled={isSaving}
                onClick={closeModal}
                className="rounded-lg border border-outline-variant px-5 py-2.5 text-body-sm font-semibold text-on-surface transition-colors hover:bg-surface-container-high disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={
                  isSaving ||
                  !selectedUserId ||
                  availableUsers.length === 0
                }
                onClick={handleAddMember}
                className="flex items-center gap-sm rounded-lg bg-primary px-5 py-2.5 text-body-sm font-bold text-on-primary transition-colors hover:bg-primary-container disabled:cursor-not-allowed disabled:opacity-60"
              >
                <span className="material-symbols-outlined text-body-md">
                  {isSaving
                    ? "progress_activity"
                    : "person_add"}
                </span>

                {isSaving
                  ? "Adding..."
                  : "Add Member"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Members;