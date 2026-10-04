import re

with open(r'c:\Projects\Devpilot\devpilot\frontend\src\pages\project\ProjectHome.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Add import
import_stmt = '''import GitHubConnectionModal from "../../components/projects/github/GitHubConnectionModal";\n\nfunction ProjectHome() {'''
content = content.replace('function ProjectHome() {', import_stmt)

# Add states
state_stmt = '''  const [isGitHubModalOpen, setIsGitHubModalOpen] = useState(false);
  const [syncing, setSyncing] = useState(false);
'''
content = content.replace('const [isInvestigationOpen, setIsInvestigationOpen] = useState(false);', 'const [isInvestigationOpen, setIsInvestigationOpen] = useState(false);\n' + state_stmt)

# Add disconnect function
disconnect_func = '''
  const handleDisconnectGitHub = async () => {
    if (!project) return;
    if (!confirm("Are you sure you want to disconnect this repository? Data will not be deleted but sync will stop.")) return;
    try {
      await githubService.disconnectRepository(project.id);
      window.location.reload();
    } catch (e) {
      console.error(e);
      alert("Failed to disconnect.");
    }
  };
  
  const handleConnectGitHub = async (owner: string, repo: string) => {
    setSyncing(true);
    // Reload after a short delay to simulate initial sync kicking off
    setTimeout(() => {
      window.location.reload();
    }, 2000);
  };
'''
content = content.replace('useEffect(() => {', disconnect_func + '\n  useEffect(() => {', 1)

# Modify header section to show github connect
header_section = '''
      {/* GitHub Connection State */}
      <div className="bg-surface-container rounded-xl p-md border border-outline-variant/30 flex items-center justify-between">
        <div>
          <h2 className="text-title-md font-bold text-on-surface flex items-center gap-sm">
            <span className="material-symbols-outlined text-on-surface-variant">terminal</span>
            GitHub Connection
          </h2>
          {project?.github_owner && project?.github_repo ? (
            <p className="text-body-sm text-on-surface-variant mt-xs">
              Connected to <a href={project.github_url} target="_blank" rel="noreferrer" className="text-primary hover:underline">{project.github_owner}/{project.github_repo}</a>
            </p>
          ) : (
            <p className="text-body-sm text-on-surface-variant mt-xs">
              Connect your GitHub repository to start analyzing this project.
            </p>
          )}
        </div>
        <div>
          {project?.github_owner && project?.github_repo ? (
            <div className="flex items-center gap-sm">
              {syncing ? (
                <span className="text-body-sm text-on-surface-variant flex items-center gap-xs">
                  <span className="material-symbols-outlined animate-spin text-[18px]">sync</span> Syncing...
                </span>
              ) : (
                <span className="text-body-sm text-success flex items-center gap-xs">
                  <span className="material-symbols-outlined text-[18px]">check_circle</span> Synced
                </span>
              )}
              <button onClick={() => window.location.reload()} className="px-md py-sm bg-surface-variant text-on-surface-variant rounded-full text-body-sm hover:bg-surface-container-high ml-md">
                Sync Now
              </button>
              <button onClick={handleDisconnectGitHub} className="px-md py-sm bg-error-container text-on-error-container rounded-full text-body-sm hover:bg-error-container/80">
                Disconnect
              </button>
            </div>
          ) : (
            <button onClick={() => setIsGitHubModalOpen(true)} className="px-xl py-sm bg-primary text-on-primary rounded-full font-medium hover:bg-primary/90 flex items-center gap-sm">
              <span className="material-symbols-outlined text-[20px]">link</span>
              Connect GitHub
            </button>
          )}
        </div>
      </div>
'''

content = content.replace('className="grid grid-cols-12 gap-xl">', 'className="grid grid-cols-12 gap-xl">\n' + header_section)
# Wait, this might be inserted into a grid div and break layout. Let's find exactly where to put it.
