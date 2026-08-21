import type {
  Issue,
  IssuePriority,
  IssueStatus,
} from "../types/issue";
import { issues as initialIssues } from "../data/issues";

const STORAGE_KEY = "devpilot_issues";

const delay = (ms: number) =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });

function cloneIssue(issue: Issue): Issue {
  return {
    ...issue,
    labels: [...issue.labels],
    assignee: issue.assignee
      ? { ...issue.assignee }
      : undefined,
  };
}

function cloneIssues(issueList: Issue[]): Issue[] {
  return issueList.map(cloneIssue);
}

function loadIssues(): Issue[] {
  if (typeof window === "undefined") {
    return cloneIssues(initialIssues);
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);

    if (!stored) {
      const defaults = cloneIssues(initialIssues);

      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(defaults),
      );

      return defaults;
    }

    const parsed: unknown = JSON.parse(stored);

    if (!Array.isArray(parsed)) {
      const defaults = cloneIssues(initialIssues);

      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(defaults),
      );

      return defaults;
    }

    return parsed as Issue[];
  } catch {
    const defaults = cloneIssues(initialIssues);

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(defaults),
    );

    return defaults;
  }
}

function saveIssues(issueList: Issue[]): void {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(issueList),
  );
}

export const issueService = {
  async getAll(): Promise<Issue[]> {
    await delay(150);

    return cloneIssues(loadIssues());
  },

  async getByProject(
    projectId: string,
  ): Promise<Issue[]> {
    await delay(150);

    return cloneIssues(
      loadIssues().filter(
        (issue) => issue.projectId === projectId,
      ),
    );
  },

  async getIssue(
    issueId: string,
  ): Promise<Issue | undefined> {
    await delay(150);

    const issue = loadIssues().find(
      (item) => item.id === issueId,
    );

    return issue ? cloneIssue(issue) : undefined;
  },

  async createIssue(
    issue: Omit<Issue, "id" | "createdAt" | "updatedAt">,
  ): Promise<Issue> {
    await delay(300);

    const now = new Date().toISOString();

    const newIssue: Issue = {
      ...issue,
      id: `issue-${Date.now()}`,
      createdAt: now,
      updatedAt: now,
      labels: [...issue.labels],
      assignee: issue.assignee
        ? { ...issue.assignee }
        : undefined,
    };

    const currentIssues = loadIssues();

    saveIssues([newIssue, ...currentIssues]);

    return cloneIssue(newIssue);
  },

  async updateIssue(
    issueId: string,
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
  ): Promise<Issue | undefined> {
    await delay(300);

    const currentIssues = loadIssues();

    const issue = currentIssues.find(
      (item) => item.id === issueId,
    );

    if (!issue) {
      return undefined;
    }

    Object.assign(issue, {
      ...updates,
      labels: updates.labels
        ? [...updates.labels]
        : issue.labels,
      assignee:
        updates.assignee !== undefined
          ? updates.assignee
            ? { ...updates.assignee }
            : undefined
          : issue.assignee,
      updatedAt: new Date().toISOString(),
    });

    saveIssues(currentIssues);

    return cloneIssue(issue);
  },

  async updateIssueStatus(
    issueId: string,
    status: IssueStatus,
  ): Promise<Issue | undefined> {
    return this.updateIssue(issueId, { status });
  },

  async updateIssuePriority(
    issueId: string,
    priority: IssuePriority,
  ): Promise<Issue | undefined> {
    return this.updateIssue(issueId, { priority });
  },

  async deleteIssue(
    issueId: string,
  ): Promise<boolean> {
    await delay(300);

    const currentIssues = loadIssues();

    const exists = currentIssues.some(
      (issue) => issue.id === issueId,
    );

    if (!exists) {
      return false;
    }

    const updatedIssues = currentIssues.filter(
      (issue) => issue.id !== issueId,
    );

    saveIssues(updatedIssues);

    return true;
  },

  reset(): void {
    saveIssues(cloneIssues(initialIssues));
  },
};