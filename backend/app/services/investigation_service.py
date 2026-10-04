import uuid
from datetime import datetime, timedelta
from typing import List, Optional
from sqlalchemy.orm import Session

from app.schemas.investigation import (
    StructuredInvestigation, ProblemSummary, EvidenceData, TimelineEvent,
    ContributingFactor, Recommendation
)
from app.services.project_service import project_service
from app.services.issue_service import issue_service
from app.services.github_service import github_service
from app.services.cicd_service import cicd_service
from app.services.traceability_service import traceability_service
from app.services.engineering_health_service import engineering_health_service
from app.services.engineering_health_history_service import engineering_health_history_service

class InvestigationService:
    async def investigate_problem(self, db: Session, project_id: str, category: str, item_id: str, title: str, description: str) -> StructuredInvestigation:
        project = project_service.get_project_model(db, project_id)
        if not project:
            raise ValueError("Project not found")
            
        health = await engineering_health_service.get_project_health(db, project_id)
        from app.models import Issue as IssueModel
        from sqlalchemy import select
        issues = db.scalars(select(IssueModel).where(IssueModel.project_id == project.id)).all()
        prs = await github_service.get_pull_requests(project.github_owner, project.github_repo) if project.github_owner else []
        commits = await github_service.get_commits(project.github_owner, project.github_repo) if project.github_owner else []
        ci_runs = cicd_service.get_runs(db, project_id)
        
        # Health history
        history = engineering_health_history_service.get_project_history(db, project_id, limit=2)
        health_change = None
        if len(history.snapshots) >= 2:
            health_change = history.snapshots[0].score - history.snapshots[1].score # Assuming history is desc ordered
            
        evidence = EvidenceData(
            health_score=health.score,
            health_change=health_change,
            open_issues=sum(1 for i in issues if i.status != "DONE"),
            critical_issues=sum(1 for i in issues if i.status != "DONE" and i.priority == "CRITICAL"),
            stale_issues=0,
            failed_ci_runs=sum(1 for r in ci_runs if r.conclusion != "success" and r.conclusion is not None),
            total_ci_runs=len(ci_runs),
            linked_prs=len(prs),
            linked_commits=len(commits)
        )
        
        events = []
        for issue in issues:
            events.append(TimelineEvent(timestamp=issue.created_at, type="ISSUE_CREATED", description=f"Issue {issue.id} created: {issue.title}", reference_id=issue.id))
        for pr in prs:
            events.append(TimelineEvent(timestamp=pr.get("created_at") or datetime.now(), type="PR_OPENED", description=f"PR #{pr.get('number')} opened: {pr.get('title')}", reference_id=str(pr.get('number')), url=pr.get("html_url")))
        for run in ci_runs:
            events.append(TimelineEvent(timestamp=run.created_at, type="CI_RUN", description=f"CI {run.workflow_name} on {run.branch}: {run.conclusion or run.status}", reference_id=run.id))
            
        events = sorted([e for e in events if e.timestamp], key=lambda x: x.timestamp)
        timeline = events[-10:] if len(events) > 10 else events

        problem = ProblemSummary(title=title, severity="HIGH", current_state="", why_it_matters="")
        factors = []
        recommendations = []
        confidence = "Limited evidence"

        if category == "cicd":
            failed = [r for r in ci_runs if r.conclusion != "success" and r.conclusion is not None]
            problem.current_state = f"{len(failed)} failed CI runs out of {len(ci_runs)} total."
            problem.why_it_matters = "CI success rate has declined and multiple failures are associated with active engineering work."
            confidence = "Strong evidence" if len(failed) > 0 else "Limited evidence"
            
            workflows = {}
            for r in failed:
                workflows[r.workflow_name] = workflows.get(r.workflow_name, 0) + 1
            for w_name, count in workflows.items():
                if count >= 2:
                    factors.append(ContributingFactor(title=f"Integration Tests", description=f"{count} recent failures occurred in {w_name}."))
                    recommendations.append(Recommendation(title=f"Inspect {w_name}", action_type="VIEW_CI"))
            
            if len(prs) > 0:
                factors.append(ContributingFactor(title="Active PR activity", description=f"{len(prs)} linked PRs were active during the failure window."))
                
            if not recommendations:
                recommendations.append(Recommendation(title="Review CI logs", action_type="VIEW_CI"))
            recommendations.append(Recommendation(title="Create Issue", action_type="CREATE_ISSUE"))
            
        elif category == "issues":
            problem.current_state = f"{evidence.open_issues} open issues."
            problem.why_it_matters = "A large number of open or critical issues can indicate bottlenecks."
            confidence = "Moderate evidence"
            
            if evidence.critical_issues and evidence.critical_issues > 0:
                factors.append(ContributingFactor(title="Critical Issues", description=f"{evidence.critical_issues} critical issues demand immediate attention."))
                recommendations.append(Recommendation(title="Open critical Issues", action_type="VIEW_ISSUES"))
                
            recommendations.append(Recommendation(title="Create Issue", action_type="CREATE_ISSUE"))

        else:
            problem.current_state = description
            problem.why_it_matters = "This requires attention to maintain engineering health."
            recommendations.append(Recommendation(title="Review Project Board", action_type="VIEW_ISSUES"))
            recommendations.append(Recommendation(title="Create Issue", action_type="CREATE_ISSUE"))

        return StructuredInvestigation(
            id=item_id or str(uuid.uuid4()),
            project_id=project_id,
            category=category,
            problem=problem,
            confidence=confidence,
            evidence=evidence,
            timeline=timeline,
            contributing_factors=factors,
            recommendations=recommendations
        )

investigation_service = InvestigationService()
