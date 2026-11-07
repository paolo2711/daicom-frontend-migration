import { Toast } from '@/plugins/alerts'
import { useSwal } from '@/composables/useSwal'
import { mensajeDeError } from '@/utils/errors'

// Llamar al back desde una accion de menu: el toast si salio, el cartel si no.
// Devuelve true si salio, para que la pantalla refresque lo suyo.
export function useActionCall() {
  const swal = useSwal()

  async function llamarSinPreguntar (llamar, exito, fallo) {
    try {
      await llamar()
      Toast.fire({ timer: 2400, icon: 'success', title: exito })
      return true
    } catch (err) {
      swal.fire({ icon: 'error', title: 'Error', text: mensajeDeError(err, fallo) })
      return false
    }
  }

  async function confirmarYLlamar ({ titulo, texto, boton, llamar, exito, fallo, icono = 'warning' }) {
    const { isConfirmed } = await swal.fire({
      title: titulo, text: texto, icon: icono,
      showCancelButton: true, confirmButtonText: boton, cancelButtonText: 'Cancelar',
    })
    return isConfirmed ? llamarSinPreguntar(llamar, exito, fallo) : false
  }

  return { llamarSinPreguntar, confirmarYLlamar }
}
