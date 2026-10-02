// Recargas de tabla y actualizaciones de fila quirurgicas (RELOAD_* / UPDATE_ROW).
import { AVISOS_QUE_LA_CAMBIAN, refreshPendingSignatures } from '@/services/certificates/pendingSignatures'
import { alVolverAVer, pestanaOculta } from '@/utils/tabVisibility'

const emit = (name, detail) =>
  window.dispatchEvent(detail !== undefined ? new CustomEvent(name, { detail }) : new CustomEvent(name))

// Mensaje-string simple -> evento de recarga de tabla que escucha cada lista.
const RELOADS = {
  RELOAD_TABLES: 'wss-reload-tables',            // salvavidas heredado
  RELOAD_CERTIFICATES: 'wss-reload-certificates',
  RELOAD_ORDERS_service: 'wss-reload-orders-service',
  RELOAD_ORDERS_rental: 'wss-reload-orders-rental',
  RELOAD_DOCUMENTS: 'wss-reload-documents',
  RELOAD_INVOICES: 'wss-reload-invoices',
  RELOAD_INVENTORY: 'wss-reload-inventory',
}

// `enLote` es el evento con la lista completa de ids, para las listas que ya
// saben decidir entre parchear y releer su pagina. Las que todavia no lo
// implementan reciben un aviso por fila, como siempre. `recargas` son las de
// esa tabla, para cuando la pestaña esta oculta.
const FILAS = {
  cert_id: {
    evento: 'wss-update-row',
    enLote: 'wss-update-rows',
    recargas: ['RELOAD_CERTIFICATES'],
  },
  order_id: {
    evento: 'wss-update-order-row',
    enLote: null,
    recargas: ['RELOAD_ORDERS_service', 'RELOAD_ORDERS_rental'],
  },
  // Solo cambio la barra de la orden: uno de sus certificados cambio de estado.
  order_progress_id: {
    evento: 'wss-update-order-progress',
    enLote: null,
    recargas: ['RELOAD_ORDERS_service', 'RELOAD_ORDERS_rental'],
  },
  invoice_id: {
    evento: 'wss-update-invoice-row',
    enLote: null,
    recargas: ['RELOAD_INVOICES'],
  },
  doc_id: {
    evento: 'wss-update-document-row',
    enLote: null,
    recargas: ['RELOAD_DOCUMENTS'],
  },
}

const campoDe = (m) => Object.keys(FILAS).find((c) => m[c])

// Las pildoras de cobro de Ordenes las refresca cada pestaña con los avisos de
// sus ordenes; la campana, el notificationHandler.
function contadores(appStore, aviso) {
  if (AVISOS_QUE_LA_CAMBIAN.has(aviso)) refreshPendingSignatures(appStore)
}

function recargar(appStore, comando) {
  contadores(appStore, comando)
  emit(RELOADS[comando])
}

// Con la pestaña oculta nada se parchea: se anota la recarga de esa tabla y al
// volver sale una sola, hayan cambiado 3 filas o 95.
function aplazar(appStore, recargas) {
  recargas.forEach((comando) => alVolverAVer(comando, () => recargar(appStore, comando)))
}

export function handleReload(data, appStore) {
  // Recargas por string.
  if (typeof data.message === 'string' && RELOADS[data.message]) {
    const comando = data.message
    if (pestanaOculta()) alVolverAVer(comando, () => recargar(appStore, comando))
    else recargar(appStore, comando)
    return true
  }

  const m = data.message
  if (!m || !m.action) return false

  // Una sola fila.
  if (m.action === 'UPDATE_ROW') {
    const campo = campoDe(m)
    if (!campo) return false
    if (pestanaOculta()) aplazar(appStore, FILAS[campo].recargas)
    else {
      contadores(appStore, campo)
      emit(FILAS[campo].evento, m[campo])
    }
    return true
  }

  // Una tanda de filas: la bolsa del back las junto.
  if (m.action === 'UPDATE_ROWS') {
    const campo = campoDe(m)
    if (!campo) return false

    const { evento, enLote, recargas } = FILAS[campo]
    if (pestanaOculta()) {
      aplazar(appStore, recargas)
    } else {
      contadores(appStore, campo)
      if (enLote) emit(enLote, m[campo])
      else m[campo].forEach((id) => emit(evento, id))
    }
    return true
  }

  return false
}
