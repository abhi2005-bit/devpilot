import re

file_path = r'C:\Projects\Devpilot\devpilot\frontend\src\pages\project\issues\IssueDetail.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Add imports
if 'import type { Sprint }' not in content:
    content = content.replace(
        'import { issueService } from "../../../services/issueService";',
        'import { issueService } from "../../../services/issueService";\nimport { sprintService } from "../../../services/sprintService";\nimport type { Sprint } from "../../../types/sprint";'
    )

# Add sprints state
if 'const [sprints, setSprints]' not in content:
    content = content.replace(
        'const [issue, setIssue] = useState<Issue | null>(null);',
        'const [issue, setIssue] = useState<Issue | null>(null);\n  const [sprints, setSprints] = useState<Sprint[]>([]);'
    )

# Fetch sprints
if 'sprintService.getSprints' not in content:
    content = content.replace(
        'const issueData = await issueService.getIssue(issueId);',
        'const issueData = await issueService.getIssue(issueId);\n      if (projectId) {\n        sprintService.getSprints(projectId).then(setSprints).catch(console.error);\n      }'
    )

# Inject Sprint Selector in UI right after Status
sprint_ui = """              {/* Sprint */}
              <div>
                <p className="text-caption text-on-surface-variant mb-xs">
                  Sprint
                </p>
                <select
                  value={issue.sprintId || ""}
                  onChange={(e) => handleUpdate({ sprintId: e.target.value || undefined })}
                  className="w-full rounded-lg border border-outline bg-surface px-md py-sm text-body-sm text-on-surface"
                >
                  <option value="">Backlog</option>
                  {sprints.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>"""

content = content.replace(
    '{/* Status */}',
    sprint_ui + '\n\n              {/* Status */}'
)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
