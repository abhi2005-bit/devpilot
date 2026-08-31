import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import Modal from "../../../components/common/Modal";
import EditIssueForm from "../../../components/issues/EditIssueForm";

import { issueService } from "../../../services/issueService";
import { memberService } from "../../../services/memberService";
import { commentService } from "../../../services/commentService";

import type {
  Issue,
  IssuePriority,
  IssueStatus,
} from "../../../types/issue";
import type { ProjectMember } from "../../../types/member";
import type { IssueComment } from "../../../types/comment";


const statusLabels: Record<IssueStatus, string> = {
  TODO: "To Do",
  IN_PROGRESS: "In Progress",
  IN_REVIEW: "In Review",
  DONE: "Done",
};


const priorityLabels: Record<IssuePriority, string> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
  CRITICAL: "Critical",
};


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


function IssueDetail() {
  const { projectId, issueId } = useParams<{
    projectId: string;
    issueId: string;
  }>();

  const navigate = useNavigate();


  const [issue, setIssue] = useState<Issue | undefined>();
  const [members, setMembers] = useState<ProjectMember[]>([]);

  // Comments
  const [comments, setComments] = useState<IssueComment[]>([]);
  const [commentText, setCommentText] = useState("");
  const [isLoadingComments, setIsLoadingComments] =
    useState(false);
  const [isSubmittingComment, setIsSubmittingComment] =
    useState(false);


  const [isLoading, setIsLoading] = useState(true);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [error, setError] = useState("");


  /*
   * Load the real issue, project members,
   * and comments from the backend.
   */
  useEffect(() => {
    if (!issueId || !projectId) {
      setError("Invalid project or issue.");
      setIsLoading(false);
      return;
    }

    const loadData = async () => {
      try {
        setIsLoading(true);
        setIsLoadingComments(true);
        setError("");

        const [
          loadedIssue,
          loadedMembers,
          loadedComments,
        ] = await Promise.all([
          issueService.getIssue(issueId),
          memberService.getMembers(projectId),
          commentService.getComments(issueId),
        ]);

        if (!loadedIssue) {
          setIssue(undefined);
          return;
        }

        /*
         * Make sure the issue actually belongs
         * to the project in the URL.
         */
        if (
          String(loadedIssue.projectId) !==
          String(projectId)
        ) {
          setIssue(undefined);
          return;
        }

        setIssue(loadedIssue);
        setMembers(loadedMembers);
        setComments(loadedComments);
      } catch (err) {
        console.error(err);

        setError(
          "Failed to load the issue. Please try again.",
        );
      } finally {
        setIsLoading(false);
        setIsLoadingComments(false);
      }
    };

    void loadData();
  }, [issueId, projectId]);


  /*
   * Update issue
   */
  const handleUpdate = async (
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
  ) => {
    if (!issue) {
      return;
    }

    try {
      setError("");

      const updatedIssue =
        await issueService.updateIssue(
          issue.id,
          updates,
        );

      if (!updatedIssue) {
        setError(
          "Unable to update this issue.",
        );
        return;
      }

      setIssue(updatedIssue);
      setIsEditOpen(false);
    } catch (err) {
      console.error(err);

      setError(
        "Failed to update the issue. Please try again.",
      );
    }
  };


  /*
   * Delete issue
   */
  const handleDelete = async () => {
    if (!issue) {
      return;
    }

    try {
      setError("");
      setIsDeleting(true);

      const deleted =
        await issueService.deleteIssue(
          issue.id,
        );

      if (!deleted) {
        setError(
          "Unable to delete this issue.",
        );
        setIsDeleting(false);
        return;
      }

      navigate(
        `/projects/${projectId}/issues`,
      );
    } catch (err) {
      console.error(err);

      setError(
        "Failed to delete the issue. Please try again.",
      );

      setIsDeleting(false);
    }
  };


  /*
   * Add comment
   */
  const handleAddComment = async () => {
    const content = commentText.trim();

    if (!content || !issueId) {
      return;
    }

    try {
      setIsSubmittingComment(true);
      setError("");

      const newComment =
        await commentService.createComment(
          issueId,
          {
            content,
          },
        );

      setComments((current) => [
        ...current,
        newComment,
      ]);

      setCommentText("");
    } catch (err) {
      console.error(err);

      setError(
        "Failed to add comment. Please try again.",
      );
    } finally {
      setIsSubmittingComment(false);
    }
  };


  /*
   * Loading state
   */
  if (isLoading) {
    return (
      <section className="flex min-h-96 items-center justify-center rounded-xl border border-outline-variant bg-surface-container-low">
        <div className="text-center">
          <span className="material-symbols-outlined animate-spin text-4xl text-primary">
            progress_activity
          </span>

          <p className="mt-md text-body-sm text-on-surface-variant">
            Loading issue...
          </p>
        </div>
      </section>
    );
  }


  /*
   * Issue not found
   */
  if (!issue) {
    return (
      <section className="flex min-h-96 items-center justify-center rounded-xl border border-dashed border-outline-variant bg-surface-container-low">
        <div className="text-center">
          <span className="material-symbols-outlined text-5xl text-on-surface-variant">
            error_outline
          </span>

          <h2 className="mt-md text-title-sm font-semibold text-on-surface">
            Issue not found
          </h2>

          <p className="mt-xs text-body-sm text-on-surface-variant">
            The issue you're looking for does not exist.
          </p>

          <button
            type="button"
            onClick={() =>
              navigate(
                `/projects/${projectId}/issues`,
              )
            }
            className="mt-lg rounded-lg bg-primary px-md py-sm text-body-sm font-bold text-on-primary"
          >
            Back to Issues
          </button>
        </div>
      </section>
    );
  }


  return (
    <div className="space-y-lg">

      {/* Back */}
      <button
        type="button"
        onClick={() =>
          navigate(
            `/projects/${projectId}/issues`,
          )
        }
        className="flex items-center gap-xs text-body-sm font-medium text-on-surface-variant hover:text-primary"
      >
        <span className="material-symbols-outlined text-body-md">
          arrow_back
        </span>

        Back to Issues
      </button>


      {/* Header */}
      <section className="rounded-xl border border-outline-variant bg-surface-container p-lg">
        <div className="flex flex-col gap-lg lg:flex-row lg:items-start lg:justify-between">

          <div className="min-w-0">

            <div className="flex flex-wrap items-center gap-sm">

              <span className="text-caption font-medium text-on-surface-variant">
                #{issue.id}
              </span>

              <span
                className={`rounded-full px-sm py-xs text-caption font-semibold ${getPriorityClass(
                  issue.priority,
                )}`}
              >
                {priorityLabels[issue.priority]}
              </span>

              <span
                className={`rounded-full px-sm py-xs text-caption font-semibold ${getStatusClass(
                  issue.status,
                )}`}
              >
                {statusLabels[issue.status]}
              </span>

            </div>


            <h1 className="mt-md text-display-sm font-bold text-on-surface">
              {issue.title}
            </h1>


            <p className="mt-sm max-w-3xl text-body-md leading-relaxed text-on-surface-variant">
              {issue.description}
            </p>

          </div>


          {/* Actions */}
          <div className="flex shrink-0 gap-sm">

            <button
              type="button"
              onClick={() =>
                setIsEditOpen(true)
              }
              className="flex items-center gap-sm rounded-lg border border-outline-variant bg-surface-container-low px-md py-sm text-body-sm font-medium text-on-surface hover:bg-surface-container-high"
            >
              <span className="material-symbols-outlined text-body-md">
                edit
              </span>

              Edit
            </button>


            <button
              type="button"
              onClick={() =>
                setIsDeleteOpen(true)
              }
              className="flex items-center gap-sm rounded-lg border border-error bg-error-container px-md py-sm text-body-sm font-medium text-error hover:opacity-80"
            >
              <span className="material-symbols-outlined text-body-md">
                delete
              </span>

              Delete
            </button>

          </div>

        </div>
      </section>


      {/* Error */}
      {error && (
        <div className="rounded-lg border border-error bg-error-container px-md py-sm text-body-sm text-error">
          {error}
        </div>
      )}


      {/* Main Content */}
      <div className="grid grid-cols-1 gap-lg xl:grid-cols-3">

        {/* Left */}
        <section className="space-y-lg xl:col-span-2">

          {/* Description */}
          <div className="rounded-xl border border-outline-variant bg-surface-container p-lg">

            <h2 className="text-title-sm font-semibold text-on-surface">
              Description
            </h2>

            <p className="mt-md whitespace-pre-wrap text-body-sm leading-relaxed text-on-surface-variant">
              {issue.description}
            </p>

          </div>


          {/* Labels */}
          <div className="rounded-xl border border-outline-variant bg-surface-container p-lg">

            <h2 className="text-title-sm font-semibold text-on-surface">
              Labels
            </h2>

            {issue.labels.length > 0 ? (
              <div className="mt-md flex flex-wrap gap-sm">

                {issue.labels.map(
                  (label: string) => (
                    <span
                      key={label}
                      className="rounded-md bg-surface-container-high px-sm py-xs text-caption text-on-surface-variant"
                    >
                      {label}
                    </span>
                  ),
                )}

              </div>
            ) : (
              <p className="mt-md text-body-sm text-on-surface-variant">
                No labels assigned.
              </p>
            )}

          </div>


          {/* Activity / Comments */}
          <div className="rounded-xl border border-outline-variant bg-surface-container p-lg">

            <div className="flex items-center justify-between">

              <h2 className="text-title-sm font-semibold text-on-surface">
                Activity
              </h2>

              <span className="material-symbols-outlined text-on-surface-variant">
                history
              </span>

            </div>


            {/* Comments */}
            <div className="mt-lg space-y-md">

              {isLoadingComments ? (
                <div className="flex items-center justify-center py-lg">

                  <span className="material-symbols-outlined animate-spin text-2xl text-primary">
                    progress_activity
                  </span>

                </div>
              ) : comments.length === 0 ? (

                <div className="rounded-lg bg-surface-container-low p-md">

                  <p className="text-body-sm text-on-surface-variant">
                    No comments yet. Start the discussion below.
                  </p>

                </div>
              ) : (

                comments.map((comment) => (

                  <div
                    key={comment.id}
                    className="rounded-lg border border-outline-variant bg-surface-container-low p-md"
                  >

                    <div className="flex items-start gap-sm">

                      {/* Avatar */}
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-container text-caption font-bold text-primary">
                        {comment.author_name
                          .charAt(0)
                          .toUpperCase()}
                      </div>


                      <div className="min-w-0 flex-1">

                        {/* Author + Date */}
                        <div className="flex flex-wrap items-center gap-sm">

                          <span className="text-body-sm font-semibold text-on-surface">
                            {comment.author_name}
                          </span>

                          <span className="text-caption text-on-surface-variant">
                            {new Date(
                              comment.created_at,
                            ).toLocaleString()}
                          </span>

                        </div>


                        {/* Comment */}
                        <p className="mt-sm whitespace-pre-wrap text-body-sm leading-relaxed text-on-surface-variant">
                          {comment.content}
                        </p>

                      </div>

                    </div>

                  </div>

                ))
              )}

            </div>


            {/* Add Comment */}
            <div className="mt-lg border-t border-outline-variant pt-lg">

              <label
                htmlFor="issue-comment"
                className="mb-xs block text-body-sm font-medium text-on-surface"
              >
                Add a comment
              </label>


              <textarea
                id="issue-comment"
                value={commentText}
                onChange={(event) =>
                  setCommentText(
                    event.target.value,
                  )
                }
                placeholder="Write a comment..."
                rows={4}
                disabled={isSubmittingComment}
                className="w-full resize-none rounded-lg border border-outline-variant bg-surface-container-low px-md py-sm text-body-sm text-on-surface outline-none placeholder:text-on-surface-variant focus:border-primary disabled:opacity-60"
              />


              <div className="mt-sm flex justify-end">

                <button
                  type="button"
                  onClick={handleAddComment}
                  disabled={
                    isSubmittingComment ||
                    !commentText.trim()
                  }
                  className="flex items-center gap-sm rounded-lg bg-primary px-md py-sm text-body-sm font-bold text-on-primary transition-colors hover:bg-primary-container disabled:cursor-not-allowed disabled:opacity-50"
                >

                  <span className="material-symbols-outlined text-body-md">
                    {isSubmittingComment
                      ? "progress_activity"
                      : "send"}
                  </span>

                  {isSubmittingComment
                    ? "Posting..."
                    : "Add Comment"}

                </button>

              </div>

            </div>

          </div>

        </section>


        {/* Right Sidebar */}
        <aside>

          <div className="rounded-xl border border-outline-variant bg-surface-container p-lg">

            <h2 className="text-title-sm font-semibold text-on-surface">
              Issue Details
            </h2>


            <div className="mt-lg space-y-lg">

              {/* Status */}
              <div>

                <p className="text-caption text-on-surface-variant">
                  Status
                </p>

                <span
                  className={`mt-xs inline-flex rounded-full px-sm py-xs text-caption font-semibold ${getStatusClass(
                    issue.status,
                  )}`}
                >
                  {statusLabels[issue.status]}
                </span>

              </div>


              {/* Priority */}
              <div>

                <p className="text-caption text-on-surface-variant">
                  Priority
                </p>

                <span
                  className={`mt-xs inline-flex rounded-full px-sm py-xs text-caption font-semibold ${getPriorityClass(
                    issue.priority,
                  )}`}
                >
                  {priorityLabels[issue.priority]}
                </span>

              </div>


              {/* Assignee */}
              <div>

                <p className="text-caption text-on-surface-variant">
                  Assignee
                </p>

                {issue.assignee ? (

                  <div className="mt-sm flex items-center gap-sm">

                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-container-highest text-caption font-semibold text-on-surface">
                      {issue.assignee.name
                        .charAt(0)
                        .toUpperCase()}
                    </div>

                    <span className="text-body-sm font-medium text-on-surface">
                      {issue.assignee.name}
                    </span>

                  </div>

                ) : (

                  <p className="mt-xs text-body-sm text-on-surface-variant">
                    Unassigned
                  </p>

                )}

              </div>


              {/* Created */}
              <div>

                <p className="text-caption text-on-surface-variant">
                  Created
                </p>

                <p className="mt-xs text-body-sm text-on-surface">
                  {issue.createdAt
                    ? new Date(
                        issue.createdAt,
                      ).toLocaleDateString()
                    : "Unknown"}
                </p>

              </div>


              {/* Updated */}
              <div>

                <p className="text-caption text-on-surface-variant">
                  Last Updated
                </p>

                <p className="mt-xs text-body-sm text-on-surface">
                  {issue.updatedAt
                    ? new Date(
                        issue.updatedAt,
                      ).toLocaleDateString()
                    : "Unknown"}
                </p>

              </div>

            </div>

          </div>

        </aside>

      </div>


      {/* Edit Modal */}
      <Modal
        isOpen={isEditOpen}
        onClose={() =>
          setIsEditOpen(false)
        }
        title="Edit Issue"
      >
        <EditIssueForm
          issue={issue}
          members={members}
          onCancel={() =>
            setIsEditOpen(false)
          }
          onSubmit={handleUpdate}
        />
      </Modal>


      {/* Delete Modal */}
      <Modal
        isOpen={isDeleteOpen}
        onClose={() => {
          if (!isDeleting) {
            setIsDeleteOpen(false);
          }
        }}
        title="Delete Issue"
      >

        <div className="space-y-lg">

          <div className="flex items-start gap-md rounded-lg bg-error-container p-md">

            <span className="material-symbols-outlined shrink-0 text-error">
              warning
            </span>

            <div>

              <h3 className="text-body-md font-semibold text-error">
                Delete this issue?
              </h3>

              <p className="mt-xs text-body-sm text-error">
                This action cannot be undone. The issue will be permanently removed.
              </p>

            </div>

          </div>


          <div>

            <p className="text-body-sm text-on-surface-variant">
              You are about to delete:
            </p>

            <p className="mt-xs font-semibold text-on-surface">
              {issue.title}
            </p>

          </div>


          <div className="flex justify-end gap-sm border-t border-outline-variant pt-lg">

            <button
              type="button"
              disabled={isDeleting}
              onClick={() =>
                setIsDeleteOpen(false)
              }
              className="rounded-lg border border-outline-variant px-md py-sm text-body-sm font-medium text-on-surface hover:bg-surface-container-high disabled:opacity-50"
            >
              Cancel
            </button>


            <button
              type="button"
              disabled={isDeleting}
              onClick={handleDelete}
              className="flex items-center gap-sm rounded-lg bg-error px-md py-sm text-body-sm font-bold text-on-error hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-50"
            >

              <span className="material-symbols-outlined text-body-md">
                delete
              </span>

              {isDeleting
                ? "Deleting..."
                : "Delete Issue"}

            </button>

          </div>

        </div>

      </Modal>

    </div>
  );
}


export default IssueDetail;