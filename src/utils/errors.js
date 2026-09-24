// Lo que el servidor respondio a un pedido rechazado, listo para mostrar.
// El back manda `error`, `detail` o los mensajes de cada campo del serializer.
export function mensajeDeError(error, porDefecto) {
  const respuesta = error?.response
  if (!respuesta) return 'No hay conexión con el servidor. Revisa tu red e intenta de nuevo.'
  if (respuesta.status >= 500) return 'El servidor tuvo un problema. Intenta de nuevo; si sigue, avisa a soporte.'

  const data = respuesta.data
  if (typeof data?.error === 'string') return data.error
  if (typeof data?.detail === 'string') return data.detail
  const deLosCampos = data && typeof data === 'object'
    ? Object.values(data).flat().filter(m => typeof m === 'string')
    : []
  return deLosCampos.join(' | ') || porDefecto
}
