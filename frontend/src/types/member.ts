import type { ProjectMemberRole } from "./project";

export interface ProjectMember {
  id: string;
  name: string;
  email: string;
  role: Exclude<ProjectMemberRole, "OWNER">;
}

export interface User {
  id: string;
  name: string;
  email: string;
}