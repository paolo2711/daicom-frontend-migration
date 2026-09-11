// El certificado llega de dos endpoints con formas distintas: la lista manda la
// ruta del PDF base (`uploaded_xls_url`) y los equipos de una orden mandan solo
// si lo tiene (`uploaded_xls`).
export function tieneExcelBase(cert) {
  return Boolean(cert?.uploaded_xls_url || cert?.uploaded_xls)
}
