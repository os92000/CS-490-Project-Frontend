import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Signup from './pages/Signup';
import RoleSelection from './pages/RoleSelection';
import FitnessSurvey from './pages/FitnessSurvey';
import Dashboard from './pages/Dashboard';
import BrowseCoaches from './pages/BrowseCoaches';
import CoachProfile from './pages/CoachProfile';
import MyCoach from './pages/MyCoach';
import MyClients from './pages/MyClients';
import Chat from './pages/Chat';
import MyWorkouts from './pages/MyWorkouts';
import CreateWorkoutPlan from './pages/CreateWorkoutPlan';
import CoachProfileSettings from './pages/CoachProfileSettings';
import CoachAvailabilitySettings from './pages/CoachAvailabilitySettings';
import CoachPricingSettings from './pages/CoachPricingSettings';
import LandingPage from './pages/LandingPage';

// Protected Route Component
const ProtectedRoute = ({ children, requireAuth = true, redirectTo = '/login' }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (requireAuth && !isAuthenticated) {
    return <Navigate to={redirectTo} replace />;
  }

  if (!requireAuth && isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

function App() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="App">
      {isAuthenticated && <Navbar />}

      <Routes>
        <Route path="/" element={<LandingPage />} />

        {/* Public routes (redirect to dashboard if logged in) */}
        <Route
          path="/login"
          element={
            <ProtectedRoute requireAuth={false}>
              <Login />
            </ProtectedRoute>
          }
        />
        <Route
          path="/signup"
          element={
            <ProtectedRoute requireAuth={false}>
              <Signup />
            </ProtectedRoute>
          }
        />

        {/* Protected routes (require authentication) */}
        <Route
          path="/role-selection"
          element={
            <ProtectedRoute>
              <RoleSelection />
            </ProtectedRoute>
          }
        />
        <Route
          path="/fitness-survey"
          element={
            <ProtectedRoute>
              <FitnessSurvey />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        {/* Coach Marketplace Routes */}
        <Route
          path="/coaches"
          element={
            <ProtectedRoute>
              <BrowseCoaches />
            </ProtectedRoute>
          }
        />
        <Route
          path="/coaches/:coachId"
          element={
            <ProtectedRoute>
              <CoachProfile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/my-coach"
          element={
            <ProtectedRoute>
              <MyCoach />
            </ProtectedRoute>
          }
        />
        <Route
          path="/my-clients"
          element={
            <ProtectedRoute>
              <MyClients />
            </ProtectedRoute>
          }
        />
        <Route
          path="/coach/profile"
          element={
            <ProtectedRoute>
              <CoachProfileSettings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/coach/availability"
          element={
            <ProtectedRoute>
              <CoachAvailabilitySettings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/coach/pricing"
          element={
            <ProtectedRoute>
              <CoachPricingSettings />
            </ProtectedRoute>
          }
        />

        {/* Chat Route */}
        <Route
          path="/chat"
          element={
            <ProtectedRoute>
              <Chat />
            </ProtectedRoute>
          }
        />

        {/* Workout Routes */}
        <Route
          path="/my-workouts"
          element={
            <ProtectedRoute>
              <MyWorkouts />
            </ProtectedRoute>
          }
        />
        <Route
          path="/create-workout-plan"
          element={
            <ProtectedRoute>
              <CreateWorkoutPlan />
            </ProtectedRoute>
          }
        />

        {/* 404 catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

export default App;
