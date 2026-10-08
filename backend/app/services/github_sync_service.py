from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.models.commit import Commit
from app.models.pull_request import PullRequest
from app.services.github_service import github_service

class GitHubSyncService:
    def _parse_github_datetime(self, date_str: str | None) -> datetime | None:
        if not date_str:
            return None
        date_str = date_str.replace("Z", "+00:00")
        try:
            return datetime.fromisoformat(date_str)
        except ValueError:
            return None

    async def sync_github_data(self, db: Session, project_id: int, owner: str, repo: str, token: str | None = None, limit: int = 50):
        # Fetch PRs
        prs = await github_service.get_pull_requests(owner, repo, limit=limit, token=token)
        for pr_data in prs:
            existing_pr = db.scalar(
                select(PullRequest).where(
                    PullRequest.project_id == project_id,
                    PullRequest.number == pr_data.number
                )
            )
            created_at = self._parse_github_datetime(pr_data.created_at)
            updated_at = self._parse_github_datetime(pr_data.updated_at)
            
            if existing_pr:
                existing_pr.title = pr_data.title
                existing_pr.state = pr_data.state
                existing_pr.author = pr_data.author
                existing_pr.updated_at = updated_at
                existing_pr.merged = pr_data.merged
                existing_pr.url = pr_data.url
            else:
                new_pr = PullRequest(
                    project_id=project_id,
                    number=pr_data.number,
                    title=pr_data.title,
                    state=pr_data.state,
                    author=pr_data.author,
                    created_at=created_at,
                    updated_at=updated_at,
                    merged=pr_data.merged,
                    url=pr_data.url
                )
                db.add(new_pr)
                
        # Fetch Commits
        commits = await github_service.get_commits(owner, repo, limit=limit, token=token)
        for commit_data in commits:
            existing_commit = db.scalar(
                select(Commit).where(
                    Commit.project_id == project_id,
                    Commit.sha == commit_data.sha
                )
            )
            date = self._parse_github_datetime(commit_data.date)
            
            if existing_commit:
                existing_commit.message = commit_data.message
                existing_commit.author = commit_data.author
                existing_commit.date = date
                existing_commit.url = commit_data.url
            else:
                new_commit = Commit(
                    project_id=project_id,
                    sha=commit_data.sha,
                    message=commit_data.message,
                    author=commit_data.author,
                    date=date,
                    url=commit_data.url
                )
                db.add(new_commit)
                
        db.commit()

github_sync_service = GitHubSyncService()
