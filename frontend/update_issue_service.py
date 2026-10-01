import re

file_path = r'C:\Projects\Devpilot\devpilot\frontend\src\services\issueService.ts'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add sprint_id to BackendIssue
content = content.replace(
    'priority: IssuePriority;',
    'priority: IssuePriority;\n  sprint_id?: number | null;'
)

# 2. Add sprintId to IssueUpdateFields
content = content.replace(
    '| "labels"',
    '| "labels"\n    | "sprintId"'
)

# 3. Add sprintId to toFrontendIssue
content = content.replace(
    'priority: issue.priority,',
    'priority: issue.priority,\n    sprintId: issue.sprint_id ? String(issue.sprint_id) : undefined,'
)

# 4. Add sprint_id to updateIssue body
update_sprint_code = """
    if (updates.assignee !== undefined) {
      body.assignee_id = getAssigneeId(
        updates.assignee,
      );
    }

    if (updates.sprintId !== undefined) {
      body.sprint_id = updates.sprintId ? Number(updates.sprintId) : null;
    }
"""
content = content.replace("""
    if (updates.assignee !== undefined) {
      body.assignee_id = getAssigneeId(
        updates.assignee,
      );
    }
""", update_sprint_code)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
