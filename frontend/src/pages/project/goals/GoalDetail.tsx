import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { goalService } from "../../../services/goalService";
import { milestoneService } from "../../../services/milestoneService";
import { traceabilityService } from "../../../services/traceabilityService";
import type { PlanningTraceability } from "../../../services/traceabilityService";
import type { GoalWithMilestones } from "../../../types/goal";

export default function GoalDetail() {
  const { projectId, goalId } = useParams<{ projectId: string; goalId: string }>();
  const [goal, setGoal] = useState<GoalWithMilestones | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [traceability, setTraceability] = useState<PlanningTraceability | null>(null);

  const [isCreatingMilestone, setIsCreatingMilestone] = useState(false);
  const [newTitle, setNewTitle] = useState("");

  const fetchGoal = async () => {
    if (!goalId) return;
    setLoading(true);
    try {
      const data = await goalService.getGoal(goalId);
      setGoal(data);
      if (projectId) {
        traceabilityService.getProjectPlanningTraceability(projectId).then(setTraceability).catch(() => null);
      }
    } catch (err) {
      setError("Failed to load goal");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGoal();
  }, [goalId]);

  const handleCreateMilestone = async () => {
    if (!goalId || !newTitle.trim()) return;
    try {
      await milestoneService.createMilestone(goalId, {
        title: newTitle,
        status: "PLANNED",
      });
      setIsCreatingMilestone(false);
      setNewTitle("");
      fetchGoal();
    } catch (err) {
      alert("Failed to create milestone");
    }
  };

  const updateGoalStatus = async (status: string) => {
    if (!goalId) return;
    try {
      await goalService.updateGoal(goalId, { status });
      fetchGoal();
    } catch (err) {
      alert("Failed to update status");
    }
  };

  if (loading) return <div className="p-xl">Loading goal...</div>;
  if (error || !goal) return <div className="p-xl">{error || "Goal not found"}</div>;

  return (
    <div className="p-xl space-y-xl max-w-[1200px] mx-auto">
      <div>
        <Link to={`/projects/${projectId}/goals`} className="text-primary hover:underline text-body-sm font-medium mb-md inline-block">
          &larr; Back to Goals
        </Link>
        <div className="flex justify-between items-start">
          <div className="flex-1 mr-xl">
            <h1 className="text-display-sm font-semibold text-on-surface">{goal.title}</h1>
            <p className="text-body-lg text-on-surface-variant mt-xs mb-lg">{goal.description || "No description."}</p>
            
            {traceability && traceability.goals && goalId && traceability.goals[goalId] && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-md p-md bg-surface-container-low rounded-xl border border-outline-variant/30">
                <div>
                  <p className="text-caption text-on-surface-variant">Overall Progress</p>
                  <p className="text-title-sm font-bold text-on-surface">{traceability.goals[goalId].progress}%</p>
                </div>
                <div>
                  <p className="text-caption text-on-surface-variant">Issues (Done/Total)</p>
                  <p className="text-title-sm font-bold text-on-surface">{traceability.goals[goalId].completed_issues} / {traceability.goals[goalId].total_issues}</p>
                </div>
                <div>
                  <p className="text-caption text-on-surface-variant">Linked PRs</p>
                  <p className="text-title-sm font-bold text-on-surface">{traceability.goals[goalId].linked_pr_count}</p>
                </div>
                <div>
                  <p className="text-caption text-on-surface-variant">CI Success</p>
                  <p className="text-title-sm font-bold text-on-surface">{traceability.goals[goalId].ci_success_rate}%</p>
                </div>
              </div>
            )}
          </div>
          <div className="flex items-center gap-sm mt-sm">
            <span className="text-body-sm text-on-surface-variant font-medium">Status:</span>
            <select
              value={goal.status}
              onChange={(e) => updateGoalStatus(e.target.value)}
              className="bg-surface-variant border border-outline-variant rounded-md px-sm py-xs text-on-surface text-body-sm font-medium focus:outline-none"
            >
              <option value="PLANNED">PLANNED</option>
              <option value="ACTIVE">ACTIVE</option>
              <option value="COMPLETED">COMPLETED</option>
            </select>
          </div>
        </div>
      </div>

      <div className="space-y-md">
        <div className="flex justify-between items-center">
          <h2 className="text-title-lg font-semibold text-on-surface">Milestones</h2>
          <button
            onClick={() => setIsCreatingMilestone(true)}
            className="text-primary font-medium hover:bg-surface-variant px-md py-sm rounded-lg transition-colors"
          >
            + Add Milestone
          </button>
        </div>

        {isCreatingMilestone && (
          <div className="bg-surface border border-outline-variant rounded-xl p-md flex gap-sm items-center">
            <input
              type="text"
              placeholder="Milestone title"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="flex-1 p-sm rounded-md border border-outline-variant bg-surface-variant text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <button onClick={() => setIsCreatingMilestone(false)} className="text-on-surface-variant font-medium px-md">Cancel</button>
            <button onClick={handleCreateMilestone} className="bg-primary text-on-primary px-md py-sm rounded-lg font-medium">Save</button>
          </div>
        )}

        {goal.milestones.length === 0 && !isCreatingMilestone ? (
          <div className="text-center py-xl bg-surface border border-outline-variant rounded-xl text-on-surface-variant">
            No milestones defined.
          </div>
        ) : (
          <div className="space-y-sm">
            {goal.milestones.map(milestone => (
              <div key={milestone.id} className="bg-surface border border-outline-variant rounded-xl p-md flex flex-col gap-sm">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-title-md font-medium text-on-surface">{milestone.title}</h3>
                    <p className="text-body-sm text-on-surface-variant">Status: {milestone.status}</p>
                  </div>
                  <div className="flex gap-sm">
                    <Link
                      to={`/projects/${projectId}/sprints?milestoneId=${milestone.id}`}
                      className="text-primary font-medium hover:underline text-body-sm"
                    >
                      View Sprints
                    </Link>
                  </div>
                </div>
                
                {traceability && traceability.milestones && traceability.milestones[milestone.id] && (
                  <div className="grid grid-cols-3 gap-xs bg-surface-container-low p-sm rounded text-caption border border-outline-variant/30 mt-xs">
                    <div>
                      <span className="text-on-surface-variant">Issues:</span><br/>
                      <span className="font-semibold text-on-surface">{traceability.milestones[milestone.id].completed_issues} / {traceability.milestones[milestone.id].total_issues}</span>
                    </div>
                    <div>
                      <span className="text-on-surface-variant">PRs / Commits:</span><br/>
                      <span className="font-semibold text-on-surface">{traceability.milestones[milestone.id].linked_pr_count} / {traceability.milestones[milestone.id].linked_commit_count}</span>
                    </div>
                    <div>
                      <span className="text-on-surface-variant">CI Runs:</span><br/>
                      <span className="font-semibold text-on-surface">{traceability.milestones[milestone.id].ci_passed_count} pass / {traceability.milestones[milestone.id].ci_failed_count} fail</span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
