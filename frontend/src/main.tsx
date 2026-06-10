import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, Navigate, RouterProvider } from "react-router-dom";
import Layout from "./components/Layout";
import "./index.css";
import AdminUsers from "./pages/AdminUsers";
import AuditLog from "./pages/AuditLog";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import Reports from "./pages/Reports";
import ReviewQueue from "./pages/ReviewQueue";
import ServiceGroupDetail from "./pages/ServiceGroupDetail";
import ServiceGroups from "./pages/ServiceGroups";
import { useAuthStore } from "./store";

function Protected({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user);
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      { path: "/login", element: <Login /> },
      { path: "/", element: <Protected><Dashboard /></Protected> },
      { path: "/service-groups", element: <Protected><ServiceGroups /></Protected> },
      { path: "/service-groups/:id", element: <Protected><ServiceGroupDetail /></Protected> },
      { path: "/reviews", element: <Protected><ReviewQueue /></Protected> },
      { path: "/reports", element: <Protected><Reports /></Protected> },
      { path: "/admin/users", element: <Protected><AdminUsers /></Protected> },
      { path: "/admin/audit", element: <Protected><AuditLog /></Protected> },
      { path: "*", element: <Navigate to="/" replace /> },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
