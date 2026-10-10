import pytest
from sqlalchemy.orm import Session
from fastapi.testclient import TestClient
from datetime import datetime
import asyncio

from app.models.user import User
from app.models.project import Project
from app.models.issue import Issue
from app.models.commit import Commit
from app.models.pull_request import PullRequest
from app.models.cicd_run import CICDRun, CICDJob
from app.schemas.project import ProjectCreate
from app.services.project_service import project_service
from app.services.github_sync_service import github_sync_service
from unittest.mock import patch, AsyncMock

def test_project_creation_transaction_integrity(db: Session):
    user = User(name="TxUser", email="tx@example.com", password_hash="pw", created_at=datetime.utcnow())
    db.add(user)
    db.commit()
    db.refresh(user)
    
    with patch.object(db, 'commit', side_effect=Exception("DB Error")):
        data = ProjectCreate(name="FailingProj", description="Desc")
        try:
            project_service.create_project(db, data, user.id)
        except Exception:
            pass
            
    db.rollback()
    projects = db.query(Project).filter_by(name="FailingProj").all()
    assert len(projects) == 0

def test_project_ab_isolation(db: Session):
    user1 = User(name="UserA", email="a@example.com", password_hash="pw", created_at=datetime.utcnow())
    user2 = User(name="UserB", email="b@example.com", password_hash="pw", created_at=datetime.utcnow())
    db.add_all([user1, user2])
    db.commit()
    
    p1 = project_service.create_project(db, ProjectCreate(name="PA", description="A"), user1.id)
    p2 = project_service.create_project(db, ProjectCreate(name="PB", description="B"), user2.id)
    
    db.add(Issue(project_id=int(p1.id), title="IssueA", status="TODO", priority="MEDIUM", created_at=datetime.utcnow()))
    db.commit()
    
    issues = db.query(Issue).filter_by(project_id=int(p2.id)).all()
    assert len(issues) == 0

def test_repeated_sync_and_upsert_behavior(db: Session):
    user = User(name="SyncUser", email="sync@example.com", password_hash="pw", created_at=datetime.utcnow())
    db.add(user)
    db.commit()
    
    p = project_service.create_project(db, ProjectCreate(name="SyncProj", description="D", github_owner="owner", github_repo="repo"), user.id)
    
    class MockPR:
        def __init__(self, **kwargs):
            self.__dict__.update(kwargs)
    class MockCommit:
        def __init__(self, **kwargs):
            self.__dict__.update(kwargs)
    class MockRun:
        def __init__(self, **kwargs):
            self.__dict__.update(kwargs)
    class MockJob:
        def __init__(self, **kwargs):
            self.__dict__.update(kwargs)
            
    mock_issues = [{"number": 1, "title": "Issue 1", "state": "open", "body": "B", "created_at": "2023-01-01T00:00:00Z"}]
    mock_prs = [MockPR(number=2, title="PR 2", state="open", author="dev", created_at="2023-01-01T00:00:00Z", updated_at="2023-01-01T00:00:00Z", merged=False, url="http")]
    mock_commits = [MockCommit(sha="abc", message="Commit", author="dev", date="2023-01-01T00:00:00Z", url="http")]
    mock_runs = [MockRun(id=10, workflow_name="CI", branch="main", commit_sha="abc", status="completed", conclusion="success", started_at="2023-01-01T00:00:00Z", completed_at="2023-01-01T00:00:00Z", url="http")]
    mock_jobs = [MockJob(id=20, name="build", status="completed", conclusion="success", started_at="2023-01-01T00:00:00Z", completed_at="2023-01-01T00:00:00Z", url="http")]
    
    async def run_sync():
        with patch("app.services.github_service.github_service.get_issues", return_value=mock_issues), \
             patch("app.services.github_service.github_service.get_pull_requests", return_value=mock_prs), \
             patch("app.services.github_service.github_service.get_commits", return_value=mock_commits), \
             patch("app.services.github_service.github_service.get_workflow_runs", return_value=mock_runs), \
             patch("app.services.github_service.github_service.get_jobs", return_value=mock_jobs):
            
            await github_sync_service.sync_github_data(db, int(p.id), "owner", "repo")
            
            assert db.query(Issue).filter_by(project_id=int(p.id)).count() == 1
            assert db.query(PullRequest).filter_by(project_id=int(p.id)).count() == 1
            assert db.query(Commit).filter_by(project_id=int(p.id)).count() == 1
            assert db.query(CICDRun).filter_by(project_id=int(p.id)).count() == 1
            assert db.query(CICDJob).filter_by(project_id=int(p.id)).count() == 1
            
            mock_issues[0]["state"] = "closed"
            mock_prs[0].state = "closed"
            mock_prs[0].merged = True
            
            await github_sync_service.sync_github_data(db, int(p.id), "owner", "repo")
            
            assert db.query(Issue).filter_by(project_id=int(p.id)).count() == 1
            assert db.query(PullRequest).filter_by(project_id=int(p.id)).count() == 1
            
            issue = db.query(Issue).filter_by(project_id=int(p.id)).first()
            assert issue.status == "DONE"
            
            pr = db.query(PullRequest).filter_by(project_id=int(p.id)).first()
            assert pr.state == "closed"
            assert pr.merged is True

    asyncio.run(run_sync())
