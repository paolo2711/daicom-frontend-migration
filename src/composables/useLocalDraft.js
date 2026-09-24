import { getCurrentInstance } from 'vue'

// Sin almacenamiento (modo privado, bloqueado) simplemente no hay borrador.
const intentar = (accion) => {
  try { return accion() } catch { return null }
}

// Lo que se va cargando en un modal queda en el navegador hasta guardarlo o
// cancelarlo, para no perderlo si se cierra la pestaña. `clave` es una funcion
// porque la de un modal puede depender de la orden que tiene abierta.
export function useLocalDraft(clave) {
  const $swal = getCurrentInstance().appContext.config.globalProperties.$swal

  // Hasta ofrecer el anterior no se guarda nada: el modal vacio que se abre lo pisaria.
  let activo = false

  const guardar = (datos) => activo && intentar(() => localStorage.setItem(clave(), JSON.stringify(datos)))
  const descartar = () => {
    activo = false
    intentar(() => localStorage.removeItem(clave()))
  }
  const leer = () => intentar(() => JSON.parse(localStorage.getItem(clave())))

  // El borrador si tiene equipos y el usuario lo quiere; si no, se descarta.
  const ofrecer = async () => {
    activo = false
    const borrador = leer()
    let recuperado = null
    if (borrador?.items?.length) {
      const { isConfirmed } = await $swal.fire({
        title: '¿Recuperar borrador?',
        text: `Hay ${borrador.items.length} equipo(s) sin guardar de una sesión anterior.`,
        icon: 'info',
        showCancelButton: true,
        confirmButtonText: 'Sí, recuperar',
        cancelButtonText: 'Descartar',
      })
      if (isConfirmed) recuperado = borrador
    }
    if (!recuperado) descartar()
    activo = true
    return recuperado
  }

  return { guardar, descartar, ofrecer }
}
