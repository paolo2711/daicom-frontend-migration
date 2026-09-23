// Certificate.CertificateType en el back.
export const TIPOS_CERTIFICADO = [
  { value: 1, title: 'ACREDITADO', sigla: 'ACR' },
  { value: 2, title: 'NO ACREDITADO', sigla: 'NAC' },
  { value: 3, title: 'OPERATIVIDAD', sigla: 'OPE' },
]

const tipoDe = (valor) => TIPOS_CERTIFICADO.find(t => t.value === valor)

export const nombreDelTipo = (valor) => tipoDe(valor)?.title || ''
export const siglaDelTipo = (valor) => tipoDe(valor)?.sigla || ''
