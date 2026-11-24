import { watch } from 'vue'
import { useRoute } from 'vue-router'

// Los filtros con que otra pantalla abre esta, en la ruta. `poner(query)` deja todos los suyos como los pide, tambien
// los que no trae; si la ruta cambia con la pantalla abierta, los pone y llama a `aplicar`.
export function useRouteFilters (poner, aplicar = () => {}) {
  const route = useRoute()
  const { path } = route
  poner(route.query)
  watch(() => route.query, (query) => {
    if (route.path !== path) return
    poner(query)
    aplicar()
  })
}
