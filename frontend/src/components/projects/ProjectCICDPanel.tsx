import { useEffect, useState } from "react";

import { cicdService } from "../../services/cicdService";
import type {
  CICDHealth,
  CICDJob,
  CICDRun,
} from "../../types/cicd";

interface ProjectCICDPanelProps {
  projectId: string;
  githubOwner?: string | null;
  githubRepo?: string | null;
  onSynced?: () => void;
}

function getErrorMessage(
  error: unknown,
  fallback: string,
): string {
  return error instanceof Error ? error.message : fallback;
}

function formatStatus(value: string | null | undefined): string {
  if (!value) {
    return "Not available";
  }

  return value.replace(/_/g, " ").toUpperCase();
}

function getStatusClasses(value: string | null | undefined): string {
  const normalized = value?.toLowerCase();

  if (normalized === "success") {
    return "bg-secondary-container text-on-secondary";
  }

  if (normalized === "failure") {
    return "bg-error-container text-on-error";
  }

  if (normalized === "queued" || normalized === "in_progress") {
    return "bg-tertiary-container text-on-tertiary";
  }

  return "bg-surface-container-highest text-on-surface-variant";
}

function StatusBadge({ value }: { value: string | null | undefined }) {
  return (
    <span
      className={`inline-flex rounded-full px-sm py-xs text-caption font-semibold ${getStatusClasses(
        value,
      )}`}
    >
      {formatStatus(value)}
    </span>
  );
}

