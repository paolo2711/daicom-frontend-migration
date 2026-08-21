import axios from 'axios'
import authHeader from '@/services/auth-header'

class HomeDataService {
  // Bloques de pendientes que le tocan al usuario (los arma el backend segun permisos).
  pendientes() {
    return axios.get('home/pendientes', { headers: authHeader() })
  }

  // Como va el mes: facturado vs cobrado, tendencia y deuda separada.
  pulso() {
    return axios.get('home/pulso', { headers: authHeader() })
  }

  // Patrones e inventario vencidos o por vencer. Sale del resumen que deja el
  // escaneo de las 9:00, no se abre el Excel en cada visita.
  vencimientos() {
    return axios.get('home/vencimientos', { headers: authHeader() })
  }

  // El boton de recargar: vuelve a leer el Excel y el inventario. Devuelve lo
  // mismo que vencimientos().
  refrescarVencimientos() {
    return axios.post('home/vencimientos/refrescar', {}, { headers: authHeader() })
  }
}

export default new HomeDataService()
