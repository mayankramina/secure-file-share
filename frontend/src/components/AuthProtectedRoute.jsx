import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';

export const AuthProtectedRoute = ({ children }) => {
  const location = useLocation();
  const { isAuthenticated, isMFAEnabled, loading } = useSelector((state) => state.auth);
  const isMFAVerified = sessionStorage.getItem('isMFAVerified') === 'true';
  
  if (loading) {
    return <div>Loading...</div>; // Or your loading component
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  if (isAuthenticated && isMFAEnabled && isMFAVerified) {
    return <Navigate to="/dashboard" state={{ from: location }} replace />;
  }

  return children;
}; 