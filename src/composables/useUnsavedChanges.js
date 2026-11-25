import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { onBeforeRouteLeave } from 'vue-router'
import Swal from 'sweetalert2'

const copia = (valores) => JSON.parse(JSON.stringify(valores))

// Lo que se edita contra lo ultimo guardado.
export function useUnsavedChanges (inicial) {
  const datos = reactive(copia(inicial))
  const guardado = ref(JSON.stringify(datos))
  const cambiado = computed(() => JSON.stringify(datos) !== guardado.value)

  // Lo que llego del servidor pasa a ser lo guardado.
  function fijar (valores) {
    Object.assign(datos, copia(valores))
    guardado.value = JSON.stringify(datos)
  }
  const deshacer = () => Object.assign(datos, JSON.parse(guardado.value))

  return { datos, cambiado, fijar, deshacer }
}

export async function salirSinGuardar () {
  const { isConfirmed } = await Swal.fire({
    icon: 'warning', title: '¿Salir sin guardar?', text: 'Lo que cambiaste se pierde.',
    showCancelButton: true, confirmButtonText: 'Salir', cancelButtonText: 'Seguir editando',
  })
  return isConfirmed
}

// Salir de la pantalla o cerrar la pestaña con algo sin guardar pregunta antes.
export function useLeaveGuard (hayCambios) {
  const alCerrar = (e) => { if (hayCambios()) e.preventDefault() }
  onMounted(() => window.addEventListener('beforeunload', alCerrar))
  onBeforeUnmount(() => window.removeEventListener('beforeunload', alCerrar))

  onBeforeRouteLeave(async () => !hayCambios() || salirSinGuardar())
}
