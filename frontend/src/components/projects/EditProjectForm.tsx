import { useForm } from "react-hook-form";
import type { Project, ProjectRisk } from "../../types/project";

interface EditProjectFormProps {
  project: Project;
  onSubmit: (project: Project) => void;
  onCancel: () => void;
}

interface ProjectFormData {
  name: string;
  description: string;
  risk: ProjectRisk;
  progress: number;
}

function EditProjectForm({
  project,
  onSubmit,
  onCancel,
}: EditProjectFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProjectFormData>({
    defaultValues: {
      name: project.name,
      description: project.description,
      risk: project.risk,
      progress: project.progress,
    },
  });

  const handleFormSubmit = (data: ProjectFormData) => {
    const updatedProject: Project = {
      ...project,
      name: data.name.trim(),
      description: data.description.trim(),
      risk: data.risk,
      progress: Number(data.progress),
    };

    onSubmit(updatedProject);
  };

  return (
    <form
      onSubmit={handleSubmit(handleFormSubmit)}
      className="w-full space-y-5"
    >
      {/* Project Name */}
      <div className="w-full">
        <label
          htmlFor="edit-project-name"
          className="mb-2 block text-sm font-medium text-on-surface"
        >
          Project Name
        </label>

        <input
          id="edit-project-name"
          type="text"
          {...register("name", {
            required: "Project name is required.",
            minLength: {
              value: 3,
              message: "Project name must be at least 3 characters.",
            },
          })}
          className="block w-full rounded-lg border border-outline-variant bg-surface-container-low px-4 py-3 text-sm text-on-surface outline-none transition-colors placeholder:text-on-surface-variant focus:border-primary focus:ring-1 focus:ring-primary"
        />

        {errors.name && (
          <p className="mt-1 text-xs text-error">
            {errors.name.message}
          </p>
        )}
      </div>

      {/* Description */}
      <div className="w-full">
        <label
          htmlFor="edit-project-description"
          className="mb-2 block text-sm font-medium text-on-surface"
        >
          Description
        </label>

        <textarea
          id="edit-project-description"
          rows={4}
          {...register("description", {
            required: "Description is required.",
            minLength: {
              value: 10,
              message: "Description must be at least 10 characters.",
            },
          })}
          className="block w-full resize-none rounded-lg border border-outline-variant bg-surface-container-low px-4 py-3 text-sm text-on-surface outline-none transition-colors placeholder:text-on-surface-variant focus:border-primary focus:ring-1 focus:ring-primary"
        />

        {errors.description && (
          <p className="mt-1 text-xs text-error">
            {errors.description.message}
          </p>
        )}
      </div>

      {/* Risk */}
      <div className="w-full">
        <label
          htmlFor="edit-project-risk"
          className="mb-2 block text-sm font-medium text-on-surface"
        >
          Risk Level
        </label>

        <select
          id="edit-project-risk"
          {...register("risk")}
          className="block w-full rounded-lg border border-outline-variant bg-surface-container-low px-4 py-3 text-sm text-on-surface outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary"
        >
          <option value="LOW">Low Risk</option>
          <option value="MEDIUM">Medium Risk</option>
          <option value="HIGH">High Risk</option>
        </select>
      </div>

      {/* Progress */}
      <div className="w-full">
        <div className="mb-2 flex items-center justify-between">
          <label
            htmlFor="edit-project-progress"
            className="text-sm font-medium text-on-surface"
          >
            Progress
          </label>

          <span className="text-sm text-on-surface-variant">
            {project.progress}%
          </span>
        </div>

        <input
          id="edit-project-progress"
          type="range"
          min="0"
          max="100"
          {...register("progress", {
            valueAsNumber: true,
          })}
          className="block w-full cursor-pointer"
        />
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 border-t border-outline-variant pt-5">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-outline-variant px-5 py-2.5 text-sm font-medium text-on-surface transition-colors hover:bg-surface-container-high"
        >
          Cancel
        </button>

        <button
          type="submit"
          className="rounded-lg bg-primary px-5 py-2.5 text-sm font-bold text-on-primary transition-colors hover:bg-primary-container"
        >
          Save Changes
        </button>
      </div>
    </form>
  );
}

export default EditProjectForm;