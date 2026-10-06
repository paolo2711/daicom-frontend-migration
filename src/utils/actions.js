// Una lista de acciones de pantalla (certificados, ordenes...) aplicada a las
// filas sobre las que se va a actuar, lista para la barra de seleccion y el
// menu. Cada accion de la lista lleva:
//   clave, grupo   el menu separa un grupo del siguiente
//   varios         si sirve para mas de una fila; si no, con varias va en gris
//   visible        (filas) => si corresponde al estado de alguna; si no, no
//                  aparece (Restaurar en uno vivo). Sin el, siempre
//   disponible     (filas) => si se puede ya; si no, va en gris: corresponde
//                  pero falta un paso (Firmar QR sin Excel). Sin el, siempre
//   permiso        sin el, no aparece
//   icono, texto, detalle   fijos o (filas) => ..., para que con una sola
//                  fila digan lo que va a pasar ("Reemplazar Excel")

const valor = (campo, filas) => (typeof campo === 'function' ? campo(filas) : campo)

export function accionesPara(lista, filas, tienePermiso) {
  if (!filas.length) return []
  return lista
    .filter(a => (!a.permiso || tienePermiso(a.permiso)) && (!a.visible || a.visible(filas)))
    .map(a => ({
      clave: a.clave,
      grupo: a.grupo,
      varios: a.varios,
      icono: valor(a.icono, filas),
      texto: valor(a.texto, filas),
      detalle: valor(a.detalle, filas),
      disabled: (filas.length > 1 && !a.varios) || Boolean(a.disponible && !a.disponible(filas)),
    }))
}
