import { useState, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";

import { useAuth } from "../../context/AuthContext";
import SearchModal from "./SearchModal";
import NotificationsPanel from "./NotificationsPanel";
import HelpModal from "./HelpModal";

function Navbar() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (user) {
      fetch("/api/v1/notifications", {
        headers: { "Authorization": `Bearer ${localStorage.getItem("token") || ""}` }
      })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setUnreadCount(data.filter((n: any) => !n.is_read).length);
        }
      })
      .catch(console.error);
    }
  }, [user, isNotificationsOpen]);

  const handleLogout = () => {
    logout();
    setIsProfileOpen(false);

    navigate("/login", {
      replace: true,
    });
  };

  const userInitial =
    user?.name?.trim().charAt(0).toUpperCase() ||
    "U";

  return (
    <header className="relative z-40 flex h-16 w-full shrink-0 items-center justify-between border-b border-outline-variant bg-surface px-lg">
      {/* Left side */}
      <div className="flex min-w-0 items-center space-x-sm">
        {/* Search */}
        <button
          type="button"
          onClick={() => setIsSearchOpen(true)}
          className="relative flex shrink-0 items-center rounded-lg border border-transparent bg-surface-container-highest px-sm py-[6px] transition-all hover:border-primary w-64 text-left"
        >
          <span className="material-symbols-outlined mr-xs text-[18px] text-on-surface-variant">
            search
          </span>
          <span className="font-body-sm text-body-sm text-on-surface-variant">
            Search...
          </span>
        </button>

        <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />

        {/* Breadcrumb */}
        <div className="ml-md flex min-w-0 items-center space-x-xs font-body-sm text-body-sm text-on-surface-variant">
          <NavLink
            to="/dashboard"
            className="font-bold text-primary hover:underline"
          >
            Dashboard
          </NavLink>

          <span>/</span>

          <span className="truncate">
            {user?.name || "User"}
          </span>
        </div>
      </div>

      {/* Right side */}
      <div className="flex shrink-0 items-center space-x-md">
        {/* Notifications */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
            className="text-on-surface-variant transition-colors hover:text-on-surface relative"
            aria-label="Notifications"
          >
            <span className="material-symbols-outlined">
              notifications
            </span>
            {unreadCount > 0 && (
              <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-primary"></span>
            )}
          </button>
          <NotificationsPanel isOpen={isNotificationsOpen} onClose={() => setIsNotificationsOpen(false)} />
        </div>

        {/* Help */}
        <button
          type="button"
          onClick={() => setIsHelpOpen(true)}
          className="text-on-surface-variant transition-colors hover:text-on-surface"
          aria-label="Help"
        >
          <span className="material-symbols-outlined">
            help_outline
          </span>
        </button>
        <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />

        {/* User profile */}
        <div className="relative">
          <button
            type="button"
            aria-label="Open user menu"
            aria-expanded={isProfileOpen}
            onClick={() =>
              setIsProfileOpen((value) => !value)
            }
            className="flex items-center gap-sm rounded-lg p-1 transition-colors hover:bg-surface-container-highest"
          >
            {user ? (
              <div className="flex h-8 w-8 items-center justify-center rounded-full border border-outline-variant bg-surface-container-highest text-body-sm font-bold text-primary">
                {userInitial}
              </div>
            ) : (
              <div className="h-8 w-8 rounded-full border border-outline-variant bg-surface-container-highest" />
            )}
          </button>

          {isProfileOpen && (
            <div className="absolute right-0 top-11 z-50 w-64 rounded-lg border border-outline-variant bg-surface-container-high p-md shadow-lg">
              <div className="border-b border-outline-variant pb-md">
                <p className="truncate font-body-md text-body-md font-bold text-on-surface">
                  {user?.name || "User"}
                </p>

                <p className="mt-1 truncate text-body-sm text-on-surface-variant">
                  {user?.email || ""}
                </p>
              </div>

              <button
                type="button"
                onClick={handleLogout}
                className="mt-md flex w-full items-center rounded-lg px-sm py-sm text-left font-body-sm text-body-sm text-error transition-colors hover:bg-error-container/20"
              >
                <span className="material-symbols-outlined mr-sm text-[18px]">
                  logout
                </span>

                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default Navbar;
