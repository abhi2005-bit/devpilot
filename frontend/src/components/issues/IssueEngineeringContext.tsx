import { useEffect, useState } from "react";
import { githubService } from "../../services/githubService";
import { traceabilityService } from "../../services/traceabilityService";
import type { TraceabilityContext } from "../../services/traceabilityService";
import type { Issue, IssueStatus } from "../../types/issue";
import type { ProjectGitHub } from "../../types/github";

interface Props {
  issue: Issue;
  onUpdateStatus: (status: IssueStatus) => void;
}

export default function IssueEngineeringContext({ issue, onUpdateStatus }: Props) {
  const [github, setGithub] = useState<ProjectGitHub | null>(null);
  const [traceability, setTraceability] = useState<TraceabilityContext | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    Promise.allSettled([
      githubService.getProjectGitHub(issue.projectId),
      traceabilityService.getIssueTraceability(issue.id)
    ]).then(([ghRes, traceRes]) => {
      if (!isMounted) return;
      if (ghRes.status === "fulfilled") setGithub(ghRes.value);
      if (traceRes.status === "fulfilled") setTraceability(traceRes.value);
      setIsLoading(false);
    });
    return () => { isMounted = false; };
  }, [issue.id, issue.projectId]);

  if (isLoading) {
    return (
      <div className="rounded-xl border border-outline-variant bg-surface-container p-lg">
        <div className="flex items-center gap-sm">
           <span className="material-symbols-outlined animate-spin text-primary">progress_activity</span>
           <span className="text-body-sm text-on-surface-variant">Loading engineering context...</span>
        </div>
      </div>
    );
  }

  const relatedPRs = traceability?.pull_requests || [];
  const relatedCommits = traceability?.commits || [];
  const relatedRuns = traceability?.ci_runs || [];

  // Verification Logic
  const problemMatch = issue.description.match(/CI Run Failed: (.*)/) || issue.title.match(/CI Run Failed: (.*)/);
  let verificationState = "unknown";
  let verificationMessage = "";

  if (issue.status === "DONE") {
    verificationState = "resolved";
    verificationMessage = "Issue is marked as done.";
  } else if (problemMatch && relatedRuns.length > 0) {
    const workflowName = problemMatch[1].split("\n")[0].trim();
    const latestRun = relatedRuns.find(r => r.workflow_name.includes(workflowName) || workflowName.includes(r.workflow_name));
    if (latestRun) {
      if (latestRun.conclusion === "success") {
        verificationState = "suggest_resolved";
        verificationMessage = `Evidence suggests the problem may be resolved. Latest CI run for ${latestRun.workflow_name} is passing.`;
      } else {
        verificationState = "failing";
        verificationMessage = `Latest CI run for ${latestRun.workflow_name} is still failing.`;
      }
    }
  }

  return (
    <div className="space-y-lg">
      <div className="rounded-xl border border-outline-variant bg-surface-container p-lg">
        <h2 className="text-title-sm font-semibold text-on-surface mb-md">Engineering Context</h2>

        <div className="space-y-md">
          {/* GitHub Context */}
          <div className="rounded-lg border border-outline-variant bg-surface-container-low p-md">
            <div className="flex items-center gap-sm mb-sm">
              <span className="material-symbols-outlined text-secondary">code</span>
              <h3 className="text-body-md font-semibold text-on-surface">GitHub Activity</h3>
            </div>
            
            {relatedPRs.length > 0 ? (
              <div className="space-y-sm">
                <p className="text-caption font-medium text-on-surface">Related Pull Requests</p>
                {relatedPRs.map(pr => (
                  <a key={pr.number} href={pr.url} target="_blank" rel="noreferrer" className="block p-sm rounded bg-surface-container hover:bg-surface-container-high transition-colors">
                    <span className="text-body-sm font-medium text-primary hover:underline">{pr.title}</span>
                    <span className="text-caption text-on-surface-variant ml-sm">({pr.state})</span>
                  </a>
                ))}
              </div>
            ) : null}

            {relatedCommits.length > 0 ? (
              <div className="space-y-sm mt-sm">
                <p className="text-caption font-medium text-on-surface">Related Commits</p>
                {relatedCommits.map(c => (
                  <a key={c.sha} href={c.url} target="_blank" rel="noreferrer" className="block p-sm rounded bg-surface-container hover:bg-surface-container-high transition-colors">
                    <span className="text-body-sm font-medium text-on-surface">{c.message.split('\n')[0]}</span>
                    <span className="text-caption text-on-surface-variant ml-sm">{c.sha.substring(0, 7)} by {c.author}</span>
                  </a>
                ))}
              </div>
            ) : null}

            {relatedPRs.length === 0 && relatedCommits.length === 0 && (
              <p className="text-body-sm text-on-surface-variant">
                No automatically linked activity. Include #{issue.id} in your commit messages or PR titles to link them.
              </p>
            )}
            {github?.repository && (
               <div className="mt-sm pt-sm border-t border-outline-variant">
                 <a href={github.repository.url} target="_blank" rel="noreferrer" className="text-caption text-primary hover:underline">
                   View Repository {github.repository.full_name}
                 </a>
               </div>
            )}
          </div>

          {/* CI/CD Context */}
          <div className="rounded-lg border border-outline-variant bg-surface-container-low p-md">
             <div className="flex items-center gap-sm mb-sm">
              <span className="material-symbols-outlined text-tertiary">rocket_launch</span>
              <h3 className="text-body-md font-semibold text-on-surface">CI/CD Status</h3>
            </div>
            {relatedRuns.length > 0 ? (
              <div className="space-y-xs">
                <p className="text-body-sm text-on-surface-variant">Latest Run: <span className="font-medium text-on-surface">{relatedRuns[0].workflow_name}</span> on <span className="font-medium text-on-surface">{relatedRuns[0].branch}</span></p>
                <div className="flex items-center gap-xs">
                  <span className={`material-symbols-outlined text-sm ${relatedRuns[0].conclusion === 'success' ? 'text-secondary' : 'text-error'}`}>
                    {relatedRuns[0].conclusion === 'success' ? 'check_circle' : 'error'}
                  </span>
                  <span className="text-body-sm capitalize text-on-surface">{relatedRuns[0].conclusion || relatedRuns[0].status}</span>
                </div>
              </div>
            ) : (
               <p className="text-body-sm text-on-surface-variant">No CI/CD runs available.</p>
            )}
          </div>
          
        </div>
      </div>

      {/* Verification */}
      {verificationState !== "unknown" && (
         <div className={`rounded-xl border p-lg ${
            verificationState === "resolved" ? "border-secondary/30 bg-secondary-container/10" : 
            verificationState === "suggest_resolved" ? "border-primary/30 bg-primary-container/10" :
            "border-error/30 bg-error-container/10"
         }`}>
            <div className="flex items-start justify-between gap-md">
              <div className="flex items-start gap-md">
                <span className={`material-symbols-outlined ${
                  verificationState === "resolved" ? "text-secondary" :
                  verificationState === "suggest_resolved" ? "text-primary" : "text-error"
                }`}>
                  {verificationState === "suggest_resolved" ? "fact_check" : verificationState === "resolved" ? "check_circle" : "warning"}
                </span>
                <div>
                  <h3 className="text-body-lg font-semibold text-on-surface">Verification Status</h3>
                  <p className="text-body-sm mt-xs text-on-surface-variant">{verificationMessage}</p>
                </div>
              </div>
              
              {verificationState === "suggest_resolved" && (
                 <button 
                   onClick={() => onUpdateStatus("DONE")}
                   className="shrink-0 rounded-lg bg-primary px-md py-sm text-body-sm font-bold text-on-primary hover:bg-primary-container"
                 >
                   Mark Resolved
                 </button>
              )}
            </div>
         </div>
      )}
    </div>
  );
}
