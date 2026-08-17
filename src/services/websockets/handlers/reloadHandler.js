// Recargas de tabla y actualizaciones de fila quirurgicas (RELOAD_* / UPDATE_ROW).
import { refreshPendingSignatures } from '@/services/certificates/pendingSignatures'

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

export function handleReload(data, appStore) {
  // Recargas por string.
  if (typeof data.message === 'string' && RELOADS[data.message]) {
    if (data.message === 'RELOAD_CERTIFICATES') refreshPendingSignatures(appStore)
    emit(RELOADS[data.message])
    return true
  }

  // Actualizacion de fila quirurgica (UPDATE_ROW), por entidad.
  const m = data.message
  if (m && m.action === 'UPDATE_ROW') {
    refreshPendingSignatures(appStore)
    if (m.cert_id) emit('wss-update-row', m.cert_id)
    else if (m.order_id) emit('wss-update-order-row', m.order_id)
    else if (m.invoice_id) emit('wss-update-invoice-row', m.invoice_id)
    else if (m.doc_id) emit('wss-update-document-row', m.doc_id)
    return true
  }

  return false
}
