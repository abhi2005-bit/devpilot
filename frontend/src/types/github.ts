export interface GitHubRepository {
  owner: string;
  name: string;
  full_name: string;
  description: string | null;
  url: string;
  default_branch: string;
  stars: number;
  forks: number;
  open_issues: number;
}

export interface GitHubCommit {
  sha: string;
  message: string;
  author: string | null;
  date: string | null;
  url: string;
}

export interface GitHubPullRequest {
  number: number;
  title: string;
  state: string;
  author: string | null;
  created_at: string;
  updated_at: string;
  merged: boolean;
  url: string;
}

export interface ProjectGitHub {
  repository: GitHubRepository;
  commits: GitHubCommit[];
  pull_requests: GitHubPullRequest[];
}