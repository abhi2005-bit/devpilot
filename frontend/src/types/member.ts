import type { ProjectMemberRole } from "./project";

export interface ProjectMember {
  id: string;
  name: string;
  email: string;
  role: ProjectMemberRole;
}

export interface User {
  id: string;
  name: string;
  email: string;
}