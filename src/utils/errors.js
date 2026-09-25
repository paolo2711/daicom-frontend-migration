// `nombres`: como se llama cada campo en pantalla.
export function mensajeDeError(error, porDefecto, nombres = {}) {
  const respuesta = error?.response
  if (!respuesta) {
    return error?.request ? 'No hay conexión con el servidor. Revisa tu red e intenta de nuevo.' : porDefecto
  }
  if (respuesta.status >= 500) return 'El servidor tuvo un problema. Intenta de nuevo; si sigue, avisa a soporte.'

  const data = respuesta.data
  if (typeof data?.error === 'string') return data.error
  if (typeof data?.detail === 'string') return data.detail
  if (!data || typeof data !== 'object') return porDefecto

  const porCampo = Object.entries(data).map(([campo, mensajes]) => {
    const texto = [mensajes].flat().filter(m => typeof m === 'string').join(', ')
    if (!texto) return ''
    return nombres[campo] ? `${nombres[campo]}: ${texto}` : texto
  })
  return porCampo.filter(Boolean).join(' | ') || porDefecto
}
