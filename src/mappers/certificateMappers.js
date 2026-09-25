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
      signed_pdf: element.signed_pdf,
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

  putMap(element) {
    return {
      id: element.id,
      status: element.status,
      order: element.order,
      correlative: element.correlative,
      registry_code: element.registry_code,
      certificate_type: element.certificate_type,
      client: element.client,
      lab: element.lab,
      equipment: element.equipment,
      brand: element.brand,
      model: element.model,
      serie: element.serie,
      indication_interval: element.indication_interval,
      identification_code: element.identification_code,
      calibration_date: element.calibration_date,
      emission_date: element.emission_date,
      uploaded_xls_url: element.uploaded_xls_url,
      signed_pdf: element.signed_pdf,
      signature_requested: element.signature_requested,
      sent_to: element.sent_to,
      sent_date: element.sent_date,
      observations: element.observations
    };
  }
};