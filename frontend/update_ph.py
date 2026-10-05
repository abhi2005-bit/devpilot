import os
with open('frontend/src/pages/project/ProjectHome.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# First replace handleConnectGitHub
new_connect = '''
  const handleConnectGitHub = async (_owner: string, _repo: string) => {
    setIsGitHubModalOpen(false);
    handleSyncGitHub();
  };

  const handleSyncGitHub = async () => {
    if (!project) return;
    setSyncing(true);
    try {
      await githubService.syncRepository(project.id);
      window.location.reload();
    } catch (e) {
      console.error(e);
      alert("Failed to sync repository.");
      setSyncing(false);
    }
  };
'''

content = content.replace('''
  const handleConnectGitHub = async (_owner: string, _repo: string) => {
    setSyncing(true);
    setTimeout(() => {
      window.location.reload();
    }, 2000);
  };
''', new_connect.strip() + '\n')

# Then replace the GitHub Connection State rendering
# In the file, the header looks like this:
old_header = '''
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
'''

new_header = '''
            <div className="flex items-center gap-sm">
              {syncing || project?.github_sync_status === "SYNCING" ? (
                <span className="text-body-sm text-on-surface-variant flex items-center gap-xs">
                  <span className="material-symbols-outlined animate-spin text-[18px]">sync</span> Syncing...
                </span>
              ) : project?.github_sync_status === "SYNC_FAILED" ? (
                <span className="text-body-sm text-error flex items-center gap-xs" title={project.github_sync_error || ""}>
                  <span className="material-symbols-outlined text-[18px]">error</span> Sync Failed
                </span>
              ) : (
                <span className="text-body-sm text-success flex items-center gap-xs">
                  <span className="material-symbols-outlined text-[18px]">check_circle</span> Synced
                </span>
              )}
              
              <button 
                onClick={handleSyncGitHub} 
                disabled={syncing || project?.github_sync_status === "SYNCING"}
                className="px-md py-sm bg-surface-variant text-on-surface-variant rounded-full text-body-sm hover:bg-surface-container-high ml-md disabled:opacity-50"
              >
                Sync Now
              </button>
'''

if old_header.strip() in content:
    content = content.replace(old_header.strip(), new_header.strip())
else:
    print("Warning: old header not found perfectly. Trying manual replacement...")

with open('frontend/src/pages/project/ProjectHome.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
