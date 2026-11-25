// La lista de Certificados con ese buscado, de cualquier fecha.
export const rutaDelCertificado = (numero) => ({ path: '/certificates', query: { certificado: numero, desde: '', hasta: '' } })
