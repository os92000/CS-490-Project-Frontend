import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: '/api',  // Proxy configured in package.json
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    console.log('API Request:', config.method?.toUpperCase(), config.url);
    console.log('Token exists:', !!token, 'Token length:', token?.length);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('Authorization header set');
    } else {
      console.log('No token found in localStorage');
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If error is 401 and we haven't tried to refresh token yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (refreshToken) {
          const response = await axios.post('/api/auth/refresh', {}, {
            headers: {
              Authorization: `Bearer ${refreshToken}`
            }
          });

          if (response.data.success) {
            const { access_token } = response.data.data;
            localStorage.setItem('access_token', access_token);
            originalRequest.headers.Authorization = `Bearer ${access_token}`;
            return api(originalRequest);
          }
        }
      } catch (refreshError) {
        // Refresh failed, logout user
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// ============================================
// Authentication APIs
// ============================================

export const authAPI = {
  signup: (data) => api.post('/auth/signup', data),
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  refreshToken: () => api.post('/auth/refresh'),
  getCurrentUser: () => api.get('/auth/me'),
  changePassword: (data) => api.put('/auth/change-password', data),
};

// ============================================
// User APIs
// ============================================

export const usersAPI = {
  updateRole: (userId, role) => api.patch(`/users/${userId}/role`, { role }),
  getProfile: (userId) => api.get(`/users/${userId}/profile`),
  updateProfile: (userId, data) => api.put(`/users/${userId}/profile`, data),
  getAllUsers: (params) => api.get('/users', { params }),
  deleteAccount: (userId) => api.delete(`/users/${userId}`),
};

// ============================================
// Survey APIs
// ============================================

export const surveysAPI = {
  createFitnessSurvey: (data) => api.post('/surveys/fitness', data),
  getFitnessSurvey: (userId) => api.get(`/surveys/fitness/${userId}`),
  getMyFitnessSurvey: () => api.get('/surveys/fitness'),
  deleteFitnessSurvey: (userId) => api.delete(`/surveys/fitness/${userId}`),
};

// ============================================
// Coach Marketplace APIs
// ============================================

export const coachesAPI = {
  getCoaches: (params) => api.get('/coaches', { params }),
  getCoachDetails: (coachId) => api.get(`/coaches/${coachId}`),
  getCoachReviews: (coachId, params) => api.get(`/coaches/${coachId}/reviews`, { params }),
  sendHireRequest: (coachId) => api.post(`/coaches/${coachId}/hire`),
  getMyRequests: (type) => api.get('/coaches/requests', { params: { type } }),
  respondToRequest: (requestId, status) => api.patch(`/coaches/requests/${requestId}`, { status }),
  submitReview: (coachId, data) => api.post(`/coaches/${coachId}/review`, data),
  getSpecializations: () => api.get('/coaches/specializations'),
  getMyClients: () => api.get('/coaches/my-clients'),
  getMyCoach: () => api.get('/coaches/my-coach'),
};

// ============================================
// Chat APIs
// ============================================

export const chatAPI = {
  getConversations: () => api.get('/chat/conversations'),
  getMessages: (relationshipId, params) => api.get(`/chat/messages/${relationshipId}`, { params }),
  sendMessage: (data) => api.post('/chat/messages', data),
};

// ============================================
// Workout APIs
// ============================================

export const workoutsAPI = {
  // Exercises
  getExercises: (params) => api.get('/workouts/exercises', { params }),
  createExercise: (data) => api.post('/workouts/exercises', data),

  // Workout Plans
  getWorkoutPlans: (params) => api.get('/workouts/plans', { params }),
  getWorkoutPlan: (planId) => api.get(`/workouts/plans/${planId}`),
  createWorkoutPlan: (data) => api.post('/workouts/plans', data),
  updateWorkoutPlan: (planId, data) => api.put(`/workouts/plans/${planId}`, data),
  deleteWorkoutPlan: (planId) => api.delete(`/workouts/plans/${planId}`),

  // Workout Logs
  getWorkoutLogs: (params) => api.get('/workouts/logs', { params }),
  createWorkoutLog: (data) => api.post('/workouts/logs', data),
  updateWorkoutLog: (logId, data) => api.put(`/workouts/logs/${logId}`, data),
  deleteWorkoutLog: (logId) => api.delete(`/workouts/logs/${logId}`),

  // Calendar & Stats
  getWorkoutCalendar: (params) => api.get('/workouts/calendar', { params }),
  getWorkoutStats: (params) => api.get('/workouts/stats', { params }),
};

export default api;
