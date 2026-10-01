import re

# 1. Update issue.ts
issue_path = r'C:\Projects\Devpilot\devpilot\frontend\src\types\issue.ts'
with open(issue_path, 'r', encoding='utf-8') as f:
    content = f.read()

if 'sprintId?: string;' not in content:
    content = content.replace(
        '  projectId: string;',
        '  projectId: string;\n  sprintId?: string;'
    )
    with open(issue_path, 'w', encoding='utf-8') as f:
        f.write(content)

# 2. Create sprint.ts
sprint_path = r'C:\Projects\Devpilot\devpilot\frontend\src\types\sprint.ts'
sprint_content = """export type SprintStatus = "PLANNED" | "ACTIVE" | "COMPLETED";

export interface Sprint {
  id: string;
  projectId: string;
  name: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  status: SprintStatus;
  createdAt: string;
  updatedAt: string;
}
"""
with open(sprint_path, 'w', encoding='utf-8') as f:
    f.write(sprint_content)
