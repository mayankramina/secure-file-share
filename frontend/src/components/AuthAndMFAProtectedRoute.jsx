import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';

export const AuthAndMFAProtectedRoute = ({ children }) => {
  const location = useLocation();
  const { isAuthenticated, isMFAEnabled, loading } = useSelector((state) => state.auth);
  const isMFAVerified = sessionStorage.getItem('isMFAVerified') === 'true';

  if (loading) {
    return <div>Loading...</div>; // Or your loading component
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!isMFAEnabled && !isMFAVerified) {
    return <Navigate to="/mfa/setup" state={{ from: location }} replace />;
  }

  if (isMFAEnabled && !isMFAVerified) {
    return <Navigate to="/mfa" state={{ from: location }} replace />;
  }

  return children || <Navigate to="/dashboard" state={{ from: location }} replace />;
}; 