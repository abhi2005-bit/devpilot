
import SummaryCard from "../components/dashboard/SummaryCard";
import AIInsights from "../components/dashboard/AIInsights";
import ProjectHealth from "../components/dashboard/ProjectHealth";
import MyWork from "../components/dashboard/MyWork";

function Dashboard() {
  return (
      <main className="overflow-y-auto px-margin pb-margin pt-8">
        
        {/* Summary Cards */}
        <section className="mb-margin grid grid-cols-1 gap-gutter md:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            title="Active Projects"
            value={12}
            icon="folder"
            description="+2 this week"
            variant="primary"
          />

          <SummaryCard
            title="Open Issues"
            value={47}
            icon="bug_report"
            description="5 critical"
            variant="error"
          />

          <SummaryCard
            title="Completed"
            value={128}
            icon="task_alt"
            description="Last 30 days"
            variant="secondary"
          />

          <SummaryCard
            title="Blocked"
            value={3}
            icon="block"
            description="Requires attention"
            variant="tertiary"
          />
        </section>

        {/* Main Dashboard */}
        <section className="grid grid-cols-1 gap-gutter xl:grid-cols-12">
          
          {/* Left */}
          <div className="flex flex-col gap-gutter xl:col-span-8">
            <AIInsights />
            <ProjectHealth />
          </div>

          {/* Right */}
          <div className="flex flex-col gap-gutter xl:col-span-4">
            <MyWork />
          </div>

        </section>

      </main>
  );
}

export default Dashboard;