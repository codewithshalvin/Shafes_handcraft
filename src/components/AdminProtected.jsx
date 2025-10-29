import { Navigate, Outlet } from "react-router-dom";

export default function AdminProtected() {
  const isAdmin = localStorage.getItem("isAdmin") === "true";
  const adminToken = localStorage.getItem("adminToken");

  console.log('🔍 AdminProtected check:', { isAdmin, hasToken: !!adminToken });

  if (!isAdmin || !adminToken) {
    console.log('❌ Admin access denied, redirecting to login');
    return <Navigate to="/auth" replace />; // redirect to main auth page
  }

  console.log('✅ Admin access granted');
  return <Outlet />; // render nested admin routes
}
