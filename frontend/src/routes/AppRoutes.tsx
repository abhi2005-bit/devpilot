import { Navigate, Route, Routes } from "react-router-dom";

import AppLayout from "../layouts/AppLayout";

import { ProtectedRoute, PublicOnlyRoute } from "../components/auth/RouteGuards";

import Dashboard from "../pages/Dashboard";
import Projects from "../pages/Projects";
import Documents from "../pages/documents/Documents";

import Login from "../pages/auth/Login";
import Register from "../pages/auth/Register";

import ProjectOverview from "../pages/project/ProjectOverview";
import ProjectHome from "../pages/project/ProjectHome";
import Issues from "../pages/project/issues/Issues";
import IssueDetail from "../pages/project/issues/IssueDetail";
import Analytics from "../pages/project/analytics/Analytics";
import AI from "../pages/project/ai/AI";
import Members from "../pages/project/members/Members";
import Goals from "../pages/project/goals/Goals";
import GoalDetail from "../pages/project/goals/GoalDetail";
import GitHubCallback from "../pages/github/GitHubCallback";
import ProjectSettings from "../pages/project/settings/ProjectSettings";
import DocumentDetail from "../pages/documents/DocumentDetail";

function AppRoutes() {
  return (
    <Routes>
      {/* ======================================== */}
      {/* PUBLIC AUTHENTICATION ROUTES */}
      {/* ======================================== */}

      <Route element={<PublicOnlyRoute />}>
        <Route
          path="/login"
          element={<Login />}
        />

        <Route
          path="/register"
          element={<Register />}
        />
      </Route>

      {/* ======================================== */}
      {/* PROTECTED APPLICATION */}
      {/* ======================================== */}

      <Route element={<ProtectedRoute />}>
        <Route path="/github/callback" element={<GitHubCallback />} />
        
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
              path="goals"
              element={<Goals />}
            />

            <Route
              path="goals/:goalId"
              element={<GoalDetail />}
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

            <Route
              path="board"
              element={<Issues />}
            />

            <Route
              path="documents"
              element={<Documents />}
            />

            <Route
              path="documents/:documentId"
              element={<DocumentDetail />}
            />

            <Route
              path="settings"
              element={<ProjectSettings />}
            />
          </Route>
        </Route>
      </Route>

      {/* ======================================== */}
      {/* ROOT */}
      {/* ======================================== */}

      <Route
        path="/"
        element={
          <Navigate
            to="/dashboard"
            replace
          />
        }
      />

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
