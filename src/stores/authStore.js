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
        
        const errorMessage = error.response?.data?.non_field_errors 
          ? error.response.data.non_field_errors.toString() 
          : 'Error de autenticación';

        Swal.fire({
          icon: 'warning',
          title: errorMessage,
          showConfirmButton: true,
          confirmButtonColor: 'red',
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