import { Outlet } from "react-router-dom";
import Sidebar from "../components/layout/Sidebar";
import Navbar from "../components/layout/Navbar";

function AppLayout() {
  return (
    <div className="min-h-screen bg-background text-on-background">
      <Sidebar />

      <div className="ml-64 flex min-h-screen flex-col">
        <Navbar />

        <main className="flex-1 pt-16">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default AppLayout;