import axios from 'axios';

const api = axios.create({
  // Point to the dedicated backend API domain
  baseURL: 'https://mail-api.eeina.com',
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('smtp_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
