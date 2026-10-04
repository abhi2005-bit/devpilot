import { useState, useEffect } from "react";
import Modal from "../common/Modal";
import CreateIssueForm from "../issues/CreateIssueForm";
import { issueService } from "../../services/issueService";
import type { Issue } from "../../types/issue";
import { investigationService, type StructuredInvestigation } from "../../services/investigationService";

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
  const [loading, setLoading] = useState<boolean>(false);
  const [aiLoading, setAiLoading] = useState<boolean>(false);
  const [investigation, setInvestigation] = useState<StructuredInvestigation | null>(null);

  useEffect(() => {
    if (isOpen && item && projectId) {
      setLoading(true);
      investigationService.analyzeProblem(
        projectId,
        item.category || "general",
        item.id,
        item.title,
        item.description
      ).then(data => {
        setInvestigation(data);
        setLoading(false);
      }).catch(err => {
        console.error(err);
        setLoading(false);
        setError("Failed to load detailed investigation data. Showing basic evidence.");
      });
    } else {
      setInvestigation(null);
    }
  }, [isOpen, item, projectId]);

  if (!item) return null;

  const handleAnalyzeWithAI = async () => {
    if (!item || !projectId) return;
    setAiLoading(true);
    try {
      const data = await investigationService.analyzeProblemWithAI(
        projectId,
        item.category || "general",
        item.id,
        item.title,
        item.description
      );
      setInvestigation(data);
    } catch (err) {
      console.error(err);
      setError("Failed to perform AI analysis. Showing deterministic data instead.");
    } finally {
      setAiLoading(false);
    }
  };

  const handleCreateIssue = async (issueData: Issue) => {
    try {
      setError(null);
      await issueService.createIssue({
        projectId,
        title: issueData.title,
        description: issueData.description,
        status: issueData.status,
        priority: issueData.priority,
        assignee: issueData.assignee?.name || "", 
        labels: issueData.labels.join(",")
      } as any); 
      onIssueCreated();
      onClose();
      onNavigateTo("issues"); 
    } catch (err) {
      console.error("Failed to create issue:", err);
      setError("Failed to create issue. Please try again.");
    }
  };

  const handleAction = (actionType: string) => {
    switch (actionType) {
      case "CREATE_ISSUE":
        setView("create_issue");
        break;
      case "VIEW_CI":
        onClose();
        onNavigateTo("cicd");
        break;
      case "VIEW_ISSUES":
        onClose();
        onNavigateTo("issues");
        break;
      default:
        onClose();
    }
  };

  const buildIssueDescription = () => {
    if (!investigation) {
      return `DevPilot detected a problem:\n\n${item.description}\n\nEvidence:\n${item.evidence}`;
    }
    
    let desc = `DevPilot detected a problem: **${investigation.problem.title}**\n\n`;
    desc += `**Severity**: ${investigation.problem.severity}\n`;
    desc += `**Current State**: ${investigation.problem.current_state}\n`;
    desc += `**Why it matters**: ${investigation.problem.why_it_matters}\n\n`;
    
    if (investigation.contributing_factors.length > 0) {
      desc += `### Potential Contributing Factors\n`;
      investigation.contributing_factors.forEach(f => {
        desc += `- **${f.title}**: ${f.description}\n`;
      });
      desc += `\n`;
    }
    
    if (investigation.timeline.length > 0) {
      desc += `### Timeline\n`;
      investigation.timeline.forEach(t => {
        desc += `- ${new Date(t.timestamp).toLocaleString()}: ${t.description}\n`;
      });
      desc += `\n`;
    }
    
    desc += `**Confidence**: ${investigation.confidence}`;
    return desc;
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
        <div className="space-y-md max-h-[70vh] overflow-y-auto pr-sm">
          {loading ? (
            <div className="text-center py-xl">
              <span className="material-symbols-outlined animate-spin text-primary text-[32px]">sync</span>
              <p className="mt-sm text-on-surface-variant">Gathering evidence and analyzing timeline...</p>
            </div>
          ) : investigation ? (
            <>
              {/* Problem Section */}
              <div className="rounded-lg border border-error/30 bg-error-container/10 p-md">
                <div className="flex items-start gap-md">
                  <span className="material-symbols-outlined text-error mt-xs">warning</span>
                  <div>
                    <h3 className="text-title-sm font-semibold text-error mb-xs">{investigation.problem.title}</h3>
                    <div className="grid grid-cols-2 gap-sm text-body-sm">
                      <div><span className="font-semibold text-on-surface">Severity:</span> <span className="text-error">{investigation.problem.severity}</span></div>
                      <div><span className="font-semibold text-on-surface">Current state:</span> <span className="text-on-surface-variant">{investigation.problem.current_state}</span></div>
                      <div className="col-span-2"><span className="font-semibold text-on-surface">Why it matters:</span> <span className="text-on-surface-variant">{investigation.problem.why_it_matters}</span></div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Evidence Section */}
              <div>
                <h4 className="text-body-md font-semibold text-on-surface mb-sm">Evidence <span className="text-caption font-normal bg-surface-variant px-sm py-[2px] rounded-full ml-sm">{investigation.confidence}</span></h4>
                <div className="grid grid-cols-2 gap-sm">
                  {investigation.evidence.open_issues !== undefined && (
                    <div className="p-sm bg-surface-container-low rounded border border-outline-variant/30">
                      <div className="text-caption text-on-surface-variant">Open Issues</div>
                      <div className="text-body-md font-semibold">{investigation.evidence.open_issues}</div>
                    </div>
                  )}
                  {investigation.evidence.critical_issues !== undefined && investigation.evidence.critical_issues > 0 && (
                    <div className="p-sm bg-surface-container-low rounded border border-outline-variant/30">
                      <div className="text-caption text-on-surface-variant text-error">Critical Issues</div>
                      <div className="text-body-md font-semibold text-error">{investigation.evidence.critical_issues}</div>
                    </div>
                  )}
                  {investigation.evidence.failed_ci_runs !== undefined && (
                    <div className="p-sm bg-surface-container-low rounded border border-outline-variant/30">
                      <div className="text-caption text-on-surface-variant">Failed CI Runs</div>
                      <div className="text-body-md font-semibold">{investigation.evidence.failed_ci_runs}</div>
                    </div>
                  )}
                  {investigation.evidence.linked_prs !== undefined && (
                    <div className="p-sm bg-surface-container-low rounded border border-outline-variant/30">
                      <div className="text-caption text-on-surface-variant">Active PRs</div>
                      <div className="text-body-md font-semibold">{investigation.evidence.linked_prs}</div>
                    </div>
                  )}
                  {investigation.evidence.health_change !== undefined && investigation.evidence.health_change !== null && (
                    <div className="p-sm bg-surface-container-low rounded border border-outline-variant/30">
                      <div className="text-caption text-on-surface-variant">Health Change</div>
                      <div className="text-body-md font-semibold">{investigation.evidence.health_change > 0 ? "+" : ""}{investigation.evidence.health_change} pts</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Contributing Factors */}
              {investigation.contributing_factors.length > 0 && (
                <div>
                  <h4 className="text-body-md font-semibold text-on-surface mb-sm">Potential Contributing Factors</h4>
                  <div className="space-y-sm">
                    {investigation.contributing_factors.map((f, i) => (
                      <div key={i} className="flex gap-sm items-start p-sm bg-surface-container-low rounded border border-outline-variant/30">
                        <span className="material-symbols-outlined text-primary text-[18px] mt-xs">info</span>
                        <div>
                          <h5 className="text-body-sm font-semibold">{f.title}</h5>
                          <p className="text-caption text-on-surface-variant">{f.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Timeline */}
              {investigation.timeline.length > 0 && (
                <div>
                  <h4 className="text-body-md font-semibold text-on-surface mb-sm">Recent Timeline</h4>
                  <div className="space-y-sm border-l-2 border-outline-variant ml-sm pl-md">
                    {investigation.timeline.map((t, i) => (
                      <div key={i} className="relative">
                        <div className="absolute -left-[23px] top-[4px] w-[10px] h-[10px] bg-primary rounded-full"></div>
                        <div className="text-caption text-on-surface-variant">{new Date(t.timestamp).toLocaleString()}</div>
                        <div className="text-body-sm font-medium">{t.description}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* AI Analysis Section */}
              {investigation.ai_analysis ? (
                <div className="rounded-lg border border-primary/30 bg-primary-container/10 p-md space-y-md">
                  <div className="flex items-center gap-sm mb-sm border-b border-primary/20 pb-sm">
                    <span className="material-symbols-outlined text-primary">psychology</span>
                    <h4 className="text-body-lg font-semibold text-primary">AI Engineering Summary</h4>
                  </div>
                  
                  <div>
                    <p className="text-body-md text-on-surface">{investigation.ai_analysis.summary}</p>
                  </div>

                  {investigation.ai_analysis.facts.length > 0 && (
                    <div>
                      <h5 className="text-body-sm font-semibold text-on-surface mb-xs">Verified Facts</h5>
                      <ul className="list-disc pl-md text-body-sm text-on-surface-variant space-y-xs">
                        {investigation.ai_analysis.facts.map((fact, idx) => (
                          <li key={idx}>{fact}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {investigation.ai_analysis.inferences.length > 0 && (
                    <div>
                      <h5 className="text-body-sm font-semibold text-on-surface mb-xs">Likely Contributing Factors (Inferences)</h5>
                      <div className="space-y-sm">
                        {investigation.ai_analysis.inferences.map((inf, idx) => (
                          <div key={idx} className="bg-surface-container-low p-sm rounded border border-outline-variant/30 text-body-sm">
                            <div className="font-medium text-on-surface mb-xs">
                              {inf.statement} 
                              <span className={`ml-sm text-caption px-[6px] py-[2px] rounded-full ${inf.confidence === 'HIGH' ? 'bg-error-container text-on-error-container' : 'bg-surface-variant text-on-surface-variant'}`}>{inf.confidence}</span>
                            </div>
                            {inf.supporting_evidence.length > 0 && (
                              <ul className="list-disc pl-md text-caption text-on-surface-variant">
                                {inf.supporting_evidence.map((ev, eIdx) => <li key={eIdx}>{ev}</li>)}
                              </ul>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {investigation.ai_analysis.recommendations.length > 0 && (
                    <div>
                      <h5 className="text-body-sm font-semibold text-on-surface mb-xs">Recommended Next Steps</h5>
                      <div className="space-y-sm">
                        {investigation.ai_analysis.recommendations.map((rec, idx) => (
                          <div key={idx} className="bg-surface-container-low p-sm rounded border border-outline-variant/30 text-body-sm">
                            <div className="font-medium text-on-surface">{rec.title}</div>
                            <div className="text-caption text-on-surface-variant mt-xs">Reason: {rec.reason}</div>
                            <div className="text-caption text-primary mt-xs font-medium">Priority: {rec.priority}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {investigation.ai_analysis.uncertainty.length > 0 && (
                    <div>
                      <h5 className="text-body-sm font-semibold text-on-surface mb-xs text-error">Uncertainty</h5>
                      <ul className="list-disc pl-md text-body-sm text-on-surface-variant space-y-xs">
                        {investigation.ai_analysis.uncertainty.map((u, idx) => (
                          <li key={idx}>{u}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex justify-center mt-md">
                  <button
                    onClick={handleAnalyzeWithAI}
                    disabled={aiLoading}
                    className="flex items-center gap-sm rounded-full bg-primary-container px-md py-sm text-body-sm font-bold text-on-primary-container hover:bg-primary/20 disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined">{aiLoading ? 'sync' : 'psychology'}</span>
                    {aiLoading ? 'Analyzing...' : 'Analyze with DevPilot AI'}
                  </button>
                </div>
              )}

              {/* Recommendations */}
              <div>
                <h4 className="text-body-md font-semibold text-on-surface mb-sm">Recommended Next Actions</h4>
                <div className="flex flex-wrap gap-sm">
                  {investigation.recommendations.map((r, i) => (
                    <button
                      key={i}
                      onClick={() => handleAction(r.action_type)}
                      className={`rounded-lg px-md py-sm text-body-sm font-bold ${r.action_type === 'CREATE_ISSUE' ? 'bg-primary text-on-primary hover:bg-primary-container' : 'bg-surface-container-highest text-on-surface hover:bg-surface-container'}`}
                    >
                      {r.title}
                    </button>
                  ))}
                </div>
              </div>
            </>
          ) : (
            // Fallback for basic view
            <>
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
                <div className="flex gap-sm mt-md">
                  <button
                    onClick={() => setView("create_issue")}
                    className="rounded-lg bg-primary px-md py-sm text-body-sm font-bold text-on-primary hover:bg-primary-container"
                  >
                    Create Issue
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      ) : (
        <CreateIssueForm
          projectId={projectId}
          onCancel={() => setView("details")}
          onSubmit={handleCreateIssue}
          initialValues={{
            title: `Investigate: ${item.title}`,
            description: buildIssueDescription(),
            priority: item.severity === "risk" ? "HIGH" : "MEDIUM"
          }}
        />
      )}
    </Modal>
  );
}

export default InvestigationModal;
