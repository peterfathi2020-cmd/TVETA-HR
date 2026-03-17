import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { usePermissions } from './usePermissions';

interface ProtectedRouteProps {
  allow: 'admin' | 'manager' | 'employee';
  children?: React.ReactNode;
}

export const RoleProtectedRoute: React.FC<ProtectedRouteProps> = ({ allow, children }) => {
  const { isAdmin, isManager, isEmployee } = usePermissions();

  let isAllowed = false;
  switch (allow) {
    case 'admin':
      isAllowed = isAdmin;
      break;
    case 'manager':
      isAllowed = isAdmin || isManager;
      break;
    case 'employee':
      isAllowed = isAdmin || isManager || isEmployee;
      break;
    default:
      isAllowed = false;
  }

  if (!isAllowed) {
    // Redirect them to the home page, but save the current location they were
    // trying to go to. This allows us to send them along to that page after they
    // log in, which is a nicer user experience than dropping them off on the home page.
    return <Navigate to="/login" replace />;
  }

  return children ? <>{children}</> : <Outlet />;
};
