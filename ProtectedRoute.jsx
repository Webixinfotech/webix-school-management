import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { authUtils } from '../../utils/auth';

/**
 * Core wrapper for all protected routes.
 * Prevents access without a valid token.
 */
const ProtectedRoute = ({ children }) => {
  const token = authUtils.getToken();
  const location = useLocation();

  // If no token is found, redirect to login and preserve the intended destination
  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Optional: Add basic token expiry check here if JWT decoding is needed
  // const isExpired = checkTokenExpiry(token);
  // if (isExpired) {
  //   authUtils.clearAuth();
  //   return <Navigate to="/login?expired=true" replace />;
  // }

  return children;
};

export default ProtectedRoute;