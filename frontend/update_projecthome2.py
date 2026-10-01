import re

file_path = r'C:\Projects\Devpilot\devpilot\frontend\src\pages\project\ProjectHome.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Add Sprint import if not there
if "import type { Sprint } from" not in content:
    content = content.replace(
        'import type { Issue } from "../../../types/issue";',
        'import type { Issue } from "../../../types/issue";\nimport type { Sprint } from "../../../types/sprint";\nimport { sprintService } from "../../../services/sprintService";'
    )

# Add sprint state if not there
if "activeSprint" not in content:
    content = content.replace(
        'const [issues, setIssues] = useState<Issue[]>([]);',
        'const [issues, setIssues] = useState<Issue[]>([]);\n  const [activeSprint, setActiveSprint] = useState<Sprint | null>(null);'
    )

# Inject sprintService call to Promise.allSettled
if "sprintService.getSprints" not in content:
    content = content.replace(
        'cicdService.getRuns(projectId, 20)',
        'cicdService.getRuns(projectId, 20),\n            sprintService.getSprints(projectId)'
    )
    content = content.replace(
        'const [contextRes, issuesRes, githubRes, cicdRes] = await Promise.allSettled([',
        'const [contextRes, issuesRes, githubRes, cicdRes, sprintsRes] = await Promise.allSettled(['
    )
    content = content.replace(
        'if (cicdRes.status === "fulfilled") setCicdRuns(cicdRes.value);',
        'if (cicdRes.status === "fulfilled") setCicdRuns(cicdRes.value);\n          if (sprintsRes.status === "fulfilled") { const active = sprintsRes.value.find(s => s.status === "ACTIVE"); setActiveSprint(active || null); }'
    )

# Inject Sprint UI
if "Active Sprint" not in content:
    sprint_ui = """
      {/* Active Sprint Banner */}
      {activeSprint && (
        <div className="mb-lg rounded-xl border border-primary bg-surface-container p-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-sm">
              <span className="material-symbols-outlined text-primary text-3xl">directions_run</span>
              <div>
                <h3 className="text-title-md font-bold text-on-surface">Active Sprint: {activeSprint.name}</h3>
                <p className="text-body-sm text-on-surface-variant">
                  {issues.filter(i => i.sprintId === activeSprint.id && i.status === 'DONE').length} / {issues.filter(i => i.sprintId === activeSprint.id).length} issues completed
                </p>
              </div>
            </div>
            <Link
              to={`/projects/${projectId}/issues`}
              className="rounded-lg border border-primary px-md py-sm text-body-sm font-semibold text-primary hover:bg-primary-container hover:text-on-primary-container transition-colors"
            >
              Go to Board
            </Link>
          </div>
        </div>
      )}

      {/* Workboard Metrics */}
"""
    content = content.replace(
        '{/* Workboard Metrics */}',
        sprint_ui
    )

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
