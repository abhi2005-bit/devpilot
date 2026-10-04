import re

with open("src/pages/project/ProjectHome.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# 1. Imports
imports_to_add = """
import { goalService } from "../../services/goalService";
import type { GoalWithMilestones } from "../../types/goal";
"""

content = content.replace('import type { CICDRun } from "../../types/cicd";', 'import type { CICDRun } from "../../types/cicd";\n' + imports_to_add)

# 2. State
state_to_add = """
  const [goals, setGoals] = useState<GoalWithMilestones[]>([]);
"""
content = content.replace('const [activeSprint, setActiveSprint] = useState<Sprint | null>(null);', 'const [activeSprint, setActiveSprint] = useState<Sprint | null>(null);\n' + state_to_add)

# 3. Load Data
load_data_add = """
            goalService.getGoals(projectId)
"""
content = content.replace('sprintService.getSprints(projectId)', 'sprintService.getSprints(projectId),\n' + load_data_add)

content = content.replace('const [contextRes, issuesRes, githubRes, cicdRes, sprintsRes] = await Promise.allSettled([', 'const [contextRes, issuesRes, githubRes, cicdRes, sprintsRes, goalsRes] = await Promise.allSettled([')

# 4. Handle Result
handle_result_add = """
          if (goalsRes.status === "fulfilled") setGoals(goalsRes.value);
"""
content = content.replace('if (sprintsRes.status === "fulfilled") { const active = sprintsRes.value.find((s: Sprint) => s.status === "ACTIVE"); setActiveSprint(active || null); }', 'if (sprintsRes.status === "fulfilled") { const active = sprintsRes.value.find((s: Sprint) => s.status === "ACTIVE"); setActiveSprint(active || null); }\n' + handle_result_add)

# 5. JSX
planning_jsx = """
      {/* 1.5. PLANNING CONTEXT */}
      <section className="rounded-xl border border-outline-variant bg-surface p-lg">
        <div className="flex items-center justify-between mb-md">
          <h2 className="text-title-md font-semibold text-on-surface flex items-center gap-xs">
            <span className="material-symbols-outlined text-primary">target</span>
            Strategic Planning
          </h2>
          <Link to={`/projects/${projectId}/goals`} className="text-primary text-body-sm font-medium hover:underline">
            View All Goals &rarr;
          </Link>
        </div>
        
        {goals.length === 0 ? (
          <div className="text-center py-md bg-surface-variant rounded-lg">
            <p className="text-body-sm text-on-surface-variant">No project goals defined yet.</p>
            <Link to={`/projects/${projectId}/goals`} className="text-primary text-body-sm font-medium mt-xs inline-block hover:underline">
              Create First Goal
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
            {goals.filter(g => g.status !== "COMPLETED").slice(0, 2).map(goal => {
              const activeMilestone = goal.milestones.find(m => m.status === "ACTIVE") || goal.milestones[0];
              
              // Calculate derived progress from Sprint/Issues
              // In this MVP, we can mock it or calculate based on issues linked to active sprint
              // if we don't have direct issue-milestone relation loaded. 
              // For now, we'll just show the goal and milestone info as a summary.

              return (
                <div key={goal.id} className="border border-outline-variant rounded-lg p-md bg-surface-container-low">
                  <div className="flex justify-between items-start mb-sm">
                    <h3 className="text-title-sm font-semibold text-on-surface truncate pr-2" title={goal.title}>{goal.title}</h3>
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded bg-secondary-container text-secondary-on-container">
                      {goal.status}
                    </span>
                  </div>
                  
                  {activeMilestone ? (
                    <div className="mt-md pt-md border-t border-outline-variant/50">
                      <p className="text-caption text-on-surface-variant mb-1">Active Milestone</p>
                      <div className="flex justify-between items-center">
                        <p className="text-body-sm font-medium text-on-surface truncate pr-2">{activeMilestone.title}</p>
                        <span className="text-caption px-2 py-0.5 bg-surface-variant rounded-full text-on-surface-variant">{activeMilestone.status}</span>
                      </div>
                    </div>
                  ) : (
                     <div className="mt-md pt-md border-t border-outline-variant/50 text-caption text-on-surface-variant">
                       No milestones defined
                     </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
"""

content = content.replace('{/* Active Sprint Banner */}', planning_jsx + '\n            {/* Active Sprint Banner */}')

with open("src/pages/project/ProjectHome.tsx", "w", encoding="utf-8") as f:
    f.write(content)
