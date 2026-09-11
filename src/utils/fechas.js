// 'YYYY-MM-DD' es una fecha sin hora. `new Date('2026-09-10')` la interpreta
// como medianoche UTC y en Perú se muestra el día anterior, así que se arma en
// hora local antes de formatear.
function aFechaLocal(iso) {
  const [anio, mes, dia] = String(iso).slice(0, 10).split('-').map(Number)
  if (!anio || !mes || !dia) return null
  return new Date(anio, mes - 1, dia)
}

export function fechaCorta(iso) {
  const fecha = iso ? aFechaLocal(iso) : null
  return fecha ? fecha.toLocaleDateString('es-PE') : ''
}

export function hoyISO() {
  const hoy = new Date()
  const mes = String(hoy.getMonth() + 1).padStart(2, '0')
  const dia = String(hoy.getDate()).padStart(2, '0')
  return `${hoy.getFullYear()}-${mes}-${dia}`
}
