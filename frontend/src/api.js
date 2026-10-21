import axios from 'axios';

// URL del backend desplegado en Render (producción)
const RENDER_BACKEND_URL = 'https://compraventapro.onrender.com/api/v1';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || RENDER_BACKEND_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;

