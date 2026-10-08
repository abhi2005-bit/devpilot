import httpx
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_db, settings
from app.api.dependencies import get_current_user, get_current_user_project
from app.models.user import User
from app.services.project_service import project_service
from app.services.github_service import github_service
from app.services.traceability_service import traceability_service
from app.services.cicd_service import cicd_service
from datetime import datetime
from app.schemas.github import GitHubRepository

router = APIRouter(
    prefix="/github",
    tags=["GitHub"],
)

@router.get("/authorize")
async def get_github_auth_url(current_user: User = Depends(get_current_user)):
    """Returns the GitHub OAuth URL."""
    client_id = settings.github_client_id
    if not client_id:
        raise HTTPException(status_code=500, detail="GitHub Client ID not configured")
    
    url = f"https://github.com/login/oauth/authorize?client_id={client_id}&scope=repo,read:user"
    return {"url": url}

@router.post("/callback")
async def github_callback(
    data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Exchanges code for token and saves to user."""
    code = data.get("code")
    if not code:
        raise HTTPException(status_code=400, detail="Code is required")
        
    client_id = settings.github_client_id
    client_secret = settings.github_client_secret
    
    if not client_id or not client_secret:
        raise HTTPException(status_code=500, detail="GitHub credentials not configured")

    async with httpx.AsyncClient() as client:
        resp = await client.post(
            "https://github.com/login/oauth/access_token",
            data={
                "client_id": client_id,
                "client_secret": client_secret,
                "code": code,
            },
            headers={"Accept": "application/json"}
        )
        if resp.status_code != 200:
            raise HTTPException(status_code=400, detail="Failed to fetch GitHub token")
            
        token_data = resp.json()
        access_token = token_data.get("access_token")
        
        if not access_token:
            raise HTTPException(status_code=400, detail="GitHub did not return access token")
            
        current_user.github_token = access_token
        db.commit()
        
    return {"status": "success"}

@router.get("/repositories", response_model=list[GitHubRepository])
async def list_github_repositories(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Lists repositories accessible by the user's token."""
    if not current_user.github_token:
        raise HTTPException(status_code=401, detail="GitHub account not connected")
        
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            "https://api.github.com/user/repos?per_page=100",
            headers={
                "Authorization": f"Bearer {current_user.github_token}",
                "Accept": "application/vnd.github+json"
            }
        )
        
        if resp.status_code == 401:
            # Token expired or invalid
            current_user.github_token = None
            db.commit()
            raise HTTPException(status_code=401, detail="GitHub token expired")
            
        resp.raise_for_status()
        repos = resp.json()
        
        result = []
        for r in repos:
            result.append(GitHubRepository(
                owner=r["owner"]["login"],
                name=r["name"],
                full_name=r["full_name"],
                description=r.get("description"),
                url=r["html_url"],
                default_branch=r["default_branch"],
                stars=r.get("stargazers_count", 0),
                forks=r.get("forks_count", 0),
                open_issues=r.get("open_issues_count", 0),
            ))
        return result

@router.post("/projects/{project_id}/connect")
async def connect_repository(
    project_id: str,
    data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    _project: object = Depends(get_current_user_project)
):
    """Connects a specific repository to a project and triggers sync."""
    owner = data.get("owner")
    repo = data.get("repo")
    
    if not owner or not repo:
        raise HTTPException(status_code=400, detail="Owner and repo are required")
        
    project = project_service.get_project_model(db, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
        
    # Verify access
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            f"https://api.github.com/repos/{owner}/{repo}",
            headers={
                "Authorization": f"Bearer {current_user.github_token}",
                "Accept": "application/vnd.github+json"
            }
        )
        if resp.status_code != 200:
            raise HTTPException(status_code=403, detail="Cannot access this repository")
        
        repo_data = resp.json()
        project.github_url = repo_data["html_url"]
        
    project.github_owner = owner
    project.github_repo = repo
    project.github_sync_status = "NOT_CONNECTED"
    db.commit()
    
    # Trigger initial sync if required, but traceability sync happens on demand currently.
    # However we could call something here if we want to preload DB.
    # In the current architecture, CI jobs and issues are pulled on demand or via a cron, 
    # but let's just make sure it's set.
    
    return {"status": "connected", "github_owner": owner, "github_repo": repo}

@router.post("/projects/{project_id}/disconnect")
async def disconnect_repository(
    project_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    _project: object = Depends(get_current_user_project)
):
    """Disconnects a repository from a project without deleting DevPilot data."""
    project = project_service.get_project_model(db, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
        
    project.github_owner = None
    project.github_repo = None
    project.github_url = None
    project.github_sync_status = "NOT_CONNECTED"
    project.github_last_synced_at = None
    project.github_sync_error = None
    db.commit()
    
    return {"status": "disconnected"}

@router.post("/projects/{project_id}/sync")
async def sync_repository(
    project_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    _project: object = Depends(get_current_user_project)
):
    """Performs real backend synchronization for the connected GitHub repository."""
    project = project_service.get_project_model(db, project_id)
    if not project or not project.github_owner or not project.github_repo:
        raise HTTPException(status_code=400, detail="Project is not connected to GitHub")

    if not current_user.github_token:
        raise HTTPException(status_code=401, detail="GitHub token missing")

    # Pre-sync state update
    project.github_sync_status = "SYNCING"
    db.commit()

    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                f"https://api.github.com/repos/{project.github_owner}/{project.github_repo}",
                headers={
                    "Authorization": f"Bearer {current_user.github_token}",
                    "Accept": "application/vnd.github+json"
                }
            )
            if resp.status_code != 200:
                raise Exception("Cannot access repository from GitHub")

        # Synchronize CI/CD information to the database
        await cicd_service.sync_github_runs(db, project_id, limit=20, token=current_user.github_token)
        
        # Synchronize PRs and Commits to the database
        from app.services.github_sync_service import github_sync_service
        await github_sync_service.sync_github_data(db, project.id, project.github_owner, project.github_repo, token=current_user.github_token, limit=20)
            
        project.github_sync_status = "SYNCED"
        project.github_last_synced_at = datetime.utcnow()
        project.github_sync_error = None
        db.commit()
        return {"status": "synced", "last_synced_at": project.github_last_synced_at.isoformat()}
    except Exception as e:
        project.github_sync_status = "SYNC_FAILED"
        project.github_sync_error = str(e)
        db.commit()
        raise HTTPException(status_code=400, detail=str(e))
