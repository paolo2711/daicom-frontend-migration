export default {
  getMap(element) {
    if (!element) return null;

    return {
      id: element.id,
      order_number: element.order_number,
      order_type: element.order_type || 1, // 1: Servicio, 2: Alquiler
      status: element.status,
      created_at: element.created_at,
      sent: element.sent,
      
      // ─── ESTADO FINANCIERO (reflejo del estado de las facturas) ───
      // La orden ya no tiene moneda: cada factura maneja la suya.
      wants_invoice: element.wants_invoice,
      detraccion: element.detraccion || null, // { afecto, tasa, monto, moneda } o null (suma de facturas)
      estado_financiero: element.estado_financiero ?? element.status,
      
      // ─── CLIENTE ───
      client: element.client,
      client_data: element.client_data || {},
      
      // ─── RELACIONES (Protección contra "undefined.length") ───
      certificates: element.certificates || [],
      rentals: element.rentals || [],
      payments: element.payments || [],
      invoices: element.invoices || [],
      
      // ─── DATOS EXCLUSIVOS DE ALQUILER (Order Type 2) ───
      client_order_reference: element.client_order_reference || '',
      quote_pdf: element.quote_pdf || null,
      dispatch_guide_pdf: element.dispatch_guide_pdf || null,
      return_guide_pdf: element.return_guide_pdf || null,

      // Resumen de documentos múltiples (OC / valorizaciones) para la columna.
      documentos: element.documentos || { oc_count: 0, val_count: 0, oc_ref: '', oc_last_pdf: null, val_last_pdf: null },
    };
  },
  
  putMap(element) {
    if (!element) return null;
    
    // El putMap de órdenes es más ligero porque la mayoría de acciones 
    // complejas (subir PDFs, vincular facturas) se hacen por FormData
    // en endpoints dedicados, no en el PUT general del objeto Order.
    return {
      id: element.id,
      status: element.status,
      order_type: element.order_type,
      client: element.client,
      wants_invoice: element.wants_invoice,
      client_order_reference: element.client_order_reference,
      sent: element.sent
    };
  }
};