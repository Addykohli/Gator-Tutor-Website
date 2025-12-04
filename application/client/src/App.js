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
// Protected Route component for admin access
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, user } = useAuth();

  // Allow access in development without authentication
  if (process.env.NODE_ENV === 'development') {
    return children;
  }

  // In production, check authentication and admin status
  if (!isAuthenticated || !user.isAdmin) {
    // Redirect to login if not authenticated or not an admin
    return <Navigate to="/login" replace />;
  }

  return children;
};

function App() {
  return (
    <ContextProvider>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/tutor/:tutorId" element={<TutorProfile />} />
            <Route path="/request-coverage" element={<CourseCoverageRequestPage />} />
            <Route path="/messages" element={<MessagesPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/sessions" element={<SessionsPage />} />
            <Route path="/appointment-requests" element={<AppointmentRequestsPage />} />
            <Route
              path="/admin"
              element={
                <ProtectedRoute>
                  <AdminHome />
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
