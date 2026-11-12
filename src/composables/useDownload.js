import { useSwal } from '@/composables/useSwal'
import { mensajeDeError } from '@/utils/errors'
import { guardarArchivo } from '@/utils/files'

// Baja un archivo de media con el nombre de su copia en la red, no con el que tiene en el server.
export function useDownload() {
  const swal = useSwal()

  async function descargar (url, nombre, queEs) {
    try {
      const respuesta = await fetch(url)
      if (!respuesta.ok) throw new Error()
      guardarArchivo(await respuesta.blob(), nombre)
    } catch (err) {
      swal.fire({ icon: 'error', title: 'Error', text: mensajeDeError(err, `No se pudo descargar ${queEs}.`) })
    }
  }

  return { descargar }
}
