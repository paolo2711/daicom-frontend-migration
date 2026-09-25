export default {
  getMap(element) {
    return {
      id: element.id,
      
      // Control de Estado y Relaciones
      status: element.status,
      order: element.order,

      // Datos Técnicos y de Registro
      certificate_type: element.certificate_type,
      certificate_type_label: element.certificate_type_label,
      correlative: element.correlative,
      registry_code: element.registry_code,
      previous_numbers: element.previous_numbers,
      uuid: element.uuid,
      
      // Entidades Relacionadas
      client_data: element.client_data,
      lab: element.lab,
      lab_data: element.lab_data,

      // Especificaciones del Equipo
      equipment: element.equipment,
      brand: element.brand,

      // Fechas
      emission_date: element.emission_date,
      created_at: element.created_at,
      
      // Archivos y Nube
      uploaded_xls_url: element.uploaded_xls_url,
      attached_pdf: element.attached_pdf,
      uploaded: element.uploaded,
      signature_requested: element.signature_requested,
      
      // Metadatos de envío
      sent_date: element.sent_date
    };
  },
  
  // Lo que la fila muestra de su orden. La lista lo trae aparte, una vez por
  // orden; el detalle de un certificado lo trae junto a el.
  getOrden(element) {
    return {
      order_number: element.order_number,
      order_status: element.order_status,
      order_requiere_pago: element.order_requiere_pago,
      order_has_invoices: element.order_has_invoices,
      order_has_payments: element.order_has_payments,
    };
  },

  // Lo que el modal edita. Lo demas se cambia con su propia accion.
  putMap(element) {
    return {
      client: element.client,
      lab: element.lab,
      equipment: element.equipment,
      emission_date: element.emission_date,
      observations: element.observations,
    };
  }
};