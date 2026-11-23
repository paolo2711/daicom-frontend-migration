export default {
  getMap(element) {
    if (!element) return null;

    return {
      id: element.id,
      order_number: element.order_number,
      order_type: element.order_type || 1, // 1: Servicio, 2: Alquiler
      status: element.status,
      created_at: element.created_at,
      
      // ─── ESTADO FINANCIERO (reflejo del estado de las facturas) ───
      // La orden ya no tiene moneda: cada factura maneja la suya.
      wants_invoice: element.wants_invoice,
      requiere_pago: element.requiere_pago ?? true,   // false = sin cargo (interno o cortesia)
      detraccion: element.detraccion || null, // { afecto, tasa, monto, moneda } o null (suma de facturas)
      estado_financiero: element.estado_financiero ?? element.status,
      
      // ─── CLIENTE ───
      client: element.client,
      client_data: element.client_data || {},
      observaciones: element.observaciones || '',
      
      progreso: element.progreso || { total: 0, listos: 0 },

      // ─── RELACIONES (Protección contra "undefined.length") ───
      // La fila no las trae: null hasta que se piden sus lineas.
      items: element.items ?? null,
      // La fila no las trae: null hasta que se piden sus lineas.
      rentals: element.rentals ?? null,
      facturas: element.facturas || { cantidad: 0, numero: '', tiene_fiscal: false, no_factura: '', vence: null },
      
      // ─── DATOS EXCLUSIVOS DE ALQUILER (Order Type 2) ───
      client_order_reference: element.client_order_reference || '',
      quote_pdf: element.quote_pdf || null,
      dispatch_guide_pdf: element.dispatch_guide_pdf || null,
      return_guide_pdf: element.return_guide_pdf || null,

      // Resumen de documentos múltiples (OC / valorizaciones) para la columna.
      documentos: element.documentos || { oc_count: 0, val_count: 0, oc_ref: '', oc_last_pdf: null, val_last_pdf: null },
    };
  },
};
