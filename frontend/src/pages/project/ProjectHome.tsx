import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import { projectService } from "../../services/projectService";
import EngineeringIntelligence from "../../components/dashboard/EngineeringIntelligence";

import type { Project } from "../../types/project";

function ProjectHome() {
  const { projectId } = useParams<{
    projectId: string;
  }>();

  const [project, setProject] = useState<Project | undefined>();
  const [isLoading, setIsLoading] = useState(true);

  /*
   * Load project
   */
  useEffect(() => {
    let cancelled = false;

    async function loadProject() {
      if (!projectId) {
        setProject(undefined);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);

      try {
        const loadedProject = await projectService.getById(projectId);

        if (!cancelled) {
          setProject(loadedProject);
        }
      } catch {
        if (!cancelled) {
          setProject(undefined);
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
  }, [projectId]);

  /*
   * Loading project
   */
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

  /*
   * Project not found
   */
  if (!project) {
    return (
      <div className="flex min-h-64 items-center justify-center rounded-xl border border-outline-variant bg-surface-container">
        <div className="text-center">
          <span className="material-symbols-outlined text-5xl text-on-surface-variant">
            folder_off
          </span>

          <h2 className="mt-md text-title-sm font-semibold text-on-surface">
            Project not found
          </h2>

          <p className="mt-xs text-body-sm text-on-surface-variant">
            This project could not be loaded.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-lg">
      {/* Engineering Intelligence */}
      <EngineeringIntelligence projectId={projectId!} />

      {/* Project Team */}
      <section>
        <div className="rounded-xl border border-outline-variant bg-surface-container p-lg">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-title-sm font-semibold text-on-surface">
                Project Team
              </h2>

              <p className="mt-xs text-caption text-on-surface-variant">
                Members currently working on this project
              </p>
            </div>

            <span className="material-symbols-outlined text-secondary">
              group
            </span>
          </div>

          <div className="mt-lg flex flex-wrap gap-sm">
            {project.members.length === 0 ? (
              <p className="text-body-sm text-on-surface-variant">
                No team members assigned yet.
              </p>
            ) : (
              project.members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center gap-sm rounded-lg bg-surface-container-low px-sm py-sm"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-container-highest text-caption font-semibold text-on-surface">
                    {member.name.charAt(0).toUpperCase()}
                  </div>

                  <div>
                    <span className="block text-body-sm font-medium text-on-surface">
                      {member.name}
                    </span>

                    {member.role && (
                      <span className="block text-caption text-on-surface-variant">
                        {member.role}
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

export default ProjectHome;
