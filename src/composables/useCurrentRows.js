import { computed, shallowRef, toValue, watch } from 'vue'

// Una lista que se recarga trae filas nuevas: lo elegido en ella se reconoce por id y se toma de la lista actual.

// Las marcadas pasan a las filas de la lista; las que la lista no tiene se sueltan.
export function seguirLaLista (lista, marcadas) {
  watch(() => toValue(lista), (filas) => {
    if (!filas || !marcadas.value.length) return
    const porId = new Map(filas.map(f => [f.id, f]))
    const alDia = marcadas.value.map(f => porId.get(f.id)).filter(Boolean)
    if (alDia.length !== marcadas.value.length || alDia.some((f, i) => f !== marcadas.value[i])) marcadas.value = alDia
  }, { deep: 1 })
}

// La fila de un panel: la de la lista con su id o, si la lista no la tiene, la ultima que se le dio.
export function useOpenRow (lista) {
  const ultima = shallowRef(null)
  return computed({
    get: () => ultima.value && (toValue(lista)?.find(f => f.id === ultima.value.id) ?? ultima.value),
    set: (fila) => { ultima.value = fila },
  })
}

// Las filas de una accion ya hecha salen de las marcadas; las demas siguen.
export function soltar (marcadas, filas) {
  const ids = new Set(filas.map(f => f.id))
  if (marcadas.value.some(f => ids.has(f.id))) marcadas.value = marcadas.value.filter(f => !ids.has(f.id))
}
