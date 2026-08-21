export type IssueStatus =
  | "TODO"
  | "IN_PROGRESS"
  | "IN_REVIEW"
  | "DONE";

export type IssuePriority =
  | "LOW"
  | "MEDIUM"
  | "HIGH"
  | "CRITICAL";

export interface IssueAssignee {
  id: string;
  name: string;
  avatar?: string;
}

export interface Issue {
  id: string;
  projectId: string;
  title: string;
  description: string;
  status: IssueStatus;
  priority: IssuePriority;
  assignee?: IssueAssignee;
  labels: string[];
  createdAt: string;
  updatedAt: string;
}