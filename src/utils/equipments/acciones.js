import { ALQUILADO } from '@/utils/equipments/estado'

// Lo que se puede hacer con un equipo del inventario, para el menu de la tabla (click derecho y boton de la
// fila). Los campos de cada una, en utils/actions.js.
export const ACCIONES_INVENTARIO = [
  { clave: 'editar', grupo: 'equipo', varios: false, icono: 'mdi-pencil', texto: 'Editar' },
  { clave: 'certificado', grupo: 'equipo', varios: false, icono: 'mdi-certificate-outline', texto: 'Certificado' },
  { clave: 'historial', grupo: 'equipo', varios: false, icono: 'mdi-truck-fast', texto: 'Historial de viajes' },
  {
    clave: 'eliminar', grupo: 'peligro', varios: false, permiso: 1007,
    icono: 'mdi-delete', texto: 'Eliminar',
    // El back tampoco lo deja: primero se registra su devolucion.
    detalle: ([equipo]) => (equipo.status === ALQUILADO ? 'Está alquilado' : ''),
    disponible: ([equipo]) => equipo.status !== ALQUILADO,
  },
]
