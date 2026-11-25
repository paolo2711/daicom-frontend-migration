import { getCurrentInstance, nextTick, onBeforeUnmount, watch } from 'vue'
import { Toast } from '@/plugins/alerts'
import { useAuthStore } from '@/stores/authStore'
import { fechaHora, fechaHoraISO } from '@/utils/dates'
import { debounce } from '@/utils/debounce'
import { mismoFormato } from '@/utils/version'

const ESPERA = 1000
const PREFIJO = 'daicom_borrador_'
const VIGENCIA = 7 * 24 * 60 * 60 * 1000

// Sin almacenamiento (modo privado, bloqueado) simplemente no hay borrador.
const intentar = (accion) => {
  try { return accion() } catch { return null }
}
const leer = (llave) => intentar(() => JSON.parse(localStorage.getItem(llave)))
const vigente = (borrador) => Date.now() - new Date(borrador?.guardado) < VIGENCIA

function quitarVencidos () {
  intentar(() => Object.keys(localStorage)
    .filter(llave => llave.startsWith(PREFIJO) && !vigente(leer(llave)))
    .forEach(llave => localStorage.removeItem(llave)))
}

// Lo que se carga en un formulario queda en el navegador hasta guardarlo o cancelarlo, por usuario y por `clave` (que
// formulario y desde donde). `llenar` devuelve los `datos` a la pantalla; sin `resumen`, no vale la pena ofrecerlos.
export function useLocalDraft ({ clave, version, datos, llenar, resumen }) {
  const $swal = getCurrentInstance().appContext.config.globalProperties.$swal
  const usuario = useAuthStore().user?.username

  // Solo entre abrir y cerrar: lo que el formulario trae lleno no es un cambio.
  let activo = false
  let llave = null
  let inicial = ''

  const enTexto = () => JSON.stringify(datos())
  const borrar = () => intentar(() => localStorage.removeItem(llave))

  // Se escribe al dejar de editar: serializar todo en cada tecla traba las listas largas.
  const escribir = debounce(() => {
    if (!activo) return
    if (enTexto() === inicial) return borrar()
    const borrador = { version, guardado: fechaHoraISO(new Date()), datos: datos() }
    intentar(() => localStorage.setItem(llave, JSON.stringify(borrador)))
  }, ESPERA)
  watch(datos, () => { if (activo) escribir() }, { deep: true })

  // Lo pendiente no se pierde al cerrar la pestaña ni al cambiar de pagina.
  const alOcultar = () => { if (document.visibilityState === 'hidden') escribir.ya() }
  document.addEventListener('visibilitychange', alOcultar)
  onBeforeUnmount(() => {
    escribir.ya()
    document.removeEventListener('visibilitychange', alOcultar)
  })

  async function quiereRecuperar (borrador, texto) {
    const { isConfirmed } = await $swal.fire({
      title: '¿Recuperar borrador?',
      text: `${texto}, del ${fechaHora(borrador.guardado)}.`,
      icon: 'info',
      showCancelButton: true,
      confirmButtonText: 'Sí, recuperar',
      cancelButtonText: 'Descartar',
    })
    return isConfirmed
  }

  async function recuperar (borrador) {
    if (!mismoFormato(borrador.version, version)) throw new Error('El borrador es de otro formato')
    const texto = resumen(borrador.datos)
    if (!texto || !await quiereRecuperar(borrador, texto)) return borrar()
    await llenar(borrador.datos)
  }

  // Con el formulario ya lleno: ofrece el borrador que haya y empieza a seguir lo que cambie.
  async function abrir () {
    escribir.cancelar()
    activo = false
    quitarVencidos()
    llave = `${PREFIJO}${usuario}_${clave()}`
    await nextTick()
    inicial = enTexto()
    const borrador = leer(llave)
    if (borrador) {
      try {
        await recuperar(borrador)
      } catch (error) {
        console.error(error)
        borrar()
        await llenar(JSON.parse(inicial))
        Toast.fire({ icon: 'info', timer: 6000, title: 'No se recuperó el borrador',
                     text: `El del ${fechaHora(borrador.guardado)} ya no es compatible y se descartó.` })
      }
    }
    activo = true
  }

  function cerrar () {
    activo = false
    escribir.cancelar()
    if (llave) borrar()
    llave = null
  }

  return { abrir, cerrar }
}
