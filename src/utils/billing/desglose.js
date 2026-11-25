import { formaDePago } from '@/utils/billing/facturas'
import { fechaCorta } from '@/utils/dates'
import { monto } from '@/utils/money'

// Las filas de AmountBreakdown para una factura y para el total de una orden. Las cuentas vienen hechas del back.

function loQueQueda (saldo, moneda) {
  if (saldo < 0) return { titulo: 'Pagado de más', valor: monto(-saldo, moneda), tono: 'warning' }
  return { titulo: 'Falta cobrar', valor: monto(saldo, moneda), tono: saldo > 0 ? 'error' : 'success' }
}

// Total, sus notas, la detraccion y lo abonado; con `abonos`, uno por fila.
export function desgloseDeFactura (factura, abonos = null) {
  const moneda = factura.currency
  const filas = [factura.es_fiscal
    ? { titulo: 'Total de la factura', valor: monto(factura.amount, moneda),
        detalle: factura.es_credito ? `Crédito · vence ${fechaCorta(factura.due_date)}` : 'Contado' }
    : { titulo: 'Monto a cobrar', valor: monto(factura.amount, moneda) }]
  for (const nota of factura.notas || []) {
    if (Number(nota.total)) {
      filas.push({ titulo: `Nota de crédito ${nota.numero}`, valor: monto(nota.total, moneda),
                   detalle: nota.motivo_nombre, resta: true })
    }
  }
  if (factura.detraccion_sin_constancia) {
    filas.push({ titulo: 'Detracción', valor: monto(factura.detraccion_sin_constancia, moneda),
                 detalle: 'sin constancia', resta: true })
  }
  if (abonos) {
    abonos.forEach(a => filas.push({ titulo: `Abono ${fechaCorta(a.payment_date)}`, valor: monto(a.amount, a.currency),
                                     detalle: formaDePago(a).texto, resta: true }))
  } else {
    const n = factura.cantidad_de_abonos
    filas.push({ titulo: 'Abonado', valor: monto(factura.total_pagado, moneda), resta: true,
                 detalle: n ? `${n} ${n === 1 ? 'abono' : 'abonos'}` : 'Sin abonos' })
  }
  return { filas, final: loQueQueda(Number(factura.saldo_pendiente), moneda) }
}

// El total de las ordenes en una moneda, como lo manda su resumen. De que se compone, solo si son dos cosas.
export function desgloseDeOrden (total, titulo) {
  const moneda = total.currency
  const suma = (nombre, valor) => (Number(valor) ? [{ titulo: nombre, valor: monto(valor, moneda) }] : [])
  const resta = (nombre, valor) => suma(nombre, valor).map(fila => ({ ...fila, resta: true }))
  const partes = [...suma('Facturado', total.facturado), ...suma('Sin comprobante', total.sin_comprobante)]
  return {
    total: { titulo, valor: monto(total.total, moneda) },
    filas: [...(partes.length > 1 ? partes : []),
            ...resta('Notas de crédito', total.notas), ...resta('Detracción', total.detraccion),
            { titulo: 'Cobrado', valor: monto(total.cobrado, moneda), resta: true }],
    final: loQueQueda(Number(total.falta), moneda),
  }
}