function formatDateTime(value: string | null | undefined): string {
  if (!value) {
    return "Not available";
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleString();
}

function SummaryValue({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-lg bg-surface-container-low p-md">
      <p className="text-caption text-on-surface-variant">{label}</p>
      <p className="mt-xs text-title-sm font-semibold text-on-surface">
        {value}
      </p>
    </div>
  );
}

function RunRow({
  run,
  isSelected,
  onSelect,
}: {
  run: CICDRun;
  isSelected: boolean;
  onSelect: () => void;
}) {
  return (
    <div className="flex flex-col gap-sm border-b border-outline-variant p-md last:border-b-0 sm:flex-row sm:items-center sm:justify-between">
      <button
        type="button"
        aria-pressed={isSelected}
        onClick={onSelect}
        className="min-w-0 flex-1 rounded-md text-left outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        <span className="block truncate text-body-sm font-semibold text-on-surface">
          {run.workflow_name}
        </span>
        <span className="mt-xs block truncate text-caption text-on-surface-variant">
          {run.branch} · Started {formatDateTime(run.started_at)}
          {run.completed_at
            ? ` · Completed ${formatDateTime(run.completed_at)}`
            : ""}
        </span>
      </button>

      <div className="flex flex-wrap items-center gap-sm">
        <StatusBadge value={run.status} />
        {run.conclusion && <StatusBadge value={run.conclusion} />}
        <span className="text-caption text-on-surface-variant">
          {run.failed_tests} failed tests/jobs
        </span>
        {run.url && (
          <a
            href={run.url}
            target="_blank"
            rel="noreferrer"
            className="text-caption font-medium text-primary underline underline-offset-2"
          >
            GitHub
          </a>
        )}
      </div>
    </div>
  );
}

function JobRow({ job }: { job: CICDJob }) {
  return (
    <div className="flex flex-col gap-sm border-b border-outline-variant py-md last:border-b-0 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="truncate text-body-sm font-medium text-on-surface">
          {job.name}
        </p>
        <p className="mt-xs text-caption text-on-surface-variant">
          Started {formatDateTime(job.started_at)}
          {job.completed_at
            ? ` · Completed ${formatDateTime(job.completed_at)}`
            : ""}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-sm">
        <StatusBadge value={job.status} />
        {job.conclusion && <StatusBadge value={job.conclusion} />}
        {job.url && (
          <a
            href={job.url}
            target="_blank"
            rel="noreferrer"
            className="text-caption font-medium text-primary underline underline-offset-2"
          >
            GitHub
          </a>
        )}
      </div>
    </div>
  );
}

function ProjectCICDPanel({
  projectId,
  githubOwner,
  githubRepo,
  onSynced,
}: ProjectCICDPanelProps) {
  const isConnected = Boolean(
    githubOwner?.trim() && githubRepo?.trim(),
  );

  const [runs, setRuns] = useState<CICDRun[]>([]);
  const [health, setHealth] = useState<CICDHealth | undefined>();
  const [selectedRunId, setSelectedRunId] = useState<number | null>(null);
  const [selectedRun, setSelectedRun] = useState<CICDRun | undefined>();
  const [jobs, setJobs] = useState<CICDJob[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isRunLoading, setIsRunLoading] = useState(false);
  const [isJobsLoading, setIsJobsLoading] = useState(false);

  const [runsError, setRunsError] = useState<string | undefined>();
  const [healthError, setHealthError] = useState<string | undefined>();
  const [syncError, setSyncError] = useState<string | undefined>();
  const [runError, setRunError] = useState<string | undefined>();
  const [jobsError, setJobsError] = useState<string | undefined>();
  const [refreshVersion, setRefreshVersion] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function loadCICDData() {
      setIsLoading(true);
      setRunsError(undefined);
      setHealthError(undefined);

      const [runsResult, healthResult] = await Promise.allSettled([
        cicdService.getRuns(projectId),
        cicdService.getHealth(projectId),
      ]);

      if (cancelled) {
        return;
      }

      if (runsResult.status === "fulfilled") {
        setRuns(runsResult.value);
      } else {
        setRunsError(
          getErrorMessage(
            runsResult.reason,
            "Unable to load workflow runs.",
          ),
        );
      }

      if (healthResult.status === "fulfilled") {
        setHealth(healthResult.value);
      } else {
        setHealthError(
          getErrorMessage(
            healthResult.reason,
            "Unable to load CI/CD summary.",
          ),
        );
      }

      setIsLoading(false);
    }

    loadCICDData();

    return () => {
      cancelled = true;
    };
  }, [projectId, refreshVersion]);

  useEffect(() => {
    if (selectedRunId === null) {
      setIsRunLoading(false);
      setIsJobsLoading(false);
      setRunError(undefined);
      setJobsError(undefined);
      setSelectedRun(undefined);
      setJobs([]);
      return;
    }

    const runId = selectedRunId;
    let cancelled = false;
    setIsRunLoading(true);
    setIsJobsLoading(true);
    setRunError(undefined);
    setJobsError(undefined);

    async function loadSelectedRun() {
      const [runResult, jobsResult] = await Promise.allSettled([
        cicdService.getRun(projectId, runId),
        cicdService.getJobs(projectId, runId),
      ]);

      if (cancelled) {
        return;
      }

      if (runResult.status === "fulfilled") {
        setSelectedRun(runResult.value);
      } else {
        setRunError(
          getErrorMessage(
            runResult.reason,
            "Unable to load workflow run details.",
          ),
        );
      }

      if (jobsResult.status === "fulfilled") {
        setJobs(jobsResult.value);
      } else {
        setJobsError(
          getErrorMessage(
            jobsResult.reason,
            "Unable to load workflow jobs.",
          ),
        );
      }

      setIsRunLoading(false);
      setIsJobsLoading(false);
    }

    loadSelectedRun();

    return () => {
      cancelled = true;
    };
  }, [projectId, selectedRunId]);

  async function handleSync() {
    if (!isConnected || isSyncing) {
      return;
    }

    setIsSyncing(true);
    setSyncError(undefined);

    try {
      const syncedRuns = await cicdService.sync(projectId);
      setRuns(syncedRuns);
      setSelectedRunId(null);
      setRefreshVersion((current) => current + 1);
      onSynced?.();
    } catch (error) {
      setSyncError(
        getErrorMessage(error, "Unable to sync GitHub Actions."),
      );
    } finally {
      setIsSyncing(false);
    }
  }

  return (
    <section className="space-y-md rounded-xl border border-outline-variant bg-surface-container p-lg">
      <header className="flex flex-col gap-md sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-title-sm font-semibold text-on-surface">
            CI/CD
          </h2>
          <p className="mt-xs text-body-sm text-on-surface-variant">
            GitHub Actions workflow runs and jobs for this public repository.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSync}
          disabled={!isConnected || isSyncing}
          className="inline-flex shrink-0 items-center justify-center gap-sm rounded-lg bg-primary px-md py-sm text-body-sm font-semibold text-on-primary transition-colors hover:bg-primary-container disabled:cursor-not-allowed disabled:opacity-60"
        >
          <span className="material-symbols-outlined text-body-md">
            {isSyncing ? "progress_activity" : "sync"}
          </span>
          {isSyncing ? "Syncing..." : "Sync GitHub Actions"}
        </button>
      </header>

      {!isConnected && (
        <div className="rounded-lg border border-outline-variant bg-surface-container-low p-md">
          <p className="text-body-sm text-on-surface-variant">
            Connect a GitHub repository to sync CI/CD runs.
          </p>
        </div>
      )}

      {syncError && (
        <div
          role="alert"
          className="rounded-lg border border-error/30 bg-error-container p-md text-body-sm text-on-error"
        >
          {syncError}
        </div>
      )}

      {runsError && (
        <div
          role="alert"
          className="rounded-lg border border-error/30 bg-error-container p-md text-body-sm text-on-error"
        >
          {runsError}
        </div>
      )}

      {health && (
        <div className="grid grid-cols-2 gap-sm sm:grid-cols-3 xl:grid-cols-5">
          <SummaryValue label="Total runs" value={health.total_runs} />
          <SummaryValue label="Successful" value={health.successful_runs} />
          <SummaryValue label="Failed" value={health.failed_runs} />
          <SummaryValue label="Running" value={health.running_runs} />
          <SummaryValue
            label="Success rate"
            value={`${health.success_rate.toFixed(1)}%`}
          />
        </div>
      )}

      {healthError && (
        <p className="text-caption text-on-surface-variant" role="status">
          {healthError}
        </p>
      )}

      {isLoading && (
        <div className="flex items-center gap-sm py-sm text-body-sm text-on-surface-variant">
          <span className="material-symbols-outlined animate-spin text-primary">
            progress_activity
          </span>
          Loading CI/CD data...
        </div>
      )}

      {!isLoading && !runsError && runs.length === 0 && (
        <p className="rounded-lg bg-surface-container-low p-md text-body-sm text-on-surface-variant">
          No GitHub Actions runs have been recorded yet.
        </p>
      )}

      {runs.length > 0 && (
        <div className="overflow-hidden rounded-lg border border-outline-variant">
          <div className="border-b border-outline-variant bg-surface-container-low px-md py-sm">
            <h3 className="text-body-sm font-semibold text-on-surface">
              Workflow runs
            </h3>
          </div>
          {runs.map((run) => (
            <RunRow
              key={run.id}
              run={run}
              isSelected={selectedRunId === run.id}
              onSelect={() => {
                setSelectedRun(run);
                setSelectedRunId(run.id);
                setJobs([]);
              }}
            />
          ))}
        </div>
      )}

      {selectedRunId !== null && (
        <section className="space-y-md rounded-lg border border-outline-variant bg-surface-container-low p-md">
          <div className="flex flex-col gap-sm sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <h3 className="truncate text-body-md font-semibold text-on-surface">
                {selectedRun?.workflow_name ?? "Workflow run details"}
              </h3>
              {selectedRun && (
                <p className="mt-xs text-caption text-on-surface-variant">
                  {selectedRun.branch}
                  {selectedRun.commit_sha
                    ? ` · ${selectedRun.commit_sha}`
                    : ""}
                </p>
              )}
            </div>

            {selectedRun?.url && (
              <a
                href={selectedRun.url}
                target="_blank"
                rel="noreferrer"
                className="text-caption font-medium text-primary underline underline-offset-2"
              >
                Open run on GitHub
              </a>
            )}
          </div>

          {isRunLoading && (
            <p className="text-body-sm text-on-surface-variant">
              Loading workflow run...
            </p>
          )}
          {runError && (
            <p className="text-body-sm text-error" role="alert">
              {runError}
            </p>
          )}

          {selectedRun && (
            <div className="flex flex-wrap items-center gap-sm">
              <StatusBadge value={selectedRun.status} />
              {selectedRun.conclusion && (
                <StatusBadge value={selectedRun.conclusion} />
              )}
              <span className="text-caption text-on-surface-variant">
                Started {formatDateTime(selectedRun.started_at)}
              </span>
              {selectedRun.completed_at && (
                <span className="text-caption text-on-surface-variant">
                  Completed {formatDateTime(selectedRun.completed_at)}
                </span>
              )}
            </div>
          )}

          <div className="border-t border-outline-variant pt-sm">
            <h4 className="text-body-sm font-semibold text-on-surface">
              Jobs
            </h4>

            {isJobsLoading && (
              <p className="mt-sm text-body-sm text-on-surface-variant">
                Loading jobs...
              </p>
            )}
            {jobsError && (
              <p className="mt-sm text-body-sm text-error" role="alert">
                {jobsError}
              </p>
            )}
            {!isJobsLoading && !jobsError && jobs.length === 0 && (
              <p className="mt-sm text-body-sm text-on-surface-variant">
                No jobs recorded for this workflow run.
              </p>
            )}
            {jobs.length > 0 && (
              <div className="mt-xs divide-y divide-outline-variant">
                {jobs.map((job) => (
                  <JobRow key={job.id} job={job} />
                ))}
              </div>
            )}
          </div>
        </section>
      )}
    </section>
  );
}

export default ProjectCICDPanel;