import { getCurrentInstance, nextTick, onBeforeUnmount, watch } from 'vue'
import { salirSinGuardar } from '@/composables/useUnsavedChanges'
import { Toast } from '@/plugins/alerts'
import { useAuthStore } from '@/stores/authStore'
import { fechaHoraISO, horaCorta, hoyISO } from '@/utils/dates'
import { debounce } from '@/utils/debounce'
import { mismoFormato } from '@/utils/version'

const ESPERA = 1000
const PREFIJO = 'daicom_borrador_'

// Sin almacenamiento (modo privado, bloqueado) simplemente no hay borrador.
const intentar = (accion) => {
  try { return accion() } catch { return null }
}
const leer = (llave) => intentar(() => JSON.parse(localStorage.getItem(llave)))
const esDeHoy = (borrador) => borrador?.guardado?.startsWith(hoyISO())

function quitarLosDeAntes () {
  intentar(() => Object.keys(localStorage)
    .filter(llave => llave.startsWith(PREFIJO) && !esDeHoy(leer(llave)))
    .forEach(llave => localStorage.removeItem(llave)))
}

// Desde donde se abrio un formulario que puede salir de unas ordenes.
export const origenDe = (ids) => (ids.length ? `ordenes_${[...ids].sort().join('_')}` : 'nueva')

// Lo que se carga en un formulario queda en el navegador hasta guardarlo o cancelarlo, por usuario y por `clave`; sin
// clave no se guarda. Sin `resumen`, no vale la pena ofrecerlo. `fuera`: lo que es un cambio y no se puede guardar.
export function useLocalDraft ({ clave, version, datos, llenar, resumen, fuera = () => null }) {
  const $swal = getCurrentInstance().appContext.config.globalProperties.$swal
  const usuario = useAuthStore().user?.username

  // Solo entre abrir y cerrar: lo que el formulario trae lleno no es un cambio.
  let activo = false
  let llave = null

  let inicial = ''
  const enTexto = () => JSON.stringify({ datos: datos(), fuera: fuera() })
  const empezar = () => { inicial = enTexto() }
  const hayCambios = () => enTexto() !== inicial
  const borrar = () => intentar(() => localStorage.removeItem(llave))

  // Se escribe al dejar de editar: serializar todo en cada tecla traba las listas largas.
  const escribir = debounce(() => {
    if (!activo || !llave) return
    if (!hayCambios()) return borrar()
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
      text: `${texto}, de las ${horaCorta(borrador.guardado)}.`,
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
    quitarLosDeAntes()
    llave = clave() && `${PREFIJO}${usuario}_${clave()}`
    await nextTick()
    empezar()
    const borrador = llave && leer(llave)
    if (borrador) {
      try {
        await recuperar(borrador)
      } catch (error) {
        console.error(error)
        borrar()
        await llenar(JSON.parse(inicial).datos)
        await nextTick()
        empezar()
        Toast.fire({ icon: 'info', timer: 6000, title: 'No se recuperó el borrador',
                     text: `El de las ${horaCorta(borrador.guardado)} ya no es compatible y se descartó.` })
      }
    }
    activo = true
  }

  function cerrar () {
    activo = false
    escribir.cancelar()
    if (llave) borrar()
  }

  const puedeSalir = async () => !hayCambios() || salirSinGuardar()

  return { abrir, cerrar, puedeSalir }
}
