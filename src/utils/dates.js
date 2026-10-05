// Las fechas se muestran solo con estas funciones, y todas igual: 05/10/2026.
// El servidor las manda crudas ('2026-10-05', o '2026-10-05 14:30' si llevan
// hora, ya en hora de Lima) y asi se guardan, ordenan y comparan.

// 'YYYY-MM-DD' es una fecha sin hora. `new Date('2026-09-10')` la interpreta
// como medianoche UTC y en Perú se muestra el día anterior, así que se arma en
// hora local antes de formatear.
function aFechaLocal(iso) {
  const [anio, mes, dia] = String(iso).slice(0, 10).split('-').map(Number)
  if (!anio || !mes || !dia) return null
  return new Date(anio, mes - 1, dia)
}

const dosCifras = (n) => String(n).padStart(2, '0')

export function fechaCorta(valor) {
  const fecha = valor ? aFechaLocal(valor) : null
  return fecha ? `${dosCifras(fecha.getDate())}/${dosCifras(fecha.getMonth() + 1)}/${fecha.getFullYear()}` : ''
}

// '14:30' de '2026-10-05 14:30' o '2026-10-05T14:30:00'. Se lee del texto, sin
// pasar por Date, para no moverla de zona horaria.
export function horaCorta(valor) {
  return String(valor || '').match(/[ T](\d{2}:\d{2})/)?.[1] || ''
}

export function fechaHora(valor) {
  return [fechaCorta(valor), horaCorta(valor)].filter(Boolean).join(' ')
}

// 'ahora', '5 min', '3 h', 'ayer', '12 d'; desde un mes, la fecha.
export function tiempoRelativo(valor) {
  const s = Math.floor((Date.now() - new Date(valor).getTime()) / 1000)
  if (s < 60) return 'ahora'
  const m = Math.floor(s / 60); if (m < 60) return `${m} min`
  const h = Math.floor(m / 60); if (h < 24) return `${h} h`
  const d = Math.floor(h / 24); if (d === 1) return 'ayer'
  if (d < 30) return `${d} d`
  return fechaCorta(valor)
}

// Dias de calendario de una fecha a otra; negativo si `hasta` es antes.
export function diasEntre(desde, hasta) {
  const inicio = aFechaLocal(desde)
  const fin = aFechaLocal(hasta)
  if (!inicio || !fin) return null
  return Math.round((fin - inicio) / 86400000)
}

// Un Date como 'YYYY-MM-DD', en hora local. toISOString() da el dia de UTC, que
// desde las 19:00 de Lima ya es el siguiente.
export function fechaISO(fecha) {
  return `${fecha.getFullYear()}-${dosCifras(fecha.getMonth() + 1)}-${dosCifras(fecha.getDate())}`
}

export const hoyISO = () => fechaISO(new Date())
