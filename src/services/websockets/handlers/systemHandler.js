import { queueToastForNextLoad } from '@/services/notifications/eventToasts'
import { useStatusStore } from '@/stores/statusStore'

// Sistema / sesion: version de la app y acciones forzadas por el admin.
// Cada handler devuelve true si CONSUMIO el mensaje (asi el router pasa al siguiente).

// Version al cargar la pestana; si el back reporta otra al reconectar, hubo deploy.
let bootVersion = null

const paraMi = (m, currentUser) => {
  const sameCompany = m.company == null || m.company == currentUser.company
  const excepted = m.except_user && m.except_user === currentUser.username
  return sameCompany && !excepted
}

export function handleSystem(data, appStore, currentUser) {
  const m = data.message
  if (!m || !m.action) return false

  if (m.action === 'APP_VERSION') {
    if (m.version) {
      if (bootVersion === null) {
        bootVersion = m.version
        if (appStore) appStore.serverVersion = m.version
      } else if (m.version !== bootVersion) {
        // Cambio = hubo deploy. Banner persistente (no bloquea): el usuario
        // termina lo que esta haciendo y recarga cuando quiera.
        if (appStore) appStore.updateAvailable = true
        try { useStatusStore().raise('update_available') } catch (e) { /* noop */ }
      }
    }
    return true
  }

  // Cierre de sesion forzado (el token ya se invalido en el server).
  if (m.action === 'FORCE_LOGOUT') {
    if (paraMi(m, currentUser)) {
      try {
        localStorage.removeItem('user')
        localStorage.removeItem('permissions')
      } catch (e) { /* noop */ }
      window.location.href = '/login'
    }
    return true
  }

  // Recarga forzada de TODA la pagina (no las tablas). El aviso se ENCOLA para
  // mostrarse DESPUES de recargar (si no, el usuario no alcanzaria a verlo).
  if (m.action === 'FORCE_RELOAD') {
    if (paraMi(m, currentUser)) {
      queueToastForNextLoad('app_recargada')
      window.location.reload()
    }
    return true
  }

  return false
}
