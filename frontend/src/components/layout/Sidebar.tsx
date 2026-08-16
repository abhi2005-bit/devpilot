import { NavLink } from "react-router-dom";

const navigationItems = [
  {
    label: "Dashboard",
    icon: "dashboard",
    path: "/dashboard",
  },
  {
    label: "Projects",
    icon: "folder_open",
    path: "/projects",
  },
  {
    label: "Issues",
    icon: "bug_report",
    path: "/issues",
  },
  {
    label: "AI Assistant",
    icon: "auto_awesome",
    path: "/ai",
  },
  {
    label: "Analytics",
    icon: "analytics",
    path: "/analytics",
  },
  {
    label: "Documents",
    icon: "description",
    path: "/documents",
  },
  {
    label: "Team",
    icon: "group",
    path: "/team",
  },
  {
    label: "Settings",
    icon: "settings",
    path: "/settings",
  },
];

function Sidebar() {
  return (
    <aside className="fixed left-0 top-0 z-50 flex h-screen w-64 flex-col border-r border-outline-variant bg-surface-container px-md py-lg">
      
      {/* Logo */}
      <div className="mb-xl flex items-center justify-between">
        <div>
          <h1 className="font-headline-md text-headline-md font-bold text-primary">
            DevPilot
          </h1>

          <p className="font-caption text-caption text-on-surface-variant">
            Engineering Intelligence
          </p>
        </div>

        <div className="h-8 w-8 rounded-full bg-surface-container-highest" />
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-sm">
        {navigationItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center space-x-md rounded-DEFAULT p-sm transition-colors duration-200 ${
                isActive
                  ? "border-l-2 border-primary bg-surface-container-high font-bold text-primary"
                  : "text-on-surface-variant hover:bg-surface-container-highest hover:text-on-surface"
              }`
            }
          >
            <span className="material-symbols-outlined font-body-md text-body-md">
              {item.icon}
            </span>

            <span className="font-body-md text-body-md">
              {item.label}
            </span>
          </NavLink>
        ))}
      </nav>

      {/* New Project */}
      <button className="mt-auto w-full rounded-lg bg-primary py-sm font-body-md font-bold text-on-primary transition-colors hover:bg-primary-container">
        New Project
      </button>
    </aside>
  );
}

export default Sidebar;