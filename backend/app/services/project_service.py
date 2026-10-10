from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.exceptions import (
    PermissionDeniedError,
    ProjectNotFoundError,
)
from app.models.issue import Issue as IssueModel
from app.models.project import Project as ProjectModel
from app.models.project import project_members
from app.schemas.health import (
    IssueMetrics,
    ProjectHealth,
)
from app.schemas.project import (
    Project,
    ProjectMember,
    ProjectCreate,
    ProjectUpdate,
)


class ProjectService:

    def _to_schema(
        self,
        db: Session,
        project: ProjectModel,
    ) -> Project:

        member_roles = dict(
            db.execute(
                select(
                    project_members.c.user_id,
                    project_members.c.role,
                ).where(
                    project_members.c.project_id == project.id
                )
            ).all()
        )

        return Project(
            id=str(project.id),
            name=project.name,
            description=project.description or "",
            ownerId=str(project.owner_id),
            risk="LOW",
            progress=0,
            openIssues=0,
            prsPending=0,
            members=[
                ProjectMember(
                    id=str(member.id),
                    name=member.name,
                    role=member_roles[member.id],
                )
                for member in project.members
            ],
            aiInsight=None,
            github_owner=project.github_owner,
            github_repo=project.github_repo,
            github_url=project.github_url,
        )

    def get_projects(
        self,
        db: Session,
        current_user_id: int,
    ) -> list[Project]:

        statement = (
            select(ProjectModel)
            .where(ProjectModel.owner_id == current_user_id)
            .order_by(ProjectModel.id)
        )

        projects = db.scalars(statement).all()

        return [
            self._to_schema(db, project)
            for project in projects
        ]

    def get_project_model(
        self,
        db: Session,
        project_id: str,
    ) -> ProjectModel:

        try:
            project_id_int = int(project_id)
        except ValueError:
            raise ProjectNotFoundError()

        statement = select(ProjectModel).where(
            ProjectModel.id == project_id_int
        )

        project = db.scalar(statement)

        if project is None:
            raise ProjectNotFoundError()

        return project

    def get_project(
        self,
        db: Session,
        project_id: str,
    ) -> Project:

        try:
            project_id_int = int(project_id)

        except ValueError:
            raise ProjectNotFoundError()

        statement = select(ProjectModel).where(
            ProjectModel.id == project_id_int
        )

        project = db.scalar(statement)

        if project is None:
            raise ProjectNotFoundError()

        return self._to_schema(db, project)

    def get_project_health(
        self,
        db: Session,
        project_id: str,
    ) -> ProjectHealth:

        try:
            project_id_int = int(project_id)

        except ValueError:
            raise ProjectNotFoundError()

        project_statement = select(ProjectModel).where(
            ProjectModel.id == project_id_int
        )

        project = db.scalar(project_statement)

        if project is None:
            raise ProjectNotFoundError()

        issue_statement = select(IssueModel).where(
            IssueModel.project_id == project_id_int
        )

        issues = db.scalars(issue_statement).all()

        total = len(issues)

        todo = sum(
            1
            for issue in issues
            if issue.status == "TODO"
        )

        in_progress = sum(
            1
            for issue in issues
            if issue.status == "IN_PROGRESS"
        )

        in_review = sum(
            1
            for issue in issues
            if issue.status == "IN_REVIEW"
        )

        done = sum(
            1
            for issue in issues
            if issue.status == "DONE"
        )

        critical = sum(
            1
            for issue in issues
            if issue.priority == "CRITICAL"
        )

        high_priority = sum(
            1
            for issue in issues
            if issue.priority == "HIGH"
        )

        unassigned = sum(
            1
            for issue in issues
            if issue.assignee_id is None
        )

        open_issues = (
            todo
            + in_progress
            + in_review
        )

        # Calculate health score

        score = 100

        if total > 0:
            open_ratio = open_issues / total
            score -= int(open_ratio * 30)

        score -= critical * 15
        score -= high_priority * 5

        if total > 0:
            unassigned_ratio = unassigned / total
            score -= int(unassigned_ratio * 15)

        score = max(
            0,
            min(100, score),
        )

        # Determine health status

        if score >= 80:
            health = "HEALTHY"

        elif score >= 60:
            health = "AT_RISK"

        else:
            health = "CRITICAL"

        return ProjectHealth(
            project_id=project_id_int,
            health=health,
            health_score=score,
            issues=IssueMetrics(
                total=total,
                open=open_issues,
                todo=todo,
                in_progress=in_progress,
                in_review=in_review,
                done=done,
                critical=critical,
                high_priority=high_priority,
                unassigned=unassigned,
            ),
        )

    def _normalize_github_repo(
        self,
        owner: str | None,
        repo: str | None,
    ) -> tuple[str | None, str | None]:
        # Combine them to see if one contains the full path
        full_str = f"{owner or ''}/{repo or ''}"
        
        # Strip .git and URLs
        full_str = full_str.replace(".git", "")
        if "github.com/" in full_str:
            full_str = full_str.split("github.com/")[-1]
            
        # Now we should have something like 'owner/repo' or 'owner//repo' or '/repo'
        parts = [p for p in full_str.split("/") if p]
        
        if len(parts) >= 2:
            return parts[-2], parts[-1]
        elif len(parts) == 1:
            return owner, parts[0]
            
        return owner, repo

    def create_project(
        self,
        db: Session,
        data: ProjectCreate,
        current_user_id: int,
    ) -> Project:

        owner, repo = self._normalize_github_repo(
            data.github_owner, data.github_repo
        )
        
        github_url = None
        if owner and repo:
            github_url = f"https://github.com/{owner}/{repo}"

        project = ProjectModel(
            name=data.name,
            description=data.description,
            owner_id=current_user_id,
            github_owner=owner,
            github_repo=repo,
            github_url=github_url,
        )

        db.add(project)
        db.flush()
        
        db.execute(
            project_members.insert().values(
                project_id=project.id,
                user_id=current_user_id,
                role="OWNER",
            )
        )
        db.commit()
        db.refresh(project)

        return self._to_schema(db, project)

    def update_project(
        self,
        db: Session,
        project_id: str,
        data: ProjectUpdate,
        current_user_id: int,
    ) -> Project:

        try:
            project_id_int = int(project_id)

        except ValueError:
            raise ProjectNotFoundError()

        statement = select(ProjectModel).where(
            ProjectModel.id == project_id_int
        )

        project = db.scalar(statement)

        if project is None:
            raise ProjectNotFoundError()

        if project.owner_id != current_user_id:
            raise PermissionDeniedError()

        update_data = data.model_dump(
            exclude_unset=True
        )

        allowed_fields = {
            "name",
            "description",
            "risk",
            "progress",
        }

        for field, value in update_data.items():
            if field in allowed_fields:
                setattr(
                    project,
                    field,
                    value,
                )

        if "github_owner" in update_data or "github_repo" in update_data:
            owner = update_data.get("github_owner", project.github_owner)
            repo = update_data.get("github_repo", project.github_repo)
            
            owner, repo = self._normalize_github_repo(owner, repo)
            
            project.github_owner = owner
            project.github_repo = repo

            if owner and repo:
                project.github_url = f"https://github.com/{owner}/{repo}"
            else:
                project.github_url = None

        db.commit()
        db.refresh(project)

        return self._to_schema(db, project)

    def delete_project(
        self,
        db: Session,
        project_id: str,
        current_user_id: int,
    ) -> bool:

        try:
            project_id_int = int(project_id)

        except ValueError:
            raise ProjectNotFoundError()

        statement = select(ProjectModel).where(
            ProjectModel.id == project_id_int
        )

        project = db.scalar(statement)

        if project is None:
            raise ProjectNotFoundError()

        if project.owner_id != current_user_id:
            raise PermissionDeniedError()

        db.delete(project)
        db.commit()

        return True


project_service = ProjectService()
