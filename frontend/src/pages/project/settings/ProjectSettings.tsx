import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { projectService } from "../../../services/projectService";
import { errorMessage } from "../../../services/apiClient";
import EditProjectForm from "../../../components/projects/EditProjectForm";
import type { Project } from "../../../types/project";

function ProjectSettings() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();

  const [project, setProject] = useState<Project | undefined>();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [success, setSuccess] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadProject() {
      if (!projectId) return;
      setIsLoading(true);
      setError("");
      setProject(undefined);
      try {
        const loadedProject = await projectService.getById(projectId);
        if (!cancelled) {
          setProject(loadedProject);
          if (!loadedProject) setError("Project not found (HTTP 404).");
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(errorMessage(loadError, "Unable to load project settings."));
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    loadProject();

    return () => {
      cancelled = true;
    };
  }, [projectId, reloadKey]);

  const handleEditProject = async (updatedProject: Project) => {
    try {
      setError("");
      setSuccess("");
      const result = await projectService.update(updatedProject);
      setProject(result);
      setSuccess("Project updated successfully.");
      
      // Auto-hide success message after 3 seconds
      setTimeout(() => setSuccess(""), 3000);
    } catch (updateError) {
      setError(errorMessage(updateError, "Unable to update project."));
    }
  };

  const handleCancel = () => {
    // Navigating back to project overview
    navigate(`/projects/${projectId}`);
  };

  const handleDelete = async () => {
    if (!project) return;
    const confirmDelete = window.confirm(
      `Are you sure you want to delete project "${project.name}"? This action cannot be undone.`
    );
    
    if (!confirmDelete) return;

    try {
      setIsDeleting(true);
      await projectService.delete(project.id);
      navigate("/projects", { replace: true });
    } catch {
      setError("Failed to delete the project.");
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-64 items-center justify-center rounded-xl border border-outline-variant bg-surface-container">
        <div className="text-center">
          <span className="material-symbols-outlined animate-spin text-4xl text-primary">
            progress_activity
          </span>
          <p className="mt-md text-body-sm text-on-surface-variant">
            Loading settings...
          </p>
        </div>
      </div>
    );
  }

  if (error && !project) {
    return (
      <div role="alert" className="flex flex-col gap-md rounded-xl border border-error/30 bg-error-container p-md text-error sm:flex-row sm:items-center sm:justify-between">
        <p className="min-w-0 break-words">{error}</p>
        <button type="button" onClick={() => setReloadKey((key) => key + 1)} className="w-fit shrink-0 rounded-lg border border-error/30 px-md py-sm font-semibold hover:bg-error/10">Retry</button>
      </div>
    );
  }

  if (!project) {
    return <div className="rounded-xl border border-outline-variant bg-surface-container p-md text-on-surface-variant">Project not found.</div>;
  }

  return (
    <div className="space-y-lg max-w-2xl">
      <div>
        <h2 className="text-title-lg font-bold text-on-surface">Settings</h2>
        <p className="mt-xs text-body-sm text-on-surface-variant">
          Update project details, GitHub connection, and risk profile.
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-error/30 bg-error-container p-md text-error">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-xl border border-secondary/30 bg-secondary-container p-md text-on-secondary-container font-medium">
          {success}
        </div>
      )}

      <div className="rounded-xl border border-outline-variant bg-surface-container p-lg">
        <EditProjectForm
          project={project}
          onSubmit={handleEditProject}
          onCancel={handleCancel}
        />
      </div>

      {/* Danger Zone */}
      <div className="mt-xl pt-lg border-t border-error/30">
        <h3 className="text-title-md font-bold text-error">Danger Zone</h3>
        <p className="mt-xs text-body-sm text-on-surface-variant mb-md">
          Irreversible and destructive actions.
        </p>
        
        <div className="rounded-xl border border-error/30 bg-surface-container p-lg flex flex-col sm:flex-row sm:items-center justify-between gap-md">
          <div>
            <h4 className="font-semibold text-on-surface">Delete this project</h4>
            <p className="text-body-sm text-on-surface-variant mt-xs">
              Once deleted, it will be gone forever. Please be certain.
            </p>
          </div>
          
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="rounded-lg bg-error text-on-error px-md py-sm font-bold transition-colors hover:bg-error-container hover:text-error disabled:opacity-50 whitespace-nowrap"
          >
            {isDeleting ? "Deleting..." : "Delete Project"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ProjectSettings;
