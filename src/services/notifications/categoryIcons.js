// Identidad visual por categoria de notificacion. Fuente unica compartida por el
// toast de evento y el panel, para que se vean como la MISMA familia.
//
// Regla (patron Slack/Linear): el COLOR DE CATEGORIA da identidad a lo informativo
// (escaneable de un vistazo), pero el NIVEL manda siempre en warning/critical, para
// que lo urgente rompa el patron y salte a la vista.
export const CATEGORY_ICONS = {
  firma_solicitada: 'mdi-draw',
  cert_subido:      'mdi-file-document-edit-outline',
  qr_subido:        'mdi-cloud-check',
  orden_creada:     'mdi-clipboard-plus-outline',
  cert_anulado:     'mdi-file-cancel-outline',
  orden_anulada:    'mdi-clipboard-remove-outline',
  app_recargada:    'mdi-refresh-circle',
}

// Clave de color por categoria (los valores viven en variables.scss).
const CATEGORY_TONE = {
  cert_subido:      'indigo',   // elaborar excel
  qr_subido:        'teal',     // firmado y en la nube
  firma_solicitada: 'purple',   // te toca firmar
  orden_creada:     'blue',     // nueva orden
  app_recargada:    'teal',     // la app se actualizó
}

export const iconForCategory = (c) => CATEGORY_ICONS[c] || 'mdi-bell'

/** Clase de color: el nivel manda en warning/critical; si no, el tono de la categoria. */
export function toneForCategory(category, level) {
  if (level === 'critical') return 'crit'
  if (level === 'warning') return 'warn'
  return CATEGORY_TONE[category] || 'blue'
}
