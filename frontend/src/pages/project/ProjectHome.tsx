import { useEffect, useState, useMemo } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";

import { projectService } from "../../services/projectService";
import { intelligenceService } from "../../services/intelligenceService";
import { issueService } from "../../services/issueService";
import { githubService } from "../../services/githubService";
import { cicdService } from "../../services/cicdService";

import InvestigationModal, { type InvestigationItem } from "../../components/projects/InvestigationModal";
import ProjectCICDPanel from "../../components/projects/ProjectCICDPanel";

import type { Project } from "../../types/project";
import type { EngineeringIntelligenceContext, EngineeringSignal } from "../../services/intelligenceService";
import type { Issue } from "../../types/issue";
import type { Sprint } from "../../types/sprint";
import { sprintService } from "../../services/sprintService";
import type { ProjectGitHub } from "../../types/github";
import type { CICDRun } from "../../types/cicd";

function getSignalIcon(signal: EngineeringSignal) {
  if (signal.severity === "risk") return "error";
  if (signal.severity === "warning") return "warning";
  if (signal.severity === "positive") return "check_circle";
  return "info";
}

function getSignalClasses(signal: EngineeringSignal) {
  if (signal.severity === "risk") {
    return {
      border: "border-error/30",
      icon: "text-error",
      background: "bg-error-container/20",
    };
  }
  if (signal.severity === "warning") {
    return {
      border: "border-tertiary/30",
      icon: "text-tertiary",
      background: "bg-tertiary-container/20",
    };
  }
  if (signal.severity === "positive") {
    return {
      border: "border-secondary/30",
      icon: "text-secondary",
      background: "bg-secondary-container/20",
    };
  }
  return {
    border: "border-outline-variant",
    icon: "text-on-surface-variant",
    background: "bg-surface-container-low",
  };
}

type TimelineEvent = {
  id: string;
  type: "issue" | "commit" | "pr" | "cicd";
  title: string;
  description: string;
  date: Date;
  url?: string;
  status?: string;
};

