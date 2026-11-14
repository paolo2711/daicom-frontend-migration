import { bajaPendienteEnSol } from '@/utils/billing/guias'
import { ACEPTADA, ENVIADA, POR_ENVIAR, REVISAR } from '@/utils/billing/sunat'
import { OTRA_PESTANA } from '@/utils/pdf'

// Lo que se puede hacer con una guia emitida, para el menu de la tabla. Los campos, en utils/actions.js.
// Las que SUNAT tiene o pudo tener se anulan dando la baja en SOL; la que no llego, solo en la app.
const SE_ANULAN = [ACEPTADA, POR_ENVIAR, REVISAR]

export const ACCIONES_GUIA = [
  {
    clave: 'info', grupo: 'ver', varios: false,
    icono: 'mdi-information-outline', texto: 'Ver información',
  },
  {
    clave: 'pdf', grupo: 'ver', varios: false,
    icono: 'mdi-open-in-new', texto: OTRA_PESTANA,
    disponible: ([guia]) => Boolean(guia.pdf),
  },
  {
    clave: 'descargar', grupo: 'ver', varios: false,
    icono: 'mdi-download', texto: 'Descargar PDF',
    disponible: ([guia]) => Boolean(guia.pdf),
  },
  {
    clave: 'xml', grupo: 'ver', varios: false,
    icono: 'mdi-file-code-outline', texto: 'Descargar XML',
    disponible: ([guia]) => Boolean(guia.xml),
  },
  {
    clave: 'cdr', grupo: 'ver', varios: false,
    icono: 'mdi-file-check-outline', texto: 'Descargar constancia de SUNAT',
    disponible: ([guia]) => Boolean(guia.cdr),
  },
  {
    clave: 'consultar', grupo: 'trabajo', varios: false,
    icono: 'mdi-refresh', texto: 'Preguntar a SUNAT',
    visible: ([guia]) => guia.estado === ENVIADA,
  },
  {
    clave: 'reintentar', grupo: 'trabajo', varios: false,
    icono: 'mdi-send', texto: 'Reintentar envío',
    visible: ([guia]) => guia.estado === POR_ENVIAR,
  },
  {
    clave: 'plantilla', grupo: 'trabajo', varios: false,
    icono: 'mdi-content-copy', texto: 'Usar como plantilla',
  },
  {
    clave: 'baja-en-sol', grupo: 'trabajo', varios: false,
    icono: 'mdi-check-circle-outline', texto: 'Ya la di de baja en SOL',
    visible: ([guia]) => bajaPendienteEnSol(guia),
  },
  {
    clave: 'anular', grupo: 'peligro', varios: false,
    icono: 'mdi-cancel', texto: 'Anular',
    visible: ([guia]) => SE_ANULAN.includes(guia.estado),
  },
]

// Lo que se puede hacer con una factura en la pestaña Facturas. La emitida ante SUNAT no se edita ni se borra.
const emitida = ([factura]) => Boolean(factura.estado_sunat)

export const ACCIONES_FACTURA = [
  {
    clave: 'info', grupo: 'ver', varios: false,
    icono: 'mdi-information-outline', texto: 'Ver información',
    visible: emitida,
  },
  {
    clave: 'pdf', grupo: 'ver', varios: false,
    icono: 'mdi-open-in-new', texto: OTRA_PESTANA,
    disponible: ([factura]) => Boolean(factura.pdf_url),
  },
  {
    clave: 'descargar', grupo: 'ver', varios: false,
    icono: 'mdi-download', texto: 'Descargar PDF',
    disponible: ([factura]) => Boolean(factura.pdf_url),
  },
  {
    clave: 'xml', grupo: 'ver', varios: false,
    icono: 'mdi-file-code-outline', texto: 'Descargar XML',
    visible: emitida, disponible: ([factura]) => Boolean(factura.xml),
  },
  {
    clave: 'cdr', grupo: 'ver', varios: false,
    icono: 'mdi-file-check-outline', texto: 'Descargar constancia de SUNAT',
    visible: emitida, disponible: ([factura]) => Boolean(factura.cdr),
  },
  {
    clave: 'consultar', grupo: 'trabajo', varios: false,
    icono: 'mdi-refresh', texto: 'Preguntar a SUNAT',
    visible: ([factura]) => factura.baja_en_proceso,
  },
  {
    clave: 'reintentar', grupo: 'trabajo', varios: false,
    icono: 'mdi-send', texto: 'Reintentar envío',
    visible: ([factura]) => factura.estado_sunat === POR_ENVIAR,
  },
  {
    clave: 'plantilla', grupo: 'trabajo', varios: false,
    icono: 'mdi-content-copy', texto: 'Usar como plantilla',
    visible: emitida,
  },
  {
    clave: 'abonos', grupo: 'trabajo', varios: false,
    icono: 'mdi-cash-plus', texto: 'Abonos',
  },
  {
    clave: 'editar', grupo: 'trabajo', varios: false,
    icono: 'mdi-pencil', texto: 'Editar factura',
    visible: ([factura]) => factura.es_fiscal && !factura.estado_sunat,
  },
  {
    clave: 'desvincular', grupo: 'trabajo', varios: false,
    icono: 'mdi-link-off', texto: 'Desvincular una orden',
    visible: ([factura]) => factura.es_fiscal && factura.ordenes_vinculadas.length > 0,
  },
  {
    clave: 'anular', grupo: 'peligro', varios: false,
    icono: 'mdi-cancel', texto: 'Anular',
    visible: ([factura]) => factura.anulable,
  },
  {
    clave: 'eliminar', grupo: 'peligro', varios: false,
    icono: 'mdi-delete-outline', texto: 'Eliminar factura',
    visible: (filas) => !emitida(filas),
  },
]
