import { useState, useEffect } from "react";
import Modal from "../../common/Modal";
import { githubService } from "../../../services/githubService";
import type { GitHubRepository } from "../../../types/github";

interface GitHubConnectionModalProps {
  projectId: string;
  isOpen: boolean;
  onClose: () => void;
  onConnected: (owner: string, repo: string) => void;
}

export default function GitHubConnectionModal({ projectId, isOpen, onClose, onConnected }: GitHubConnectionModalProps) {
  const [loading, setLoading] = useState(false);
  const [repos, setRepos] = useState<GitHubRepository[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedRepo, setSelectedRepo] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadRepos();
    }
  }, [isOpen]);

  const loadRepos = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await githubService.getAvailableRepositories();
      setRepos(data);
    } catch (err: any) {
      if (err.message.includes("not connected")) {
        // Need to auth
        setError("auth_required");
      } else {
        setError("Failed to load repositories.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAuth = async () => {
    try {
      sessionStorage.setItem("github_redirect", `/projects/${projectId}`);
      const data = await githubService.getAuthUrl();
      window.location.href = data.url;
    } catch (err) {
      setError("Failed to initiate GitHub authorization.");
    }
  };

  const handleConnect = async () => {
    if (!selectedRepo) return;
    const repoObj = repos.find(r => r.full_name === selectedRepo);
    if (!repoObj) return;

    setLoading(true);
    try {
      await githubService.connectRepository(projectId, repoObj.owner, repoObj.name);
      onConnected(repoObj.owner, repoObj.name);
      onClose();
    } catch (err) {
      setError("Failed to connect repository.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Connect GitHub Repository">
      <div className="space-y-md">
        {loading ? (
          <div className="flex flex-col justify-center items-center py-xl">
            <span className="material-symbols-outlined text-[48px] animate-spin text-primary">progress_activity</span>
            <p className="mt-sm text-on-surface-variant text-body-md">Loading...</p>
          </div>
        ) : error === "auth_required" ? (
          <div className="text-center py-xl space-y-md">
            <div className="material-symbols-outlined text-[48px] text-on-surface-variant">account_circle</div>
            <h3 className="text-title-md font-semibold text-on-surface">Authorize DevPilot</h3>
            <p className="text-body-md text-on-surface-variant">
              You need to connect your GitHub account to DevPilot before you can select a repository.
            </p>
            <button
              onClick={handleAuth}
              className="mt-md bg-primary text-on-primary px-xl py-sm rounded-full font-medium"
            >
              Connect to GitHub
            </button>
          </div>
        ) : error ? (
          <div className="text-error bg-error-container text-on-error-container p-md rounded">
            {error}
          </div>
        ) : (
          <div className="space-y-md">
            <p className="text-body-md text-on-surface-variant">Select a repository to connect to this project.</p>
            <div className="max-h-[300px] overflow-y-auto border border-outline-variant/30 rounded">
              {repos.length === 0 ? (
                <div className="p-md text-center text-on-surface-variant">No repositories found.</div>
              ) : (
                repos.map((repo) => (
                  <div
                    key={repo.full_name}
                    onClick={() => setSelectedRepo(repo.full_name)}
                    className={`p-md border-b border-outline-variant/30 cursor-pointer flex items-center justify-between hover:bg-surface-container-high transition-colors ${
                      selectedRepo === repo.full_name ? "bg-primary-container/20 border-l-4 border-l-primary" : ""
                    }`}
                  >
                    <div>
                      <div className="text-body-md font-semibold text-on-surface">{repo.name}</div>
                      <div className="text-caption text-on-surface-variant">{repo.owner}</div>
                    </div>
                    {repo.stars > 0 && (
                      <div className="flex items-center gap-xs text-caption text-on-surface-variant">
                        <span className="material-symbols-outlined text-[16px]">star</span> {repo.stars}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
            
            <div className="flex justify-end gap-sm pt-md border-t border-outline-variant/30">
              <button
                onClick={onClose}
                className="px-md py-sm rounded-full font-medium text-on-surface hover:bg-surface-variant"
              >
                Cancel
              </button>
              <button
                onClick={handleConnect}
                disabled={!selectedRepo || loading}
                className="px-md py-sm rounded-full font-medium bg-primary text-on-primary hover:bg-primary/90 disabled:opacity-50"
              >
                Connect Repository
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
