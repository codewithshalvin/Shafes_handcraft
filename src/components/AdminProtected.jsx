import { Navigate, Outlet } from "react-router-dom";

export default function AdminProtected() {
  const isAdmin = localStorage.getItem("isAdmin") === "true";

  if (!isAdmin) {
    return <Navigate to="/admin" />; // redirect to login if not admin
  }

  return <Outlet />; // render nested admin routes
}
