// Guarda un archivo con el nombre elegido. Por blob: asi lo respeta tambien en
// dev, donde el archivo lo sirve otro puerto.
export function guardarArchivo(blob, nombre) {
  const url = URL.createObjectURL(blob)
  const enlace = document.createElement('a')
  enlace.href = url
  enlace.download = nombre
  enlace.click()
  URL.revokeObjectURL(url)
}

// El archivo de una peticion con responseType 'blob'. Si el back la rechaza,
// su respuesta tambien llega como blob: se lee como JSON para que el error
// tenga la misma forma que en las demas peticiones.
export async function archivoDe(peticion) {
  try {
    const { data } = await peticion
    return data
  } catch (error) {
    if (error.response?.data instanceof Blob) {
      try { error.response.data = JSON.parse(await error.response.data.text()) } catch { /* no era JSON */ }
    }
    throw error
  }
}
