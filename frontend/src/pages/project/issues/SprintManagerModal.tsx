import { useState, useEffect } from "react";
import Modal from "../../../components/common/Modal";
import type { Sprint, SprintStatus } from "../../../types/sprint";
import { sprintService } from "../../../services/sprintService";
import { traceabilityService } from "../../../services/traceabilityService";

import { goalService } from "../../../services/goalService";
import type { GoalWithMilestones } from "../../../types/goal";


interface SprintManagerModalProps {
  projectId: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function SprintManagerModal({
  projectId,
  isOpen,
  onClose
}: SprintManagerModalProps) {
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [newSprintName, setNewSprintName] = useState("");
  const [loading, setLoading] = useState(false);
  const [traceability, setTraceability] = useState<any>(null);

  const [goals, setGoals] = useState<GoalWithMilestones[]>([]);
  const [selectedMilestoneId, setSelectedMilestoneId] = useState<string>("");


  const loadSprints = () => {
    sprintService.getSprints(projectId).then(setSprints);

    goalService.getGoals(projectId).then(setGoals);
    traceabilityService.getProjectPlanningTraceability(projectId).then(setTraceability).catch(() => null);

  };

  useEffect(() => {
    if (isOpen && projectId) {
      loadSprints();
    }
  }, [isOpen, projectId]);

  const handleCreate = async () => {
    if (!newSprintName.trim()) return;
    setLoading(true);
    try {
      
      await sprintService.createSprint(projectId, { 
        name: newSprintName, 
        milestoneId: selectedMilestoneId || null 
      });
      setSelectedMilestoneId("");

      setNewSprintName("");
      loadSprints();
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (sprintId: string, status: SprintStatus) => {
    setLoading(true);
    try {
      await sprintService.updateSprint(sprintId, { status });
      loadSprints();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Manage Sprints">
      <div className="space-y-lg w-[500px] max-w-full">
        {/* Create new sprint */}
        
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


        {/* List sprints */}
        <div className="space-y-sm max-h-[400px] overflow-y-auto">
          {sprints.map(sprint => (
            <div key={sprint.id} className="flex flex-col gap-sm rounded-lg border border-outline-variant p-md">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="text-body-md font-semibold text-on-surface">{sprint.name}</h4>
                  <p className="text-caption text-on-surface-variant">Status: {sprint.status}</p>
                </div>
                
                <div className="flex gap-sm">
                  {sprint.status === "PLANNED" && (
                    <button
                      onClick={() => handleStatusChange(sprint.id, "ACTIVE")}
                      disabled={loading}
                      className="rounded-lg bg-secondary-container px-sm py-xs text-caption font-semibold text-on-secondary-container"
                    >
                      Start
                    </button>
                  )}
                  {sprint.status === "ACTIVE" && (
                    <button
                      onClick={() => handleStatusChange(sprint.id, "COMPLETED")}
                      disabled={loading}
                      className="rounded-lg bg-tertiary-container px-sm py-xs text-caption font-semibold text-on-tertiary-container"
                    >
                      Complete
                    </button>
                  )}
                </div>
              </div>

              {traceability && traceability.sprints && traceability.sprints[sprint.id] && (
                <div className="grid grid-cols-3 gap-xs bg-surface-container-low p-sm rounded text-caption border border-outline-variant/30 mt-xs">
                  <div>
                    <span className="text-on-surface-variant">Issues:</span><br/>
                    <span className="font-semibold text-on-surface">{traceability.sprints[sprint.id].completed_issues} / {traceability.sprints[sprint.id].total_issues}</span>
                  </div>
                  <div>
                    <span className="text-on-surface-variant">PRs / Commits:</span><br/>
                    <span className="font-semibold text-on-surface">{traceability.sprints[sprint.id].linked_pr_count} / {traceability.sprints[sprint.id].linked_commit_count}</span>
                  </div>
                  <div>
                    <span className="text-on-surface-variant">CI Runs:</span><br/>
                    <span className="font-semibold text-on-surface">{traceability.sprints[sprint.id].ci_passed_count} pass / {traceability.sprints[sprint.id].ci_failed_count} fail</span>
                  </div>
                </div>
              )}
            </div>
          ))}
          {sprints.length === 0 && (
            <p className="text-body-sm text-on-surface-variant text-center py-md">No sprints found.</p>
          )}
        </div>
      </div>
    </Modal>
  );
}
