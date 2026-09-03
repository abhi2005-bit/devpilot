from pydantic import BaseModel


class GitHubRepository(BaseModel):
    owner: str
    name: str
    full_name: str
    description: str | None
    url: str
    default_branch: str
    stars: int
    forks: int
    open_issues: int


class GitHubCommit(BaseModel):
    sha: str
    message: str
    author: str | None
    date: str | None
    url: str


class GitHubPullRequest(BaseModel):
    number: int
    title: str
    state: str
    author: str | None
    created_at: str
    updated_at: str
    merged: bool
    url: str


class GitHubWorkflowRun(BaseModel):
    id: int
    workflow_name: str
    branch: str
    commit_sha: str | None
    status: str
    conclusion: str | None
    started_at: str
    completed_at: str | None
    url: str


class GitHubJob(BaseModel):
    id: int
    name: str
    status: str
    conclusion: str | None
    started_at: str | None
    completed_at: str | None
    url: str


class ProjectGitHub(BaseModel):
    repository: GitHubRepository
    commits: list[GitHubCommit]
    pull_requests: list[GitHubPullRequest]
    workflow_runs: list[GitHubWorkflowRun]