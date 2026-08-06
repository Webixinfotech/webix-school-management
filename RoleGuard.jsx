import React from 'react';
import { Navigate } from 'react-router-dom';
import { authUtils } from '../../utils/auth';

/**
 * RoleGuard wrapper protects routes based on user role.
 * Must be used inside or alongside ProtectedRoute.
 */
const RoleGuard = ({ allowedRoles = [], children }) => {
  const user = authUtils.getUser();
  const userRole = user?.role?.toLowerCase();

  // If user role is not in the allowed list, block access
  if (!user || !allowedRoles.includes(userRole)) {
    // Redirect unauthorized users (e.g., Teacher trying to access Admin route)
    // You can redirect to an 'Unauthorized' page or the default dashboard
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

export default RoleGuard;