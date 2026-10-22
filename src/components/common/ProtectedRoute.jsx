import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import LoadingSpinner from "./LoadingSpinner";

export default function ProtectedRoute({ children, allowedRole }) {
  const { isAuthenticated, role, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <LoadingSpinner size="lg" text="Authenticating session..." />
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect to login page and preserve attempted route
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRole && role !== allowedRole) {
    // If logged in as patient trying to open hospital route, or vice versa
    const destination = role === "hospital" ? "/hospital/dashboard" : "/patient/dashboard";
    return <Navigate to={destination} replace />;
  }

  return children;
}
