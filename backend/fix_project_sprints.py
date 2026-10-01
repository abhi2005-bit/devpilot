import re

file_path = r'C:\Projects\Devpilot\devpilot\backend\app\models\project.py'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace existing issues relationship to include sprints
sprints_rel = """    issues: Mapped[list["Issue"]] = relationship(
    "Issue",
    back_populates="project",
    )
    sprints: Mapped[list["Sprint"]] = relationship(
    "Sprint",
    back_populates="project",
    )"""

content = content.replace("""    issues: Mapped[list["Issue"]] = relationship(
    "Issue",
    back_populates="project",
    )""", sprints_rel)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
