import axios from 'axios'
import authHeader from '@/services/auth-header'

// Acciones de mantenimiento del admin (modulo `administration` del backend).
class MaintenanceDataService {
  // Cierra la sesion de todos los usuarios de la empresa (menos el propio admin).
  forceLogoutAll() {
    return axios.post('administration/force-logout-all', {}, { headers: authHeader() })
  }

  // Sin grupo borra todas las de la empresa; con grupo ('Patrones', 'Expedientes')
  // solo las de ese grupo del catalogo de notificaciones.
  clearNotifications(grupo = null) {
    return axios.post('administration/clear-notifications', grupo ? { grupo } : {}, { headers: authHeader() })
  }

  // Pide a todos los clientes recargar TODA la pagina (no las tablas).
  reloadAllTabs() {
    return axios.post('administration/reload-all-tabs', {}, { headers: authHeader() })
  }

  // Cuando corrio el escaneo de vencimientos por ultima vez.
  scanStatus() {
    return axios.get('administration/scan-status', { headers: authHeader() })
  }

  // Fuerza el escaneo de vencimientos (patrones + inventario).
  scan() {
    return axios.post('administration/scan', {}, { headers: authHeader() })
  }

  // Crea una notificacion de prueba para mi (testing del panel + toast real).
  testNotification(category) {
    return axios.post('administration/test-notification', { category }, { headers: authHeader() })
  }
}

export default new MaintenanceDataService()
