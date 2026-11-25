import { useRouteFilters } from '@/composables/useRouteFilters'

// Los de las dos pestañas de Órdenes: ?buscar_orden=OS-1 y ?pildora=missing_payment.
export function useOrderRouteFilters (filter_order, pildora, aplicar) {
  useRouteFilters(({ buscar_orden, pildora: pedida }) => {
    filter_order.value = buscar_orden || ''
    pildora.value = pedida || null
  }, aplicar)
}
