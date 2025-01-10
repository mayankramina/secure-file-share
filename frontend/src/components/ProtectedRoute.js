import { useSelector } from "react-redux";
import { Navigate, useLocation } from "react-router-dom";
import { getCookie } from "../utils/cookies";

export const ProtectedRoute = ({ children }) => {
  const { isMFAEnabled, isMFAVerified } = useSelector((state) => state.auth);
  const location = useLocation();
  
  const isAuthenticated = Boolean(getCookie(process.env.REACT_APP_ACCESS_TOKEN_NAME));

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!isMFAEnabled && !isMFAVerified) {
    return <Navigate to="/mfa/setup" state={{ from: location }} replace />;
  }

  if (isMFAEnabled && !isMFAVerified) {
    return <Navigate to="/mfa" state={{ from: location }} replace />;
  }

  return children;
};
