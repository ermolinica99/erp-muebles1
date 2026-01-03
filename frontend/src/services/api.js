import axios from 'axios';

const API_URL = 'http://127.0.0.1:8000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para añadir token JWT en cada petición
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

// Interceptor para manejar errores 401 y refrescar token
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Si es error 401 y no es la ruta de login ni ya intentamos refrescar
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refresh_token');
        
        if (!refreshToken) {
          // No hay refresh token, redirigir a login
          localStorage.clear();
          window.location.href = '/login';
          return Promise.reject(error);
        }

        // Intentar refrescar el token
        const response = await axios.post(`${API_URL}/token/refresh/`, {
          refresh: refreshToken,
        });

        const newAccessToken = response.data.access;
        localStorage.setItem('access_token', newAccessToken);

        // Reintentar la petición original con el nuevo token
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);

      } catch (refreshError) {
        // Si falla el refresh, cerrar sesión
        localStorage.clear();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Funciones para cada endpoint
export const clientesAPI = {
  getAll: () => api.get('/clientes/'),
  getById: (id) => api.get(`/clientes/${id}/`),
  create: (data) => api.post('/clientes/', data),
  update: (id, data) => api.put(`/clientes/${id}/`, data),
  delete: (id) => api.delete(`/clientes/${id}/`),
};

export const productosAPI = {
  getAll: () => api.get('/productos/'),
  getById: (id) => api.get(`/productos/${id}/`),
  create: (data) => api.post('/productos/', data),
  update: (id, data) => api.put(`/productos/${id}/`, data),
  delete: (id) => api.delete(`/productos/${id}/`),
  getAlertas: () => api.get('/productos/alertas/'),
};

export const materiasPrimasAPI = {
  getAll: () => api.get('/materias-primas/'),
  getById: (id) => api.get(`/materias-primas/${id}/`),
  create: (data) => api.post('/materias-primas/', data),
  update: (id, data) => api.put(`/materias-primas/${id}/`, data),
  delete: (id) => api.delete(`/materias-primas/${id}/`),
  getAlertas: () => api.get('/materias-primas/alertas/'),
};

export const pedidosAPI = {
  getAll: () => api.get('/pedidos/'),
  getById: (id) => api.get(`/pedidos/${id}/`),
  create: (data) => api.post('/pedidos/', data),
  update: (id, data) => api.put(`/pedidos/${id}/`, data),
  delete: (id) => api.delete(`/pedidos/${id}/`),
  porEstado: (estado) => api.get(`/pedidos/por_estado/?estado=${estado}`),
};

export default api;