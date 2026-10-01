import { useState, useEffect } from "react";
import type { Sprint } from "../../../types/sprint";
import { sprintService } from "../../../services/sprintService";

interface SprintSelectorProps {
  projectId: string;
  selectedSprintId: string | null;
  onSprintSelect: (sprintId: string | null) => void;
  onSprintAction: () => void;
}

export default function SprintSelector({
  projectId,
  selectedSprintId,
  onSprintSelect,
  onSprintAction
}: SprintSelectorProps) {
  const [sprints, setSprints] = useState<Sprint[]>([]);

  useEffect(() => {
    if (projectId) {
      sprintService.getSprints(projectId).then(setSprints).catch(console.error);
    }
  }, [projectId]);

  return (
    <div className="flex items-center gap-md">
      <select
        value={selectedSprintId || ""}
        onChange={(e) => onSprintSelect(e.target.value || null)}
        className="rounded-lg border border-outline bg-surface px-md py-sm text-body-sm text-on-surface"
      >
        <option value="">All Project Issues (Backlog)</option>
        {sprints.map((sprint) => (
          <option key={sprint.id} value={sprint.id}>
            {sprint.name} ({sprint.status})
          </option>
        ))}
      </select>

      <button
        onClick={onSprintAction}
        className="rounded-lg bg-primary-container px-md py-sm text-body-sm font-semibold text-on-primary-container hover:bg-primary-container-hover transition-colors"
      >
        Manage Sprints
      </button>
    </div>
  );
}
