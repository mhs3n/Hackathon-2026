import { Navigate, Outlet } from "react-router-dom";

import { useAuth } from "../auth/AuthContext";
import type { UserRole } from "../types";

export function RequireAuth() {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}

export function RequireRole({ role }: { role: UserRole }) {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== role) {
    return <Navigate to={getHomePath(user.role)} replace />;
  }

  return <Outlet />;
}

export function getHomePath(role: UserRole) {
  if (role === "ucar_admin") {
    return "/admin/dashboard";
  }
  if (role === "institution_admin") {
    return "/institution/dashboard";
  }
  return "/student/dashboard";
}
