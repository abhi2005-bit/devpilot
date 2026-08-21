import { Navigate, Route, Routes } from "react-router-dom";

import AppLayout from "../layouts/AppLayout";

import Dashboard from "../pages/Dashboard";
import Projects from "../pages/Projects";
import Documents from "../pages/documents/Documents";

import ProjectOverview from "../pages/project/ProjectOverview";
import ProjectHome from "../pages/project/ProjectHome";
import Issues from "../pages/project/issues/Issues";
import IssueDetail from "../pages/project/issues/IssueDetail";
import Analytics from "../pages/project/analytics/Analytics";
import AI from "../pages/project/ai/AI";
import Members from "../pages/project/members/Members";

function AppRoutes() {
  return (
    <Routes>

      {/* ======================================== */}
      {/* APPLICATION LAYOUT */}
      {/* ======================================== */}

      <Route element={<AppLayout />}>

        {/* ====================================== */}
        {/* GLOBAL ROUTES */}
        {/* ====================================== */}

        <Route
          path="/dashboard"
          element={<Dashboard />}
        />

        <Route
          path="/projects"
          element={<Projects />}
        />

        <Route
          path="/documents"
          element={<Documents />}
        />

        {/* ====================================== */}
        {/* PROJECT WORKSPACE */}
        {/* ====================================== */}

        <Route
          path="/projects/:projectId"
          element={<ProjectOverview />}
        >

          <Route
            index
            element={<ProjectHome />}
          />

          <Route
            path="issues"
            element={<Issues />}
          />

          <Route
            path="issues/:issueId"
            element={<IssueDetail />}
          />

          <Route
            path="analytics"
            element={<Analytics />}
          />

          <Route
            path="ai"
            element={<AI />}
          />

          <Route
            path="members"
            element={<Members />}
          />

        </Route>

      </Route>

      {/* ======================================== */}
      {/* FALLBACK */}
      {/* ======================================== */}

      <Route
        path="*"
        element={
          <Navigate
            to="/dashboard"
            replace
          />
        }
      />

    </Routes>
  );
}

export default AppRoutes;