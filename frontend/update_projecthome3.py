import re

file_path = r'C:\Projects\Devpilot\devpilot\frontend\src\pages\project\ProjectHome.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

sprint_ui = """      {/* Active Sprint Banner */}
      {activeSprint && (
        <div className="mb-lg rounded-xl border-2 border-primary bg-primary-container/20 p-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-md">
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
              className="rounded-lg border border-primary bg-primary px-md py-sm text-body-sm font-semibold text-on-primary shadow hover:bg-primary/90 transition-colors"
            >
              Go to Sprint Board
            </Link>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-md mb-lg">"""

content = content.replace(
    '<div className="grid grid-cols-1 md:grid-cols-3 gap-md mb-lg">',
    sprint_ui
)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
