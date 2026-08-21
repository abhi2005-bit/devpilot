import { NavLink } from "react-router-dom";

function Navbar() {
  return (
    <header className="relative z-40 flex h-16 shrink-0 w-full items-center justify-between border-b border-outline-variant bg-surface px-lg">
      {/* Left side */}
      <div className="flex min-w-0 items-center space-x-sm">
        {/* Search */}
        <div className="relative flex shrink-0 items-center rounded-lg border border-transparent bg-surface-container-highest px-sm py-[6px] transition-all focus-within:border-primary">
          <span className="material-symbols-outlined mr-xs text-[18px] text-on-surface-variant">
            search
          </span>

          <input
            type="text"
            placeholder="Search..."
            className="w-48 border-none bg-transparent p-0 font-body-sm text-body-sm text-on-surface placeholder:text-on-surface-variant focus:ring-0"
          />
        </div>

        {/* Breadcrumb */}
        <div className="ml-md flex min-w-0 items-center space-x-xs font-body-sm text-body-sm text-on-surface-variant">
          <NavLink
            to="/dashboard"
            className="font-bold text-primary hover:underline"
          >
            Dashboard
          </NavLink>

          <span>/</span>

          <span className="truncate">Abhijit</span>
        </div>
      </div>

      {/* Right side */}
      <div className="flex shrink-0 items-center space-x-md">
        {/* Notifications */}
        <button
          type="button"
          className="text-on-surface-variant transition-colors hover:text-on-surface"
          aria-label="Notifications"
        >
          <span className="material-symbols-outlined">
            notifications
          </span>
        </button>

        {/* Help */}
        <button
          type="button"
          className="text-on-surface-variant transition-colors hover:text-on-surface"
          aria-label="Help"
        >
          <span className="material-symbols-outlined">
            help_outline
          </span>
        </button>

        {/* User avatar */}
        <img
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuAS_0MqhbKuc52Zyvw3xEnK6GKbjpP3dJS4Zf8sR_bemgZUfGDTnjTgMYiOBCsYeBXCzf3y8KjaRk4FWerTP_-IFri5ybTF759P1BnestRSTmux5cwpO9keoYeYvWg-152lLHgohmbGf6l7iX34TD36OUCCiFnSeRedF9AMxDNKMOdwjxEekuF66NMYcyrYgsLDjigF-7LH4qOwt7B1jLTFx5_g4X7CKZejVUsp00Xu7MRq3Hy8F99"
          alt="User avatar"
          className="h-8 w-8 rounded-full border border-outline-variant object-cover"
        />
      </div>
    </header>
  );
}

export default Navbar;