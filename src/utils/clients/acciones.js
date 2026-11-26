// Lo que se puede hacer con un cliente, para el menu de la tabla (click derecho y boton de la fila). Los campos
// de cada una, en utils/actions.js.
export const ACCIONES_CLIENTE = [
  { clave: 'editar', grupo: 'cliente', varios: false, icono: 'mdi-pencil', texto: 'Editar' },
  {
    clave: 'revisado', grupo: 'cliente', varios: false,
    icono: 'mdi-account-check-outline', texto: 'Marcar como revisado', detalle: 'Es un posible duplicado',
    visible: ([cliente]) => cliente.needs_review,
  },
  { clave: 'eliminar', grupo: 'peligro', varios: false, icono: 'mdi-delete', texto: 'Eliminar' },
]
