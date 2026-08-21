// Toasts de evento: la cara efimera de una notificacion. Solo dicen el tipo, el
// detalle esta en el panel. Los de feedback ("guardado") no pasan por aqui, esos
// siguen con swal en cada componente.
// El render lo hace <EventToastStack> para que se puedan apilar varios.
import { useEventToastStore } from '@/stores/eventToastStore'

// Mismas categorias que el registry del back. single = una sola, many = varias
// juntas (lote). Agregar un toast nuevo es una linea aqui.
export const TOAST_CATALOG = {
  cert_subido:      { single: (r) => `Certificado ${r} elaborado`,   many: (n) => `${n} certificados elaborados` },
  qr_subido:        { single: (r) => `Certificado ${r} firmado`,     many: (n) => `${n} certificados firmados` },
  firma_solicitada: { single: () => 'Te solicitaron una firma',      many: (n) => `Te solicitaron ${n} firmas` },
  orden_creada:     { single: (r) => `Nueva orden ${r} · certs por elaborar`, many: (n) => `${n} órdenes nuevas` },
  app_recargada:    { single: () => 'La aplicación fue actualizada por el developer', many: () => 'La aplicación fue actualizada por el developer' },
  cert_anulado:     { single: (r) => `Certificado ${r} anulado`,      many: (n) => `${n} certificados anulados` },
  orden_anulada:    { single: (r) => `Orden ${r} anulada`,            many: (n) => `${n} órdenes anuladas` },
}

// Punto UNICO de entrada: todo aviso de evento pasa por aqui.
// (appStore queda como parametro opcional por compatibilidad con los llamadores.)
export function showEventToast(message) {
  try {
    useEventToastStore().push({
      category: message.category,
      level: message.level,
      ref: message.ref,
    })
  } catch (e) { /* store aún no listo */ }
}

//  Toast diferido a traves de una recarga
// Si el aviso se muestra ANTES de recargar, el usuario no alcanza a verlo. Lo
// dejamos anotado en sessionStorage y se dispara al volver a montar la app.
const PENDING_KEY = 'daicom_pending_toast'

export function queueToastForNextLoad(category) {
  try { sessionStorage.setItem(PENDING_KEY, category) } catch (e) { /* noop */ }
}

export function flushQueuedToast() {
  try {
    const category = sessionStorage.getItem(PENDING_KEY)
    if (!category) return
    sessionStorage.removeItem(PENDING_KEY)
    showEventToast({ category, level: 'info' })
  } catch (e) { /* noop */ }
}
