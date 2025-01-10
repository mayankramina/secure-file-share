import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';

export const NonAuthRoute = ({ children }) => {
  const location = useLocation();
  const { isAuthenticated, isMFAEnabled, loading } = useSelector((state) => state.auth);
  const isMFAVerified = sessionStorage.getItem('isMFAVerified') === 'true';


  if (loading) {
    return <div>Loading...</div>;
  }

  if (isAuthenticated && isMFAEnabled && isMFAVerified) {
    return <Navigate to="/dashboard" state={{ from: location }} replace />;
  }

  if (isAuthenticated && !isMFAEnabled && !isMFAVerified) {
    return <Navigate to="/mfa/setup" state={{ from: location }} replace />;
  }

  if (isAuthenticated && isMFAEnabled && !isMFAVerified) {
    return <Navigate to="/mfa" state={{ from: location }} replace />;
  }


  return children;
};