import { editable, vivo } from '@/utils/documents/estado'
import { OTRA_PESTANA } from '@/utils/pdf'

// Lo que se puede hacer con un documento, para el menu de la tabla (click
// derecho y boton de la fila). Los campos de cada una, en utils/actions.js.
// Uno anulado solo se ve.

export const ACCIONES_DOCUMENTO = [
  {
    clave: 'ver', grupo: 'documento', varios: false,
    icono: 'mdi-open-in-new', texto: OTRA_PESTANA,
    disponible: ([documento]) => Boolean(documento.pdf_file),
  },
  {
    clave: 'editar', grupo: 'documento', varios: false,
    icono: 'mdi-pencil', texto: 'Editar',
    detalle: ([documento]) => (editable(documento) ? '' : 'Solo lectura'),
    visible: ([documento]) => vivo(documento),
    disponible: ([documento]) => editable(documento),
  },
  {
    clave: 'crear-orden', grupo: 'documento', varios: false,
    icono: 'mdi-file-document-plus', texto: 'Crear orden',
    // Cuales pasan lo decide el back (pasa_a_orden en apps/documents/cotizacion.py).
    visible: ([documento]) => documento.pasa_a_orden,
  },
  {
    clave: 'anular', grupo: 'peligro', varios: false,
    icono: 'mdi-cancel', texto: 'Anular',
    visible: ([documento]) => vivo(documento),
  },
]
