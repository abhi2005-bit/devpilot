import { useForm } from "react-hook-form";
import type {
  Issue,
  IssuePriority,
  IssueStatus,
} from "../../types/issue";

interface EditIssueFormProps {
  issue: Issue;
  onCancel: () => void;
  onSubmit: (
    updates: Partial<
      Pick<
        Issue,
        | "title"
        | "description"
        | "status"
        | "priority"
        | "assignee"
        | "labels"
      >
    >,
  ) => void;
}

interface FormValues {
  title: string;
  description: string;
  priority: IssuePriority;
  status: IssueStatus;
  assignee: string;
  labels: string;
}

function EditIssueForm({
  issue,
  onCancel,
  onSubmit,
}: EditIssueFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    defaultValues: {
      title: issue.title,
      description: issue.description,
      priority: issue.priority,
      status: issue.status,
      assignee: issue.assignee?.name ?? "",
      labels: issue.labels.join(", "),
    },
  });

  const submitForm = (data: FormValues) => {
    const labels = data.labels
      .split(",")
      .map((label) => label.trim())
      .filter(Boolean);

    onSubmit({
      title: data.title.trim(),
      description: data.description.trim(),
      priority: data.priority,
      status: data.status,
      assignee: data.assignee.trim()
        ? {
            id: issue.assignee?.id ?? `user-${Date.now()}`,
            name: data.assignee.trim(),
          }
        : undefined,
      labels,
    });
  };

  return (
    <form
      onSubmit={handleSubmit(submitForm)}
      className="space-y-lg"
    >
      {/* Title */}
      <div>
        <label
          htmlFor="edit-issue-title"
          className="mb-xs block text-body-sm font-medium text-on-surface"
        >
          Issue Title
        </label>

        <input
          id="edit-issue-title"
          type="text"
          {...register("title", {
            required: "Issue title is required.",
            minLength: {
              value: 3,
              message:
                "Title must contain at least 3 characters.",
            },
          })}
          className="w-full rounded-lg border border-outline-variant bg-surface-container-low px-md py-sm text-body-sm text-on-surface outline-none placeholder:text-on-surface-variant focus:border-primary"
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
          htmlFor="edit-issue-description"
          className="mb-xs block text-body-sm font-medium text-on-surface"
        >
          Description
        </label>

        <textarea
          id="edit-issue-description"
          rows={5}
          {...register("description", {
            required: "Description is required.",
            minLength: {
              value: 10,
              message:
                "Description must contain at least 10 characters.",
            },
          })}
          className="w-full resize-none rounded-lg border border-outline-variant bg-surface-container-low px-md py-sm text-body-sm text-on-surface outline-none placeholder:text-on-surface-variant focus:border-primary"
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
            htmlFor="edit-issue-priority"
            className="mb-xs block text-body-sm font-medium text-on-surface"
          >
            Priority
          </label>

          <select
            id="edit-issue-priority"
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
            htmlFor="edit-issue-status"
            className="mb-xs block text-body-sm font-medium text-on-surface"
          >
            Status
          </label>

          <select
            id="edit-issue-status"
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
          htmlFor="edit-issue-assignee"
          className="mb-xs block text-body-sm font-medium text-on-surface"
        >
          Assignee
        </label>

        <input
          id="edit-issue-assignee"
          type="text"
          placeholder="Enter assignee name"
          {...register("assignee")}
          className="w-full rounded-lg border border-outline-variant bg-surface-container-low px-md py-sm text-body-sm text-on-surface outline-none placeholder:text-on-surface-variant focus:border-primary"
        />
      </div>

      {/* Labels */}
      <div>
        <label
          htmlFor="edit-issue-labels"
          className="mb-xs block text-body-sm font-medium text-on-surface"
        >
          Labels
        </label>

        <input
          id="edit-issue-labels"
          type="text"
          placeholder="bug, frontend, urgent"
          {...register("labels")}
          className="w-full rounded-lg border border-outline-variant bg-surface-container-low px-md py-sm text-body-sm text-on-surface outline-none placeholder:text-on-surface-variant focus:border-primary"
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
          className="rounded-lg border border-outline-variant px-md py-sm text-body-sm font-medium text-on-surface hover:bg-surface-container-high"
        >
          Cancel
        </button>

        <button
          type="submit"
          disabled={isSubmitting}
          className="flex items-center gap-sm rounded-lg bg-primary px-md py-sm text-body-sm font-bold text-on-primary hover:bg-primary-container disabled:cursor-not-allowed disabled:opacity-60"
        >
          <span className="material-symbols-outlined text-body-md">
            save
          </span>

          Save Changes
        </button>
      </div>
    </form>
  );
}

export default EditIssueForm;