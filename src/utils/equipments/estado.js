// InventoryItem.ItemStatus en el back. El color de la pildora del codigo y su leyenda.
export const ESTADOS_DE_EQUIPO = {
  1: { texto: 'Disponible', color: 'green' },
  reservado: { texto: 'Reservado', color: 'grey' },
  2: { texto: 'Alquilado', color: 'blue' },
  3: { texto: 'Mantenimiento', color: 'orange' },
  4: { texto: 'Baja', color: 'red' },
}

// Reservado: apartado para una orden, pero todavia en el almacen.
export const estadoDe = (equipo) =>
  ESTADOS_DE_EQUIPO[equipo.current_rental?.estado === 'reservado' ? 'reservado' : equipo.status]
