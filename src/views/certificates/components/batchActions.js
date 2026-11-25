import { tieneExcelBase } from '@/utils/certificates/excelBase'
import { esEntregable, estaEntregado } from '@/utils/certificates/entrega'
import { ANULADO, estaPublicado } from '@/utils/certificates/estado'
import { SE_RENUMERA, nombreDelTipo } from '@/utils/certificates/tipos'
import { opcionDe, opcionPorClave, opcionesConCertificado } from '@/composables/useOrderServices'
import { AVISO, BLOQUEA, HECHO, NEUTRO } from '@/utils/batchLevels'
import { fechaCorta } from '@/utils/dates'

export const esAviso = (estado) => estado.nivel === AVISO

// En la accion Excel se puede adjuntar el Excel a convertir o el PDF ya hecho.
const ADJUNTADO = {
  manual:          { icono: 'mdi-file-excel',   titulo: 'Excel adjuntado: se convierte' },
  manual_pdf_base: { icono: 'mdi-file-pdf-box', titulo: 'PDF adjuntado: queda listo para firmar' },
}

export const estaAdjuntado = (item) => item.validation_status in ADJUNTADO

const SIN_PDF = { icono: 'mdi-close-circle', nivel: BLOQUEA, titulo: 'No tiene PDF para firmar' }

// Las mismas reglas que por_que_no_se_corrige en el back. `clave`: la opcion de servicio elegida.
const impideCorregir = (cert, clave) => {
  const tipo = opcionPorClave(clave)?.certificate_type
  if (cert.status === ANULADO) return { nivel: BLOQUEA, titulo: 'Está anulado' }
  if (!tipo) return { nivel: NEUTRO, titulo: 'Elige el servicio correcto' }
  if (cert.certificate_type === tipo) return { nivel: NEUTRO, titulo: `Ya es ${nombreDelTipo(tipo)}` }
  if (estaPublicado(cert)) return { nivel: BLOQUEA, titulo: 'Está en la nube: elimínalo de la nube primero' }
  return null
}

