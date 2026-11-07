import { avanceDe } from '@/utils/certificates/avance'
import { ANULADO } from '@/utils/certificates/estado'

// Las lineas de una orden de servicio: cada equipo con su servicio y, si lo lleva, su certificado.

export const certificadosDe = (lineas) => (lineas || []).map(l => l.certificate).filter(Boolean)

export const lineaAnulada = (linea) => linea.certificate?.status === ANULADO

// Su servicio como lo elige el formulario: el tipo de certificado viene dentro del certificado.
export const servicioDe = (linea) => ({
  tipo_servicio: linea.tipo_servicio,
  certificate_type: linea.certificate?.certificate_type ?? null,
})

// El chip de la linea: el de su certificado, o completada o pendiente si no lo lleva.
export function avanceDeLinea(linea) {
  if (linea.certificate) return avanceDe(linea.certificate)
  return linea.completado ? { texto: 'Completado', color: 'success' } : { texto: 'Pendiente', color: 'grey-darken-1' }
}

// Lo que se puede hacer con una linea sin certificado; la que lo lleva usa las de certificados.
export const ACCIONES_LINEA = [
  {
    clave: 'completar', grupo: 'trabajo', varios: false,
    icono: ([l]) => (l.completado ? 'mdi-progress-check' : 'mdi-check-circle-outline'),
    texto: ([l]) => (l.completado ? 'Quitar completado' : 'Marcar completado'),
  },
  {
    clave: 'servicio', grupo: 'trabajo', varios: false,
    icono: 'mdi-swap-horizontal', texto: 'Cambiar servicio',
  },
  {
    clave: 'eliminar', grupo: 'peligro', varios: false,
    icono: 'mdi-delete', texto: 'Eliminar de la orden',
  },
]
