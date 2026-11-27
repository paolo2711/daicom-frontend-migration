import { ROL_ADMINISTRADOR } from '@/utils/users/roles'

// Lo que se puede hacer con un rol, para el menu de la tabla (click derecho y boton de la fila). Los campos de
// cada una, en utils/actions.js. Administrador viene con la app: se ve, pero no se toca.
const esDeLaApp = ([rol]) => rol.id === ROL_ADMINISTRADOR

export const ACCIONES_ROL = [
  {
    clave: 'editar', grupo: 'rol', varios: false, icono: 'mdi-pencil', texto: 'Editar',
    detalle: (filas) => (esDeLaApp(filas) ? 'Viene con la app: no se edita' : ''),
    disponible: (filas) => !esDeLaApp(filas),
  },
  {
    clave: 'eliminar', grupo: 'peligro', varios: false, icono: 'mdi-delete', texto: 'Eliminar',
    detalle: (filas) => (esDeLaApp(filas) ? 'Viene con la app: no se elimina' : ''),
    disponible: (filas) => !esDeLaApp(filas),
  },
]
