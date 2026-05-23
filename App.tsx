
import React, { Suspense, lazy } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { RoleProtectedRoute } from './hooks/RoleProtectedRoute';
import { Loader2 } from 'lucide-react';
import { UserRole } from './types';

// Lazy load pages
const Dashboard = lazy(() => import('./pages/Dashboard').then(module => ({ default: module.Dashboard })));
const EmployeesView = lazy(() => import('./pages/EmployeesView'));
const EmployeeForm = lazy(() => import('./pages/EmployeeForm'));
const EmployeeDetail = lazy(() => import('./pages/EmployeeDetail'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const SelfService = lazy(() => import('./pages/SelfService').then(m => ({ default: m.SelfService })));
const UserManagement = lazy(() => import('./pages/UserManagement').then(m => ({ default: m.UserManagement })));
const AuditLogs = lazy(() => import('./pages/AuditLogs').then(m => ({ default: m.AuditLogs })));
const UpdateRequestsView = lazy(() => import('./pages/UpdateRequestsView').then(m => ({ default: m.UpdateRequestsView })));

// Loading Fallback Component
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900">
    <div className="flex flex-col items-center gap-3">
      <Loader2 className="animate-spin text-indigo-600" size={40} />
      <p className="text-gray-500 font-medium text-sm">جاري تحميل النظام...</p>
    </div>
  </div>
);

import ErrorBoundary from './components/ErrorBoundary';

import { Layout } from './components/Layout';
import { PWAInstallBanner } from './components/PWAInstallBanner';

const HomeRedirect: React.FC = () => {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900">
        <Loader2 className="animate-spin text-indigo-600" size={40} />
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === UserRole.EMPLOYEE) {
    return <Navigate to="/self-service" replace />;
  }
  return <Navigate to="/dashboard" replace />;
};

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <HashRouter>
        <PWAInstallBanner />
        <Toaster position="top-center" reverseOrder={false} />
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            {/* Protected Routes for All (including Employees) */}
                <Route element={<RoleProtectedRoute allow='employee' />}>
                  <Route path="/" element={<HomeRedirect />} />
                  <Route path="/self-service" element={<Layout><SelfService /></Layout>} />
                  <Route path="/profile" element={<Navigate to="/self-service" replace />} />
                </Route>
                
                {/* Administrative Pages (Admin & Manager only) */}
                <Route element={<RoleProtectedRoute allow='manager' />}>
                  <Route path="/dashboard" element={<Layout><Dashboard /></Layout>} />
                  <Route path="/directory" element={<Layout><Dashboard initialView="directory" /></Layout>} />
                  <Route path="/units" element={<Layout><Dashboard initialView="units" /></Layout>} />
                  <Route path="/ai" element={<Layout><Dashboard initialView="ai" /></Layout>} />
                  <Route path="/org-chart" element={<Layout><Dashboard initialView="org-chart" /></Layout>} />
                  <Route path="/my-profile" element={<Layout><Dashboard initialView="profile" /></Layout>} />
                  <Route path="/employees" element={<Layout><EmployeesView /></Layout>} />
                  <Route path="/add" element={<Layout><EmployeeForm /></Layout>} />
                  <Route path="/system/requests" element={<Layout><UpdateRequestsView /></Layout>} />
                  
                  {/* Admin Only System Routes */}
                  <Route element={<RoleProtectedRoute allow='admin' />}>
                     <Route path="/system/users" element={<Layout><UserManagement /></Layout>} />
                     <Route path="/system/audit-logs" element={<Layout><AuditLogs /></Layout>} />
                  </Route>

                  {/* Manager/Admin can view and edit other employees */}
                  <Route path="/employees/:id" element={<Layout><EmployeeDetail /></Layout>} />
                  <Route path="/edit/:id" element={<Layout><EmployeeForm /></Layout>} />
                </Route>
                
                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </HashRouter>
    </ErrorBoundary>
  );
};

export default App;
