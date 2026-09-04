import type {
  Issue,
  IssuePriority,
  IssueStatus,
} from "../types/issue";
import API_URL_BASE from "../config/api";

const API_URL =
  `${API_URL_BASE}/issues`;

type BackendIssue = {
  id: number;
  project_id: number;
  assignee_id: number | null;
  title: string;
  description: string;
  status: IssueStatus;
  priority: IssuePriority;
};

type FrontendIssueInput = Omit<
  Issue,
  "id" | "createdAt" | "updatedAt"
>;

type IssueUpdateFields = Partial<
  Pick<
    Issue,
    | "title"
    | "description"
    | "status"
    | "priority"
    | "assignee"
    | "labels"
  >
>;

function toFrontendIssue(
  issue: BackendIssue,
): Issue {
  const now = new Date().toISOString();

  return {
    id: String(issue.id),
    projectId: String(issue.project_id),
    title: issue.title,
    description: issue.description ?? "",
    status: issue.status,
    priority: issue.priority,
    assignee: issue.assignee_id
      ? {
          id: String(issue.assignee_id),
          name: `User ${issue.assignee_id}`,
        }
      : undefined,
    labels: [],
    createdAt: now,
    updatedAt: now,
  };
}

function getAssigneeId(
  assignee: Issue["assignee"],
): number | null {
  if (!assignee) {
    return null;
  }

  const parsedId = Number(assignee.id);

  return Number.isInteger(parsedId)
    ? parsedId
    : null;
}

export const issueService = {

  async getAll(): Promise<Issue[]> {
    const response = await fetch(API_URL);

    if (!response.ok) {
      throw new Error("Failed to load issues");
    }

    const data: BackendIssue[] =
      await response.json();

    return data.map(toFrontendIssue);
  },

  async getByProject(
    projectId: string,
  ): Promise<Issue[]> {
    const response = await fetch(
      `${API_URL}?project_id=${encodeURIComponent(
        projectId,
      )}`,
    );

    if (!response.ok) {
      throw new Error(
        "Failed to load project issues",
      );
    }

    const data: BackendIssue[] =
      await response.json();

    return data.map(toFrontendIssue);
  },

  async getIssue(
    issueId: string,
  ): Promise<Issue | undefined> {
    const response = await fetch(
      `${API_URL}/${issueId}`,
    );

    if (response.status === 404) {
      return undefined;
    }

    if (!response.ok) {
      throw new Error("Failed to load issue");
    }

    const data: BackendIssue =
      await response.json();

    return toFrontendIssue(data);
  },

  async createIssue(
    issue: FrontendIssueInput,
  ): Promise<Issue> {

    const response = await fetch(API_URL, {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        project_id: Number(issue.projectId),
        assignee_id: getAssigneeId(
          issue.assignee,
        ),
        title: issue.title,
        description: issue.description,
        status: issue.status,
        priority: issue.priority,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to create issue");
    }

    const data: BackendIssue =
      await response.json();

    return toFrontendIssue(data);
  },

  async updateIssue(
    issueId: string,
    updates: IssueUpdateFields,
  ): Promise<Issue | undefined> {

    const body: Record<
      string,
      string | number | null
    > = {};

    if (updates.title !== undefined) {
      body.title = updates.title;
    }

    if (updates.description !== undefined) {
      body.description = updates.description;
    }

    if (updates.status !== undefined) {
      body.status = updates.status;
    }

    if (updates.priority !== undefined) {
      body.priority = updates.priority;
    }

    if (updates.assignee !== undefined) {
      body.assignee_id = getAssigneeId(
        updates.assignee,
      );
    }

    const response = await fetch(
      `${API_URL}/${issueId}`,
      {
        method: "PUT",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify(body),
      },
    );

    if (response.status === 404) {
      return undefined;
    }

    if (!response.ok) {
      throw new Error("Failed to update issue");
    }

    const data: BackendIssue =
      await response.json();

    return toFrontendIssue(data);
  },

  async updateIssueStatus(
    issueId: string,
    status: IssueStatus,
  ): Promise<Issue | undefined> {
    return this.updateIssue(
      issueId,
      { status },
    );
  },

  async updateIssuePriority(
    issueId: string,
    priority: IssuePriority,
  ): Promise<Issue | undefined> {
    return this.updateIssue(
      issueId,
      { priority },
    );
  },

  async deleteIssue(
    issueId: string,
  ): Promise<boolean> {

    const response = await fetch(
      `${API_URL}/${issueId}`,
      {
        method: "DELETE",
      },
    );

    if (response.status === 404) {
      return false;
    }

    if (!response.ok) {
      throw new Error("Failed to delete issue");
    }

    return true;
  },
};