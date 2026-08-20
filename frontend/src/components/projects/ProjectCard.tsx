import { useNavigate } from "react-router-dom";
import type { Project } from "../../types/project";

interface ProjectCardProps {
  project: Project;
  onClick?: () => void;
  onEdit?: (project: Project) => void;
  onDelete?: (project: Project) => void;
}

function ProjectCard({
  project,
  onClick,
  onEdit,
  onDelete,
}: ProjectCardProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    if (onClick) {
      onClick();
      return;
    }

    navigate(`/projects/${project.id}`);
  };

  const handleEdit = (
    event: React.MouseEvent<HTMLButtonElement>,
  ) => {
    event.stopPropagation();

    if (onEdit) {
      onEdit(project);
    }
  };

  const handleDelete = (
    event: React.MouseEvent<HTMLButtonElement>,
  ) => {
    event.stopPropagation();

    if (onDelete) {
      onDelete(project);
    }
  };

  return (
    <article
      onClick={handleClick}
      className="cursor-pointer rounded-xl border border-outline-variant bg-surface-container p-lg transition-all duration-200 hover:-translate-y-1 hover:bg-surface-container-high"
    >
      {/* Header */}
      <div className="mb-md flex items-start justify-between gap-md">
        <div className="min-w-0">
          <h2 className="text-title-sm font-semibold text-on-surface">
            {project.name}
          </h2>

          <p className="mt-xs text-body-sm text-on-surface-variant">
            {project.description}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-xs">
          {/* Risk */}
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

          {/* Edit */}
          {onEdit && (
            <button
              type="button"
              onClick={handleEdit}
              aria-label={`Edit ${project.name}`}
              className="flex h-8 w-8 items-center justify-center rounded-full text-on-surface-variant transition-colors hover:bg-surface-container-highest hover:text-primary"
            >
              <span className="material-symbols-outlined text-body-md">
                edit
              </span>
            </button>
          )}

          {/* Delete */}
          {onDelete && (
            <button
              type="button"
              onClick={handleDelete}
              aria-label={`Delete ${project.name}`}
              className="flex h-8 w-8 items-center justify-center rounded-full text-on-surface-variant transition-colors hover:bg-error-container hover:text-error"
            >
              <span className="material-symbols-outlined text-body-md">
                delete
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Progress */}
      <div className="mb-lg">
        <div className="mb-xs flex items-center justify-between">
          <span className="text-caption text-on-surface-variant">
            Progress
          </span>

          <span className="text-body-sm font-semibold text-on-surface">
            {project.progress}%
          </span>
        </div>

        <div className="h-2 overflow-hidden rounded-full bg-surface-container-highest">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${project.progress}%` }}
          />
        </div>
      </div>

      {/* Metrics */}
      <div className="mb-lg grid grid-cols-2 gap-md">
        <div className="rounded-lg bg-surface-container-low p-sm">
          <p className="text-caption text-on-surface-variant">
            Open Issues
          </p>

          <p className="mt-xs text-body-md font-semibold text-on-surface">
            {project.openIssues}
          </p>
        </div>

        <div className="rounded-lg bg-surface-container-low p-sm">
          <p className="text-caption text-on-surface-variant">
            PRs Pending
          </p>

          <p className="mt-xs text-body-md font-semibold text-on-surface">
            {project.prsPending}
          </p>
        </div>
      </div>

      {/* Footer / Team */}
      <div className="flex items-end justify-between gap-md">
        <div>
          <p className="mb-xs text-caption text-on-surface-variant">
            Team
          </p>

          <div className="flex -space-x-2">
            {project.members.map((member) => (
              <div
                key={member.id}
                title={member.name}
                className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-surface-container bg-surface-container-highest text-caption font-semibold text-on-surface"
              >
                {member.name.charAt(0).toUpperCase()}
              </div>
            ))}
          </div>
        </div>

        <span className="material-symbols-outlined text-primary">
          arrow_forward
        </span>
      </div>

      {/* AI Insight */}
      {project.aiInsight && (
        <div className="mt-lg rounded-lg border border-outline-variant bg-surface-container-low p-md">
          <div className="mb-xs flex items-center gap-sm">
            <span className="material-symbols-outlined text-secondary">
              auto_awesome
            </span>

            <span className="text-caption font-semibold text-secondary">
              AI Insight
            </span>
          </div>

          <p className="text-body-sm text-on-surface-variant">
            {project.aiInsight}
          </p>
        </div>
      )}
    </article>
  );
}

export default ProjectCard;