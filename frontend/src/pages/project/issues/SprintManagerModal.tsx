import { useState, useEffect } from "react";
import Modal from "../../../components/common/Modal";
import type { Sprint, SprintStatus } from "../../../types/sprint";
import { sprintService } from "../../../services/sprintService";

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

  const loadSprints = () => {
    sprintService.getSprints(projectId).then(setSprints);
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
      await sprintService.createSprint(projectId, { name: newSprintName });
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
        <div className="flex gap-sm">
          <input
            type="text"
            placeholder="New Sprint Name"
            value={newSprintName}
            onChange={(e) => setNewSprintName(e.target.value)}
            className="flex-1 rounded-lg border border-outline bg-surface px-md py-sm text-body-sm text-on-surface focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <button
            onClick={handleCreate}
            disabled={loading || !newSprintName.trim()}
            className="rounded-lg bg-primary px-md py-sm text-body-sm font-semibold text-on-primary disabled:opacity-50"
          >
            Create
          </button>
        </div>

        {/* List sprints */}
        <div className="space-y-sm max-h-[400px] overflow-y-auto">
          {sprints.map(sprint => (
            <div key={sprint.id} className="flex items-center justify-between rounded-lg border border-outline-variant p-md">
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
          ))}
          {sprints.length === 0 && (
            <p className="text-body-sm text-on-surface-variant text-center py-md">No sprints found.</p>
          )}
        </div>
      </div>
    </Modal>
  );
}
