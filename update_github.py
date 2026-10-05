import os
with open('backend/app/api/routes/github.py', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('from app.services.traceability_service import traceability_service', 
'''from app.services.traceability_service import traceability_service
from app.services.cicd_service import cicd_service
from datetime import datetime''')

sync_endpoint = '''
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
        if current_user.github_token != "mock_github_token":
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
        await cicd_service.sync_github_runs(db, project_id, limit=20)
        
        # Test fetching PRs and commits
        if current_user.github_token != "mock_github_token":
            await github_service.get_pull_requests(project.github_owner, project.github_repo, limit=10)
            await github_service.get_commits(project.github_owner, project.github_repo, limit=10)
            
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
'''

content = content + sync_endpoint

# Update disconnect to reset sync status
disconnect_update = '''
    project.github_owner = None
    project.github_repo = None
    project.github_url = None
    project.github_sync_status = "NOT_CONNECTED"
    project.github_last_synced_at = None
    project.github_sync_error = None
    db.commit()
'''
content = content.replace('''
    project.github_owner = None
    project.github_repo = None
    project.github_url = None
    db.commit()
''', disconnect_update)

# Update connect to trigger initial mock/auth verify
connect_update = '''
        project.github_url = f"https://github.com/{owner}/{repo}"
        
    project.github_owner = owner
    project.github_repo = repo
    project.github_sync_status = "NOT_CONNECTED"
    db.commit()
'''
content = content.replace('''
    else:
        project.github_url = f"https://github.com/{owner}/{repo}"
        
    project.github_owner = owner
    project.github_repo = repo
    db.commit()
''', connect_update.replace('    else:\n', '    else:\n'))

with open('backend/app/api/routes/github.py', 'w', encoding='utf-8') as f:
    f.write(content)
