from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.issue import Issue as IssueModel
from app.models.project import Project as ProjectModel
from app.schemas.dashboard import DashboardSummary


class DashboardService:

    def get_summary(
        self,
        db: Session,
    ) -> DashboardSummary:
        projects = db.scalars(
            select(ProjectModel)
        ).all()

        issues = db.scalars(
            select(IssueModel)
        ).all()

        active_projects = len(projects)

        open_issues = sum(
            1
            for issue in issues
            if issue.status in {
                "TODO",
                "IN_PROGRESS",
                "IN_REVIEW",
            }
        )

        completed_issues = sum(
            1
            for issue in issues
            if issue.status == "DONE"
        )

        critical_issues = sum(
            1
            for issue in issues
            if issue.priority == "CRITICAL"
        )

        blocked_or_review = sum(
            1
            for issue in issues
            if (
                issue.status == "IN_REVIEW"
                or issue.priority in {
                    "CRITICAL",
                    "HIGH",
                }
            )
        )

        return DashboardSummary(
            active_projects=active_projects,
            open_issues=open_issues,
            completed_issues=completed_issues,
            blocked_or_review=blocked_or_review,
            critical_issues=critical_issues,
        )


dashboard_service = DashboardService()