import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Global error interceptor
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (!error.response) {
      // Network error or backend down
      error.userMessage = 'Unable to connect to the server. Please check your internet connection and try again.';
    }
    return Promise.reject(error);
  }
);

export default API;
