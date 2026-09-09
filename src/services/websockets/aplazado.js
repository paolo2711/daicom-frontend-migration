// Una pestaña en segundo plano no repinta nada: el navegador la frena igual, y
// termina pidiendo de golpe todo lo que se perdio. Se anota que quedo sucia y al
// volver se recarga una sola vez.
const pendientes = new Map()

export const pestanaOculta = () => document.hidden

// La clave dedupe: veinte avisos de la misma tabla dejan una sola recarga.
export function alVolverAVer(clave, accion) {
  pendientes.set(clave, accion)
}

document.addEventListener('visibilitychange', () => {
  if (document.hidden || pendientes.size === 0) return
  const acciones = [...pendientes.values()]
  pendientes.clear()
  acciones.forEach((accion) => accion())
})
