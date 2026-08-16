# DevPilot — AI-Powered Engineering Intelligence Platform

DevPilot is a full-stack engineering intelligence platform for managing projects, issues, documentation, developer workflows, analytics, and AI-powered engineering insights.

> **Current status:** Frontend foundation in progress. The application is being built incrementally as a learning-focused, resume-ready full-stack project.

## Goals

- Learn modern React + TypeScript development
- Build a production-style FastAPI backend
- Design and use a PostgreSQL database
- Learn SQLAlchemy ORM and migrations
- Connect frontend and backend through REST APIs
- Integrate AI and agentic workflows using LangGraph
- Learn testing, Docker, deployment, and production practices

## Tech Stack

### Frontend
- React
- TypeScript
- Vite
- Tailwind CSS v4
- React Router
- Axios (planned)
- Material Symbols

### Backend
- Python
- FastAPI
- Pydantic
- Uvicorn
- SQLAlchemy
- Alembic

### Database
- PostgreSQL

### AI
- LangGraph
- LLM APIs / local LLMs where appropriate
- Retrieval and embeddings where useful

### DevOps
- Git/GitHub
- Docker
- Docker Compose
- CI/CD
- Cloud deployment

## Architecture

```text
React + TypeScript
        |
        | HTTP / REST
        v
     FastAPI
        |
   +----+----------------+
   |                     |
   v                     v
SQLAlchemy           AI / LangGraph
   |                     |
   v                     |
PostgreSQL <-------------+
```

## Repository Structure

```text
DevPilot/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── dashboard/
│   │   │   ├── projects/
│   │   │   ├── issues/
│   │   │   ├── kanban/
│   │   │   ├── analytics/
│   │   │   ├── ai/
│   │   │   └── layout/
│   │   ├── pages/
│   │   ├── layouts/
│   │   ├── routes/
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── types/
│   │   ├── lib/
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css
│   ├── index.html
│   └── package.json
│
├── backend/
│   ├── app/
│   │   ├── api/
│   │   ├── core/
│   │   ├── models/
│   │   ├── schemas/
│   │   ├── services/
│   │   ├── repositories/
│   │   ├── agents/
│   │   └── main.py
│   ├── tests/
│   └── requirements.txt
│
├── stitch_exports/
├── docker-compose.yml
├── .gitignore
└── README.md
```

## Current Frontend Progress

### Completed
- React + TypeScript + Vite setup
- Tailwind CSS v4
- Stitch design tokens
- Geist and JetBrains Mono fonts
- Material Symbols
- Shared Sidebar
- Shared Navbar
- AppLayout
- React routing foundation
- Dashboard page
- Reusable SummaryCard
- AI Insights
- Project Health
- My Work

### Next
1. Projects
2. Project Overview
3. Issues
4. Create Issue
5. Kanban
6. Documentation
7. Analytics
8. AI Assistant
9. Authentication
10. Backend integration

## Core Features

### Dashboard
- Active projects
- Open issues
- Completed work
- Blocked work
- AI engineering insights
- Project health
- Developer work queue

### Projects
- List/search/filter projects
- Create projects
- Project details
- Progress
- Members
- Issues
- Activity

Planned routes:

```text
/projects
/projects/:projectId
```

### Issues
- Create/edit issues
- Assign issues
- Priorities
- Status
- Labels
- Comments
- Activity

### Kanban
Workflow:

```text
TODO → IN PROGRESS → REVIEW → DONE
```

Drag-and-drop will eventually update the backend/database, not just the UI.

### Documentation
- Project documentation
- Search
- Markdown/code content
- AI-assisted documentation

### Analytics
- Issue statistics
- Project progress
- Completion trends
- Workload
- Risk indicators

## AI Features

AI is intended to be a core application capability.

Planned features:

- Engineering assistant
- Issue summarization
- Related issue detection
- Priority/risk suggestions
- Project risk analysis
- Documentation assistance
- Engineering insights

A planned LangGraph workflow may look like:

```text
User Request
     ↓
Intent Detection
     ↓
Retrieve Project Context
     ↓
Retrieve Issues / Documentation
     ↓
Analyze Context
     ↓
Generate Recommendation
     ↓
Validate Result
     ↓
Response
```

## Database

Potential entities:

```text
User
Workspace
Project
ProjectMember
Issue
IssueComment
Label
IssueLabel
Document
Activity
AIInsight
```

Relationships will be implemented with SQLAlchemy and PostgreSQL.

## API

Planned REST endpoints:

```text
GET    /api/projects
POST   /api/projects
GET    /api/projects/{project_id}
PUT    /api/projects/{project_id}
DELETE /api/projects/{project_id}

GET    /api/issues
POST   /api/issues
GET    /api/issues/{issue_id}
PUT    /api/issues/{issue_id}
DELETE /api/issues/{issue_id}
```

## Authentication

Planned:

- Registration
- Login
- Password hashing
- JWT authentication
- Protected routes
- Workspace membership
- Role-based permissions

## Development Philosophy

This project is being built primarily as a learning project.

The workflow is:

```text
Understand
   ↓
Implement
   ↓
Debug
   ↓
Refactor
   ↓
Document
```

AI tools may assist with development, but important architecture and implementation decisions should be understood before being accepted.

The goal is not simply to generate a working application. The goal is to understand how a modern full-stack application is built.

## Frontend Design

The initial UI was designed with Google Stitch and is being converted into a proper React application.

The Stitch exports are treated as **visual/design references**. React owns the component architecture, routing, state, and behavior.

## Running the Frontend

```bash
cd frontend
npm install
npm run dev
```

Default development URL:

```text
http://localhost:5173
```

## Environment Variables

Never commit secrets.

Example:

```env
VITE_API_BASE_URL=http://localhost:8000/api
```

Backend credentials and secrets will be configured separately.

## Roadmap

### Phase 1 — Frontend
React → routing → pages → components → interactions

### Phase 2 — Backend
FastAPI → API architecture → validation → services

### Phase 3 — Database
PostgreSQL → SQLAlchemy → relationships → Alembic

### Phase 4 — Integration
React → FastAPI → PostgreSQL

### Phase 5 — AI
LLM → LangGraph → context retrieval → engineering workflows

### Phase 6 — Production
Testing → Docker → security → logging → CI/CD → deployment

## Learning Outcomes

By completing DevPilot, the project should demonstrate practical understanding of:

- React component architecture
- TypeScript
- Routing and dynamic routes
- State management
- Forms and validation
- REST APIs
- FastAPI
- PostgreSQL
- SQLAlchemy
- Database migrations
- Authentication
- Frontend/backend integration
- LangGraph and AI workflows
- Testing
- Docker
- Deployment

## License

This is currently a personal learning and portfolio project.