// Cada accion de BatchActionDialog. `contexto` trae lo elegido arriba: `opcion` (el servicio) y `sinPlantilla`.
export const ACCIONES = {
  excel: {
    titulo: 'Subir Excel',
    icono: 'mdi-microsoft-excel',
    color: 'green-darken-2',
    descripcion: 'Cada Excel se convierte a PDF para revisarlo antes de guardarlo. Los acreditados con hoja de '
      + 'datos salen con la carátula que arma la plataforma.',
    verbo: 'Convertir',
    escaneaElServidor: true,
    ayudaGrafica: true,

    preparar: (cert) => ({ disabled: false, already_has_it: tieneExcelBase(cert) }),

    ahora: (item) => item.already_has_it ? 'Con PDF' : 'Sin PDF',

    validacion: (item, { sinPlantilla }) => {
      if (item.validation_status === 'manual_pdf_base' && sinPlantilla) {
        return { icono: 'mdi-file-pdf-box', nivel: NEUTRO, titulo: 'PDF ya hecho: sin plantilla no se usa' }
      }
      if (estaAdjuntado(item)) {
        const { icono, titulo } = ADJUNTADO[item.validation_status]
        return { icono, nivel: HECHO, titulo: sinPlantilla ? 'Excel adjuntado: se descarga sin plantilla' : titulo }
      }
      if (item.validation_status === 'conflict') {
        return { icono: 'mdi-close-circle', nivel: BLOQUEA, titulo: 'Hay más de un Excel con ese número' }
      }
      if (item.validation_status !== 'found') {
        return { icono: 'mdi-close-circle', nivel: BLOQUEA, titulo: 'No está en el servidor' }
      }
      if (sinPlantilla) return { icono: 'mdi-download', nivel: HECHO, titulo: 'Encontrado: se descarga sin plantilla' }
      return item.already_has_it
        ? { icono: 'mdi-sync', nivel: AVISO, titulo: 'Encontrado: reemplaza el PDF' }
        : { icono: 'mdi-check-circle', nivel: HECHO, titulo: 'Encontrado: se convierte' }
    },
  },

  qr: {
    titulo: 'Firmar y publicar',
    icono: 'mdi-qrcode-scan',
    color: 'primary',
    descripcion: 'Cada PDF se firma con el certificado digital, lleva su QR y se publica en la nube.',
    verbo: 'Firmar',
    // Solo el día del sello. La hora y la firma criptográfica van con el reloj.
    fecha: { label: 'Fecha del sello de firma', permiteFutura: false },
    ayuda: [
      'Solo se firman los que ya tienen PDF: primero se sube el Excel o el PDF hecho.',
      'La fecha cambia solo el día que se ve en el sello; la firma digital lleva el momento real.',
      'Si uno ya está en la nube, se vuelve a firmar y reemplaza al publicado.',
      'Si lo firmaste por fuera, adjunta el PDF firmado en su fila: se publica tal cual.',
      'El avance de cada firma se ve en el panel de subidas; si una falla, las demás siguen.',
    ],

    preparar: (cert) => ({
      disabled: !tieneExcelBase(cert),
      already_has_it: tieneExcelBase(cert) && Boolean(cert.uploaded),
    }),

    ahora: (item) => {
      if (item.disabled) return 'Sin PDF'
      if (item.already_has_it) return 'En la nube'
      // Quien firma necesita saber a cuales los esta esperando gerencia.
      return item.signature_requested ? 'Firma solicitada' : 'Con PDF'
    },

    validacion: (item) => {
      if (item.validation_status === 'manual_pdf') {
        return { icono: 'mdi-file-pdf-box', nivel: HECHO, titulo: 'PDF firmado adjuntado: se publica' }
      }
      if (item.disabled) return SIN_PDF
      return item.already_has_it
        ? { icono: 'mdi-sync', nivel: AVISO, titulo: 'En la nube: se vuelve a firmar' }
        : { icono: 'mdi-check-circle', nivel: HECHO, titulo: 'Se firma y se publica' }
    },
  },

  notify: {
    titulo: 'Solicitar firma',
    icono: 'mdi-bell-ring',
    color: 'orange-darken-2',
    descripcion: 'Se avisa a quien firma que estos certificados ya tienen su PDF y esperan la firma.',
    verbo: 'Solicitar',
    ayuda: [
      'Solo avisa: no firma nada.',
      'Le llega una notificación a quien tiene permiso de firmar, y la fila queda marcada como “Firma solicitada”.',
      'Solo los que ya tienen PDF. Uno con una solicitud activa no se vuelve a pedir.',
    ],

    preparar: (cert) => ({
      // Ya notificado se bloquea: pedir la misma firma dos veces es spam.
      disabled: !tieneExcelBase(cert) || Boolean(cert.signature_requested),
      already_has_it: tieneExcelBase(cert) && !cert.signature_requested && Boolean(cert.uploaded),
    }),

    ahora: (item) => {
      if (item.signature_requested) return 'Firma solicitada'
      if (item.disabled) return 'Sin PDF'
      return item.already_has_it ? 'En la nube' : 'Con PDF'
    },

    validacion: (item) => {
      if (!item.disabled) return { icono: 'mdi-bell-check', nivel: HECHO, titulo: 'Se avisa a quien firma' }
      if (item.signature_requested) {
        return { icono: 'mdi-minus-circle', nivel: NEUTRO, titulo: 'Ya tiene una solicitud' }
      }
      return SIN_PDF
    },
  },

  entrega: {
    titulo: 'Registrar entrega',
    icono: 'mdi-package-variant-closed-check',
    color: 'teal-darken-2',
    descripcion: 'Se anota la fecha en que el cliente recibió cada certificado.',
    verbo: 'Registrar',
    fecha: { label: 'Fecha de entrega', permiteFutura: false },
    ayuda: [
      'Solo los ya firmados y publicados.',
      'Si ya estaba entregado, la fecha nueva reemplaza a la anterior: así se corrige una fecha mal puesta.',
      'La entrega se ve en la lista de certificados y en la orden.',
    ],

    // Los ya entregados vienen desmarcados: marcarlos otra vez pisa la fecha,
    // que es como se corrige una mal puesta.
    preparar: (cert) => ({
      disabled: !esEntregable(cert),
      already_has_it: estaEntregado(cert),
    }),

    ahora: (item) => {
      if (estaEntregado(item)) return `Entregado ${fechaCorta(item.sent_date)}`
      if (item.disabled) return 'Sin firmar'
      return 'Sin entregar'
    },

    validacion: (item) => {
      if (item.disabled) return { icono: 'mdi-close-circle', nivel: BLOQUEA, titulo: 'Todavía no está firmado' }
      return item.already_has_it
        ? { icono: 'mdi-sync', nivel: AVISO, titulo: 'Ya entregado: cambia la fecha' }
        : { icono: 'mdi-check-circle', nivel: HECHO, titulo: 'Se marca entregado' }
    },
  },

  tipo: {
    titulo: 'Corregir tipo',
    icono: 'mdi-swap-horizontal',
    color: 'indigo',
    descripcion: `Cada uno ${SE_RENUMERA}.`,
    verbo: 'Corregir',
    // Las mismas opciones que en la orden: en una orden, su linea queda con ese servicio.
    opcion: {
      label: 'Servicio correcto',
      get items () { return opcionesConCertificado().map(o => ({ value: opcionDe(o), title: o.title })) },
    },
    ayuda: [
      'Cada uno toma el siguiente número del tipo correcto; el que tenía queda registrado como número anterior.',
      'Si ya tenía PDF, se descarta: hay que rehacerlo con el número nuevo.',
      'Si ya se entregó, el cliente lo tiene con el número anterior.',
      'Uno que está en la nube no se corrige: primero se elimina de la nube.',
    ],

    impide: (cert, { opcion }) => Boolean(impideCorregir(cert, opcion)),

    ahora: (item) => {
      if (item.status === ANULADO) return 'Anulado'
      if (estaEntregado(item)) return `Entregado ${fechaCorta(item.sent_date)}`
      if (estaPublicado(item)) return 'En la nube'
      return tieneExcelBase(item) ? 'Con PDF' : 'Sin PDF'
    },

    validacion: (item, { opcion }) => {
      const impedimento = impideCorregir(item, opcion)
      if (impedimento) return { ...impedimento, icono: 'mdi-minus-circle' }
      if (estaEntregado(item)) {
        return { icono: 'mdi-alert', nivel: AVISO, titulo: 'Ya se entregó: el cliente lo tiene con el número anterior' }
      }
      if (tieneExcelBase(item)) {
        return { icono: 'mdi-file-remove', nivel: AVISO, titulo: 'Se descarta su PDF: hay que rehacerlo' }
      }
      return { icono: 'mdi-check-circle', nivel: HECHO, titulo: `Pasa a ${opcionPorClave(opcion).title}` }
    },
  },
}
