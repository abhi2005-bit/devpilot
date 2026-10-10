from datetime import datetime

from sqlalchemy.orm import Session
from sqlalchemy import select

from app.models.commit import Commit
from app.models.pull_request import PullRequest
from app.models.issue import Issue
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
                
        # Fetch Issues
        issues_data = await github_service.get_issues(owner, repo, limit=limit, token=token)
        for issue_data in issues_data:
            existing_issue = db.scalar(
                select(Issue).where(
                    Issue.project_id == project_id,
                    Issue.github_number == issue_data["number"]
                )
            )
            created_at = self._parse_github_datetime(issue_data.get("created_at")) or datetime.utcnow()
            
            # Map GitHub state to DevPilot status
            state = issue_data.get("state", "open")
            status = "DONE" if state == "closed" else "TODO"
            
            if existing_issue:
                existing_issue.title = issue_data["title"]
                existing_issue.description = issue_data.get("body")
                existing_issue.status = status
                existing_issue.github_url = issue_data.get("html_url")
            else:
                new_issue = Issue(
                    project_id=project_id,
                    title=issue_data["title"],
                    description=issue_data.get("body"),
                    status=status,
                    priority="MEDIUM",
                    created_at=created_at,
                    github_number=issue_data["number"],
                    github_url=issue_data.get("html_url")
                )
                db.add(new_issue)
                
        # Fetch CI/CD Runs
        runs_data = await github_service.get_workflow_runs(owner, repo, limit=limit, token=token)
        from app.models.cicd_run import CICDRun, CICDJob
        
        for run_data in runs_data:
            existing_run = db.scalar(
                select(CICDRun).where(
                    CICDRun.project_id == project_id,
                    CICDRun.github_run_id == run_data.id
                )
            )
            started_at = self._parse_github_datetime(run_data.started_at) or datetime.utcnow()
            completed_at = self._parse_github_datetime(run_data.completed_at)
            
            if existing_run:
                existing_run.status = run_data.status
                existing_run.conclusion = run_data.conclusion
                existing_run.completed_at = completed_at
                existing_run.url = run_data.url
            else:
                existing_run = CICDRun(
                    project_id=project_id,
                    github_run_id=run_data.id,
                    workflow_name=run_data.workflow_name,
                    branch=run_data.branch,
                    commit_sha=run_data.commit_sha,
                    status=run_data.status,
                    conclusion=run_data.conclusion,
                    started_at=started_at,
                    completed_at=completed_at,
                    url=run_data.url
                )
                db.add(existing_run)
            
            db.flush() # flush to get existing_run.id if new
            
            # Fetch Jobs for the Run
            jobs_data = await github_service.get_jobs(owner, repo, run_data.id, token=token)
            for job_data in jobs_data:
                existing_job = db.scalar(
                    select(CICDJob).where(
                        CICDJob.cicd_run_id == existing_run.id,
                        CICDJob.github_job_id == job_data.id
                    )
                )
                job_started_at = self._parse_github_datetime(job_data.started_at)
                job_completed_at = self._parse_github_datetime(job_data.completed_at)
                
                if existing_job:
                    existing_job.status = job_data.status
                    existing_job.conclusion = job_data.conclusion
                    existing_job.completed_at = job_completed_at
                    existing_job.url = job_data.url
                else:
                    new_job = CICDJob(
                        project_id=project_id,
                        cicd_run_id=existing_run.id,
                        github_job_id=job_data.id,
                        name=job_data.name,
                        status=job_data.status,
                        conclusion=job_data.conclusion,
                        started_at=job_started_at,
                        completed_at=job_completed_at,
                        url=job_data.url
                    )
                    db.add(new_job)

        db.commit()

github_sync_service = GitHubSyncService()
