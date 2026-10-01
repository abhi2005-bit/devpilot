import { useForm } from "react-hook-form";
import type { Project, ProjectRisk } from "../../types/project";

interface CreateProjectFormProps {
  onSubmit: (project: Project) => void;
  onCancel: () => void;
}

interface ProjectFormData {
  name: string;
  description: string;
  github_owner: string;
  github_repo: string;
  risk: ProjectRisk;
  progress: number;
}

function CreateProjectForm({
  onSubmit,
  onCancel,
}: CreateProjectFormProps) {
  const {
    register,
    getValues,
    handleSubmit,
    formState: { errors },
  } = useForm<ProjectFormData>({
    defaultValues: {
      name: "",
      description: "",
      github_owner: "",
      github_repo: "",
      risk: "MEDIUM",
      progress: 0,
    },
  });

  const handleFormSubmit = (data: ProjectFormData) => {
    const slug = data.name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    const newProject: Project = {
      id: `${slug}-${Date.now()}`,
      name: data.name.trim(),
      description: data.description.trim(),
      github_owner: data.github_owner.trim() || null,
      github_repo: data.github_repo.trim() || null,
      ownerId: "1",
      risk: data.risk,
      progress: Number(data.progress),
      openIssues: 0,
      prsPending: 0,
      members: [],
      aiInsight: "No AI insight available yet.",
    };

    onSubmit(newProject);
  };

  return (
    <form
      onSubmit={handleSubmit(handleFormSubmit)}
      className="w-full space-y-5"
    >
      {/* Project Name */}
      <div className="w-full">
        <label
          htmlFor="project-name"
          className="mb-2 block text-sm font-medium text-on-surface"
        >
          Project Name
        </label>

        <input
          id="project-name"
          type="text"
          placeholder="e.g. Customer Portal"
          {...register("name", {
            required: "Project name is required.",
            minLength: {
              value: 3,
              message:
                "Project name must be at least 3 characters.",
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
          htmlFor="project-description"
          className="mb-2 block text-sm font-medium text-on-surface"
        >
          Description
        </label>

        <textarea
          id="project-description"
          rows={4}
          placeholder="Describe what this project is about..."
          {...register("description", {
            required: "Description is required.",
            minLength: {
              value: 10,
              message:
                "Description must be at least 10 characters.",
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

      {/* GitHub Repository */}
      <section className="space-y-4 border-t border-outline-variant pt-5">
        <div>
          <h3 className="text-sm font-semibold text-on-surface">
            Public GitHub Repository
          </h3>
          <p className="mt-1 text-xs text-on-surface-variant">
            Optional. Enter both fields to connect a public repository.
          </p>
        </div>

        <div className="w-full">
          <label
            htmlFor="project-github-owner"
            className="mb-2 block text-sm font-medium text-on-surface"
          >
            GitHub Owner
          </label>
          <input
            id="project-github-owner"
            type="text"
            placeholder="openai"
            maxLength={100}
            {...register("github_owner", {
              validate: (value) =>
                !value.trim() ||
                Boolean(getValues("github_repo").trim()) ||
                "Enter a repository when an owner is provided.",
            })}
            className="block w-full rounded-lg border border-outline-variant bg-surface-container-low px-4 py-3 text-sm text-on-surface outline-none transition-colors placeholder:text-on-surface-variant focus:border-primary focus:ring-1 focus:ring-primary"
          />
          {errors.github_owner && (
            <p className="mt-1 text-xs text-error">
              {errors.github_owner.message}
            </p>
          )}
        </div>

        <div className="w-full">
          <label
            htmlFor="project-github-repo"
            className="mb-2 block text-sm font-medium text-on-surface"
          >
            GitHub Repository
          </label>
          <input
            id="project-github-repo"
            type="text"
            placeholder="openai-python"
            maxLength={100}
            {...register("github_repo", {
              validate: (value) =>
                !value.trim() ||
                Boolean(getValues("github_owner").trim()) ||
                "Enter an owner when a repository is provided.",
            })}
            className="block w-full rounded-lg border border-outline-variant bg-surface-container-low px-4 py-3 text-sm text-on-surface outline-none transition-colors placeholder:text-on-surface-variant focus:border-primary focus:ring-1 focus:ring-primary"
          />
          {errors.github_repo && (
            <p className="mt-1 text-xs text-error">
              {errors.github_repo.message}
            </p>
          )}
        </div>
      </section>

      {/* Risk */}
      <div className="w-full">
        <label
          htmlFor="project-risk"
          className="mb-2 block text-sm font-medium text-on-surface"
        >
          Risk Level
        </label>

        <select
          id="project-risk"
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
            htmlFor="project-progress"
            className="text-sm font-medium text-on-surface"
          >
            Initial Progress
          </label>

          <span className="text-sm text-on-surface-variant">
            0%
          </span>
        </div>

        <input
          id="project-progress"
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
          Create Project
        </button>
      </div>
    </form>
  );
}

export default CreateProjectForm;