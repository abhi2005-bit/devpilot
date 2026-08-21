import { useForm } from "react-hook-form";
import type {
  Issue,
  IssuePriority,
  IssueStatus,
} from "../../types/issue";

interface CreateIssueFormProps {
  projectId: string;
  onCancel: () => void;
  onSubmit: (issue: Issue) => void;
}

interface FormValues {
  title: string;
  description: string;
  priority: IssuePriority;
  status: IssueStatus;
  assignee: string;
  labels: string;
}

const defaultValues: FormValues = {
  title: "",
  description: "",
  priority: "MEDIUM",
  status: "TODO",
  assignee: "",
  labels: "",
};

function CreateIssueForm({
  projectId,
  onCancel,
  onSubmit,
}: CreateIssueFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    defaultValues,
  });

  const submitForm = (data: FormValues) => {
    const labels = data.labels
      .split(",")
      .map((label) => label.trim())
      .filter(Boolean);

    const now = new Date().toISOString();

    const newIssue: Issue = {
      id: `issue-${Date.now()}`,
      projectId,
      title: data.title.trim(),
      description: data.description.trim(),
      status: data.status,
      priority: data.priority,
      assignee: data.assignee.trim()
        ? {
            id: `user-${Date.now()}`,
            name: data.assignee.trim(),
          }
        : undefined,
      labels,
      createdAt: now,
      updatedAt: now,
    };

    onSubmit(newIssue);
    reset(defaultValues);
  };

  return (
    <form
      onSubmit={handleSubmit(submitForm)}
      className="space-y-lg"
    >
      {/* Title */}
      <div>
        <label
          htmlFor="issue-title"
          className="mb-xs block text-body-sm font-medium text-on-surface"
        >
          Issue Title
        </label>

        <input
          id="issue-title"
          type="text"
          placeholder="Enter issue title"
          {...register("title", {
            required: "Issue title is required.",
            minLength: {
              value: 3,
              message:
                "Title must contain at least 3 characters.",
            },
          })}
          className="w-full rounded-lg border border-outline-variant bg-surface-container-low px-md py-sm text-body-sm text-on-surface outline-none transition-colors placeholder:text-on-surface-variant focus:border-primary"
        />

        {errors.title && (
          <p className="mt-xs text-caption text-error">
            {errors.title.message}
          </p>
        )}
      </div>

      {/* Description */}
      <div>
        <label
          htmlFor="issue-description"
          className="mb-xs block text-body-sm font-medium text-on-surface"
        >
          Description
        </label>

        <textarea
          id="issue-description"
          rows={4}
          placeholder="Describe the issue..."
          {...register("description", {
            required: "Description is required.",
            minLength: {
              value: 10,
              message:
                "Description must contain at least 10 characters.",
            },
          })}
          className="w-full resize-none rounded-lg border border-outline-variant bg-surface-container-low px-md py-sm text-body-sm text-on-surface outline-none transition-colors placeholder:text-on-surface-variant focus:border-primary"
        />

        {errors.description && (
          <p className="mt-xs text-caption text-error">
            {errors.description.message}
          </p>
        )}
      </div>

      {/* Priority + Status */}
      <div className="grid grid-cols-1 gap-md sm:grid-cols-2">
        <div>
          <label
            htmlFor="issue-priority"
            className="mb-xs block text-body-sm font-medium text-on-surface"
          >
            Priority
          </label>

          <select
            id="issue-priority"
            {...register("priority")}
            className="w-full rounded-lg border border-outline-variant bg-surface-container-low px-md py-sm text-body-sm text-on-surface outline-none focus:border-primary"
          >
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="CRITICAL">Critical</option>
          </select>
        </div>

        <div>
          <label
            htmlFor="issue-status"
            className="mb-xs block text-body-sm font-medium text-on-surface"
          >
            Status
          </label>

          <select
            id="issue-status"
            {...register("status")}
            className="w-full rounded-lg border border-outline-variant bg-surface-container-low px-md py-sm text-body-sm text-on-surface outline-none focus:border-primary"
          >
            <option value="TODO">To Do</option>
            <option value="IN_PROGRESS">
              In Progress
            </option>
            <option value="IN_REVIEW">In Review</option>
            <option value="DONE">Done</option>
          </select>
        </div>
      </div>

      {/* Assignee */}
      <div>
        <label
          htmlFor="issue-assignee"
          className="mb-xs block text-body-sm font-medium text-on-surface"
        >
          Assignee
        </label>

        <input
          id="issue-assignee"
          type="text"
          placeholder="Enter assignee name"
          {...register("assignee")}
          className="w-full rounded-lg border border-outline-variant bg-surface-container-low px-md py-sm text-body-sm text-on-surface outline-none transition-colors placeholder:text-on-surface-variant focus:border-primary"
        />

        <p className="mt-xs text-caption text-on-surface-variant">
          Leave empty if the issue is unassigned.
        </p>
      </div>

      {/* Labels */}
      <div>
        <label
          htmlFor="issue-labels"
          className="mb-xs block text-body-sm font-medium text-on-surface"
        >
          Labels
        </label>

        <input
          id="issue-labels"
          type="text"
          placeholder="bug, frontend, urgent"
          {...register("labels")}
          className="w-full rounded-lg border border-outline-variant bg-surface-container-low px-md py-sm text-body-sm text-on-surface outline-none transition-colors placeholder:text-on-surface-variant focus:border-primary"
        />

        <p className="mt-xs text-caption text-on-surface-variant">
          Separate multiple labels with commas.
        </p>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-sm border-t border-outline-variant pt-lg">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-outline-variant px-md py-sm text-body-sm font-medium text-on-surface transition-colors hover:bg-surface-container-high"
        >
          Cancel
        </button>

        <button
          type="submit"
          disabled={isSubmitting}
          className="flex items-center gap-sm rounded-lg bg-primary px-md py-sm text-body-sm font-bold text-on-primary transition-colors hover:bg-primary-container disabled:cursor-not-allowed disabled:opacity-60"
        >
          <span className="material-symbols-outlined text-body-md">
            add
          </span>

          Create Issue
        </button>
      </div>
    </form>
  );
}

export default CreateIssueForm;