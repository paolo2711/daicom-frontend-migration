import { ref } from 'vue'
import ServicioCatalogoDataService from '@/services/equipments/servicioCatalogoDataService'

// Los tipos de servicio del catalogo, como los define el back. Se piden una vez
// por pestaña: no cambian mientras se usa la app.
const tipos = ref([])
let pedido = null

export function useServiceTypes() {
  if (!pedido) {
    pedido = ServicioCatalogoDataService.tipos()
      .then(({ data }) => { tipos.value = data })
      .catch(() => { pedido = null })
  }
  return tipos
}
