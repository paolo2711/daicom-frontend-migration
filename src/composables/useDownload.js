import { useSwal } from '@/composables/useSwal'
import { avisarHecho } from '@/utils/documents/avisos'
import { mensajeDeError } from '@/utils/errors'
import { guardarArchivo } from '@/utils/files'

async function bajar (url, nombre) {
  const respuesta = await fetch(url)
  if (!respuesta.ok) throw new Error()
  guardarArchivo(await respuesta.blob(), nombre)
}

// Baja archivos de media con el nombre de su copia en la red, no con el que tienen en el server.
export function useDownload() {
  const swal = useSwal()

  async function descargar (url, nombre, queEs) {
    try {
      await bajar(url, nombre)
    } catch (err) {
      swal.fire({ icon: 'error', title: 'Error', text: mensajeDeError(err, `No se pudo descargar ${queEs}.`) })
    }
  }

  // Uno tras otro ({ url, nombre }): el que falla no detiene a los demas. `hecho` dice cuantos bajaron.
  async function descargarVarios (archivos, hecho) {
    const fallaron = []
    for (const { url, nombre } of archivos) {
      try { await bajar(url, nombre) } catch { fallaron.push(nombre) }
    }
    const bajaron = archivos.length - fallaron.length
    const aviso = fallaron.length ? `No se pudo descargar: ${fallaron.join(', ')}.` : ''
    if (bajaron) avisarHecho(hecho(bajaron), { warning: aviso })
    else swal.fire({ icon: 'error', title: 'Error', text: aviso })
  }

  return { descargar, descargarVarios }
}
