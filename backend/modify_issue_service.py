import re

file_path = r'C:\Projects\Devpilot\devpilot\backend\app\services\issue_service.py'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Update _to_schema
content = content.replace(
    'priority=issue.priority,',
    'priority=issue.priority,\n            sprint_id=issue.sprint_id,'
)

# Update create_issue
content = content.replace(
    'priority=data.priority,',
    'priority=data.priority,\n            sprint_id=data.sprint_id,'
)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
