import { defineStore } from 'pinia';
import AuthService from '@/services/auth.service';
import Swal from 'sweetalert2';

export const useAuthStore = defineStore('auth', {
  state: () => {
    const user = JSON.parse(localStorage.getItem('user'));
    return {
      status: { loggedIn: !!user },
      user: user || null,
    };
  },

  actions: {
    async login(userData) {
      try {
        const responseUser = await AuthService.login(userData);
        this.status.loggedIn = true;
        this.user = responseUser;
        return Promise.resolve(responseUser);
      } catch (error) {
        this.status.loggedIn = false;
        this.user = null;

        const data = error.response?.data;
        const errorMessage =
          data?.detail
          || (data?.non_field_errors ? data.non_field_errors.toString() : null)
          || (error.response ? 'No se pudo iniciar sesión. Intenta de nuevo.' : 'Sin conexión con el servidor.');

        Swal.fire({
          icon: 'warning',
          title: 'No se pudo iniciar sesión',
          text: errorMessage,
          showConfirmButton: true,
          confirmButtonColor: '#1976d2',
          backdrop: true,
        });
        
        return Promise.reject(error);
      }
    },

    async logout() {
      try {
        await AuthService.logout();
      } finally {
        this.status.loggedIn = false;
        this.user = null;
      }
    },
  },
});