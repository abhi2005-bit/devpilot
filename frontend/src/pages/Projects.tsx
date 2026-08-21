import { useMemo, useState } from "react";
import Modal from "../components/common/Modal";
import CreateProjectForm from "../components/projects/CreateProjectForm";
import EditProjectForm from "../components/projects/EditProjectForm";
import ProjectCard from "../components/projects/ProjectCard";
import { projectService } from "../services/projectService";
import type { Project, ProjectRisk } from "../types/project";

type FilterOption = "ALL" | ProjectRisk;

type SortOption =
  | "NAME_ASC"
  | "PROGRESS_HIGH"
  | "PROGRESS_LOW"
  | "ISSUES_HIGH"
  | "ISSUES_LOW";

function Projects() {
  const [projectList, setProjectList] = useState<Project[]>(() =>
    projectService.getAll(),
  );

  const [filter, setFilter] = useState<FilterOption>("ALL");
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const [sort, setSort] = useState<SortOption>("NAME_ASC");
  const [isSortOpen, setIsSortOpen] = useState(false);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const [editingProject, setEditingProject] =
    useState<Project | null>(null);

  const [deletingProject, setDeletingProject] =
    useState<Project | null>(null);

  const displayedProjects = useMemo(() => {
    const filtered =
      filter === "ALL"
        ? [...projectList]
        : projectList.filter(
            (project) => project.risk === filter,
          );

    return filtered.sort((a, b) => {
      switch (sort) {
        case "PROGRESS_HIGH":
          return b.progress - a.progress;

        case "PROGRESS_LOW":
          return a.progress - b.progress;

        case "ISSUES_HIGH":
          return b.openIssues - a.openIssues;

        case "ISSUES_LOW":
          return a.openIssues - b.openIssues;

        case "NAME_ASC":
        default:
          return a.name.localeCompare(b.name);
      }
    });
  }, [projectList, filter, sort]);

  const sortLabels: Record<SortOption, string> = {
    NAME_ASC: "Name A-Z",
    PROGRESS_HIGH: "Progress: High -> Low",
    PROGRESS_LOW: "Progress: Low -> High",
    ISSUES_HIGH: "Issues: High -> Low",
    ISSUES_LOW: "Issues: Low -> High",
  };

  const handleCreateProject = (newProject: Project) => {
    const createdProject = projectService.create(newProject);

    setProjectList((currentProjects) => [
      ...currentProjects,
      createdProject,
    ]);

    setIsCreateModalOpen(false);
  };

  const handleEditProject = (updatedProject: Project) => {
    const savedProject = projectService.update(updatedProject);

    setProjectList((currentProjects) =>
      currentProjects.map((project) =>
        project.id === savedProject.id
          ? savedProject
          : project,
      ),
    );

    setEditingProject(null);
  };

  const handleDeleteProject = () => {
    if (!deletingProject) {
      return;
    }

    projectService.delete(deletingProject.id);

    setProjectList((currentProjects) =>
      currentProjects.filter(
        (project) => project.id !== deletingProject.id,
      ),
    );

    setDeletingProject(null);
  };

  return (
    <main className="overflow-y-auto px-margin pb-margin pt-8">
      {/* Page Header */}
      <div className="mb-xl flex flex-col gap-lg md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-display-lg font-bold text-on-surface">
            Projects
          </h1>

          <p className="mt-sm text-body-md text-on-surface-variant">
            Your engineering projects at a glance.
          </p>
        </div>

        {/* Toolbar */}
        <div className="flex flex-wrap gap-sm">
          {/* Filter */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setIsFilterOpen((open) => !open);
                setIsSortOpen(false);
              }}
              className="flex items-center gap-sm rounded-lg border border-outline-variant bg-surface-container px-md py-sm text-body-sm font-medium text-on-surface transition-colors hover:bg-surface-container-high"
            >
              <span className="material-symbols-outlined text-body-md">
                filter_list
              </span>

              Filter

              <span className="material-symbols-outlined text-body-md">
                expand_more
              </span>
            </button>

            {isFilterOpen && (
              <div className="absolute right-0 z-30 mt-sm w-48 rounded-lg border border-outline-variant bg-surface-container p-sm shadow-xl">
                {[
                  {
                    label: "All Projects",
                    value: "ALL",
                  },
                  {
                    label: "High Risk",
                    value: "HIGH",
                  },
                  {
                    label: "Medium Risk",
                    value: "MEDIUM",
                  },
                  {
                    label: "Low Risk",
                    value: "LOW",
                  },
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      setFilter(option.value as FilterOption);
                      setIsFilterOpen(false);
                    }}
                    className={`flex w-full items-center justify-between rounded-md px-sm py-sm text-left text-body-sm transition-colors hover:bg-surface-container-high ${
                      filter === option.value
                        ? "bg-surface-container-high text-primary"
                        : "text-on-surface"
                    }`}
                  >
                    <span>{option.label}</span>

                    {filter === option.value && (
                      <span className="material-symbols-outlined text-body-md">
                        check
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Sort */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setIsSortOpen((open) => !open);
                setIsFilterOpen(false);
              }}
              className="flex items-center gap-sm rounded-lg border border-outline-variant bg-surface-container px-md py-sm text-body-sm font-medium text-on-surface transition-colors hover:bg-surface-container-high"
            >
              <span className="material-symbols-outlined text-body-md">
                sort
              </span>

              Sort

              <span className="material-symbols-outlined text-body-md">
                expand_more
              </span>
            </button>

            {isSortOpen && (
              <div className="absolute right-0 z-30 mt-sm w-60 rounded-lg border border-outline-variant bg-surface-container p-sm shadow-xl">
                {(Object.keys(sortLabels) as SortOption[]).map(
                  (option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => {
                        setSort(option);
                        setIsSortOpen(false);
                      }}
                      className={`flex w-full items-center justify-between rounded-md px-sm py-sm text-left text-body-sm transition-colors hover:bg-surface-container-high ${
                        sort === option
                          ? "bg-surface-container-high text-primary"
                          : "text-on-surface"
                      }`}
                    >
                      <span>{sortLabels[option]}</span>

                      {sort === option && (
                        <span className="material-symbols-outlined text-body-md">
                          check
                        </span>
                      )}
                    </button>
                  ),
                )}
              </div>
            )}
          </div>

          {/* New Project */}
          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-sm rounded-lg bg-primary px-md py-sm text-body-sm font-bold text-on-primary transition-colors hover:bg-primary-container"
          >
            <span className="material-symbols-outlined text-body-md">
              add
            </span>

            New Project
          </button>
        </div>
      </div>

      {/* Active Filters */}
      <div className="mb-md flex flex-wrap items-center gap-sm">
        {filter !== "ALL" && (
          <span className="rounded-full bg-surface-container-high px-sm py-xs text-caption text-on-surface">
            Risk: {filter}
          </span>
        )}

        <span className="rounded-full bg-surface-container-high px-sm py-xs text-caption text-on-surface">
          {sortLabels[sort]}
        </span>
      </div>

      {/* Result Count */}
      <div className="mb-md">
        <p className="text-body-sm text-on-surface-variant">
          Showing{" "}
          <span className="font-semibold text-on-surface">
            {displayedProjects.length}
          </span>{" "}
          {displayedProjects.length === 1
            ? "project"
            : "projects"}
        </p>
      </div>

      {/* Project Grid */}
      {displayedProjects.length > 0 ? (
        <section className="grid grid-cols-1 gap-gutter md:grid-cols-2 xl:grid-cols-3">
          {displayedProjects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onEdit={setEditingProject}
              onDelete={setDeletingProject}
            />
          ))}
        </section>
      ) : (
        <div className="flex min-h-64 items-center justify-center rounded-xl border border-dashed border-outline-variant bg-surface-container-low">
          <div className="text-center">
            <span className="material-symbols-outlined text-4xl text-on-surface-variant">
              folder_off
            </span>

            <h2 className="mt-md text-title-sm font-semibold text-on-surface">
              No projects found
            </h2>

            <p className="mt-xs text-body-sm text-on-surface-variant">
              Try selecting a different filter.
            </p>
          </div>
        </div>
      )}

      {/* Create Project Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create New Project"
      >
        <CreateProjectForm
          onCancel={() => setIsCreateModalOpen(false)}
          onSubmit={handleCreateProject}
        />
      </Modal>

      {/* Edit Project Modal */}
      {editingProject && (
        <Modal
          isOpen={true}
          onClose={() => setEditingProject(null)}
          title="Edit Project"
        >
          <EditProjectForm
            project={editingProject}
            onCancel={() => setEditingProject(null)}
            onSubmit={handleEditProject}
          />
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      {deletingProject && (
        <Modal
          isOpen={true}
          onClose={() => setDeletingProject(null)}
          title="Delete Project"
        >
          <div className="space-y-lg">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-error-container">
              <span className="material-symbols-outlined text-error">
                delete_forever
              </span>
            </div>

            <div>
              <h2 className="text-title-sm font-semibold text-on-surface">
                Delete "{deletingProject.name}"?
              </h2>

              <p className="mt-sm text-body-sm leading-6 text-on-surface-variant">
                This will permanently remove the project from
                your current project list.
              </p>
            </div>

            <div className="flex justify-end gap-sm border-t border-outline-variant pt-lg">
              <button
                type="button"
                onClick={() => setDeletingProject(null)}
                className="rounded-lg border border-outline-variant px-md py-sm text-body-sm font-medium text-on-surface transition-colors hover:bg-surface-container-high"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleDeleteProject}
                className="rounded-lg bg-error px-md py-sm text-body-sm font-bold text-on-error transition-colors hover:opacity-90"
              >
                Delete Project
              </button>
            </div>
          </div>
        </Modal>
      )}
    </main>
  );
}

export default Projects;