import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { getPostAuthRoute, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import LandingPage from './pages/LandingPage';
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
import Calendar from './pages/Calendar';
import CreateWorkoutPlan from './pages/CreateWorkoutPlan';
import Nutrition from './pages/Nutrition';
import Analytics from './pages/Analytics';
import Profile from './pages/Profile';
import CoachSettings from './pages/CoachSettings';
import CoachOnboarding from './pages/CoachOnboarding';
import AdminDashboard from './pages/AdminDashboard';
import ClientProgress from './pages/ClientProgress';
import CoachClientAnalytics from './pages/CoachClientAnalytics';
import TopCoachesPage from './pages/TopCoachesPage';
import CustomizeWorkoutPlan from './pages/CustomizeWorkoutPlan';
import ViewWorkoutPlan from './pages/ViewWorkoutPlan';
import ExerciseLibrary from './pages/ExerciseLibrary';
import ProgressPhotos from './pages/ProgressPhotos';
import Payments from './pages/Payments';

// Protected Route Component
const ProtectedRoute = ({ children, requireAuth = true, redirectTo = '/login' }) => {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (requireAuth && !isAuthenticated) {
    return <Navigate to={redirectTo} replace />;
  }

  if (!requireAuth && isAuthenticated) {
    return <Navigate to={getPostAuthRoute(user)} replace />;
  }

  return children;
};

const DashboardGate = () => {
  const { user } = useAuth();

  if (user?.role === 'admin') {
    return <Navigate to="/admin" replace />;
  }

  return <Dashboard />;
};

function App() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="App">
      {isAuthenticated && <Navbar />}

      <Routes>
        {/* Public routes */}
        <Route
          path="/"
          element={
            <LandingPage />
          }
        />
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
          path="/coach-onboarding"
          element={
            <ProtectedRoute>
              <CoachOnboarding />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardGate />
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
          path="/top-coaches"
          element={<TopCoachesPage />}
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
        <Route
          path="/calendar"
          element={
            <ProtectedRoute>
              <Calendar />
            </ProtectedRoute>
          }
        />
        <Route
          path="/nutrition"
          element={
            <ProtectedRoute>
              <Nutrition />
            </ProtectedRoute>
          }
        />
        <Route
          path="/analytics"
          element={
            <ProtectedRoute>
              <Analytics />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/coach-settings"
          element={
            <ProtectedRoute>
              <CoachSettings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/clients/:clientId"
          element={
            <ProtectedRoute>
              <ClientProgress />
            </ProtectedRoute>
          }
        />
        <Route
          path="/clients/:clientId/analytics"
          element={
            <ProtectedRoute>
              <CoachClientAnalytics />
            </ProtectedRoute>
          }
        />
        <Route
          path="/exercises"
          element={
            <ProtectedRoute>
              <ExerciseLibrary />
            </ProtectedRoute>
          }
        />
        <Route
          path="/browse-exercises"
          element={<Navigate to="/exercises" replace />}
        />
        <Route
          path="/progress-photos"
          element={
            <ProtectedRoute>
              <ProgressPhotos />
            </ProtectedRoute>
          }
        />
        <Route
          path="/payments"
          element={
            <ProtectedRoute>
              <Payments />
            </ProtectedRoute>
          }
        />
        {/* Removed filter workout plans route - browsing consolidated in MyWorkouts */}
        <Route
          path="/customize-workout-plan/:planId"
          element={
            <ProtectedRoute>
              <CustomizeWorkoutPlan />
            </ProtectedRoute>
          }
        />
        <Route
          path="/workout-plans/:planId"
          element={
            <ProtectedRoute>
              <ViewWorkoutPlan />
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
