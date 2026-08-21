import type { Project } from "../types/project";
import { projects as initialProjects } from "../data/projects";

const STORAGE_KEY = "devpilot_projects";

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function saveProjects(projectList: Project[]): void {
  if (!isBrowser()) {
    return;
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(projectList));
}

function loadProjects(): Project[] {
  if (!isBrowser()) {
    return initialProjects;
  }

  try {
    const storedProjects = localStorage.getItem(STORAGE_KEY);

    if (!storedProjects) {
      saveProjects(initialProjects);
      return initialProjects;
    }

    const parsedProjects: unknown = JSON.parse(storedProjects);

    if (!Array.isArray(parsedProjects)) {
      saveProjects(initialProjects);
      return initialProjects;
    }

    return parsedProjects as Project[];
  } catch {
    saveProjects(initialProjects);
    return initialProjects;
  }
}

export const projectService = {
  getAll(): Project[] {
    return loadProjects();
  },

  getById(id: string): Project | undefined {
    return loadProjects().find((project) => project.id === id);
  },

  create(project: Project): Project {
    const currentProjects = loadProjects();

    const updatedProjects = [...currentProjects, project];

    saveProjects(updatedProjects);

    return project;
  },

  update(project: Project): Project {
    const currentProjects = loadProjects();

    const updatedProjects = currentProjects.map((currentProject) =>
      currentProject.id === project.id ? project : currentProject,
    );

    saveProjects(updatedProjects);

    return project;
  },

  delete(id: string): void {
    const currentProjects = loadProjects();

    const updatedProjects = currentProjects.filter(
      (project) => project.id !== id,
    );

    saveProjects(updatedProjects);
  },

  reset(): void {
    saveProjects(initialProjects);
  },
};