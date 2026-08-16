function AIInsights() {
  return (
    <section className="relative overflow-hidden rounded-lg border border-[#10B981] bg-surface-container p-md shadow-[inset_0_0_8px_rgba(16,185,129,0.2)]">
      {/* AI indicator */}
      <div className="absolute right-0 top-0 p-sm">
        <span className="material-symbols-outlined animate-pulse text-[#10B981]">
          auto_awesome
        </span>
      </div>

      {/* Header */}
      <div className="mb-md border-b border-[#242830] pb-sm">
        <h2 className="flex items-center font-title-sm text-title-sm text-on-surface">
          AI Insights
        </h2>
      </div>

      {/* Insight */}
      <div className="flex items-start gap-md">
        <div className="rounded-DEFAULT border border-error bg-[#93000a] bg-opacity-20 p-sm">
          <span className="material-symbols-outlined text-error">
            gpp_maybe
          </span>
        </div>

        <div className="flex-1">
          <h3 className="mb-xs font-body-md text-body-md font-bold text-on-surface">
            Authentication is high-risk
          </h3>

          <p className="mb-md font-body-sm text-body-sm text-on-surface-variant">
            Pattern analysis indicates recent commits to{" "}
            <code className="font-code-label text-code-label">
              auth-service
            </code>{" "}
            have introduced potential race conditions. 3 dependent
            microservices are currently degraded.
          </p>

          <button
            type="button"
            className="flex items-center rounded-lg border border-[#10B981] px-md py-xs font-code-label text-code-label text-[#10B981] transition-colors hover:bg-[#10B981] hover:bg-opacity-10"
          >
            <span className="material-symbols-outlined mr-xs text-[16px]">
              troubleshoot
            </span>

            Analyze Project
          </button>
        </div>
      </div>
    </section>
  );
}

export default AIInsights;