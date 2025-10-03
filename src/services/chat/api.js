import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_CHAT_API_URL || 'http://localhost:5000';

// Create axios instance
const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use(
  async (config) => {
    const token = localStorage.getItem('chatAuthToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('chatAuthToken');
      // You might want to redirect to login or refresh token here
    }
    return Promise.reject(error);
  }
);

// Auth endpoints
export const authAPI = {
  loginWithFirebase: (firebaseToken, userData) =>
    api.post('/auth/firebase-login', { firebaseToken, userData }),
  
  loginWithMeowgram: (email, password) =>
    api.post('/auth/meowgram-login', { email, password }),
  
  getCurrentUser: () => api.get('/auth/me'),
  
  getAllUsers: () => api.get('/auth/users'),
  
  logout: () => api.post('/auth/logout'),
};

// Chat endpoints
export const chatAPI = {
  getChats: () => api.get('/chats'),
  
  createChat: (participantIds, chatName, isGroup = false) =>
    api.post('/chats', { participantIds, chatName, isGroup }),
  
  getChatMessages: (chatId, page = 1, limit = 50) =>
    api.get(`/chats/${chatId}/messages?page=${page}&limit=${limit}`),
  
  sendMessage: (chatId, content, messageType = 'text') =>
    api.post(`/chats/${chatId}/messages`, { content, messageType }),
  
  markMessagesAsRead: (chatId) =>
    api.put(`/chats/${chatId}/read`),
  
  deleteMessage: (messageId) =>
    api.delete(`/messages/${messageId}`),
  
  editMessage: (messageId, content) =>
    api.put(`/messages/${messageId}`, { content }),
};

// File upload endpoints
export const uploadAPI = {
  uploadFile: (file, chatId) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('chatId', chatId);
    
    return api.post('/uploads', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
};

export default api;