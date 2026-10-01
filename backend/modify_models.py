import re

# 1. Modify app/models/issue.py
issue_path = r'C:\Projects\Devpilot\devpilot\backend\app\models\issue.py'
with open(issue_path, 'r', encoding='utf-8') as f:
    issue_content = f.read()

issue_content = issue_content.replace('from app.models.user import User', 'from app.models.user import User\n    from app.models.sprint import Sprint')

fk_code = """    assignee_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )

    sprint_id: Mapped[int | None] = mapped_column(
        ForeignKey("sprints.id", ondelete="SET NULL"),
        nullable=True,
    )"""
issue_content = issue_content.replace("""    assignee_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )""", fk_code)

rel_code = """    assignee: Mapped["User | None"] = relationship(
        "User",
        back_populates="assigned_issues",
    )

    sprint: Mapped["Sprint | None"] = relationship(
        "Sprint",
        back_populates="issues",
    )"""
issue_content = issue_content.replace("""    assignee: Mapped["User | None"] = relationship(
        "User",
        back_populates="assigned_issues",
    )""", rel_code)

with open(issue_path, 'w', encoding='utf-8') as f:
    f.write(issue_content)

# 2. Modify app/models/project.py
project_path = r'C:\Projects\Devpilot\devpilot\backend\app\models\project.py'
with open(project_path, 'r', encoding='utf-8') as f:
    project_content = f.read()

project_content = project_content.replace('from app.models.issue import Issue', 'from app.models.issue import Issue\n    from app.models.sprint import Sprint')

proj_rel_code = """    issues: Mapped[list["Issue"]] = relationship(
        "Issue",
        back_populates="project",
        cascade="all, delete-orphan",
    )

    sprints: Mapped[list["Sprint"]] = relationship(
        "Sprint",
        back_populates="project",
        cascade="all, delete-orphan",
    )"""
project_content = project_content.replace("""    issues: Mapped[list["Issue"]] = relationship(
        "Issue",
        back_populates="project",
        cascade="all, delete-orphan",
    )""", proj_rel_code)

with open(project_path, 'w', encoding='utf-8') as f:
    f.write(project_content)

# 3. Modify app/models/__init__.py
init_path = r'C:\Projects\Devpilot\devpilot\backend\app\models\__init__.py'
with open(init_path, 'r', encoding='utf-8') as f:
    init_content = f.read()

if 'from .sprint import Sprint' not in init_content:
    init_content += '\nfrom .sprint import Sprint\n'
    with open(init_path, 'w', encoding='utf-8') as f:
        f.write(init_content)
