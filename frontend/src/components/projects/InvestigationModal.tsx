import { useState } from "react";
import Modal from "../common/Modal";
import CreateIssueForm from "../issues/CreateIssueForm";
import { issueService } from "../../services/issueService";
import type { Issue } from "../../types/issue";

export interface InvestigationItem {
  id: string;
  title: string;
  severity: string;
  description: string;
  evidence: string;
  category?: string;
  originalData?: any;
}

interface InvestigationModalProps {
  projectId: string;
  item: InvestigationItem | null;
  isOpen: boolean;
  onClose: () => void;
  onNavigateTo: (destination: string) => void;
  onIssueCreated: () => void;
}

function InvestigationModal({
  projectId,
  item,
  isOpen,
  onClose,
  onNavigateTo,
  onIssueCreated,
}: InvestigationModalProps) {
  const [view, setView] = useState<"details" | "create_issue">("details");
  const [error, setError] = useState<string | null>(null);

  if (!item) return null;

  const handleCreateIssue = async (issueData: Issue) => {
    try {
      setError(null);
      await issueService.createIssue({
        projectId,
        title: issueData.title,
        description: issueData.description,
        status: issueData.status,
        priority: issueData.priority,
        // The CreateIssueForm sends the assignee as a string, but the service expects an IssueAssignee object or a string depending on how it's typed. 
        // We'll pass what the form sends, which handles it internally.
        assignee: issueData.assignee?.name || "", 
        labels: issueData.labels.join(",")
      } as any); // Type assertion because FrontendIssueInput expects a slightly different shape
      onIssueCreated();
      onClose();
      onNavigateTo("issues"); // Navigate to issues page
    } catch (err) {
      console.error("Failed to create issue:", err);
      setError("Failed to create issue. Please try again.");
    }
  };

  const getRecommendedAction = () => {
    if (item.category === "cicd") {
      return (
        <div className="flex gap-sm mt-md">
          <button
            onClick={() => { onClose(); onNavigateTo("cicd"); }}
            className="rounded-lg bg-surface-container-highest px-md py-sm text-body-sm font-medium text-on-surface hover:bg-surface-container"
          >
            View CI/CD
          </button>
          <button
            onClick={() => setView("create_issue")}
            className="rounded-lg bg-primary px-md py-sm text-body-sm font-bold text-on-primary hover:bg-primary-container"
          >
            Create Issue
          </button>
        </div>
      );
    }
    
    if (item.category === "issues") {
      return (
        <div className="flex gap-sm mt-md">
          <button
            onClick={() => { onClose(); onNavigateTo("issues"); }}
            className="rounded-lg bg-surface-container-highest px-md py-sm text-body-sm font-medium text-on-surface hover:bg-surface-container"
          >
            View Issues
          </button>
        </div>
      );
    }

    if (item.category === "github") {
       return (
         <div className="flex gap-sm mt-md">
          <button
            onClick={() => { onClose(); onNavigateTo("github"); }}
            className="rounded-lg bg-surface-container-highest px-md py-sm text-body-sm font-medium text-on-surface hover:bg-surface-container"
          >
            Open GitHub
          </button>
           <button
            onClick={() => setView("create_issue")}
            className="rounded-lg bg-primary px-md py-sm text-body-sm font-bold text-on-primary hover:bg-primary-container"
          >
            Create Issue
          </button>
        </div>
       );
    }

    // Default
    return (
      <div className="flex gap-sm mt-md">
        <button
          onClick={() => setView("create_issue")}
          className="rounded-lg bg-primary px-md py-sm text-body-sm font-bold text-on-primary hover:bg-primary-container"
        >
          Create Issue
        </button>
      </div>
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        setView("details");
        setError(null);
        onClose();
      }}
      title={view === "details" ? "Investigate Problem" : "Create Issue"}
    >
      {error && (
        <div className="mb-4 rounded-lg bg-error-container p-sm text-body-sm text-on-error">
          {error}
        </div>
      )}
      {view === "details" ? (
        <div className="space-y-md">
          <div className="rounded-lg border border-error/30 bg-error-container/10 p-md">
            <div className="flex items-start gap-md">
              <span className="material-symbols-outlined text-error">warning</span>
              <div>
                <h3 className="text-body-lg font-semibold text-error">{item.title}</h3>
                <p className="text-body-sm text-on-surface mt-xs">{item.description}</p>
              </div>
            </div>
          </div>
          
          <div>
            <h4 className="text-body-md font-semibold text-on-surface">Evidence</h4>
            <div className="mt-sm rounded-lg border border-outline-variant bg-surface-container-low p-md">
              <p className="text-body-sm text-on-surface-variant whitespace-pre-wrap">{item.evidence}</p>
            </div>
          </div>

          <div>
            <h4 className="text-body-md font-semibold text-on-surface">Recommended Action</h4>
            {getRecommendedAction()}
          </div>
        </div>
      ) : (
        <CreateIssueForm
          projectId={projectId}
          onCancel={() => setView("details")}
          onSubmit={handleCreateIssue}
          initialValues={{
            title: `Investigate: ${item.title}`,
            description: `DevPilot detected a problem:\n\n${item.description}\n\nEvidence:\n${item.evidence}`,
            priority: item.severity === "risk" ? "HIGH" : "MEDIUM"
          }}
        />
      )}
    </Modal>
  );
}

export default InvestigationModal;
