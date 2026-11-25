import { itemVacio } from '@/utils/documents/quoteDefaults'

// La regla, en utils/version.js; las mismas que ESQUEMA de Invoice, CreditNote y DispatchGuide en el back. Los demas
// valores por defecto los arma el back, con la empresa y las ordenes.
export const CURRENT_INVOICE_SCHEMA = '1.0'
export const CURRENT_CREDIT_NOTE_SCHEMA = '1.0'
export const CURRENT_DISPATCH_GUIDE_SCHEMA = '1.0'

// La unidad de los items de la factura; a SUNAT va como servicio (ZZ).
const UNIDAD_DE_FACTURA = 'und'

export const itemDeFactura = () => itemVacio(UNIDAD_DE_FACTURA)
// Un item de la factura en su nota: si entra y cuanto tenia.
export const itemDeNota = (item) => ({ ...item, incluir: false, original: item.quantity })
export const itemDeGuia = () => ({ descripcion: '', detalle: '', cantidad: 1, peso: '', unidad: 'NIU' })
