import { tieneExcelBase } from '@/utils/certificates/excelBase'
import { esEntregable, estaEntregado } from '@/utils/certificates/entrega'
import { ANULADO, estaFirmado } from '@/utils/certificates/estado'
import { TIPOS_CERTIFICADO, nombreDelTipo } from '@/utils/certificates/tipos'
import { usePermissions } from '@/composables/usePermissions'
import { fechaCorta } from '@/utils/dates'

// Cada accion del modal de lote se describe entera en su entrada de ACCIONES.
// La fila devuelve un nivel y no un color, para que la regla de los colores
// este en un solo lugar.
const HECHO = 'hecho'      // ya esta hecho, o listo para esta accion
const BLOQUEA = 'bloquea'  // no se puede
const NEUTRO = 'neutro'    // ni una cosa ni la otra
const ESPERA = 'espera'    // depende de otra persona
const AVISO = 'aviso'      // se puede, pero se pierde algo

export const esAviso = (estado) => estado.nivel === AVISO

const COLOR_POR_NIVEL = {
  [BLOQUEA]: 'error', [NEUTRO]: 'grey', [ESPERA]: 'orange-darken-2', [AVISO]: 'warning',
}

export const colorDe = (nivel, colorDeLaAccion) => COLOR_POR_NIVEL[nivel] || colorDeLaAccion

// En la accion Excel se puede adjuntar el Excel a convertir o el PDF ya hecho.
const ADJUNTADO = {
  manual:          { icono: 'mdi-file-excel',   titulo: 'Excel adjuntado, se convertirá al continuar' },
  manual_pdf_base: { icono: 'mdi-file-pdf-box', titulo: 'PDF adjuntado, se guardará al continuar' },
}

export const estaAdjuntado = (item) => item.validation_status in ADJUNTADO

// Las mismas reglas que por_que_no_se_corrige en el back.
const PERMISO_FIRMA = 1001

const impideCorregir = (cert, tipo) => {
  if (cert.status === ANULADO) return { nivel: BLOQUEA, titulo: 'Está anulado' }
  if (!tipo) return { nivel: NEUTRO, titulo: 'Elige el tipo correcto' }
  if (cert.certificate_type === tipo) return { nivel: NEUTRO, titulo: `Ya es ${nombreDelTipo(tipo)}` }
  if (estaFirmado(cert) && !usePermissions().hasAction(PERMISO_FIRMA)) {
    return { nivel: BLOQUEA, titulo: 'Está firmado: corregirlo necesita el permiso de firma' }
  }
  return null
}

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
      if (item.already_has_it) return { texto: 'En Nube', nivel: HECHO }
      // Quien firma necesita saber a cuales los esta esperando gerencia.
      return item.signature_requested
        ? { texto: 'Solicitado', nivel: ESPERA }
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
      if (item.signature_requested) return { texto: 'Notificado', nivel: ESPERA }
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

  tipo: {
    titulo: 'Corregir Tipo de Certificado',
    icono: 'mdi-swap-horizontal',
    color: 'indigo',
    subtitulo: 'Cada uno toma el siguiente número del tipo elegido; el que tenía queda como número anterior:',
    iconoAccion: 'mdi-swap-horizontal',
    opcion: { label: 'Tipo correcto', items: TIPOS_CERTIFICADO },

    preparar: (cert, tipo) => ({ disabled: Boolean(impideCorregir(cert, tipo)) }),

    estadoPrevio: (item) => ({ texto: nombreDelTipo(item.certificate_type), nivel: NEUTRO }),

    validacion: (item, tipo) => {
      const impedimento = impideCorregir(item, tipo)
      if (impedimento) return { ...impedimento, icono: 'mdi-minus-circle' }
      if (estaEntregado(item)) {
        return { icono: 'mdi-alert', nivel: AVISO, titulo: 'Ya se entregó: el QR que tiene el cliente deja de funcionar' }
      }
      if (item.uploaded) return { icono: 'mdi-cloud-off-outline', nivel: AVISO, titulo: 'Se baja de la nube' }
      if (tieneExcelBase(item)) {
        return { icono: 'mdi-file-remove', nivel: AVISO, titulo: 'Se descarta el Excel: hay que rehacerlo con el número nuevo' }
      }
      return { icono: 'mdi-check-circle', nivel: HECHO, titulo: `Pasa a ${nombreDelTipo(tipo)}` }
    },
  },
}
