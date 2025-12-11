import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, createSearchParams } from 'react-router-dom';
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
import TutorCourseApplications from './compnents/TutorCourseApplications';
import ApplyTutorPage from './compnents/ApplyTutorPage';
import AdminTutorApplicationsPage from './compnents/AdminTutorApplicationsPage';
import AdminCourseCoverageRequestsPage from './compnents/AdminCourseCoverageRequestsPage';

// Protected Route component for admin access
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();

  // Always check authentication and admin status
  if (!isAuthenticated || !user || user.role !== 'admin') {
    // If not authenticated, redirect to login with query param
    if (!isAuthenticated || !user) {
      return <Navigate
        to={{
          pathname: '/login',
          search: `?${createSearchParams({ redirect: location.pathname + location.search })}`
        }}
        replace
      />;
    }
    // Redirect to home if not authorized (authenticated but not admin)
    return <Navigate to="/" replace />;
  }

  return children;
};

// Public Route component for login/signup pages
const PublicRoute = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();

  // Redirect to home if already logged in
  if (isAuthenticated) {
    const searchParams = new URLSearchParams(location.search || window.location.search);
    const redirectParam = searchParams.get('redirect');
    const redirectState = location.state?.from;

    const target = redirectParam ? decodeURIComponent(redirectParam) : redirectState;

    if (target) {
      return <Navigate to={target} replace />;
    }

    if (user?.role === 'admin') {
      return <Navigate to="/admin" replace />;
    }
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
const ProtectedContent = ({ adminOnly = false, tutorOnly = false, blockAdmin = false, currentPath, children }) => {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();

  if (!isAuthenticated || !user) {
    const pathname = currentPath || location.pathname;
    // Capture search params from window as valid fallback
    const search = window.location.search || location.search;
    const path = pathname + search;

    return <Navigate
      to={{
        pathname: '/login',
        search: `?${createSearchParams({ redirect: path })}`
      }}
      replace
    />;
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
              <ProtectedContent blockAdmin={true} currentPath="/request-coverage">
                <CourseCoverageRequestPage />
              </ProtectedContent>
            } />
            <Route path="/messages" element={
              <ProtectedContent currentPath="/messages">
                <MessagesPage />
              </ProtectedContent>
            } />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/sessions" element={
              <ProtectedContent blockAdmin={true} currentPath="/sessions">
                <SessionsPage />
              </ProtectedContent>
            } />
            <Route path="/appointment-requests" element={
              <ProtectedContent tutorOnly={true} currentPath="/appointment-requests">
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
              path="/admin/tutor-course-applications"
              element={
                <ProtectedRoute>
                  <TutorCourseApplications />
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
              path="/apply-tutor" 
              element={
            <ProtectedContent 
            blockAdmin={true} currentPath="/apply-tutor">
              <ApplyTutorPage />
            </ProtectedContent>
              } 
            />
            <Route
              path="/admin/tutor-applications"
              element={
                <ProtectedRoute>
                  <AdminTutorApplicationsPage />
                </ProtectedRoute>
              }
            />
            <Route
            path="/admin/coverage-requests"
            element={
              <ProtectedRoute>
                <AdminCourseCoverageRequestsPage />
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
