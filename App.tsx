
import React, { Suspense } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import { Loader2 } from 'lucide-react';

// Lazy load pages
const Dashboard = React.lazy(() => import('./pages/Dashboard').then(module => ({ default: module.Dashboard })));
const EmployeeList = React.lazy(() => import('./pages/EmployeeList'));
const EmployeeForm = React.lazy(() => import('./pages/EmployeeForm'));
const EmployeeDetail = React.lazy(() => import('./pages/EmployeeDetail'));
const Login = React.lazy(() => import('./pages/Login'));
const Register = React.lazy(() => import('./pages/Register'));

const LoadingFallback = () => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-slate-900">
    <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mb-4" />
    <p className="text-gray-500 dark:text-gray-400 font-medium animate-pulse">جاري تحميل النظام...</p>
  </div>
);

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <Suspense fallback={<LoadingFallback />}>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              
              <Route element={<ProtectedRoute />}>
                <Route path="/" element={
                  <Layout><Dashboard /></Layout>
                } />
                <Route path="/employees" element={
                  <Layout><EmployeeList /></Layout>
                } />
                <Route path="/employees/:id" element={
                  <Layout><EmployeeDetail /></Layout>
                } />
                <Route path="/add" element={
                  <Layout><EmployeeForm /></Layout>
                } />
                <Route path="/edit/:id" element={
                  <Layout><EmployeeForm /></Layout>
                } />
              </Route>
              
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
