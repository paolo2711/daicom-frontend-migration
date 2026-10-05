import { Toast } from '@/plugins/alerts'
import CertificateDataService from '@/services/certificates/certificateDataService'
import { useSwal } from '@/composables/useSwal'
import { useUploadState } from '@/composables/useUploadState'
import { estaEntregado } from '@/utils/certificates/entrega'
import { copiarConAviso } from '@/utils/clipboard'
import { mensajeDeError } from '@/utils/errors'

// Lo que hace cada accion de ACCIONES_CERTIFICADO, sobre uno o varios. Lo usa
// toda pantalla con certificados; cada una dice como abre su modal de lote y
// la ficha de un certificado.
export function useCertificateActions({ abrirLote, abrirFicha }) {
  const swal = useSwal()
  const { tareaDe } = useUploadState()

  // Recien firmado, el link llega en la tarea antes que la fila se actualice.
  const linkDe = (cert) => cert.link_nube || tareaDe(cert.id, 'qr')?.url || ''

  const cuales = (certs) => (certs.length === 1 ? certs[0].registry_code : `${certs.length} certificados`)

  // Uno solo, el link pelado: se pega en el navegador. Varios, cada uno bajo su
  // codigo y separados por una linea en blanco, para saber cual es cual y que
  // no se junten donde se peguen.
  function copiarLinks (certs) {
    const conLink = certs.filter(linkDe)
    if (!conLink.length) return
    if (conLink.length === 1) return copiarConAviso(linkDe(conLink[0]), 'Link copiado')
    copiarConAviso(conLink.map(c => `${c.registry_code}\n${linkDe(c)}`).join('\n\n'), `${conLink.length} links copiados`)
  }

  const ids = (certs) => certs.map(c => c.id)

  // El toast si salio, el cartel si no.
  async function llamarSinPreguntar (llamar, exito, fallo) {
    try {
      await llamar()
      Toast.fire({ timer: 2400, icon: 'success', title: exito })
    } catch (err) {
      swal.fire({ icon: 'error', title: 'Error', text: mensajeDeError(err, fallo) })
    }
  }

  async function confirmarYLlamar ({ titulo, texto, boton, llamar, exito, fallo, icono = 'warning' }) {
    const { isConfirmed } = await swal.fire({
      title: titulo, text: texto, icon: icono,
      showCancelButton: true, confirmButtonText: boton, cancelButtonText: 'Cancelar',
    })
    if (isConfirmed) await llamarSinPreguntar(llamar, exito, fallo)
  }

  function ejecutarAccion (clave, certs) {
    const [cert] = certs
    const solo = certs.length === 1
    switch (clave) {
      case 'ver': return abrirFicha(cert)
      case 'link': return copiarLinks(certs)
      case 'excel': return abrirLote('excel', certs)
      // Con varios, el modal dice cuales ya estaban pedidos.
      case 'firma':
        if (!solo) return abrirLote('notify', certs)
        return llamarSinPreguntar(() => CertificateDataService.requestBatchSignatures([cert.id]),
          `Firma solicitada para ${cert.registry_code}`, 'No se pudo notificar a gerencia.')
      case 'cancelar_firma':
        return llamarSinPreguntar(() => CertificateDataService.cancelarSolicitudes(ids(certs)),
          `Solicitud cancelada: ${cuales(certs)}`, 'No se pudo cancelar la solicitud.')
      case 'qr': return abrirLote('qr', certs)
      // Marcar pasa por el modal aunque sea uno: hay que elegir la fecha.
      case 'entrega':
        if (!solo || !estaEntregado(cert)) return abrirLote('entrega', certs)
        return confirmarYLlamar({
          titulo: '¿Quitar la entrega?', texto: `${cert.registry_code} volverá a figurar como no entregado.`,
          boton: 'Sí, quitar', llamar: () => CertificateDataService.registrarEntrega([cert.id], null),
          exito: 'Entrega quitada', fallo: 'No se pudo quitar la entrega.',
        })
      case 'tipo': return abrirLote('tipo', certs)
      // El resultado de cada uno llega por el panel de subidas.
      case 'nube':
        return confirmarYLlamar({
          titulo: `¿Eliminar de la nube ${cuales(certs)}?`,
          texto: solo
            ? 'Su QR dejará de funcionar y el PDF ya no se verá en el portal. No se anula en el sistema.'
            : 'Sus QR dejarán de funcionar y los PDF ya no se verán en el portal. No se anulan en el sistema.',
          boton: 'Sí, eliminar', llamar: () => CertificateDataService.eliminarDeLaNube(ids(certs)),
          exito: 'Eliminando de la nube…', fallo: 'No se pudo eliminar de la nube.',
        })
      case 'anular':
        return confirmarYLlamar({
          titulo: `¿Anular ${cuales(certs)}?`,
          texto: solo ? 'Se borran sus datos, su PDF y su publicación en la nube.'
            : 'Se borran sus datos, sus PDF y su publicación en la nube.',
          boton: 'Sí, anular', llamar: () => CertificateDataService.anular(ids(certs)),
          exito: solo ? 'Certificado anulado' : 'Certificados anulados', fallo: 'No se pudo anular.',
        })
      case 'restaurar':
        return confirmarYLlamar({
          titulo: `¿Restaurar ${cuales(certs)}?`, texto: solo ? 'Vuelve a borrador.' : 'Vuelven a borrador.', icono: 'info',
          boton: 'Sí, restaurar', llamar: () => CertificateDataService.restaurar(ids(certs)),
          exito: solo ? 'Certificado restaurado' : 'Certificados restaurados', fallo: 'No se pudo restaurar.',
        })
    }
  }

  return { ejecutarAccion, copiarLinks, linkDe }
}
