import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ContextProvider, useAuth } from './Context/Context';
import HomePage from './compnents/HomePage';
import AdminHome from './compnents/AdminHome';
import LoginPage from './compnents/LoginPage';
import SearchPage from './compnents/SearchPage';
import TutorProfile from './compnents/TutorProfile';
import CourseCoverageRequestPage from './compnents/CourseCoverageRequestPage';
import MessagesPage from './compnents/MessagesPage';
import RegisterPage from './compnents/RegisterPage';
import SessionsPage from './compnents/SessionsPage';
import AppointmentRequestsPage from './compnents/AppointmentRequestsPage';
import ReportsPage from './compnents/ReportsPage';
import CourseCatalog from './compnents/CourseCatalog';
// Protected Route component for admin access
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, user } = useAuth();

  // Always check authentication and admin status
  if (!isAuthenticated || !user || user.role !== 'admin') {
    // Redirect to home if not authorized
    return <Navigate to="/" replace />;
  }

  return children;
};

// Public Route component for login/signup pages
const PublicRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();

  // Redirect to home if already logged in
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return children;
};

// Redirect component for admins
const AdminRedirect = () => {
  const { isAuthenticated, user } = useAuth();

  if (isAuthenticated && user?.role === 'admin') {
    return <Navigate to="/admin" replace />;
  }

  return <HomePage />;
};

// Protected content component for role-based access
const ProtectedContent = ({ adminOnly = false, tutorOnly = false, blockAdmin = false, children }) => {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated || !user) {
    return <Navigate to="/" replace />;
  }

  // Redirect admins to /admin if they try to access blocked routes
  if (blockAdmin && user.role === 'admin') {
    return <Navigate to="/admin" replace />;
  }

  if ((adminOnly && user.role !== 'admin') ||
    (tutorOnly && !user.isTutor)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

function App() {
  return (
    <ContextProvider>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/" element={<AdminRedirect />} />
            <Route path="/login" element={
              <PublicRoute>
                <LoginPage />
              </PublicRoute>
            } />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/tutor/:tutorId" element={<TutorProfile />} />
            <Route path="/request-coverage" element={
              <ProtectedContent blockAdmin={true}>
                <CourseCoverageRequestPage />
              </ProtectedContent>
            } />
            <Route path="/messages" element={<MessagesPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/sessions" element={
              <ProtectedContent blockAdmin={true}>
                <SessionsPage />
              </ProtectedContent>
            } />
            <Route path="/appointment-requests" element={
              <ProtectedContent tutorOnly={true}>
                <AppointmentRequestsPage />
              </ProtectedContent>
            } />
            <Route
              path="/admin"
              element={
                <ProtectedRoute>
                  <AdminHome />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/course-catalog"
              element={
                <ProtectedRoute>
                  <CourseCatalog />
                </ProtectedRoute>
              }
            />
            <Route
              path="/reports"
              element={
                <ProtectedRoute>
                  <ReportsPage />
                </ProtectedRoute>
              }
            />
          </Routes>
        </div>
      </Router>
    </ContextProvider>
  );
}

export default App;
