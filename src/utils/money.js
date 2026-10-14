const SIMBOLOS = { PEN: 'S/', USD: '$' }

// Para elegirla en un formulario o filtrar por ella.
export const MONEDAS = [{ title: 'Soles (S/)', value: 'PEN' }, { title: 'Dólares ($)', value: 'USD' }]

export const simboloDe = (moneda) => SIMBOLOS[moneda] || 'S/'

// 'S/ 1,040.76', como sale en los PDF.
export const monto = (valor, moneda = 'PEN') =>
  `${simboloDe(moneda)} ${(Number(valor) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
