import { ref } from 'vue'

// El menu de click derecho (y del boton ⋮) de una tabla, como en Google Drive:
// sobre una fila marcada es de toda la seleccion; sobre otra, la seleccion pasa
// a ser esa sola, asi la barra flotante y el menu hablan de lo mismo.
//
// `seleccion` es el ref de las filas marcadas, o null si la tabla no marca.
// `seMarca(fila)` dice si esa fila admite casilla: si no, el menu es de ella
// sola y la seleccion queda vacia.
// Con `marca: false` el menu nunca toca la seleccion, para las tablas donde
// marcar hace algo mas que elegir filas.

// Uno solo abierto en toda la pantalla, aunque haya tablas dentro de tablas
// (ordenes y sus equipos): Vuetify cierra un menu con un click afuera, pero no
// con un click derecho.
let cerrarElAbierto = null

export function useContextMenu(seleccion = null, { seMarca = () => true, marca = true } = {}) {
  const menu = ref({ show: false, x: 0, y: 0, filas: [] })

  const cerrar = () => { menu.value = { ...menu.value, show: false } }

  function abrir (x, y, fila) {
    if (cerrarElAbierto && cerrarElAbierto !== cerrar) cerrarElAbierto()
    cerrarElAbierto = cerrar

    const marcada = Boolean(seleccion?.value.some(f => f.id === fila.id))
    if (seleccion && marca && !marcada) seleccion.value = seMarca(fila) ? [fila] : []

    // Posicion y contenido en una sola asignacion: el menu se mueve y cambia sus
    // opciones en el mismo render, sin mostrar las de la fila anterior.
    menu.value = { show: true, x, y, filas: marcada ? [...seleccion.value] : [fila] }
  }

  // Para @contextmenu:row de v-data-table.
  function alClickDerecho (event, { item }) {
    event.preventDefault()
    abrir(event.clientX, event.clientY, item.raw || item)
  }

  // Con el menu abierto, este click ya dejo encolado el cierre de Vuetify: la
  // apertura va detras. El click derecho no lo sufre, Vuetify no lo escucha.
  function alBotonDeFila (event, fila) {
    const { clientX, clientY } = event
    if (!menu.value.show) return abrir(clientX, clientY, fila)
    setTimeout(() => abrir(clientX, clientY, fila), 0)
  }

  // Para resaltar las filas de las que habla el menu abierto.
  const estaEnElMenu = (fila) => menu.value.show && menu.value.filas.some(f => f.id === fila.id)

  return { menu, alClickDerecho, alBotonDeFila, estaEnElMenu }
}
