import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { goalService } from "../../../services/goalService";
import type { GoalWithMilestones } from "../../../types/goal";

export default function Goals() {
  const { projectId } = useParams<{ projectId: string }>();
  const [goals, setGoals] = useState<GoalWithMilestones[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");

  const fetchGoals = async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const data = await goalService.getGoals(projectId);
      setGoals(data);
    } catch (err) {
      setError("Failed to load goals");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGoals();
  }, [projectId]);

  const handleCreate = async () => {
    if (!projectId || !newTitle.trim()) return;
    try {
      await goalService.createGoal(projectId, {
        title: newTitle,
        description: newDescription,
        status: "PLANNED",
      });
      setIsCreating(false);
      setNewTitle("");
      setNewDescription("");
      fetchGoals();
    } catch (err) {
      alert("Failed to create goal");
    }
  };

  if (loading) return <div>Loading goals...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div className="p-xl space-y-xl max-w-[1200px] mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-display-sm font-semibold text-on-surface">Project Goals</h1>
          <p className="text-body-lg text-on-surface-variant">Strategic outcomes for this project</p>
        </div>
        <button
          onClick={() => setIsCreating(true)}
          className="bg-primary text-on-primary px-lg py-md rounded-lg font-medium"
        >
          Create Goal
        </button>
      </div>

      {isCreating && (
        <div className="bg-surface border border-outline-variant rounded-xl p-lg space-y-md">
          <h2 className="text-title-lg font-semibold">New Goal</h2>
          <div className="space-y-sm">
            <label className="text-body-sm font-medium text-on-surface">Title</label>
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="w-full p-sm rounded-md border border-outline-variant bg-surface-variant text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div className="space-y-sm">
            <label className="text-body-sm font-medium text-on-surface">Description</label>
            <textarea
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              className="w-full p-sm rounded-md border border-outline-variant bg-surface-variant text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div className="flex gap-sm justify-end">
            <button onClick={() => setIsCreating(false)} className="px-md py-sm text-on-surface-variant font-medium">Cancel</button>
            <button onClick={handleCreate} className="px-md py-sm bg-primary text-on-primary rounded-lg font-medium">Save</button>
          </div>
        </div>
      )}

      {goals.length === 0 ? (
        <div className="text-center py-xl bg-surface border border-outline-variant rounded-xl">
          <p className="text-on-surface-variant">No project goals yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-lg">
          {goals.map(goal => (
            <Link
              key={goal.id}
              to={`/projects/${projectId}/goals/${goal.id}`}
              className="block bg-surface border border-outline-variant rounded-xl p-lg hover:border-primary transition-colors"
            >
              <h3 className="text-title-md font-semibold text-on-surface mb-xs">{goal.title}</h3>
              <p className="text-body-sm text-on-surface-variant mb-md line-clamp-2">
                {goal.description || "No description provided."}
              </p>
              <div className="flex justify-between items-center text-label-md">
                <span className="bg-surface-variant text-on-surface-variant px-sm py-[2px] rounded-full">
                  {goal.status}
                </span>
                <span className="text-on-surface-variant">
                  {goal.milestones.length} Milestones
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
