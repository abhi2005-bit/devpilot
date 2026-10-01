import re

file_path = r'C:\Projects\Devpilot\devpilot\frontend\src\pages\project\ProjectHome.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Add Sprint import
content = content.replace(
    'import type { Issue } from "../../../types/issue";',
    'import type { Issue } from "../../../types/issue";\nimport type { Sprint } from "../../../types/sprint";\nimport { sprintService } from "../../../services/sprintService";'
)

# Add sprint state
state_code = """
  const [issues, setIssues] = useState<Issue[]>([]);
  const [activeSprint, setActiveSprint] = useState<Sprint | null>(null);
"""
content = content.replace(
    'const [issues, setIssues] = useState<Issue[]>([]);',
    state_code
)

# Fetch sprint
fetch_code = """      try {
        const [projectData, ctxData, issuesData, ghData, runsData, sprintsData] = await Promise.all([
          projectService.getProject(projectId),
          intelligenceService.getProjectContext(projectId),
          issueService.getByProject(projectId),
          githubService.getProjectGitHub(projectId),
          cicdService.getRunsByProject(projectId),
          sprintService.getSprints(projectId).catch(() => [])
        ]);

        setProject(projectData);
        setContext(ctxData);
        setIssues(issuesData);
        setGithubData(ghData);
        setCicdRuns(runsData);
        
        const active = sprintsData.find(s => s.status === "ACTIVE");
        setActiveSprint(active || null);
"""
# Replace the promise.all block
content = re.sub(
    r'const \[projectData, ctxData, issuesData, ghData, runsData\] = await Promise\.all\(\[\s*projectService\.getProject\(projectId\),\s*intelligenceService\.getProjectContext\(projectId\),\s*issueService\.getByProject\(projectId\),\s*githubService\.getProjectGitHub\(projectId\),\s*cicdService\.getRunsByProject\(projectId\)\s*\]\);\s*setProject\(projectData\);\s*setContext\(ctxData\);\s*setIssues\(issuesData\);\s*setGithubData\(ghData\);\s*setCicdRuns\(runsData\);',
    fetch_code,
    content,
    flags=re.DOTALL
)

# Inject Sprint metrics before Workboard Metrics
sprint_ui = """
      {/* Active Sprint Banner */}
      {activeSprint && (
        <div className="mb-lg rounded-xl border-2 border-primary bg-primary-container p-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-sm">
              <span className="material-symbols-outlined text-primary text-3xl">directions_run</span>
              <div>
                <h3 className="text-title-md font-bold text-on-primary-container">Active Sprint: {activeSprint.name}</h3>
                <p className="text-body-sm text-on-primary-container/80">
                  {issues.filter(i => i.sprintId === activeSprint.id && i.status === 'DONE').length} / {issues.filter(i => i.sprintId === activeSprint.id).length} issues completed
                </p>
              </div>
            </div>
            <Link
              to={`/projects/${projectId}/issues`}
              className="rounded-lg bg-primary px-md py-sm text-body-sm font-semibold text-on-primary shadow hover:bg-primary/90 transition-colors"
            >
              Go to Sprint Board
            </Link>
          </div>
          
          <div className="mt-md h-2 w-full overflow-hidden rounded-full bg-primary-container-highest">
            <div 
              className="h-full bg-primary transition-all duration-500"
              style={{ width: `${Math.max(5, (issues.filter(i => i.sprintId === activeSprint.id && i.status === 'DONE').length / Math.max(1, issues.filter(i => i.sprintId === activeSprint.id).length)) * 100)}%` }}
            />
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
