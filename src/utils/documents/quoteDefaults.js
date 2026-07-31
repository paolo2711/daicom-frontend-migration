export const CURRENT_QUOTE_SCHEMA = "1.0"

export const quoteDefaultJSON = () => {
  return {
    meta: {
      schema_version: CURRENT_QUOTE_SCHEMA, // Lo guardamos en el JSON por trazabilidad
      format_code: "FORD-022",
      revision: "1",
      city: "Arequipa",
      date: new Date().toISOString().substring(0, 10),
      validity_days: 15,
      payment_terms: "Contado",
      currency: "PEN"
    },
    billing_client: {
      type: "company",
      business_name: "",
      doc_type: "RUC",
      doc_number: "",
      address: "",
      contact_name: "",
      phone: "",
      email: ""
    },
    certificate_data: {
      same_as_billing_client: true,
      client_ref_id: null,
      business_name: "",
      address: ""
    },
    intro_text: "Mediante la presente nos es grato saludarlo y a la vez hacerle llegar nuestra propuesta económica: Ítems de servicios requeridos.",
    items: [],
    totals: {
      subtotal: 0,
      igv_percent: 18,
      igv: 0,
      total: 0
    },
    observations: [
      "Realizar el pago a las cuentas del BANCO DE CRÉDITO detalladas al final.",
      "Los servicios se ejecutarán en horario laboral de lunes a viernes de 08:00 h a 17:00 h."
    ],
    service_conditions_note: "El cliente deberá enviar el voucher y/o transferencia de pago, orden de compra, orden de servicio acompañado de esta proforma al correo de nuestro representante comercial y al correo de ventas@daicomsac.com (para la emisión de su factura electrónica, la cual saldrá con datos del cliente, y será enviada de manera digital).",
    complementary_concepts: [],
    service_conditions: [
      "De ser aceptada nuestra cotización les solicitamos nos notifiquen mediante una orden de compra, orden de servicio o respuesta afirmativa vía e-mail de la presente propuesta, favor de indicar el número de cotización en toda documentación durante el proceso.",
      "DAICOM S.A.C. solicita y brinda las aclaraciones necesarias sobre el servicio antes de emitir una cotización, esta se envía cuando el cliente remite la información completa sobre el alcance comprendido en el servicio que requiere contratar; de suscitarse algún inconveniente, el laboratorio se deslinda de cualquier responsabilidad no tratada o acordada con el cliente.",
      "El laboratorio se compromete a mantener toda la información de las actividades realizadas en estricta confidencialidad.",
      "DAICOM S.A.C. se responsabiliza por los resultados de los servicios subcontratados a terceros.",
      "Si existiera alguna variación en su requerimiento respecto a su solicitud inicial, ésta deberá ser informada a su coordinador comercial para realizar las modificaciones necesarias a nuestra propuesta y gestiones internas del caso.",
      "Al término del servicio se contabilizará la cantidad de días efectivos y reales de trabajo el cual puede modificar la presente cotización."
    ],
    estimated_delivery: {
      label: "Tiempo estimado del servicio",
      value: "5 días hábiles"
    },
    final_note: "Al finalizar el servicio se realizará la entrega conforme a lo coordinado.",
    requirements_note: "MEDIOS Y REQUERIMIENTOS QUE SUMINISTRA EL SOLICITANTE.",
    requirements: [
      "Los instrumentos del cliente se deben encontrar en perfectas condiciones de operación."
    ]
  }
}