function ProjectHome() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();

  const [project, setProject] = useState<Project | undefined>();
  const [context, setContext] = useState<EngineeringIntelligenceContext | undefined>();
  
  const [issues, setIssues] = useState<Issue[]>([]);
  const [activeSprint, setActiveSprint] = useState<Sprint | null>(null);

  const [githubData, setGithubData] = useState<ProjectGitHub | undefined>();
  const [cicdRuns, setCicdRuns] = useState<CICDRun[]>([]);

  
  const [investigationItem, setInvestigationItem] = useState<InvestigationItem | null>(null);
  const [isInvestigationOpen, setIsInvestigationOpen] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | undefined>();
  const [intelligenceRefreshKey, setIntelligenceRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      if (!projectId) {
        setProject(undefined);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);

      try {
        const loadedProject = await projectService.getById(projectId);
        if (cancelled) return;
        setProject(loadedProject);

        if (loadedProject) {
          const [contextRes, issuesRes, githubRes, cicdRes, sprintsRes] = await Promise.allSettled([
            intelligenceService.getContext(projectId),
            issueService.getByProject(projectId),
            githubService.getProjectGitHub(projectId),
            cicdService.getRuns(projectId, 20),
            sprintService.getSprints(projectId)
          ]);

          if (cancelled) return;

          if (contextRes.status === "fulfilled") setContext(contextRes.value);
          if (issuesRes.status === "fulfilled") setIssues(issuesRes.value);
          if (githubRes.status === "fulfilled") setGithubData(githubRes.value);
          if (cicdRes.status === "fulfilled") setCicdRuns(cicdRes.value);
          if (sprintsRes.status === "fulfilled") { const active = sprintsRes.value.find((s: Sprint) => s.status === "ACTIVE"); setActiveSprint(active || null); }
        }
      } catch (err) {
        if (!cancelled) {
          setError("Failed to load project workspace.");
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    loadData();

    return () => { cancelled = true; };
  }, [projectId, intelligenceRefreshKey]);

  const timelineEvents = useMemo(() => {
    const events: TimelineEvent[] = [];

    issues.forEach(issue => {
      events.push({
        id: `issue-${issue.id}`,
        type: "issue",
        title: `Issue ${issue.status === 'TODO' ? 'Created' : 'Updated'}: ${issue.title}`,
        description: `Status: ${issue.status} | Priority: ${issue.priority}`,
        date: new Date(issue.updatedAt || issue.createdAt),
        url: `/projects/${projectId}/issues/${issue.id}`,
        status: issue.status
      });
    });

    if (githubData) {
      githubData.commits.forEach(commit => {
        if (commit.date) {
          events.push({
            id: `commit-${commit.sha}`,
            type: "commit",
            title: `Commit: ${commit.message.split('\n')[0]}`,
            description: `Author: ${commit.author || 'Unknown'}`,
            date: new Date(commit.date),
            url: commit.url
          });
        }
      });

      githubData.pull_requests.forEach(pr => {
        events.push({
          id: `pr-${pr.number}`,
          type: "pr",
          title: `PR ${pr.merged ? 'Merged' : 'Opened'}: ${pr.title}`,
          description: `State: ${pr.state}`,
          date: new Date(pr.updated_at || pr.created_at),
          url: pr.url,
          status: pr.state
        });
      });
    }

    cicdRuns.forEach(run => {
      events.push({
        id: `cicd-${run.id}`,
        type: "cicd",
        title: `CI/CD: ${run.workflow_name} on ${run.branch}`,
        description: `Conclusion: ${run.conclusion || run.status}`,
        date: new Date(run.started_at),
        url: run.url || undefined,
        status: run.conclusion || run.status
      });
    });

    events.sort((a, b) => b.date.getTime() - a.date.getTime());
    return events.slice(0, 10);
  }, [issues, githubData, cicdRuns, projectId]);

  const needsAttentionItems = useMemo(() => {
    const items: Array<{id: string, title: string, severity: string, description: string, evidence: string, actionText: string, onAction: () => void}> = [];

    if (context?.signals?.signals) {
      context.signals.signals.filter(s => s.severity === "risk" || s.severity === "warning").slice(0, 3).forEach(signal => {
        items.push({
          id: `signal-${signal.title}`,
          title: signal.title,
          severity: signal.severity,
          description: signal.description,
          evidence: signal.evidence.join(", "),
          actionText: "Investigate Signal",
          onAction: () => document.getElementById("engineering-signals")?.scrollIntoView({ behavior: 'smooth' })
        });
      });
    }

    const criticalIssues = issues.filter(i => i.priority === "CRITICAL" && i.status !== "DONE").slice(0, 3);
    criticalIssues.forEach(issue => {
      items.push({
        id: `crit-issue-${issue.id}`,
        title: `Critical Issue: ${issue.title}`,
        severity: "risk",
        description: "Open critical issue requires attention.",
        evidence: `Status: ${issue.status}`,
        actionText: "View Issue",
        onAction: () => navigate(`/projects/${projectId}/issues/${issue.id}`)
      });
    });

    const recentFailedRuns = cicdRuns.filter(r => r.conclusion === "failure").slice(0, 2);
    recentFailedRuns.forEach(run => {
      items.push({
        id: `fail-run-${run.id}`,
        title: `CI Run Failed: ${run.workflow_name}`,
        severity: "risk",
        description: `Failed on branch ${run.branch}`,
        evidence: `Failed tests: ${run.failed_tests}`,
        actionText: "View CI/CD",
        onAction: () => document.getElementById("project-cicd")?.scrollIntoView({ behavior: 'smooth' })
      });
    });

    return items;
  }, [context, issues, cicdRuns, projectId, navigate]);

  if (isLoading) {
    return (
      <div className="flex min-h-64 items-center justify-center rounded-xl border border-outline-variant bg-surface-container">
        <div className="text-center">
          <span className="material-symbols-outlined animate-spin text-5xl text-primary">progress_activity</span>
          <p className="mt-md text-body-sm text-on-surface-variant">Loading workspace...</p>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="flex min-h-64 items-center justify-center rounded-xl border border-outline-variant bg-surface-container">
        <div className="text-center">
          <span className="material-symbols-outlined text-5xl text-error">error</span>
          <h2 className="mt-md text-title-sm font-semibold text-on-surface">Workspace Unavailable</h2>
          <p className="mt-xs text-body-sm text-error">{error || "Project could not be loaded."}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-lg">
      {/* 1. PROJECT HEADER */}
      <section className="rounded-xl border border-outline-variant bg-surface-container p-lg">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-md">
          <div>
            <div className="flex items-center gap-sm">
              <span className="material-symbols-outlined text-3xl text-primary">engineering</span>
              <h1 className="text-headline-sm font-bold text-on-surface">{project.name}</h1>
            </div>
            <p className="mt-sm text-body-md text-on-surface-variant">{project.description || "No description provided."}</p>
            {project.github_owner && project.github_repo && (
              <div className="mt-sm flex items-center gap-xs text-body-sm text-secondary">
                <span className="material-symbols-outlined text-base">code</span>
                <span>{project.github_owner}/{project.github_repo}</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-sm">
            {context?.health && (
              <div className="flex flex-col items-end">
                <span className="text-caption text-on-surface-variant">Health Score</span>
                <span className={`text-title-lg font-bold ${context.health.score < 50 ? 'text-error' : context.health.score < 80 ? 'text-tertiary' : 'text-secondary'}`}>
                  {context.health.score.toFixed(0)}/100
                </span>
              </div>
            )}
          </div>
        </div>
      </section>

      
            {/* Active Sprint Banner */}
      {activeSprint && (
        <div className="mb-lg rounded-xl border-2 border-primary bg-primary-container/20 p-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-md">
              <span className="material-symbols-outlined text-primary text-3xl">directions_run</span>
              <div>
                <h3 className="text-title-md font-bold text-on-surface">Active Sprint: {activeSprint.name}</h3>
                <p className="text-body-sm text-on-surface-variant">
                  {issues.filter(i => i.sprintId === activeSprint.id && i.status === 'DONE').length} / {issues.filter(i => i.sprintId === activeSprint.id).length} issues completed
                </p>
              </div>
            </div>
            <Link
              to={`/projects/${projectId}/issues`}
              className="rounded-lg border border-primary bg-primary px-md py-sm text-body-sm font-semibold text-on-primary shadow hover:bg-primary/90 transition-colors"
            >
              Go to Sprint Board
            </Link>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-md mb-lg">
        <div className="rounded-xl border border-outline-variant bg-surface-container p-md flex items-center justify-between">
           <div>
             <p className="text-caption text-on-surface-variant font-medium">Active Work</p>
             <p className="text-title-lg font-bold text-on-surface">{issues.filter(i => i.status !== 'DONE').length}</p>
           </div>
           <span className="material-symbols-outlined text-primary">work</span>
        </div>
        <div className="rounded-xl border border-outline-variant bg-surface-container p-md flex items-center justify-between">
           <div>
             <p className="text-caption text-on-surface-variant font-medium">In Progress</p>
             <p className="text-title-lg font-bold text-on-surface">{issues.filter(i => i.status === 'IN_PROGRESS' || i.status === 'IN_REVIEW').length}</p>
           </div>
           <span className="material-symbols-outlined text-tertiary">pending</span>
        </div>
        <div className="rounded-xl border border-outline-variant bg-surface-container p-md flex items-center justify-between">
           <div>
             <p className="text-caption text-on-surface-variant font-medium">Completed</p>
             <p className="text-title-lg font-bold text-on-surface">{issues.filter(i => i.status === 'DONE').length}</p>
           </div>
           <span className="material-symbols-outlined text-secondary">check_circle</span>
        </div>
      </div>

      {/* 2. ENGINEERING HEALTH SUMMARY */}
      {context?.health && (
        <section>
          <h2 className="text-title-md font-semibold text-on-surface mb-md">Engineering Health Summary</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-md">
            <div className="rounded-xl border border-outline-variant bg-surface-container p-md">
              <p className="text-caption text-on-surface-variant">Open Issues</p>
              <p className="mt-xs text-title-lg font-bold text-on-surface">{context.metrics.issues.open}</p>
              <p className="mt-xs text-caption text-on-surface-variant">
                {context.metrics.issues.completion_rate.toFixed(0)}% completion
              </p>
            </div>
            <div className="rounded-xl border border-outline-variant bg-surface-container p-md">
              <p className="text-caption text-on-surface-variant">Critical Issues</p>
              <p className="mt-xs text-title-lg font-bold text-error">{context.metrics.issues.critical}</p>
              <p className="mt-xs text-caption text-on-surface-variant">Requires attention</p>
            </div>
            <div className="rounded-xl border border-outline-variant bg-surface-container p-md">
              <p className="text-caption text-on-surface-variant">CI/CD Success</p>
              <p className="mt-xs text-title-lg font-bold text-on-surface">{context.metrics.cicd.success_rate.toFixed(1)}%</p>
              <p className="mt-xs text-caption text-on-surface-variant">{context.metrics.cicd.failed_runs} failed runs</p>
            </div>
            <div className="rounded-xl border border-outline-variant bg-surface-container p-md">
              <p className="text-caption text-on-surface-variant">Open PRs</p>
              <p className="mt-xs text-title-lg font-bold text-on-surface">{context.metrics.github.open_pull_requests}</p>
              <p className="mt-xs text-caption text-on-surface-variant">{context.metrics.github.merged_pull_requests} merged</p>
            </div>
          </div>
        </section>
      )}

      {/* 3. NEEDS ATTENTION */}
      <section>
        <div className="flex items-center gap-sm mb-md">
          <span className="material-symbols-outlined text-error">warning</span>
          <h2 className="text-title-md font-semibold text-on-surface">Needs Attention</h2>
        </div>
        
        {needsAttentionItems.length === 0 ? (
          <div className="rounded-xl border border-outline-variant bg-surface-container-low p-md">
            <p className="text-body-sm text-on-surface-variant">No critical items requiring immediate attention.</p>
          </div>
        ) : (
          <div className="space-y-sm">
            {needsAttentionItems.map(item => (
              <div key={item.id} className="flex flex-col sm:flex-row sm:items-center justify-between rounded-lg border border-error/30 bg-error-container/10 p-md gap-md">
                <div className="flex-1 min-w-0">
                  <h3 className="text-body-md font-semibold text-error truncate">{item.title}</h3>
                  <p className="text-body-sm text-on-surface mt-xs">{item.description}</p>
                  <p className="text-caption text-on-surface-variant mt-xs">Evidence: {item.evidence}</p>
                </div>
                <button
                  onClick={item.onAction}
                  className="shrink-0 rounded-lg bg-surface-container-highest px-sm py-xs text-body-sm font-medium text-on-surface hover:bg-surface-container"
                >
                  {item.actionText}
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 4. QUICK ACTIONS */}
      <section>
        <h2 className="text-title-md font-semibold text-on-surface mb-md">Quick Actions</h2>
        <div className="flex flex-wrap gap-sm">
          <Link
            to={`/projects/${projectId}/issues`}
            className="flex items-center gap-sm rounded-lg border border-outline-variant bg-surface-container px-md py-sm hover:bg-surface-container-high transition-colors text-body-sm font-medium text-on-surface"
          >
            <span className="material-symbols-outlined text-primary">view_kanban</span>
            Open Workboard
          </Link>
          <button
            onClick={() => document.getElementById("project-cicd")?.scrollIntoView({ behavior: 'smooth' })}
            className="flex items-center gap-sm rounded-lg border border-outline-variant bg-surface-container px-md py-sm hover:bg-surface-container-high transition-colors text-body-sm font-medium text-on-surface"
          >
            <span className="material-symbols-outlined text-secondary">rocket_launch</span>
            View CI/CD
          </button>
          <button
            onClick={() => document.getElementById("engineering-signals")?.scrollIntoView({ behavior: 'smooth' })}
            className="flex items-center gap-sm rounded-lg border border-outline-variant bg-surface-container px-md py-sm hover:bg-surface-container-high transition-colors text-body-sm font-medium text-on-surface"
          >
            <span className="material-symbols-outlined text-tertiary">psychology</span>
            View Intelligence
          </button>
          <Link
            to={`/projects/${projectId}/ai`}
            className="flex items-center gap-sm rounded-lg border border-outline-variant bg-surface-container px-md py-sm hover:bg-surface-container-high transition-colors text-body-sm font-medium text-on-surface"
          >
            <span className="material-symbols-outlined text-primary">auto_awesome</span>
            Run AI Analysis
          </Link>
          {project.github_owner && project.github_repo && (
            <a
              href={`https://github.com/${project.github_owner}/${project.github_repo}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-sm rounded-lg border border-outline-variant bg-surface-container px-md py-sm hover:bg-surface-container-high transition-colors text-body-sm font-medium text-on-surface"
            >
              <span className="material-symbols-outlined text-secondary">open_in_new</span>
              Open GitHub
            </a>
          )}
        </div>
      </section>

      {/* 5. RECENT ENGINEERING ACTIVITY */}
      <section>
        <h2 className="text-title-md font-semibold text-on-surface mb-md">Recent Engineering Activity</h2>
        {timelineEvents.length === 0 ? (
          <div className="rounded-xl border border-outline-variant bg-surface-container-low p-md">
            <p className="text-body-sm text-on-surface-variant">No recent activity found.</p>
          </div>
        ) : (
          <div className="space-y-sm">
            {timelineEvents.map(event => (
              <div key={event.id} className="flex items-start gap-md rounded-lg border border-outline-variant bg-surface-container p-md">
                <span className={`material-symbols-outlined mt-xs ${
                  event.type === 'issue' ? 'text-primary' :
                  event.type === 'commit' ? 'text-secondary' :
                  event.type === 'pr' ? 'text-tertiary' : 'text-on-surface-variant'
                }`}>
                  {event.type === 'issue' ? 'bug_report' :
                   event.type === 'commit' ? 'commit' :
                   event.type === 'pr' ? 'merge_type' : 'rocket_launch'}
                </span>
                <div className="flex-1 min-w-0">
                  <h3 className="text-body-sm font-semibold text-on-surface truncate">{event.title}</h3>
                  <p className="text-caption text-on-surface-variant mt-xs">{event.description}</p>
                </div>
                <div className="shrink-0 flex flex-col items-end">
                  <span className="text-caption text-on-surface-variant">
                    {event.date.toLocaleDateString()} {event.date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </span>
                  {event.url && (
                    <a href={event.url} target={event.url.startsWith('/') ? "_self" : "_blank"} rel="noreferrer" className="text-caption text-primary hover:underline mt-xs">
                      View
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 6. ENGINEERING SIGNALS */}
      <section id="engineering-signals">
        <h2 className="text-title-md font-semibold text-on-surface mb-md">Engineering Signals</h2>
        {!context || context.signals.signals.length === 0 ? (
          <div className="rounded-xl border border-outline-variant bg-surface-container-low p-md">
            <p className="text-body-sm text-on-surface-variant">No significant engineering signals detected.</p>
          </div>
        ) : (
          <div className="space-y-md">
            {context.signals.signals.map(signal => {
              const styles = getSignalClasses(signal);
              return (
                <div key={`${signal.category}-${signal.title}`} className={`rounded-lg border ${styles.border} ${styles.background} p-md`}>
                  <div className="flex items-start gap-md">
                    <span className={`material-symbols-outlined ${styles.icon}`}>{getSignalIcon(signal)}</span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center justify-between gap-sm">
                        <h4 className="text-body-md font-semibold text-on-surface">{signal.title}</h4>
                        <span className="rounded-full bg-surface-container px-sm py-xs text-caption capitalize text-on-surface-variant">
                          {signal.category}
                        </span>
                      </div>
                      <p className="mt-xs text-body-sm leading-6 text-on-surface-variant">{signal.description}</p>
                      
                      {signal.evidence.length > 0 && (
                        <div className="mt-sm rounded-lg bg-surface-container-low p-sm">
                          <p className="text-caption font-medium text-on-surface">Evidence</p>
                          <ul className="mt-xs space-y-xs">
                            {signal.evidence.map(ev => (
                              <li key={ev} className="text-caption text-on-surface-variant">• {ev}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      <div className="mt-sm flex items-center justify-between">
                        <div>
                          <p className="text-caption font-medium text-on-surface">Recommended action</p>
                          <p className="text-caption text-on-surface-variant">{signal.recommendation}</p>
                        </div>
                        
                        {/* Action buttons mapping Signal -> DevPilot module */}
                        <button
                          onClick={() => {
                            setInvestigationItem({
                              id: `signal-${signal.title}`,
                              title: signal.title,
                              severity: signal.severity,
                              description: signal.description,
                              evidence: signal.evidence.join(", "),
                              category: signal.category,
                              originalData: signal,
                            });
                            setIsInvestigationOpen(true);
                          }}
                          className="text-caption font-medium text-primary hover:underline"
                        >
                          Investigate
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* 7. CONNECT THE SECTIONS -> ProjectCICDPanel */}
      <div id="project-cicd">
        <ProjectCICDPanel
          key={projectId}
          projectId={projectId!}
          githubOwner={project.github_owner}
          githubRepo={project.github_repo}
          onSynced={() => setIntelligenceRefreshKey(curr => curr + 1)}
        />
      </div>

      {/* 8. INVESTIGATION MODAL */}
      <InvestigationModal
        projectId={projectId!}
        item={investigationItem}
        isOpen={isInvestigationOpen}
        onClose={() => setIsInvestigationOpen(false)}
        onIssueCreated={() => setIntelligenceRefreshKey(curr => curr + 1)}
        onNavigateTo={(destination) => {
          if (destination === "issues") navigate(`/projects/${projectId}/issues`);
          else if (destination === "cicd") document.getElementById("project-cicd")?.scrollIntoView({ behavior: 'smooth' });
          else if (destination === "github") {
             if (project.github_owner && project.github_repo) {
                 window.open(`https://github.com/${project.github_owner}/${project.github_repo}`, "_blank");
             }
          }
        }}
      />
    </div>
  );
}

export default ProjectHome;
