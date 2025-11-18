import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ContextProvider, useAuth } from './Context/Context';
import PeoplePage from './compnents/PeoplePage';
import AddyPage from './compnents/AddyPage';
import KojiroPage from './compnents/KojiroPage';
import AtharvaPage from './compnents/AtharvaPage';
import KrinjalPage from './compnents/KrinjalPage';
import SonamPage from './compnents/SonamPage';
import AketzaliPage from './compnents/AketzaliPage';
import HomePage from './compnents/HomePage';
import AdminHome from './compnents/AdminHome';
import LoginPage from './compnents/LoginPage';
import SearchPage from './compnents/SearchPage';
import MySchedulePage from './compnents/MySchedulePage';
import TutorProfile from './compnents/TutorProfile';
import FindTutorPage from './compnents/FindTutorPage';
import FindCoursePage from './compnents/FindCoursePage';
import CourseCoverageRequestPage from './compnents/CourseCoverageRequestPage';
import MessagesPage from './compnents/MessagesPage';
import RegisterPage from './compnents/RegisterPage';
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
            <Route path="/people" element={<PeoplePage />} />
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/addy" element={<AddyPage />} />
            <Route path="/kojiro" element={<KojiroPage />} />
            <Route path="/atharva" element={<AtharvaPage />} />
            <Route path="/krinjal" element={<KrinjalPage />} />
            <Route path="/sonam" element={<SonamPage />} />
            <Route path="/aketzali" element={<AketzaliPage />} />
            <Route path="/myschedule" element={<MySchedulePage />} />
            <Route path="/tutor/:tutorId" element={<TutorProfile />} />
            <Route path="/find-tutor" element={<FindTutorPage />} />
            <Route path="/find-course" element={<FindCoursePage />} />
            <Route path="/coverage-request" element={<CourseCoverageRequestPage />} />
            <Route path="/messages" element={<MessagesPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route 
              path="/admin" 
              element={
                <ProtectedRoute>
                  <AdminHome />
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
