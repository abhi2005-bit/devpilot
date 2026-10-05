interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function HelpModal({ isOpen, onClose }: HelpModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-3xl max-h-[80vh] overflow-y-auto rounded-xl bg-surface p-xl shadow-2xl">
        <div className="flex items-center justify-between border-b border-outline-variant pb-md mb-md">
          <h2 className="text-2xl font-bold text-on-surface">DevPilot Help</h2>
          <button onClick={onClose} className="text-on-surface-variant hover:text-on-surface">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="space-y-lg text-on-surface">
          <section>
            <h3 className="text-xl font-bold text-primary mb-sm">The DevPilot Workflow</h3>
            <p className="mb-md text-on-surface-variant">DevPilot follows a structured engineering workflow from high-level planning down to AI-assisted analysis.</p>
            <div className="bg-surface-container p-md rounded-lg flex flex-wrap gap-2 text-sm font-bold text-primary">
              <span>Project</span> &rarr;
              <span>Goal</span> &rarr;
              <span>Milestone</span> &rarr;
              <span>Sprint</span> &rarr;
              <span>Issue</span> &rarr;
              <span>PR</span> &rarr;
              <span>Commit</span> &rarr;
              <span>CI/CD</span> &rarr;
              <span>Engineering Health</span> &rarr;
              <span>Investigation</span> &rarr;
              <span>AI Analysis</span>
            </div>
          </section>

          <section className="grid grid-cols-1 md:grid-cols-2 gap-md">
            <div>
              <h4 className="font-bold mb-1">GitHub Connection</h4>
              <p className="text-sm text-on-surface-variant">Connect your project to a GitHub repository to automatically sync Issues, PRs, Commits, and GitHub Actions (CI/CD) into DevPilot.</p>
            </div>
            <div>
              <h4 className="font-bold mb-1">Engineering Health</h4>
              <p className="text-sm text-on-surface-variant">A comprehensive score representing project stability and velocity, based on open issues, critical bugs, and CI/CD reliability.</p>
            </div>
            <div>
              <h4 className="font-bold mb-1">Investigation</h4>
              <p className="text-sm text-on-surface-variant">Gather deterministic evidence for bugs or issues using deterministic logs, traces, and metrics before applying AI.</p>
            </div>
            <div>
              <h4 className="font-bold mb-1">AI Analysis</h4>
              <p className="text-sm text-on-surface-variant">AI interprets supplied engineering evidence and provides recommendations. <strong className="text-primary">Important:</strong> The current AI layer does NOT autonomously execute engineering actions.</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
