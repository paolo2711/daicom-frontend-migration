// Certificate.CertificateType en el back.
export const TIPOS_CERTIFICADO = [
  { value: 1, title: 'ACREDITADO', sigla: 'ACR', uno: 'acreditado', varios: 'acreditados' },
  { value: 2, title: 'NO ACREDITADO', sigla: 'NAC', uno: 'no acreditado', varios: 'no acreditados' },
  { value: 3, title: 'OPERATIVIDAD', sigla: 'OPE', uno: 'de operatividad', varios: 'de operatividad' },
]

const tipoDe = (valor) => TIPOS_CERTIFICADO.find(t => t.value === Number(valor))

export const nombreDelTipo = (valor) => tipoDe(valor)?.title || ''
export const siglaDelTipo = (valor) => tipoDe(valor)?.sigla || ''

// "3 no acreditados · 1 acreditado", en el orden de TIPOS_CERTIFICADO.
export function resumenPorTipo(filas) {
  return TIPOS_CERTIFICADO
    .map(tipo => [tipo, filas.filter(f => Number(f.certificate_type) === tipo.value).length])
    .filter(([, cuantos]) => cuantos)
    .map(([tipo, cuantos]) => `${cuantos} ${cuantos === 1 ? tipo.uno : tipo.varios}`)
    .join(' · ')
}
