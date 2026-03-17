
import React, { Suspense, lazy } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/authContext';
import { ThemeProvider } from './context/ThemeContext';
import { RoleProtectedRoute } from './hooks/RoleProtectedRoute';
import { Loader2 } from 'lucide-react';
import { UserRole } from './types';

// Lazy load pages
const Dashboard = lazy(() => import('./pages/Dashboard').then(module => ({ default: module.Dashboard })));
const EmployeeList = lazy(() => import('./pages/EmployeeList'));
const EmployeeForm = lazy(() => import('./pages/EmployeeForm'));
const EmployeeDetail = lazy(() => import('./pages/EmployeeDetail'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const SelfService = lazy(() => import('./pages/SelfService').then(m => ({ default: m.SelfService })));

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

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <HashRouter>
            <Toaster position="top-center" reverseOrder={false} />
            <Suspense fallback={<PageLoader />}>
              <Routes>
                {/* Public Routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                
                {/* Protected Routes Wrapper */}
                <Route element={<RoleProtectedRoute allow='employee' />}>
                  <Route path="/" element={<Layout><Dashboard /></Layout>} />
                  <Route path="/profile" element={<Layout><Dashboard initialView="profile" /></Layout>} />
                  <Route path="/directory" element={<Layout><Dashboard initialView="directory" /></Layout>} />
                  <Route path="/units" element={<Layout><Dashboard initialView="units" /></Layout>} />
                  <Route path="/ai" element={<Layout><Dashboard initialView="ai" /></Layout>} />
                  <Route path="/self-service" element={<Layout><SelfService /></Layout>} />
                  
                  {/* Administrative Pages (Admin & Manager) */}
                  <Route element={<RoleProtectedRoute allow='manager' />}>
                    <Route path="/employees" element={<Layout><EmployeeList /></Layout>} />
                    <Route path="/add" element={<Layout><EmployeeForm /></Layout>} />
                  </Route>

                  {/* Employee Details & Edit */}
                  <Route path="/employees/:id" element={<Layout><EmployeeDetail /></Layout>} />
                  <Route path="/edit/:id" element={<Layout><EmployeeForm /></Layout>} />
                </Route>
                
                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </HashRouter>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
};

export default App;
