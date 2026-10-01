import re

file_path = r'C:\Projects\Devpilot\devpilot\frontend\src\services\issueService.ts'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Fix the duplicate replace issue
content = content.replace(
    'sprintId: issue.sprint_id ? String(issue.sprint_id) : undefined,',
    'sprint_id: issue.sprintId ? Number(issue.sprintId) : undefined,'
)
# But wait, we want to fix ONLY the second one (in createIssue)
# Let's just do a proper targeted replace.
