import re

file_path = r'C:\Projects\Devpilot\devpilot\frontend\src\services\issueService.ts'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace(
    'sprintId: issue.sprint_id ? String(issue.sprint_id) : undefined,\n        })',
    'sprint_id: issue.sprintId ? Number(issue.sprintId) : undefined,\n        })'
)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
