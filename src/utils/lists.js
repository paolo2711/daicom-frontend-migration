// "Otro igual": una fila nueva justo debajo de la de `indice`, y la devuelve para abrirla.
// `copia` arma lo que lleva la nueva; por defecto, todo (las filas son datos JSON).
export function copiarDebajo (lista, indice, copia = fila => JSON.parse(JSON.stringify(fila))) {
  const nueva = copia(lista[indice])
  lista.splice(indice + 1, 0, nueva)
  return nueva
}
