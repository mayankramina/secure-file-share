import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import FullScreenLoader from '../common/FullScreenLoader';

export const AuthProtectedRoute = ({ children }) => {
  const location = useLocation();
  const { isAuthenticated, isMFAEnabled, loading } = useSelector((state) => state.auth);
  const isMFAVerified = sessionStorage.getItem('isMFAVerified') === 'true';
  
  if (loading) {
    return <FullScreenLoader />;
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  if (isAuthenticated && isMFAEnabled && isMFAVerified) {
    return <Navigate to="/dashboard" state={{ from: location }} replace />;
  }

  return children;
}; 