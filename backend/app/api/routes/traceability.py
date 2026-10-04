from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.dependencies import get_db, get_current_user
from app.services.traceability_service import traceability_service
from app.services.project_service import project_service
from app.services.issue_service import issue_service
from app.services.sprint_service import sprint_service
from app.services.milestone_service import milestone_service
from app.services.goal_service import goal_service

router = APIRouter()

@router.get("/issues/{issue_id}/traceability")
async def get_issue_traceability(issue_id: int, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    issue = issue_service.get_issue(db, issue_id, current_user.id)
    return await traceability_service.get_issue_traceability(db, issue)

@router.get("/sprints/{sprint_id}/traceability")
async def get_sprint_traceability(sprint_id: int, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    sprint = sprint_service.get_sprint(db, sprint_id, current_user.id)
    return await traceability_service.get_sprint_traceability(db, sprint)

@router.get("/milestones/{milestone_id}/traceability")
async def get_milestone_traceability(milestone_id: int, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    milestone = milestone_service.get_milestone(db, milestone_id, current_user.id)
    return await traceability_service.get_milestone_traceability(db, milestone)

@router.get("/goals/{goal_id}/traceability")
async def get_goal_traceability(goal_id: int, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    goal = goal_service.get_goal(db, goal_id, current_user.id)
    return await traceability_service.get_goal_traceability(db, goal)

@router.get("/projects/{project_id}/engineering-progress")
async def get_project_engineering_progress(project_id: int, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    project = project_service.get_project(db, project_id, current_user.id)
    return await traceability_service.get_project_engineering_progress(db, project)

@router.get("/projects/{project_id}/traceability-matrix")
async def get_project_traceability_matrix(project_id: int, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    project = project_service.get_project(db, project_id, current_user.id)
    # returns mapping of issue_id -> traceability
    matrix = {}
    prs, commits = await traceability_service._get_project_github_data(project)
    ci_runs = traceability_service._get_project_ci_runs(db, project_id)
    for issue in project.issues:
        matrix[issue.id] = traceability_service._match_issue(issue.id, prs, commits, ci_runs)
    return matrix

@router.get("/projects/{project_id}/planning-traceability")
async def get_project_planning_traceability(project_id: int, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    project = project_service.get_project(db, project_id, current_user.id)
    return await traceability_service.get_project_planning_traceability(db, project)
