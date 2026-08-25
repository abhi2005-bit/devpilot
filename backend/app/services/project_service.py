from app.schemas.project import (
    Project,
    ProjectCreate,
    ProjectUpdate,
)



# In-memory project storage


_projects: list[Project] = [
    Project(
        id="ecommerce-platform-v2",
        name="E-Commerce Platform V2",
        description=(
            "Next-generation commerce platform with improved "
            "checkout and inventory management."
        ),
        risk="HIGH",
        progress=68,
        openIssues=12,
        prsPending=4,
        members=[
            {
                "id": "1",
                "name": "Abhi",
                "role": "OWNER",
            },
            {
                "id": "2",
                "name": "Shanu",
                "role": "ENGINEER",
            },
            {
                "id": "3",
                "name": "Harsh",
                "role": "ENGINEER",
            },
            {
                "id": "4",
                "name": "Shitij",
                "role": "QA",
            },
        ],
        aiInsight=(
            "Deployment risk increased due to unresolved "
            "checkout issues."
        ),
    ),
    Project(
        id="mobile-banking-app",
        name="Mobile Banking App",
        description=(
            "Secure mobile banking experience with payments, "
            "transfers, and account management."
        ),
        risk="MEDIUM",
        progress=82,
        openIssues=5,
        prsPending=2,
        members=[
            {
                "id": "5",
                "name": "Emma",
                "role": "OWNER",
            },
            {
                "id": "6",
                "name": "David",
                "role": "ENGINEER",
            },
            {
                "id": "7",
                "name": "Ryan",
                "role": "QA",
            },
        ],
        aiInsight=(
            "Project is progressing well with a small "
            "number of remaining issues."
        ),
    ),
    Project(
        id="internal-dev-tools",
        name="Internal Dev Tools",
        description=(
            "Internal engineering tools for improving "
            "developer productivity and workflow automation."
        ),
        risk="LOW",
        progress=94,
        openIssues=2,
        prsPending=1,
        members=[
            {
                "id": "8",
                "name": "Daniel",
                "role": "OWNER",
            },
            {
                "id": "9",
                "name": "Lisa",
                "role": "ENGINEER",
            },
        ],
        aiInsight=(
            "Project is on track and approaching completion."
        ),
    ),
]



# Get all projects

def get_projects() -> list[Project]:
    return _projects




# Get project by ID


def get_project(project_id: str) -> Project | None:
    for project in _projects:
        if project.id == project_id:
            return project

    return None



# Create project


def create_project(data: ProjectCreate) -> Project:
    project_id = data.name.lower().replace(" ", "-")

    project = Project(
        id=project_id,
        name=data.name,
        description=data.description,
        risk="LOW",
        progress=0,
        openIssues=0,
        prsPending=0,
        members=[],
        aiInsight=None,
    )

    _projects.append(project)

    return project



# Update project


def update_project(
    project_id: str,
    data: ProjectUpdate,
) -> Project | None:

    project = get_project(project_id)

    if project is None:
        return None

    update_data = data.model_dump(exclude_unset=True)

    updated_project = project.model_copy(
        update=update_data
    )

    index = _projects.index(project)

    _projects[index] = updated_project

    return updated_project



# Delete project


def delete_project(project_id: str) -> bool:

    project = get_project(project_id)

    if project is None:
        return False

    _projects.remove(project)

    return True