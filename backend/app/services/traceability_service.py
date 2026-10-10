import re
from typing import List, Dict, Any, Set
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.models.issue import Issue
from app.models.sprint import Sprint
from app.models.milestone import Milestone
from app.models.goal import Goal
from app.models.project import Project
from app.models.cicd_run import CICDRun
from app.models.pull_request import PullRequest
from app.models.commit import Commit
from app.services.github_service import github_service
from app.schemas.github import GitHubPullRequest, GitHubCommit

def extract_issue_ids(text: str) -> Set[int]:
    if not text:
        return set()
    # Match exact #123 or issue-123.
    # regex: (?<![a-zA-Z0-9])(?:#|issue-)(\d+)(?!\d)
    matches = re.findall(r'(?<![a-zA-Z0-9])(?:#|issue-)(\d+)(?!\d)', text, re.IGNORECASE)
    return {int(m) for m in matches}

class TraceabilityService:
    def _get_project_github_data(self, db: Session, project: Project):
        if not project.github_owner or not project.github_repo:
            return [], []
        try:
            prs = db.scalars(
                select(PullRequest)
                .where(PullRequest.project_id == project.id)
                .order_by(PullRequest.updated_at.desc())
                .limit(100)
            ).all()
            
            commits = db.scalars(
                select(Commit)
                .where(Commit.project_id == project.id)
                .order_by(Commit.date.desc())
                .limit(100)
            ).all()
            
            # Note: _match_issue in this file expects GitHubPullRequest and GitHubCommit schemas,
            # or objects with the same properties. Since we are using the DB models, they have
            # the same attribute names (number, sha, message, etc.) so we can just return them.
            return list(prs), list(commits)
        except Exception:
            return [], []

    def _get_project_ci_runs(self, db: Session, project_id: int) -> List[CICDRun]:
        runs = db.scalars(
            select(CICDRun)
            .where(CICDRun.project_id == project_id)
            .order_by(CICDRun.started_at.desc())
            .limit(100)
        ).all()
        return list(runs)
        
    def _match_issue(self, issue: Issue, prs: List[GitHubPullRequest], commits: List[GitHubCommit], ci_runs: List[CICDRun]) -> Dict[str, Any]:
        issue_prs = []
        issue_commits = []
        issue_ci_runs = []

        ids_to_match = {issue.id}
        if getattr(issue, "github_number", None) is not None:
            ids_to_match.add(issue.github_number)

        for pr in prs:
            extracted = extract_issue_ids(pr.title)
            if any(i in extracted for i in ids_to_match):
                issue_prs.append(pr)

        for commit in commits:
            extracted = extract_issue_ids(commit.message)
            if any(i in extracted for i in ids_to_match):
                issue_commits.append(commit)

        commit_shas = {c.sha for c in issue_commits}

        for run in ci_runs:
            if run.commit_sha and run.commit_sha in commit_shas:
                issue_ci_runs.append(run)
            elif run.branch:
                extracted = extract_issue_ids(run.branch)
                if any(i in extracted for i in ids_to_match):
                    if run not in issue_ci_runs:
                        issue_ci_runs.append(run)

        return {
            "pull_requests": issue_prs,
            "commits": issue_commits,
            "ci_runs": issue_ci_runs,
        }

    async def get_issue_traceability(self, db: Session, issue: Issue) -> Dict[str, Any]:
        project = issue.project
        prs, commits = self._get_project_github_data(db, project)
        ci_runs = self._get_project_ci_runs(db, project.id)

        return self._match_issue(issue, prs, commits, ci_runs)

    async def get_sprint_traceability(self, db: Session, sprint: Sprint) -> Dict[str, Any]:
        project = sprint.project
        prs, commits = self._get_project_github_data(db, project)
        ci_runs = self._get_project_ci_runs(db, project.id)
        
        issues = sprint.issues
        total_issues = len(issues)
        completed_issues = sum(1 for i in issues if i.status == "DONE")
        active_issues = sum(1 for i in issues if i.status != "DONE")
        
        all_prs = set()
        all_commits = set()
        all_ci_runs = set()
        
        for issue in issues:
            res = self._match_issue(issue, prs, commits, ci_runs)
            for pr in res["pull_requests"]:
                all_prs.add(pr.number)
            for commit in res["commits"]:
                all_commits.add(commit.sha)
            for run in res["ci_runs"]:
                all_ci_runs.add(run.id)
                
        ci_run_objs = [r for r in ci_runs if r.id in all_ci_runs]
        failed_runs = sum(1 for r in ci_run_objs if r.conclusion != "success")
        passed_runs = sum(1 for r in ci_run_objs if r.conclusion == "success")

        return {
            "total_issues": total_issues,
            "completed_issues": completed_issues,
            "active_issues": active_issues,
            "linked_pr_count": len(all_prs),
            "linked_commit_count": len(all_commits),
            "ci_run_count": len(all_ci_runs),
            "ci_passed_count": passed_runs,
            "ci_failed_count": failed_runs,
        }
        
    async def get_milestone_traceability(self, db: Session, milestone: Milestone) -> Dict[str, Any]:
        project = milestone.goal.project if milestone.goal else None
        if not project:
            return {}
        prs, commits = self._get_project_github_data(db, project)
        ci_runs = self._get_project_ci_runs(db, project.id)
        
        issues = []
        for sprint in milestone.sprints:
            issues.extend(sprint.issues)
            
        total_issues = len(issues)
        completed_issues = sum(1 for i in issues if i.status == "DONE")
        
        all_prs = set()
        all_commits = set()
        all_ci_runs = set()
        
        for issue in issues:
            res = self._match_issue(issue, prs, commits, ci_runs)
            for pr in res["pull_requests"]:
                all_prs.add(pr.number)
            for commit in res["commits"]:
                all_commits.add(commit.sha)
            for run in res["ci_runs"]:
                all_ci_runs.add(run.id)

        ci_run_objs = [r for r in ci_runs if r.id in all_ci_runs]
        failed_runs = sum(1 for r in ci_run_objs if r.conclusion != "success")
        passed_runs = sum(1 for r in ci_run_objs if r.conclusion == "success")

        return {
            "total_issues": total_issues,
            "completed_issues": completed_issues,
            "linked_pr_count": len(all_prs),
            "linked_commit_count": len(all_commits),
            "ci_run_count": len(all_ci_runs),
            "ci_passed_count": passed_runs,
            "ci_failed_count": failed_runs,
        }
        
    async def get_goal_traceability(self, db: Session, goal: Goal) -> Dict[str, Any]:
        project = goal.project
        prs, commits = self._get_project_github_data(db, project)
        ci_runs = self._get_project_ci_runs(db, project.id)
        
        issues = []
        for milestone in goal.milestones:
            for sprint in milestone.sprints:
                issues.extend(sprint.issues)
                
        total_issues = len(issues)
        completed_issues = sum(1 for i in issues if i.status == "DONE")
        progress = int((completed_issues / total_issues * 100)) if total_issues > 0 else 0
        
        active_milestones = sum(1 for m in goal.milestones if m.status in ("ACTIVE", "COMPLETED", "IN_PROGRESS"))
        total_milestones = len(goal.milestones)
        
        all_prs = set()
        all_ci_runs = set()
        
        for issue in issues:
            res = self._match_issue(issue, prs, commits, ci_runs)
            for pr in res["pull_requests"]:
                all_prs.add(pr.number)
            for run in res["ci_runs"]:
                all_ci_runs.add(run.id)

        ci_run_objs = [r for r in ci_runs if r.id in all_ci_runs]
        passed_runs = sum(1 for r in ci_run_objs if r.conclusion == "success")
        ci_success_rate = int((passed_runs / len(all_ci_runs) * 100)) if len(all_ci_runs) > 0 else 0

        return {
            "progress": progress,
            "active_milestones": active_milestones,
            "total_milestones": total_milestones,
            "total_issues": total_issues,
            "completed_issues": completed_issues,
            "linked_pr_count": len(all_prs),
            "ci_success_rate": ci_success_rate,
        }
        
    async def get_project_engineering_progress(self, db: Session, project: Project) -> Dict[str, Any]:
        prs, commits = self._get_project_github_data(db, project)
        ci_runs = self._get_project_ci_runs(db, project.id)
        
        # We need "Current Goal", "Active Milestone", "Current Sprint"
        current_goal = next((g for g in project.goals if g.status in ("ACTIVE", "IN_PROGRESS")), None)
        active_milestone = None
        if current_goal:
            active_milestone = next((m for m in current_goal.milestones if m.status in ("ACTIVE", "IN_PROGRESS")), None)
            
        current_sprint = next((s for s in project.sprints if s.status in ("ACTIVE", "IN_PROGRESS")), None)
        
        active_issues = sum(1 for i in project.issues if i.status != "DONE")
        
        all_prs = set()
        all_ci_runs = set()
        
        for issue in project.issues:
            if issue.status != "DONE":
                res = self._match_issue(issue, prs, commits, ci_runs)
                for pr in res["pull_requests"]:
                    all_prs.add(pr.number)
                for run in res["ci_runs"]:
                    all_ci_runs.add(run.id)

        ci_run_objs = [r for r in ci_runs if r.id in all_ci_runs]
        passed_runs = sum(1 for r in ci_run_objs if r.conclusion == "success")
        ci_success_rate = int((passed_runs / len(all_ci_runs) * 100)) if len(all_ci_runs) > 0 else 0
        
        return {
            "current_goal_title": current_goal.title if current_goal else None,
            "active_milestone_title": active_milestone.title if active_milestone else None,
            "current_sprint_name": current_sprint.name if current_sprint else None,
            "active_issues": active_issues,
            "linked_prs": len(all_prs),
            "ci_success_rate": ci_success_rate
        }

    async def get_project_planning_traceability(self, db: Session, project: Project) -> Dict[str, Any]:
        prs, commits = self._get_project_github_data(db, project)
        ci_runs = self._get_project_ci_runs(db, project.id)

        result = {
            "sprints": {},
            "milestones": {},
            "goals": {}
        }
        for sprint in project.sprints:
            result["sprints"][sprint.id] = await self._compute_sprint_traceability(sprint, prs, commits, ci_runs)
        for goal in project.goals:
            result["goals"][goal.id] = await self._compute_goal_traceability(goal, prs, commits, ci_runs)
            for milestone in goal.milestones:
                result["milestones"][milestone.id] = await self._compute_milestone_traceability(milestone, prs, commits, ci_runs)
        return result

    async def _compute_sprint_traceability(self, sprint, prs, commits, ci_runs):
        issues = sprint.issues
        total_issues = len(issues)
        completed_issues = sum(1 for i in issues if i.status == "DONE")
        active_issues = sum(1 for i in issues if i.status != "DONE")
        
        all_prs = set()
        all_commits = set()
        all_ci_runs = set()
        for issue in issues:
            res = self._match_issue(issue, prs, commits, ci_runs)
            all_prs.update(pr.number for pr in res["pull_requests"])
            all_commits.update(commit.sha for commit in res["commits"])
            all_ci_runs.update(run.id for run in res["ci_runs"])
                
        ci_run_objs = [r for r in ci_runs if r.id in all_ci_runs]
        failed_runs = sum(1 for r in ci_run_objs if r.conclusion != "success")
        passed_runs = sum(1 for r in ci_run_objs if r.conclusion == "success")

        return {
            "total_issues": total_issues,
            "completed_issues": completed_issues,
            "active_issues": active_issues,
            "linked_pr_count": len(all_prs),
            "linked_commit_count": len(all_commits),
            "ci_run_count": len(all_ci_runs),
            "ci_passed_count": passed_runs,
            "ci_failed_count": failed_runs,
        }

    async def _compute_milestone_traceability(self, milestone, prs, commits, ci_runs):
        issues = []
        for sprint in milestone.sprints:
            issues.extend(sprint.issues)
            
        total_issues = len(issues)
        completed_issues = sum(1 for i in issues if i.status == "DONE")
        
        all_prs = set()
        all_commits = set()
        all_ci_runs = set()
        for issue in issues:
            res = self._match_issue(issue, prs, commits, ci_runs)
            all_prs.update(pr.number for pr in res["pull_requests"])
            all_commits.update(commit.sha for commit in res["commits"])
            all_ci_runs.update(run.id for run in res["ci_runs"])

        ci_run_objs = [r for r in ci_runs if r.id in all_ci_runs]
        failed_runs = sum(1 for r in ci_run_objs if r.conclusion != "success")
        passed_runs = sum(1 for r in ci_run_objs if r.conclusion == "success")

        return {
            "total_issues": total_issues,
            "completed_issues": completed_issues,
            "linked_pr_count": len(all_prs),
            "linked_commit_count": len(all_commits),
            "ci_run_count": len(all_ci_runs),
            "ci_passed_count": passed_runs,
            "ci_failed_count": failed_runs,
        }

    async def _compute_goal_traceability(self, goal, prs, commits, ci_runs):
        issues = []
        for milestone in goal.milestones:
            for sprint in milestone.sprints:
                issues.extend(sprint.issues)
                
        total_issues = len(issues)
        completed_issues = sum(1 for i in issues if i.status == "DONE")
        progress = int((completed_issues / total_issues * 100)) if total_issues > 0 else 0
        
        active_milestones = sum(1 for m in goal.milestones if m.status in ("ACTIVE", "COMPLETED", "IN_PROGRESS"))
        total_milestones = len(goal.milestones)
        
        all_prs = set()
        all_ci_runs = set()
        for issue in issues:
            res = self._match_issue(issue, prs, commits, ci_runs)
            all_prs.update(pr.number for pr in res["pull_requests"])
            all_ci_runs.update(run.id for run in res["ci_runs"])

        ci_run_objs = [r for r in ci_runs if r.id in all_ci_runs]
        passed_runs = sum(1 for r in ci_run_objs if r.conclusion == "success")
        ci_success_rate = int((passed_runs / len(all_ci_runs) * 100)) if len(all_ci_runs) > 0 else 0

        return {
            "progress": progress,
            "active_milestones": active_milestones,
            "total_milestones": total_milestones,
            "total_issues": total_issues,
            "completed_issues": completed_issues,
            "linked_pr_count": len(all_prs),
            "ci_success_rate": ci_success_rate,
        }

traceability_service = TraceabilityService()
