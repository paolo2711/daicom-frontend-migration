import { getCurrentInstance, onBeforeUnmount } from 'vue'
import { debounce } from '@/utils/debounce'

const ESPERA = 1000

// Sin almacenamiento (modo privado, bloqueado) simplemente no hay borrador.
const intentar = (accion) => {
  try { return accion() } catch { return null }
}

const equiposSinGuardar = (borrador) =>
  borrador?.items?.length ? `Hay ${borrador.items.length} equipo(s) sin guardar de una sesión anterior.` : ''

// Lo que se va cargando en un modal queda en el navegador hasta guardarlo o
// cancelarlo, para no perderlo si se cierra la pestaña. `clave` es una funcion
// porque la de un modal puede depender de la orden que tiene abierta.
// `resumen` dice que hay en el borrador; vacio, no vale la pena ofrecerlo.
export function useLocalDraft(clave, { resumen = equiposSinGuardar } = {}) {
  const $swal = getCurrentInstance().appContext.config.globalProperties.$swal

  // Hasta ofrecer el anterior no se guarda nada: el modal vacio que se abre lo pisaria.
  let activo = false

  // Se escribe al dejar de editar: serializar todo en cada tecla traba las listas largas.
  const escribir = debounce((llave, datos) => {
    if (activo) intentar(() => localStorage.setItem(llave, JSON.stringify(datos)))
  }, ESPERA)
  const guardar = (datos) => activo && escribir(clave(), datos)
  const descartar = () => {
    activo = false
    escribir.cancelar()
    intentar(() => localStorage.removeItem(clave()))
  }

  // Lo pendiente no se pierde al cerrar la pestaña ni al cambiar de pagina.
  const alOcultar = () => { if (document.visibilityState === 'hidden') escribir.ya() }
  document.addEventListener('visibilitychange', alOcultar)
  onBeforeUnmount(() => {
    escribir.ya()
    document.removeEventListener('visibilitychange', alOcultar)
  })
  const leer = () => intentar(() => JSON.parse(localStorage.getItem(clave())))

  // El borrador si tiene algo y el usuario lo quiere; si no, se descarta.
  const ofrecer = async () => {
    escribir.ya()
    activo = false
    const borrador = leer()
    const texto = borrador ? resumen(borrador) : ''
    let recuperado = null
    if (texto) {
      const { isConfirmed } = await $swal.fire({
        title: '¿Recuperar borrador?',
        text: texto,
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
