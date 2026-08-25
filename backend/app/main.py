from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes.projects import router as projects_router


app = FastAPI(
    title="DevPilot API",
    description="Engineering Intelligence Platform API",
    version="0.1.0",
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