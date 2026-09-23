from datetime import datetime

from app.models.project import Project
from app.models.user import User
from app.schemas.issue import IssueCreate
from app.schemas.project import ProjectCreate
from app.services.issue_service import IssueService
from app.services.project_service import ProjectService


def test_create_project(db):
    service = ProjectService()

    user = User(
        name="Test User",
        email="test@example.com",
        created_at=datetime.now(),
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    data = ProjectCreate(
        name="Test Project",
        description="Project created during a unit test.",
    )

    project = service.create_project(
        db,
        data,
        current_user_id=user.id,
    )

    assert project.name == "Test Project"
    assert project.description == "Project created during a unit test."
    assert project.id is not None


def test_create_issue(db):
    service = IssueService()

    user = User(
        name="Issue Test User",
        email="issue-test@example.com",
        created_at=datetime.now(),
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    project = Project(
        name="Issue Test Project",
        description="Project for issue testing.",
        owner_id=user.id,
    )

    db.add(project)
    db.commit()
    db.refresh(project)

    data = IssueCreate(
        project_id=project.id,
        title="Test Issue",
        description="Issue created during a unit test.",
        status="TODO",
        priority="MEDIUM",
    )

    issue = service.create_issue(
        db,
        data,
        user.id,
    )

    assert issue.id is not None
    assert issue.project_id == project.id
    assert issue.title == "Test Issue"
    assert issue.status == "TODO"
    assert issue.priority == "MEDIUM"

