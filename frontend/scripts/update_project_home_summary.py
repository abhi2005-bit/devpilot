import re

file_path = r'C:\Projects\Devpilot\devpilot\frontend\src\pages\project\ProjectHome.tsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update View Issues -> Open Workboard
content = content.replace(
    '<span className="material-symbols-outlined text-primary">list_alt</span>\n            View Issues',
    '<span className="material-symbols-outlined text-primary">view_kanban</span>\n            Open Workboard'
)

# 2. Add Active Work summary below Project Header
summary_jsx = """
      <div className="grid grid-cols-1 md:grid-cols-3 gap-md mb-lg">
        <div className="rounded-xl border border-outline-variant bg-surface-container p-md flex items-center justify-between">
           <div>
             <p className="text-caption text-on-surface-variant font-medium">Active Work</p>
             <p className="text-title-lg font-bold text-on-surface">{issues.filter(i => i.status !== 'DONE').length}</p>
           </div>
           <span className="material-symbols-outlined text-primary">work</span>
        </div>
        <div className="rounded-xl border border-outline-variant bg-surface-container p-md flex items-center justify-between">
           <div>
             <p className="text-caption text-on-surface-variant font-medium">In Progress</p>
             <p className="text-title-lg font-bold text-on-surface">{issues.filter(i => i.status === 'IN_PROGRESS' || i.status === 'IN_REVIEW').length}</p>
           </div>
           <span className="material-symbols-outlined text-tertiary">pending</span>
        </div>
        <div className="rounded-xl border border-outline-variant bg-surface-container p-md flex items-center justify-between">
           <div>
             <p className="text-caption text-on-surface-variant font-medium">Completed</p>
             <p className="text-title-lg font-bold text-on-surface">{issues.filter(i => i.status === 'DONE').length}</p>
           </div>
           <span className="material-symbols-outlined text-secondary">check_circle</span>
        </div>
      </div>

      {/* 2. ENGINEERING HEALTH SUMMARY */}"""

content = content.replace('{/* 2. ENGINEERING HEALTH SUMMARY */}', summary_jsx)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
