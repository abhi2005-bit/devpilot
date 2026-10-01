import re

file_path = r'C:\Projects\Devpilot\devpilot\backend\app\schemas\issue.py'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace(
    'priority: str',
    'priority: str\n    sprint_id: int | None = None',
    1
)

content = content.replace(
    'priority: str = "MEDIUM"',
    'priority: str = "MEDIUM"\n    sprint_id: int | None = None'
)

content = content.replace(
    'assignee_id: int | None = None',
    'assignee_id: int | None = None\n    sprint_id: int | None = None'
)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
