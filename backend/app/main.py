from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.routes.projects import router as projects_router
from app.api.routes.issues import router as issues_router
from app.api.routes.comments import router as comments_router
from app.api.routes.project_members import (
    router as project_members_router,
)
from app.api.routes.users import router as users_router
from app.api.routes.cicd import router as cicd_router
from app.api.routes.metrics import router as metrics_router
from app.api.routes.health import router as health_router
from app.api.routes.ai import router as ai_router
from app.api.routes.signals import router as signals_router
from app.api.routes.intelligence import router as intelligence_router

from app.api.routes.dashboard import (
    router as dashboard_router,
)

from app.core.exceptions import (
    CICDRunNotFoundError,
    GitHubAPIError,
    GitHubRepositoryNotConnectedError,
    IssueNotFoundError,
    InvalidGitHubResponseError,
    PermissionDeniedError,
    ProjectMemberAlreadyExistsError,
    ProjectMemberNotFoundError,
    ProjectNotFoundError,
    UserNotFoundError,
)


app = FastAPI(
    title="DevPilot API",
    description="Engineering Intelligence Platform API",
    version="0.1.0",
)


# Exception Handlers


@app.exception_handler(ProjectNotFoundError)
async def project_not_found_handler(
    request: Request,
    exc: ProjectNotFoundError,
):
    return JSONResponse(
        status_code=404,
        content={
            "detail": "Project not found",
        },
    )


@app.exception_handler(IssueNotFoundError)
async def issue_not_found_handler(
    request: Request,
    exc: IssueNotFoundError,
):
    return JSONResponse(
        status_code=404,
        content={
            "detail": "Issue not found",
        },
    )


@app.exception_handler(PermissionDeniedError)
async def permission_denied_handler(
    request: Request,
    exc: PermissionDeniedError,
):
    return JSONResponse(
        status_code=403,
        content={
            "detail": "Permission denied",
        },
    )


@app.exception_handler(UserNotFoundError)
async def user_not_found_handler(
    request: Request,
    exc: UserNotFoundError,
):
    return JSONResponse(
        status_code=404,
        content={
            "detail": "User not found",
        },
    )


@app.exception_handler(ProjectMemberNotFoundError)
async def project_member_not_found_handler(
    request: Request,
    exc: ProjectMemberNotFoundError,
):
    return JSONResponse(
        status_code=404,
        content={
            "detail": "Project member not found",
        },
    )


@app.exception_handler(ProjectMemberAlreadyExistsError)
async def project_member_already_exists_handler(
    request: Request,
    exc: ProjectMemberAlreadyExistsError,
):
    return JSONResponse(
        status_code=409,
        content={
            "detail": "User is already a member of this project",
        },
    )


@app.exception_handler(CICDRunNotFoundError)
async def cicd_run_not_found_handler(
    request: Request,
    exc: CICDRunNotFoundError,
):
    return JSONResponse(
        status_code=404,
        content={
            "detail": "CI/CD run not found",
        },
    )


@app.exception_handler(GitHubRepositoryNotConnectedError)
async def github_repository_not_connected_handler(
    request: Request,
    exc: GitHubRepositoryNotConnectedError,
):
    return JSONResponse(
        status_code=400,
        content={
            "detail": "GitHub repository is not connected to this project",
        },
    )


@app.exception_handler(GitHubAPIError)
async def github_api_error_handler(
    request: Request,
    exc: GitHubAPIError,
):
    return JSONResponse(
        status_code=502,
        content={
            "detail": "GitHub API request failed",
        },
    )


@app.exception_handler(InvalidGitHubResponseError)
async def invalid_github_response_handler(
    request: Request,
    exc: InvalidGitHubResponseError,
):
    return JSONResponse(
        status_code=502,
        content={
            "detail": "GitHub API returned an invalid response",
        },
    )


# CORS


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "https://devpilot33.netlify.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# API Routes


app.include_router(
    projects_router,
    prefix="/api/v1",
)

app.include_router(
    issues_router,
    prefix="/api/v1",
)

app.include_router(
    comments_router,
    prefix="/api/v1",
)

app.include_router(
    project_members_router,
    prefix="/api/v1",
)

app.include_router(
    users_router,
    prefix="/api/v1",
)

app.include_router(
    cicd_router,
    prefix="/api/v1",
)

app.include_router(
    metrics_router,
    prefix="/api/v1",
)

app.include_router(
    health_router,
    prefix="/api/v1",
)

app.include_router(
    dashboard_router,
    prefix="/api/v1",
)

app.include_router(
    ai_router,
    prefix="/api/v1",
)
app.include_router(
    signals_router,
    prefix="/api/v1",
)

app.include_router(
    intelligence_router,
    prefix="/api/v1",
)


# Health


@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "devpilot-backend",
        "version": "0.1.0",
    }


# Root


@app.get("/")
def root():
    return {
        "message": "DevPilot API is running",
    }
