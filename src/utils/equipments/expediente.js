import { fechaCorta } from '@/utils/dates'

// Hasta cuando vale un certificado, con su `vence` y `vigencia` del back: «hasta 12/12/2026» o «venció 07/11/2026».
export const textoDeVence = (certificado) => (certificado?.vence
  ? `${certificado.vigencia === 'vencido' ? 'venció' : 'hasta'} ${fechaCorta(certificado.vence)}`
  : '')
