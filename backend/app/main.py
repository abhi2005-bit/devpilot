from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.routes.projects import router as projects_router
from app.api.routes.issues import router as issues_router

from app.core.exceptions import (
    PermissionDeniedError,
    ProjectNotFoundError,
    IssueNotFoundError,
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



# CORS


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
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