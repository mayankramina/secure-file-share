import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import FullScreenLoader from '../common/FullScreenLoader';
import { getAndClearInitialUrl, storeInitialUrlIfNotSet } from '../../utils/urlStorage';

export const AuthAndMFAProtectedRoute = ({ children }) => {
  const location = useLocation();
  const { isAuthenticated, isMFAEnabled, loading } = useSelector((state) => state.auth);
  const isMFAVerified = sessionStorage.getItem('isMFAVerified') === 'true';

  if (loading) {
    return <FullScreenLoader />;
  }

  if (!isAuthenticated) {
    storeInitialUrlIfNotSet(location.pathname);
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!isMFAEnabled && !isMFAVerified) {
    storeInitialUrlIfNotSet(location.pathname);
    return <Navigate to="/mfa/setup" state={{ from: location }} replace />;
  }

  if (isMFAEnabled && !isMFAVerified) {
    storeInitialUrlIfNotSet(location.pathname);
    return <Navigate to="/mfa" state={{ from: location }} replace />;
  }

  // Check for stored initial URL after full authentication
  if (isAuthenticated && isMFAVerified) {
    const initialUrl = getAndClearInitialUrl();
    if (initialUrl) {
      return <Navigate to={initialUrl} replace />;
    }
  }

  return children || <Navigate to="/dashboard" state={{ from: location }} replace />;
}; 