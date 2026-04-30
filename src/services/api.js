import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
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
  getPublicTopCoaches: (params) => api.get('/coaches/public/top-coaches', { params }),
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
  removeMyCoach: () => api.delete('/coaches/my-coach'),
  getCoachSettings: () => api.get('/coaches/me/settings'),
  updateCoachSettings: (data) => api.put('/coaches/me/settings', data),
  getClientProgress: (clientId) => api.get(`/coaches/clients/${clientId}/progress`),
  removeClient: (clientId) => api.delete(`/coaches/clients/${clientId}`),
  reportCoach: (coachId, data) => api.post(`/coaches/${coachId}/report`, data),
  getCoachApplication: () => api.get('/coaches/application'),
  submitCoachApplication: (data) => api.post('/coaches/application', data),
};

// ============================================
// Chat APIs
// ============================================

export const chatAPI = {
  getConversations: () => api.get('/chat/conversations'),
  getMessages: (relationshipId, params) => api.get(`/chat/messages/${relationshipId}`, { params }),
  sendMessage: (data) => api.post('/chat/messages', data),
  reportConversation: (data) => api.post('/chat/reports', data),
};

// ============================================
// Workout APIs
// ============================================

export const workoutsAPI = {
  getPublicExercises: (params) => api.get('/workouts/public/exercises', { params }),
  // Exercises
  getExercises: (params) => api.get('/workouts/exercises', { params }),
  createExercise: (data) => api.post('/workouts/exercises', data),

  // Workout Plans
  getWorkoutPlans: (params) => api.get('/workouts/plans', { params }),
  getWorkoutPlan: (planId) => api.get(`/workouts/plans/${planId}`),
  getPlanClients: (planId) => api.get(`/workouts/plans/${planId}/clients`),
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
  getCalendarFeedInfo: () => api.get('/workouts/calendar/feed-info'),
  downloadIcs: () => api.get('/workouts/calendar.ics', { responseType: 'blob' }),
  createCalendarNote: (data) => api.post('/workouts/calendar/notes', data),
  getCalendarNotes: (params) => api.get('/workouts/calendar/notes', { params }),
  deleteCalendarNote: (noteId) => api.delete(`/workouts/calendar/notes/${noteId}`),
  getTemplates: (params) => api.get('/workouts/templates', { params }),
  createTemplate: (data) => api.post('/workouts/templates', data),
  customizeTemplate: (templateId, data) => api.post(`/workouts/templates/${templateId}/customize`, data),
  createAssignment: (data) => api.post('/workouts/assignments', data),
  deleteAssignment: (assignmentId) => api.delete('/workouts/assignments', { params: { assignment_id: assignmentId } }),
};

// ============================================
// Nutrition APIs
// ============================================

export const nutritionAPI = {
  getMeals: (params) => api.get('/nutrition/meals', { params }),
  createMeal: (data) => api.post('/nutrition/meals', data),
  deleteMeal: (mealId) => api.delete(`/nutrition/meals/${mealId}`),
  getMealPlans: () => api.get('/nutrition/meal-plans'),
  createMealPlan: (data) => api.post('/nutrition/meal-plans', data),
  getMetrics: () => api.get('/nutrition/metrics'),
  createMetric: (data) => api.post('/nutrition/metrics', data),
  deleteMetric: (metricId) => api.delete(`/nutrition/metrics/${metricId}`),
  getDailyMetrics: () => api.get('/nutrition/daily-metrics'),
  createDailyMetric: (data) => api.post('/nutrition/daily-metrics', data),
  deleteDailyMetric: (metricId) => api.delete(`/nutrition/daily-metrics/${metricId}`),
  getWellness: () => api.get('/nutrition/wellness'),
  createWellness: (data) => api.post('/nutrition/wellness', data),
  deleteWellness: (logId) => api.delete(`/nutrition/wellness/${logId}`),
};

// ============================================
// Profile APIs
// ============================================

export const profileAPI = {
  getProfile: () => api.get('/profile'),
  updateProfile: (data) => api.put('/profile', data),
  getNotifications: () => api.get('/profile/notifications'),
  markNotificationRead: (notificationId) => api.patch(`/profile/notifications/${notificationId}/read`),
  uploadProfilePicture: (formData) => api.post('/profile/picture', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  }),
};

// ============================================
// Analytics APIs
// ============================================

export const analyticsAPI = {
  getWorkoutSummary: (params) => api.get('/analytics/workout-summary', { params }),
  getNutritionSummary: (params) => api.get('/analytics/nutrition-summary', { params }),
  getProgress: (params) => api.get('/analytics/progress', { params }),
};

// ============================================
// Admin APIs
// ============================================

export const adminAPI = {
  getUsers: () => api.get('/admin/users'),
  getStats: () => api.get('/admin/stats'),
  updateUserStatus: (userId, status) => api.patch(`/admin/users/${userId}/status`, { status }),
  updateUser: (userId, data) => api.put(`/admin/users/${userId}`, data),
  getCoachApplications: () => api.get('/admin/coach-applications'),
  reviewCoachApplication: (applicationId, data) => api.patch(`/admin/coach-applications/${applicationId}`, data),
  getReports: () => api.get('/admin/reports'),
  updateReport: (reportId, data) => api.patch(`/admin/reports/${reportId}`, data),
  getExercises: () => api.get('/admin/exercises'),
  createExercise: (data) => api.post('/admin/exercises', data),
  updateExercise: (exerciseId, data) => api.put(`/admin/exercises/${exerciseId}`, data),
  deleteExercise: (exerciseId) => api.delete(`/admin/exercises/${exerciseId}`),
  getRequests: () => api.get('/admin/requests'),
  updateRequest: (requestId, data) => api.patch(`/admin/requests/${requestId}`, data),
  getPaymentAnalytics: () => api.get('/admin/payment-analytics'),
  getTemplates: () => api.get('/admin/templates'),
  updateTemplate: (data) => api.patch('/admin/templates', data),
};

// ============================================
// Payment APIs
// ============================================

export const paymentsAPI = {
  getCoachPricing: (coachId) => api.get(`/payments/pricing/${coachId}`),
  processPayment: (data) => api.post('/payments/process', data),
  getPaymentHistory: () => api.get('/payments/history'),
};

// ============================================
// Progress Photos APIs
// ============================================

export const progressPhotosAPI = {
  getPhotos: (params) => api.get('/progress-photos', { params }),
  uploadPhoto: (formData) => api.post('/progress-photos', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  deletePhoto: (photoId) => api.delete(`/progress-photos/${photoId}`),
  getClientPhotos: (clientId) => api.get(`/progress-photos/client/${clientId}`),
};

export default api;
