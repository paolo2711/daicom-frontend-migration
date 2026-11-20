// Marca, modelo y serie de un equipo en una linea, sin los que faltan.
export const datosDelEquipo = (...partes) => partes.filter(Boolean).join(' · ')
