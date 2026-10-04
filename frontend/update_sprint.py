import re

with open("src/pages/project/issues/SprintManagerModal.tsx", "r", encoding="utf-8") as f:
    content = f.read()

imports_add = """
import { goalService } from "../../../services/goalService";
import type { GoalWithMilestones } from "../../../types/goal";
"""
content = content.replace('import { sprintService } from "../../../services/sprintService";', 'import { sprintService } from "../../../services/sprintService";\n' + imports_add)

state_add = """
  const [goals, setGoals] = useState<GoalWithMilestones[]>([]);
  const [selectedMilestoneId, setSelectedMilestoneId] = useState<string>("");
"""
content = content.replace('const [loading, setLoading] = useState(false);', 'const [loading, setLoading] = useState(false);\n' + state_add)

load_goals = """
    goalService.getGoals(projectId).then(setGoals);
"""
content = content.replace('sprintService.getSprints(projectId).then(setSprints);', 'sprintService.getSprints(projectId).then(setSprints);\n' + load_goals)

create_call = """
      await sprintService.createSprint(projectId, { 
        name: newSprintName, 
        milestoneId: selectedMilestoneId || null 
      });
      setSelectedMilestoneId("");
"""
content = content.replace('await sprintService.createSprint(projectId, { name: newSprintName });', create_call)

ui_add = """
        <div className="flex flex-col gap-sm">
          <div className="flex gap-sm">
            <input
              type="text"
              placeholder="New Sprint Name"
              value={newSprintName}
              onChange={(e) => setNewSprintName(e.target.value)}
              className="flex-1 p-sm rounded-md border border-outline-variant bg-surface-variant text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <button
              onClick={handleCreate}
              disabled={loading || !newSprintName.trim()}
              className="bg-primary text-on-primary px-md py-sm rounded-lg font-medium disabled:opacity-50"
            >
              Create
            </button>
          </div>
          
          <select 
            value={selectedMilestoneId}
            onChange={(e) => setSelectedMilestoneId(e.target.value)}
            className="p-sm rounded-md border border-outline-variant bg-surface-variant text-on-surface focus:outline-none focus:ring-2 focus:ring-primary text-body-sm"
          >
            <option value="">No Milestone (Optional)</option>
            {goals.map(g => (
              <optgroup key={g.id} label={`Goal: ${g.title}`}>
                {g.milestones.map(m => (
                  <option key={m.id} value={m.id}>{m.title}</option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>
"""

content = re.sub(r'<div className="flex gap-sm">.*?</div>', ui_add, content, flags=re.DOTALL, count=1)

with open("src/pages/project/issues/SprintManagerModal.tsx", "w", encoding="utf-8") as f:
    f.write(content)
