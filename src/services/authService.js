const API_BASE_URL = 'http://localhost:8081/api';

class AuthService {
  constructor() {
    this.isRefreshing = false;
    this.failedQueue = [];
  }

  // Procesar la cola de peticiones fallidas
  processQueue(error, token = null) {
    this.failedQueue.forEach(prom => {
      if (error) {
        prom.reject(error);
      } else {
        prom.resolve(token);
      }
    });
    
    this.failedQueue = [];
  }

  // Obtener headers de autenticación
  getAuthHeaders() {
    const token = localStorage.getItem('jwt');
    return {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    };
  }

  // Login
  async login(email, password, recaptchaToken) {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          correo: email,
          password: password,
          'recaptcha-token': recaptchaToken
        })
      });

      if (!response.ok) {
        throw new Error('Credenciales incorrectas');
      }

      const data = await response.json();
      
      // Guardar tokens
      localStorage.setItem('jwt', data.token);
      localStorage.setItem('refreshToken', data.refreshToken);
      // Guardar usuario completo (incluyendo avatar)
      if (data.user) {
        localStorage.setItem('user', JSON.stringify(data.user));
      }
      return data;
    } catch (error) {
      console.error('Error en login:', error);
      throw error;
    }
  }

  // Obtener usuario actual
  async getCurrentUser() {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/me`, {
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('No se pudo obtener información del usuario');
      }

      const userData = await response.json();
      localStorage.setItem('user', JSON.stringify(userData));
      return userData;
    } catch (error) {
      console.error('Error obteniendo usuario:', error);
      throw error;
    }
  }

  // Refrescar token
  async refreshToken() {
    if (this.isRefreshing) {
      return new Promise((resolve, reject) => {
        this.failedQueue.push({ resolve, reject });
      });
    }

    this.isRefreshing = true;

    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        throw new Error('No hay refresh token disponible');
      }

      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          refreshToken: refreshToken
        })
      });

      if (!response.ok) {
        throw new Error('Refresh token inválido o expirado');
      }

      const data = await response.json();
      
      // Actualizar tokens
      localStorage.setItem('jwt', data.token);
      localStorage.setItem('refreshToken', data.refreshToken);
      
      this.processQueue(null, data.token);
      return data.token;
    } catch (error) {
      this.processQueue(error, null);
      throw error;
    } finally {
      this.isRefreshing = false;
    }
  }

  // Logout
  async logout() {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        await fetch(`${API_BASE_URL}/auth/logout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            refreshToken: refreshToken
          })
        });
      }
    } catch (error) {
      console.error('Error en logout:', error);
    } finally {
      // Limpiar localStorage
      localStorage.removeItem('jwt');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
    }
  }

  // Verificar si está autenticado
  isAuthenticated() {
    const token = localStorage.getItem('jwt');
    if (!token) {
      return false;
    }
    try {
      const tokenData = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      if (tokenData.exp < currentTime) {
        this.logout();
        return false;
      }
      return true;
    } catch (error) {
      this.logout();
      return false;
    }
  }

  // Hacer petición con manejo automático de token expirado
  async authenticatedRequest(url, options = {}) {
    try {
      // Primera petición
      const response = await fetch(url, {
        ...options,
        headers: {
          ...this.getAuthHeaders(),
          ...options.headers
        }
      });

      // Si la petición es exitosa, retornar la respuesta
      if (response.ok) {
        return response;
      }

      // Si es 401 (no autorizado), intentar refrescar el token
      if (response.status === 401) {
        try {
          await this.refreshToken();
          
          // Reintentar la petición con el nuevo token
          const retryResponse = await fetch(url, {
            ...options,
            headers: {
              ...this.getAuthHeaders(),
              ...options.headers
            }
          });

          if (retryResponse.ok) {
            return retryResponse;
          } else {
            // Si sigue fallando, hacer logout
            await this.logout();
            throw new Error('Sesión expirada');
          }
        } catch (refreshError) {
          await this.logout();
          throw new Error('Sesión expirada');
        }
      }

      return response;
    } catch (error) {
      console.error('Error en petición autenticada:', error);
      throw error;
    }
  }
}

export default new AuthService(); 