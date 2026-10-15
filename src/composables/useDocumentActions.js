import DocumentsDataService from '@/services/documents/documentsDataService'
import { useContextMenu } from '@/composables/useContextMenu'
import { useSwal } from '@/composables/useSwal'
import { accionesPara } from '@/utils/actions'
import { ACCIONES_DOCUMENTO } from '@/utils/documents/acciones'
import { avisarHecho } from '@/utils/documents/avisos'
import { abrirEnOtraPestana } from '@/utils/pdf'
import { mensajeDeError } from '@/utils/errors'

// Lo que hace cada accion de ACCIONES_DOCUMENTO, y el menu de la tabla. Cada
// tipo de documento dice como abre su formulario.
export function useDocumentActions({ editar }) {
  const swal = useSwal()
  const { menu, alClickDerecho, alBotonDeFila, estaEnElMenu } = useContextMenu()

  const accionesDe = (documentos) => accionesPara(ACCIONES_DOCUMENTO, documentos, () => true)

  async function anular (documento) {
    const { isConfirmed } = await swal.fire({
      title: `¿Anular ${documento.document_number}?`,
      text: 'Su PDF queda sellado como anulado. No se puede revertir.',
      icon: 'warning', showCancelButton: true, confirmButtonText: 'Sí, anular', cancelButtonText: 'Cancelar',
    })
    if (!isConfirmed) return
    try {
      const { data } = await DocumentsDataService.cancel(documento.id)
      avisarHecho(`${documento.document_number} anulado`, data)
    } catch (err) {
      swal.fire({ icon: 'error', title: 'No se anuló', text: mensajeDeError(err, 'No se pudo anular el documento.') })
    }
  }

  function ejecutarAccion (clave, [documento]) {
    switch (clave) {
      case 'ver': return abrirEnOtraPestana(documento.pdf_file)
      case 'editar': return editar(documento)
      case 'anular': return anular(documento)
    }
  }

  return { menu, alClickDerecho, alBotonDeFila, estaEnElMenu, accionesDe, ejecutarAccion }
}
