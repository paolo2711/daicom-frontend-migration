// El server avisa que cambiaron varias filas. Solo importa lo que el usuario
// tiene en pantalla: si no ve ninguna no hay nada que hacer, si ve pocas se
// parchean, y si ve muchas sale mas barato releer la pagina de una.
export function decidirRefresco(idsCambiados, idsVisibles, topeParcheo = 5) {
  const visibles = new Set([...idsVisibles].map(String))
  const afectadas = [...idsCambiados].map(String).filter((id) => visibles.has(id))

  if (afectadas.length === 0) return { accion: 'nada', ids: [] }
  if (afectadas.length <= topeParcheo) return { accion: 'parchear', ids: afectadas }
  return { accion: 'refrescar', ids: afectadas }
}
