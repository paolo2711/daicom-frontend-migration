import axios from 'axios'
import { useAuthStore } from '@/stores/authStore'

// Un 401 es un token que el server ya no reconoce: cerraron las sesiones,
// restablecieron la clave o es de otro back. El login y el logout manejan su
// propia respuesta.
const CON_RESPUESTA_PROPIA = ['auth/login', 'auth/logout']

export default function registerSession() {
  axios.interceptors.response.use(null, (error) => {
    const url = error.config?.url || ''
    if (error.response?.status === 401 && !CON_RESPUESTA_PROPIA.some(ruta => url.includes(ruta))) {
      useAuthStore().cerrarSesionLocal('sesion')
    }
    return Promise.reject(error)
  })
}
