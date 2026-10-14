import { editable, vivo } from '@/utils/documents/estado'

// Lo que se puede hacer con un documento, para el menu de la tabla (click
// derecho y boton de la fila). Los campos de cada una, en utils/actions.js.
// Uno anulado solo se ve.

export const ACCIONES_DOCUMENTO = [
  {
    clave: 'ver', grupo: 'documento', varios: false,
    icono: 'mdi-file-pdf-box', texto: 'Ver PDF',
    disponible: ([documento]) => Boolean(documento.pdf_file),
  },
  {
    clave: 'editar', grupo: 'documento', varios: false,
    icono: 'mdi-pencil', texto: 'Editar',
    detalle: ([documento]) => (editable(documento) ? '' : 'Formato anterior: solo se puede ver'),
    visible: ([documento]) => vivo(documento),
    disponible: ([documento]) => editable(documento),
  },
  {
    clave: 'anular', grupo: 'peligro', varios: false,
    icono: 'mdi-cancel', texto: 'Anular',
    visible: ([documento]) => vivo(documento),
  },
]
