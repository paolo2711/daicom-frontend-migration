const SIMBOLOS = { PEN: 'S/', USD: '$' }

// Para elegirla en un formulario o filtrar por ella.
export const MONEDAS = [{ title: 'Soles (S/)', value: 'PEN' }, { title: 'Dólares ($)', value: 'USD' }]

export const simboloDe = (moneda) => SIMBOLOS[moneda] || 'S/'

export const nombreDe = (moneda) => (MONEDAS.find(m => m.value === moneda) || MONEDAS[0]).title

// '1,040.76': el numero sin la moneda.
export const importe = (valor) =>
  (Number(valor) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

// 'S/ 1,040.76', como sale en los PDF.
export const monto = (valor, moneda = 'PEN') => `${simboloDe(moneda)} ${importe(valor)}`
