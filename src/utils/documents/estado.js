import { CURRENT_QUOTE_SCHEMA } from './quoteDefaults'
import { CURRENT_FORMATO_INGRESO_SCHEMA } from './formatoIngresoDefaults'

// Document.status en el back.
const EMITIDO = 'EMITIDO'
const ANULADO = 'ANULADO'

// El color de la pildora del numero y su leyenda; los mismos de Certificados.
export const ESTADOS = {
  [EMITIDO]: { texto: 'Emitido', color: 'green' },
  [ANULADO]: { texto: 'Anulado', color: 'red' },
}

export const FILTRO_DE_ESTADO = [EMITIDO, ANULADO].map(id => ({ id, name: ESTADOS[id].texto }))

// Document.document_type en el back.
export const COTIZACION = 'COT'
export const FORMATO_DE_INGRESO = 'FOI'

// La version vigente del JSON de cada tipo, la misma que ESQUEMA_POR_TIPO en
// el back. Se edita uno con el mismo primer numero (los cambios del segundo
// solo agregan campos); uno con otro se puede ver pero no editar.
const ESQUEMA_VIGENTE = {
  [COTIZACION]: CURRENT_QUOTE_SCHEMA,
  [FORMATO_DE_INGRESO]: CURRENT_FORMATO_INGRESO_SCHEMA,
}
const mayor = (version) => String(version ?? '').split('.')[0]

export const vivo = (documento) => documento?.status !== ANULADO
export const editable = (documento) =>
  mayor(documento?.schema_version) === mayor(ESQUEMA_VIGENTE[documento?.document_type])
