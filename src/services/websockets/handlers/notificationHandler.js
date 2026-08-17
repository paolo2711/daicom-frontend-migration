// Notificaciones (persistentes + su toast de EVENTO) y ANUNCIOS manuales.
import { useNotificationStore } from '@/stores/notificationStore'
import { showEventToast } from '@/services/notifications/eventToasts'
import { refreshPendingSignatures } from '@/services/certificates/pendingSignatures'

// Categorias cuyo evento cambia la pildora de "pendientes de firma".
const AFECTAN_PENDIENTES = new Set(['firma_solicitada', 'qr_subido'])

export function handleNotification(data, appStore, currentUser) {
  const m = data.message
  if (!m || !m.action) return false

  const miEmpresa = () => m.company == null || m.company == currentUser.company

  // Liviano: solo el numero de la campana (al marcar leido).
  if (m.action === 'UPDATE_NOTIF_COUNT') {
    if (miEmpresa()) { try { useNotificationStore().fetchUnread() } catch (e) { /* noop */ } }
    return true
  }

  // Pesado: numero + lista (la lista solo si el panel esta abierto).
  if (m.action === 'RELOAD_NOTIFICATIONS') {
    if (miEmpresa()) { try { useNotificationStore().resync() } catch (e) { /* noop */ } }
    return true
  }

  // Notificacion nueva: badge + campanazo + toast de EVENTO (clic -> panel).
  // Si la categoria afecta a firmas, refresca esa pildora (dirigido, sin toast aparte).
  if (m.action === 'NEW_NOTIFICATION') {
    try { useNotificationStore().onNew() } catch (e) { /* noop */ }
    if (AFECTAN_PENDIENTES.has(m.category)) refreshPendingSignatures(appStore)
    showEventToast(m)
    return true
  }

  // Toast de EVENTO dirigido pero SIN notificacion (efimero, no llena el panel).
  // Ej. "orden creada": el metrologo se entera, pero no queda registro.
  if (m.action === 'EVENT_TOAST') {
    showEventToast(m)
    return true
  }

  return false
}
