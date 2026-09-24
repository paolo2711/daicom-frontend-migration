import { getCurrentInstance } from 'vue'

// Sin almacenamiento (modo privado, bloqueado) simplemente no hay borrador.
const intentar = (accion) => {
  try { return accion() } catch { return null }
}

// Lo que se va cargando en un modal queda en el navegador hasta guardarlo o
// cancelarlo, para no perderlo si se cierra la pestaña. `clave` es una funcion
// porque la de un modal puede depender de la orden que tiene abierta.
export function useBorradorLocal(clave) {
  const $swal = getCurrentInstance().appContext.config.globalProperties.$swal

  const guardar = (datos) => intentar(() => localStorage.setItem(clave(), JSON.stringify(datos)))
  const descartar = () => intentar(() => localStorage.removeItem(clave()))
  const leer = () => intentar(() => JSON.parse(localStorage.getItem(clave())))

  // El borrador si tiene equipos y el usuario lo quiere; si no, se descarta.
  const ofrecer = async () => {
    const borrador = leer()
    if (!borrador?.items?.length) {
      descartar()
      return null
    }
    const { isConfirmed } = await $swal.fire({
      title: '¿Recuperar borrador?',
      text: `Hay ${borrador.items.length} equipo(s) sin guardar de una sesión anterior.`,
      icon: 'info',
      showCancelButton: true,
      confirmButtonText: 'Sí, recuperar',
      cancelButtonText: 'Descartar',
    })
    if (isConfirmed) return borrador
    descartar()
    return null
  }

  return { guardar, descartar, ofrecer }
}
