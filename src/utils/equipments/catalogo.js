// El permiso de accion que deja cambiar el catalogo: equipos, servicios y sus
// precios (PERM_EDITAR_CATALOGO en apps/equipments/views.py). Buscar es para todos.
export const EDITAR_CATALOGO = 1011

// Lo que se hace con un equipo y con uno de sus servicios, para sus menus. Los campos, en utils/actions.js.
export const ACCIONES_EQUIPO_DEL_CATALOGO = [
  { clave: 'editar', grupo: 'equipo', varios: false, permiso: EDITAR_CATALOGO, icono: 'mdi-pencil', texto: 'Editar' },
  {
    clave: 'servicio', grupo: 'equipo', varios: false, permiso: EDITAR_CATALOGO,
    icono: 'mdi-plus', texto: 'Agregar servicio',
  },
  {
    clave: 'eliminar', grupo: 'peligro', varios: false, permiso: EDITAR_CATALOGO,
    icono: 'mdi-delete', texto: 'Eliminar', detalle: 'Con todos sus servicios',
  },
]
export const ACCIONES_SERVICIO_DEL_CATALOGO = [
  { clave: 'editar', grupo: 'servicio', varios: false, permiso: EDITAR_CATALOGO, icono: 'mdi-pencil', texto: 'Editar' },
  { clave: 'eliminar', grupo: 'peligro', varios: false, permiso: EDITAR_CATALOGO, icono: 'mdi-delete', texto: 'Eliminar' },
]
