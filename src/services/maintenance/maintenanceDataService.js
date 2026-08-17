import axios from 'axios'
import authHeader from '@/services/auth-header'

// Acciones de mantenimiento del admin (modulo `administration` del backend).
class MaintenanceDataService {
  // Cierra la sesion de todos los usuarios de la empresa (menos el propio admin).
  forceLogoutAll() {
    return axios.post('administration/force-logout-all', {}, { headers: authHeader() })
  }

  // Borra todas las notificaciones de la empresa.
  clearNotifications() {
    return axios.post('administration/clear-notifications', {}, { headers: authHeader() })
  }

  // Pide a todos los clientes recargar TODA la pagina (no las tablas).
  reloadAllTabs() {
    return axios.post('administration/reload-all-tabs', {}, { headers: authHeader() })
  }

  // Fuerza el escaneo de expedientes por vencer/vencidos (idempotente).
  scanExpiries() {
    return axios.post('administration/scan-expiries', {}, { headers: authHeader() })
  }

  // Crea una notificacion de prueba para mi (testing del panel + toast real).
  testNotification(category) {
    return axios.post('administration/test-notification', { category }, { headers: authHeader() })
  }
}

export default new MaintenanceDataService()
