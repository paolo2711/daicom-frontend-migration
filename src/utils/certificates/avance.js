import { estaEntregado } from './entrega'
import { ESTADOS, NUBE_DESACTUALIZADA, vivo } from './estado'
import { tieneExcelBase } from './excelBase'

// Como va el trabajo de un equipo, en un solo chip: lo que muestra la orden.
// Certificados usa estadoDe porque la firma y la entrega ya tienen su columna.
export function avanceDe(cert) {
  if (!vivo(cert)) return { texto: 'ANULADO', color: 'red-darken-2' }
  if (cert.status === NUBE_DESACTUALIZADA) return ESTADOS[NUBE_DESACTUALIZADA]
  if (estaEntregado(cert)) return { texto: 'Entregado', color: 'teal-darken-2' }
  if (cert.uploaded) return { texto: 'Listo', color: 'success' }
  if (cert.signature_requested) return { texto: 'Firma solicitada', color: 'warning' }
  if (tieneExcelBase(cert)) return { texto: 'En Proceso', color: 'warning' }
  return { texto: 'Borrador', color: 'grey-darken-1' }
}
