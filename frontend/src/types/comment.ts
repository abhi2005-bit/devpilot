export interface IssueComment {
  id: number;
  issue_id: number;
  author_id: number;
  author_name: string;
  content: string;
  created_at: string;
}

export interface CreateIssueComment {
  content: string;
}