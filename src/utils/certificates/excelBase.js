// uploaded_xls guarda un flag ("1"/"0") en los certificados viejos y la ruta del
// PDF en los nuevos. Segun de donde venga el dato, el "no tiene" llega escrito de
// varias formas, y cada pantalla lo comprobaba a su manera: ListCertificates
// descartaba '0' y 'False', BatchActionModal ademas 'false'. Con eso las dos
// podian discrepar sobre el mismo certificado.
export function tieneExcelBase(cert) {
  const valor = String(cert?.uploaded_xls ?? '').trim().toLowerCase()
  return valor !== '' && valor !== '0' && valor !== 'false'
}
