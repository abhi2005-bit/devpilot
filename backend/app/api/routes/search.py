from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import or_, select

from app.api.dependencies import get_current_user
from app.db.database import get_db
from app.models.user import User as UserModel
from app.models.project import Project as ProjectModel, project_members
from app.models.issue import Issue as IssueModel
from app.models.goal import Goal as GoalModel
from app.models.milestone import Milestone as MilestoneModel
from app.models.sprint import Sprint as SprintModel
from app.models.pull_request import PullRequest as PullRequestModel
from app.models.commit import Commit as CommitModel
from pydantic import BaseModel
from typing import Optional

router = APIRouter(prefix="/search", tags=["Search"])

class SearchResult(BaseModel):
    type: str
    id: str
    project_id: Optional[str] = None
    title: str
    subtitle: Optional[str] = None
    url: Optional[str] = None

class SearchResponse(BaseModel):
    results: list[SearchResult]

@router.get("", response_model=SearchResponse)
def search(q: str = "", db: Session = Depends(get_db), current_user: UserModel = Depends(get_current_user)):
    if not q or not q.strip():
        return SearchResponse(results=[])

    q_term = f"%{q.strip()}%"
    
    auth_projects_stmt = select(ProjectModel.id).outerjoin(
        project_members, ProjectModel.id == project_members.c.project_id
    ).where(
        or_(
            ProjectModel.owner_id == current_user.id,
            project_members.c.user_id == current_user.id
        )
    ).distinct()
    
    auth_project_ids = db.scalars(auth_projects_stmt).all()
    
    if not auth_project_ids:
        return SearchResponse(results=[])
    
    results = []
    
    projects = db.scalars(
        select(ProjectModel)
        .where(ProjectModel.id.in_(auth_project_ids))
        .where(or_(ProjectModel.name.ilike(q_term), ProjectModel.description.ilike(q_term)))
        .limit(5)
    ).all()
    for p in projects:
        results.append(SearchResult(type="project", id=str(p.id), project_id=str(p.id), title=p.name, subtitle=p.description))
        
    issues = db.scalars(
        select(IssueModel)
        .where(IssueModel.project_id.in_(auth_project_ids))
        .where(or_(IssueModel.title.ilike(q_term), IssueModel.description.ilike(q_term)))
        .limit(10)
    ).all()
    for i in issues:
        results.append(SearchResult(type="issue", id=str(i.id), project_id=str(i.project_id), title=i.title, subtitle=f"Issue #{i.id}"))
        
    goals = db.scalars(
        select(GoalModel)
        .where(GoalModel.project_id.in_(auth_project_ids))
        .where(or_(GoalModel.title.ilike(q_term), GoalModel.description.ilike(q_term)))
        .limit(5)
    ).all()
    for g in goals:
        results.append(SearchResult(type="goal", id=str(g.id), project_id=str(g.project_id), title=g.title, subtitle=g.description))
        
    milestones = db.scalars(
        select(MilestoneModel)
        .join(GoalModel, MilestoneModel.goal_id == GoalModel.id)
        .where(GoalModel.project_id.in_(auth_project_ids))
        .where(or_(MilestoneModel.title.ilike(q_term), MilestoneModel.description.ilike(q_term)))
        .limit(5)
    ).all()
    for m in milestones:
        results.append(SearchResult(type="milestone", id=str(m.id), project_id=str(m.goal.project_id), title=m.title, subtitle=m.description))
        
    sprints = db.scalars(
        select(SprintModel)
        .where(SprintModel.project_id.in_(auth_project_ids))
        .where(or_(SprintModel.name.ilike(q_term), SprintModel.description.ilike(q_term)))
        .limit(5)
    ).all()
    for s in sprints:
        results.append(SearchResult(type="sprint", id=str(s.id), project_id=str(s.project_id), title=s.name, subtitle=s.description))
        
    prs = db.scalars(
        select(PullRequestModel)
        .where(PullRequestModel.project_id.in_(auth_project_ids))
        .where(PullRequestModel.title.ilike(q_term))
        .limit(5)
    ).all()
    for pr in prs:
        results.append(SearchResult(type="pr", id=str(pr.id), project_id=str(pr.project_id), title=pr.title, subtitle=f"PR #{pr.number}", url=pr.url))
        
    commits = db.scalars(
        select(CommitModel)
        .where(CommitModel.project_id.in_(auth_project_ids))
        .where(CommitModel.message.ilike(q_term))
        .limit(5)
    ).all()
    for c in commits:
        results.append(SearchResult(type="commit", id=str(c.id), project_id=str(c.project_id), title=c.message.split("\n")[0] if c.message else "", subtitle=c.sha[:7] if c.sha else "", url=c.url))
        
    return SearchResponse(results=results)
