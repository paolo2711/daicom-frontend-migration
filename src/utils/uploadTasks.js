// Vocabulario del panel de subidas. Lo leen la fila del listado y el panel: un
// estado nuevo se suma al grupo que le toca y los dos lo entienden.

const EN_CURSO  = ['generating', 'uploading', 'publishing', 'retrying', 'saving', 'cancelling', 'removing']
const FALLIDA   = ['error', 'cloud_error']
const TERMINADA = ['success', 'warning', 'saved']
// Las que corto el usuario: quedan a la vista hasta que las limpie.
const DETENIDA  = ['canceled', 'discarded']

// Excel -> PDF: el del certificado y el suelto se ven y se manejan igual.
const TIPOS_CONVERSION = ['sheet', 'suelto']

// Los que pintan un icono en la fila de un certificado.
export const TIPOS_DE_FILA = ['qr', 'sheet']

// En curso y ya sin marcha atras: 'saving' copia al disco de red, 'publishing'
// da de alta el documento en el portal, 'cancelling' espera que el servidor
// conteste si alcanzo a frenar y 'removing' lo saca del portal.
const SIN_VUELTA = ['saving', 'publishing', 'cancelling', 'removing']

export const enCurso   = (tarea) => EN_CURSO.includes(tarea.status)
// Lo que corre la pestaña con su propio pedido, no el servidor: aprobar el PDF
// ('saving') y subir el PDF rescatado. Del servidor no hay avisos que pedirle.
export const enElServidor = (tarea) =>
  enCurso(tarea) && tarea.status !== 'saving' && tarea.source !== 'manual'
export const cancelable = (tarea) => enCurso(tarea) && !SIN_VUELTA.includes(tarea.status)
export const fallida   = (tarea) => FALLIDA.includes(tarea.status)
export const terminada = (tarea) => TERMINADA.includes(tarea.status)
export const detenida  = (tarea) => DETENIDA.includes(tarea.status)

export const esConversion = (tarea) => TIPOS_CONVERSION.includes(tarea.type)

// Sacar de la nube no deja ningun PDF que abrir al terminar.
export const esBaja = (tarea) => tarea.type === 'nube'

// Una conversion en 'success' tiene el PDF hecho y todavia sin guardar: lo que
// sigue no es cerrarla, es que alguien lo revise.
export const esperandoRevision = (tarea) =>
  esConversion(tarea) && tarea.status === 'success'

// Aprobada o descartada: su PDF temporal ya no existe.
export const yaRevisada = (tarea) => ['saved', 'discarded'].includes(tarea.status)

// Un archivo subido del navegador no se puede repetir: solo viajo una vez.
export const reintentable = (tarea) => fallida(tarea) && tarea.source !== 'manual'
