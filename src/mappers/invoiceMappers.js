// Mapper de Facturas (OrderInvoice) — para el Panel de Finanzas.
// Mismo patrón que orderMappers.js: protege contra "undefined.length" /
// "undefined.toFixed" cuando el backend todavía no manda un campo, y le da
// un contrato estable al componente sin importar cambios menores del API.
export default {
  getMap(element) {
    if (!element) return null;

    return {
      id: element.id,
      invoice_number: element.invoice_number || null,
      invoice_date: element.invoice_date || null,
      amount: element.amount != null ? Number(element.amount) : 0,
      currency: element.currency || 'PEN',
      exchange_rate: element.exchange_rate != null ? Number(element.exchange_rate) : null,
      pdf_url: element.pdf_url || null,

      // ─── TIPO Y NATURALEZA ───
      order_type: element.order_type ?? null, // null = limbo (sin vincular)
      es_fiscal: element.es_fiscal ?? true,   // false = factura interna disfrazada

      // ─── DETRACCIÓN (a nivel factura) ───
      detraccion_applies: element.detraccion_applies || false,
      detraccion_amount: element.detraccion_amount != null ? Number(element.detraccion_amount) : 0,

      // ─── ESTADO FINANCIERO (vive en la factura, ver OrderInvoice.status) ───
      status: element.status ?? 2, // 2 = Deuda por defecto

      // ─── CEREBRO FINANCIERO DE LA FACTURA ───
      total_pagado: element.total_pagado != null ? Number(element.total_pagado) : 0,
      saldo_pendiente: element.saldo_pendiente != null ? Number(element.saldo_pendiente) : 0,

      // ─── ÓRDENES VINCULADAS ───
      ordenes_vinculadas: element.ordenes_vinculadas || [],

      // ─── HISTORIAL DE ABONOS (para DialogLiquidacion cuando se abre desde el panel) ───
      payments: element.payments || [],

      created_at: element.created_at || null,
    };
  },
};