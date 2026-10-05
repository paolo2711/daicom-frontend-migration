import { tieneExcelBase } from '@/utils/certificates/excelBase'
import { esEntregable, estaEntregado } from '@/utils/certificates/entrega'
import { ANULADO } from '@/utils/certificates/estado'
import { fechaCorta } from '@/utils/dates'

// Lo que se puede hacer con certificados. De aca salen la barra de seleccion y
// el menu (click derecho y boton de la fila), asi que una accion se agrega o
// se cambia una sola vez. Los campos de cada una, en utils/actions.js.

const vivo = (cert) => cert.status !== ANULADO
const uno = (certs) => (certs.length === 1 ? certs[0] : null)

export const ACCIONES_CERTIFICADO = [
  {
    clave: 'ver', grupo: 'ver', varios: false,
    icono: 'mdi-pencil', texto: 'Ver y editar',
    disponible: ([cert]) => vivo(cert),
  },
  {
    clave: 'link', grupo: 'ver', varios: true,
    icono: 'mdi-link-variant',
    texto: (certs) => (certs.length > 1 ? 'Copiar links' : 'Copiar link'),
    disponible: (certs) => certs.some(c => c.link_nube),
  },
  {
    clave: 'excel', grupo: 'trabajo', varios: true, permiso: 1006,
    icono: 'mdi-file-excel',
    texto: (certs) => {
      if (certs.length > 1) return 'Subir Excels'
      return tieneExcelBase(certs[0]) ? 'Reemplazar Excel' : 'Subir Excel'
    },
    disponible: (certs) => certs.every(vivo),
  },
  {
    clave: 'firma', grupo: 'trabajo', varios: true, permiso: 1005,
    icono: 'mdi-bell-ring', texto: 'Solicitar firma',
    disponible: (certs) => certs.some(c => vivo(c) && tieneExcelBase(c) && !c.signature_requested),
  },
  {
    clave: 'cancelar_firma', grupo: 'trabajo', varios: true, permiso: 1005,
    icono: 'mdi-bell-cancel-outline', texto: 'Cancelar solicitud',
    disponible: (certs) => certs.some(c => c.signature_requested),
  },
  {
    clave: 'qr', grupo: 'trabajo', varios: true, permiso: 1001,
    icono: (certs) => (uno(certs)?.uploaded ? 'mdi-refresh' : 'mdi-qrcode-scan'),
    texto: (certs) => (uno(certs)?.uploaded ? 'Regenerar QR' : 'Firmar QR'),
    disponible: (certs) => certs.some(c => vivo(c) && tieneExcelBase(c)),
  },
  {
    clave: 'entrega', grupo: 'trabajo', varios: true, permiso: 1010,
    icono: (certs) => (estaEntregado(uno(certs)) ? 'mdi-package-variant-closed-remove' : 'mdi-package-variant-closed-check'),
    texto: (certs) => {
      if (certs.length > 1) return 'Marcar entregados'
      return estaEntregado(certs[0]) ? 'Quitar entrega' : 'Marcar entregado'
    },
    detalle: (certs) => (estaEntregado(uno(certs)) ? `Entregado ${fechaCorta(certs[0].sent_date)}` : ''),
    disponible: (certs) => certs.some(c => esEntregable(c) || estaEntregado(c)),
  },
  {
    clave: 'tipo', grupo: 'trabajo', varios: true,
    icono: 'mdi-swap-horizontal', texto: 'Corregir tipo',
    disponible: (certs) => certs.some(vivo),
  },
  {
    clave: 'nube', grupo: 'peligro', varios: true, permiso: 1003,
    icono: 'mdi-cloud-remove-outline', texto: 'Eliminar de la nube',
    disponible: (certs) => certs.some(c => vivo(c) && c.link_nube),
  },
  {
    clave: 'anular', grupo: 'peligro', varios: true, permiso: 1003,
    icono: 'mdi-delete-outline', texto: 'Anular',
    disponible: (certs) => certs.some(vivo),
  },
  {
    clave: 'restaurar', grupo: 'peligro', varios: true, permiso: 1003,
    icono: 'mdi-backup-restore', texto: 'Restaurar',
    disponible: (certs) => certs.some(c => !vivo(c)),
  },
]
