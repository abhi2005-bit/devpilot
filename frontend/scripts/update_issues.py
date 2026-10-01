import re

file_path = r'C:\Projects\Devpilot\devpilot\frontend\src\pages\project\issues\Issues.tsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Workload visibility to inject above the Board
workload_jsx = """          <div className="flex items-center justify-between mb-sm">
            <p className="text-body-sm text-on-surface-variant">
              Showing{" "}
              <span className="font-semibold text-on-surface">
                {filteredIssues.length}
              </span>{" "}
              {filteredIssues.length === 1
                ? "issue"
                : "issues"}
            </p>
          </div>
          
          {/* Workload Visibility */}
          {Object.keys(projectIssues.reduce((acc, issue) => { if (issue.status !== "DONE" && issue.assignee) { acc[issue.assignee.name] = 1; } return acc; }, {})).length > 0 && (
            <div className="flex flex-wrap gap-sm mb-md">
              {Object.entries(
                 projectIssues.reduce((acc, issue) => {
                   if (issue.status !== "DONE" && issue.assignee) {
                     acc[issue.assignee.name] = (acc[issue.assignee.name] || 0) + 1;
                   }
                   return acc;
                 }, {} as Record<string, number>)
              ).map(([name, count]) => (
                 <div key={name} className="flex items-center gap-sm rounded-full border border-outline-variant bg-surface-container px-md py-xs">
                   <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-container text-caption font-bold text-primary">
                      {name.charAt(0).toUpperCase()}
                   </div>
                   <span className="text-body-sm font-medium text-on-surface">{name}</span>
                   <span className="text-caption text-on-surface-variant ml-xs">{count} active issue{count !== 1 ? 's' : ''}</span>
                 </div>
              ))}
            </div>
          )}
"""

content = content.replace("""          <div className="flex items-center justify-between">
            <p className="text-body-sm text-on-surface-variant">
              Showing{" "}
              <span className="font-semibold text-on-surface">
                {filteredIssues.length}
              </span>{" "}
              {filteredIssues.length === 1
                ? "issue"
                : "issues"}
            </p>
          </div>""", workload_jsx)

# Verification state to inject into the card
verification_jsx = """                              <h4 className="mb-xs text-body-sm font-semibold text-on-surface">
                                {issue.title}
                              </h4>
                              
                              {issue.description.includes('DevPilot detected a problem') && issue.status !== 'DONE' && (
                                <div className="flex items-center gap-xs mb-sm text-primary">
                                   <span className="material-symbols-outlined text-[14px]">fact_check</span>
                                   <span className="text-[11px] font-medium leading-none">Verification available</span>
                                </div>
                              )}
                              
                              {issue.description.includes('DevPilot detected a problem') && issue.status === 'DONE' && (
                                <div className="flex items-center gap-xs mb-sm text-secondary">
                                   <span className="material-symbols-outlined text-[14px]">check_circle</span>
                                   <span className="text-[11px] font-medium leading-none">Verified</span>
                                </div>
                              )}

                              <div className="flex items-center justify-between">"""

content = content.replace("""                              <h4 className="mb-md text-body-sm font-semibold text-on-surface">
                                {issue.title}
                              </h4>

                              <div className="flex items-center justify-between">""", verification_jsx)

# Empty states for columns
empty_state_jsx = """                      <div className="space-y-sm">
                        {columnIssues.length === 0 && !isDropTarget && (
                           <div className="p-md text-center border-2 border-dashed border-outline-variant rounded-lg mt-sm">
                              <p className="text-caption text-on-surface-variant">
                                {status === "DONE" ? "No completed work yet." : "No issues here."}
                              </p>
                           </div>
                        )}
                        {columnIssues.map("""

content = content.replace("""                      <div className="space-y-sm">
                        {columnIssues.map(""", empty_state_jsx)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
