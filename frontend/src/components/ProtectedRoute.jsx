import { Navigate } from "react-router-dom";
import { auth } from "../auth";

export default function ProtectedRoute({ role, children }) {
  if (!auth.isLogged()) return <Navigate to="/login" replace />;
  if (role && auth.getRole() !== role) return <Navigate to="/login" replace />;
  return children;
}
