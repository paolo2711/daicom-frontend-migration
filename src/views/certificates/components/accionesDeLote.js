import { tieneExcelBase } from '@/utils/certificates/excelBase'
import { esEntregable, estaEntregado } from '@/utils/certificates/entrega'
import { fechaCorta } from '@/utils/fechas'

// Cada accion del modal de lote se describe entera en su entrada de ACCIONES.
// La fila devuelve un nivel y no un color, para que la regla de los tres
// colores este en un solo lugar.
const HECHO = 'hecho'      // ya esta hecho, o listo para esta accion
const BLOQUEA = 'bloquea'  // no se puede
const NEUTRO = 'neutro'    // ni una cosa ni la otra

const COLOR_POR_NIVEL = { [BLOQUEA]: 'error', [NEUTRO]: 'grey' }

export const colorDe = (nivel, colorDeLaAccion) => COLOR_POR_NIVEL[nivel] || colorDeLaAccion

// En la accion Excel se puede adjuntar el Excel a convertir o el PDF ya hecho.
const ADJUNTADO = {
  manual:          { icono: 'mdi-file-excel',   titulo: 'Excel adjuntado, se convertirá al continuar' },
  manual_pdf_base: { icono: 'mdi-file-pdf-box', titulo: 'PDF adjuntado, se guardará al continuar' },
}

export const estaAdjuntado = (item) => item.validation_status in ADJUNTADO

export const ACCIONES = {
  excel: {
    titulo: 'Auto-Carga de Excels Nativos',
    icono: 'mdi-folder-search',
    color: 'green-darken-2',
    subtitulo: 'Se generarán los PDFs para los siguientes certificados:',
    iconoAccion: 'mdi-server-network',
    escaneaElServidor: true,

    preparar: (cert) => ({ disabled: false, already_has_it: tieneExcelBase(cert) }),

    estadoPrevio: (item) => item.already_has_it
      ? { texto: 'Tiene Excel', nivel: HECHO }
      : { texto: 'Sin Excel', nivel: NEUTRO },

    validacion: (item) => {
      if (estaAdjuntado(item)) {
        const { icono, titulo } = ADJUNTADO[item.validation_status]
        return { icono, nivel: HECHO, titulo }
      }
      return item.validation_status === 'found'
        ? { icono: 'mdi-check-circle', nivel: HECHO, titulo: 'Encontrado en el servidor' }
        : { icono: 'mdi-close-circle', nivel: BLOQUEA, titulo: 'No está en el servidor' }
    },
  },

  qr: {
    titulo: 'Firma Múltiple y Código QR',
    icono: 'mdi-qrcode-scan',
    color: 'primary',
    subtitulo: 'Se firmarán en lote los siguientes certificados:',
    iconoAccion: 'mdi-pen',
    // Solo el día del sello. La hora y la firma criptográfica van con el reloj.
    fecha: { label: 'Fecha del sello de firma', permiteFutura: false },

    preparar: (cert) => ({
      disabled: !tieneExcelBase(cert),
      already_has_it: tieneExcelBase(cert) && Boolean(cert.uploaded),
    }),

    estadoPrevio: (item) => {
      if (item.disabled) return { texto: 'Sin Excel', nivel: BLOQUEA }
      return item.already_has_it
        ? { texto: 'En Nube', nivel: HECHO }
        : { texto: 'Con PDF', nivel: NEUTRO }
    },

    validacion: (item) => {
      if (item.validation_status === 'manual_pdf') {
        return { icono: 'mdi-file-pdf-box', nivel: HECHO, titulo: 'PDF firmado adjuntado' }
      }
      return item.disabled
        ? { icono: 'mdi-close-circle', nivel: BLOQUEA, titulo: 'No tiene certificado base' }
        : { icono: 'mdi-check-circle', nivel: HECHO, titulo: 'Listo para firmar' }
    },
  },

  notify: {
    titulo: 'Solicitar Firma a Gerencia',
    icono: 'mdi-bell-ring',
    color: 'orange-darken-2',
    subtitulo: 'Se registrará la solicitud de firma para los siguientes equipos:',
    iconoAccion: 'mdi-send-check',

    preparar: (cert) => ({
      // Ya notificado se bloquea: pedir la misma firma dos veces es spam.
      disabled: !tieneExcelBase(cert) || Boolean(cert.signature_requested),
      already_has_it: tieneExcelBase(cert) && !cert.signature_requested && Boolean(cert.uploaded),
    }),

    estadoPrevio: (item) => {
      if (item.signature_requested) return { texto: 'Notificado', nivel: HECHO }
      if (item.disabled) return { texto: 'Sin Excel', nivel: BLOQUEA }
      return { texto: item.already_has_it ? 'En Nube' : 'Con PDF', nivel: NEUTRO }
    },

    validacion: (item) => {
      if (!item.disabled) return { icono: 'mdi-bell-check', nivel: HECHO, titulo: 'Apto para notificar' }
      if (item.signature_requested) return { icono: 'mdi-minus-circle', nivel: NEUTRO, titulo: 'Ya tiene una solicitud activa' }
      return { icono: 'mdi-close-circle', nivel: BLOQUEA, titulo: 'No tiene certificado base' }
    },
  },

  entrega: {
    titulo: 'Registrar Entrega',
    icono: 'mdi-package-variant-closed-check',
    color: 'teal-darken-2',
    subtitulo: 'Se registrará la entrega al cliente de los siguientes certificados:',
    iconoAccion: 'mdi-check-all',
    fecha: { label: 'Fecha de entrega', permiteFutura: false },

    // Los ya entregados vienen desmarcados: marcarlos otra vez pisa la fecha,
    // que es como se corrige una mal puesta.
    preparar: (cert) => ({
      disabled: !esEntregable(cert),
      already_has_it: estaEntregado(cert),
    }),

    estadoPrevio: (item) => {
      if (estaEntregado(item)) return { texto: `Entregado ${fechaCorta(item.sent_date)}`, nivel: HECHO }
      if (item.disabled) return { texto: 'Sin firmar', nivel: BLOQUEA }
      return { texto: 'Sin entregar', nivel: NEUTRO }
    },

    validacion: (item) => {
      if (item.disabled) {
        return { icono: 'mdi-close-circle', nivel: BLOQUEA, titulo: 'Todavía no está firmado' }
      }
      return item.uploaded
        ? { icono: 'mdi-cloud-check', nivel: HECHO, titulo: 'En la nube' }
        : { icono: 'mdi-file-sign', nivel: NEUTRO, titulo: 'Firmado, pero no está en la nube' }
    },
  },
}
