import { defineStore } from 'pinia';
import AuthService from '@/services/auth.service';
import Swal from 'sweetalert2';

// Varios pedidos pueden volver con 401 a la vez: la sesion se cierra una sola vez.
let sesionCerrandose = false;

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

    // El server puede no aceptar el aviso (token ya invalido, sin red): la
    // sesion de este navegador se cierra igual.
    async logout() {
      try {
        await AuthService.logout();
      } catch {
        /* se cierra aca de todas formas */
      }
      this.cerrarSesionLocal();
    },

    // Unico lugar que cierra la sesion en el navegador. Recarga la pagina entera
    // para que se corten el WebSocket y lo que quedo en memoria de la sesion.
    cerrarSesionLocal(motivo = '') {
      if (sesionCerrandose) return;
      sesionCerrandose = true;
      try {
        localStorage.removeItem('user');
        localStorage.removeItem('permissions');
      } catch {
        /* sin almacenamiento no hay nada que borrar */
      }
      AuthService.deleteAllCookies();
      window.location.href = motivo ? `/login?motivo=${motivo}` : '/login';
    },
  },
});