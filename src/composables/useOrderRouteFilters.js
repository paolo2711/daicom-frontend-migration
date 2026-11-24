import { useRouteFilters } from '@/composables/useRouteFilters'

// Los de las dos pestañas de Órdenes: ?buscar_orden=OS-1, ?sin_factura=1 y ?falta_pago=1.
export function useOrderRouteFilters ({ filter_order, filtro_sin_factura, filtro_falta_pago, filtro_a_credito }, aplicar) {
  useRouteFilters(({ buscar_orden, sin_factura, falta_pago }) => {
    filter_order.value = buscar_orden || ''
    filtro_sin_factura.value = Boolean(sin_factura)
    filtro_falta_pago.value = Boolean(falta_pago)
    filtro_a_credito.value = false
  }, aplicar)
}
