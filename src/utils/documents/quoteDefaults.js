import { hoyISO } from '@/utils/dates'

export const CURRENT_QUOTE_SCHEMA = "1.4"

// Los mismos topes que apps/documents/cotizacion.py: sin ellos una fila del PDF
// podria ser mas alta que una hoja.
export const LIMITES = {
  descripcion: 300,
  comentario: 500,
  observacion: 500,
  grupo: 120,
  area: 120,
  // Sin tope el campo pasa a notacion cientifica y el total no entra en su columna.
  cantidad: 999,
  precio: 999999.99,
}

// Lo que se escribe en un numero, sin pasar del tope ni de dos decimales.
export const acotado = (valor, maximo) => {
  if (valor === '' || valor === null || Number.isNaN(Number(valor))) return valor
  return Math.min(Math.round(Number(valor) * 100) / 100, maximo)
}

// Una fila de items con este tipo es el titulo de un grupo: no suma ni se
// numera. El mismo GRUPO de cotizacion.py.
const GRUPO = "group"
export const esGrupo = (fila) => fila?.type === GRUPO
export const grupoVacio = () => ({ type: GRUPO, description: "" })

export const UNIDADES = ['und', 'serv', 'glb', 'dias']

export const FORMAS_DE_PAGO = ['Contado', 'Crédito 15 días', 'Crédito 30 días']

const ACEPTACION = "Para aceptar esta cotización, envíe su orden de compra, orden de servicio o confirmación por correo a ventas@daicomsac.com, indicando el N.° de cotización."
// Confidencialidad y quejas cubren lo que pide la ISO/IEC 17025 (4.2 y 7.9).
const CONFIDENCIALIDAD = {
  title: "Confidencialidad",
  items: ["Toda la información del cliente y de los servicios realizados se trata como confidencial y no se comparte con terceros sin su autorización. Si la ley nos obliga a entregarla, se le avisa antes, salvo que la ley lo prohíba."]
}
const QUEJAS = {
  title: "Quejas",
  items: ["Si tiene una queja sobre el servicio, escríbanos a ventas@daicomsac.com: le confirmamos la recepción y le informamos el avance y el resultado. Puede solicitar nuestro procedimiento de atención de quejas."]
}

// Las variantes de la cotizacion (meta.kind), las mismas que TIPOS en
// apps/documents/cotizacion.py. Se elige al crearla y no se cambia despues;
// de aca salen sus valores por defecto.
export const TIPOS_DE_COTIZACION = {
  servicio: {
    texto: "Servicio",
    sigla: "SRV",
    detalle: "Calibración y otros servicios",
    icono: "mdi-wrench-outline",
    etiquetaPlazo: "Plazo de entrega",
    ejemploPlazo: "Ej: 5 días hábiles",
    plazo: "",
    unidad: "und",
    etiquetaItems: "Servicios",
    ejemploItem: "Ej: Calibración de vernier digital",
    entrada: "Le hacemos llegar nuestra propuesta económica por los servicios solicitados:",
    terms: [
      {
        title: "Aceptación",
        items: [
          ACEPTACION,
          "Los precios se basan en la información enviada por el cliente. Si cambian los equipos, las cantidades o el alcance, avise a su asesor comercial: el precio y el plazo pueden variar."
        ]
      },
      {
        title: "Recepción de equipos",
        items: [
          "Los equipos deben llegar limpios, operativos y con sus accesorios (cables, baterías, cargador).",
          "Horario de recepción y atención: lunes a viernes, de 08:00 a 17:00 h.",
          "Si un equipo llega dañado o no se puede calibrar, se le informa antes de continuar. El ajuste y la reparación no están incluidos y se cotizan aparte.",
          "El envío y el recojo de los equipos corren por cuenta del cliente."
        ]
      },
      {
        title: "Servicio y certificados",
        items: [
          "El plazo de entrega se cuenta desde la recepción del equipo.",
          "Al terminar el servicio se emite el certificado de calibración.",
          "En servicios en campo se facturan los días efectivos de trabajo, que pueden modificar el monto cotizado.",
          "Si parte del servicio se subcontrata, se le informa antes y DAICOM S.A.C. responde por sus resultados.",
          "Si requiere una declaración de conformidad (cumple / no cumple), la regla de decisión se acuerda antes del servicio."
        ]
      },
      CONFIDENCIALIDAD,
      {
        title: "Recojo",
        items: [
          "Los equipos no recogidos dentro de los 30 días siguientes al aviso de término quedan bajo responsabilidad del cliente."
        ]
      },
      QUEJAS
    ]
  },
  alquiler: {
    texto: "Alquiler",
    sigla: "ALQ",
    detalle: "Equipos alquilados por días",
    icono: "mdi-truck-delivery-outline",
    etiquetaPlazo: "Periodo de alquiler",
    ejemploPlazo: "Ej: 7 días desde la salida del equipo",
    plazo: "",
    unidad: "dias",
    etiquetaItems: "Equipos",
    ejemploItem: "Ej: Multímetro FLUKE 87V",
    entrada: "Le hacemos llegar nuestra propuesta económica por el alquiler de los equipos solicitados:",
    terms: [
      {
        title: "Aceptación",
        items: [
          ACEPTACION,
          "Los precios se basan en los equipos y el periodo solicitados. Si cambian, el precio puede variar."
        ]
      },
      {
        title: "Periodo, entrega y devolución",
        items: [
          "El alquiler se cuenta desde la salida del equipo de nuestras instalaciones hasta su devolución. Si se necesita extender el periodo, se coordina antes; la extensión y la tarifa de los días adicionales están sujetas a evaluación previa.",
          "La devolución anticipada se coordina antes. El ajuste del monto, si corresponde, se evalúa en cada caso.",
          "El envío y el recojo de los equipos corren por cuenta del cliente, salvo acuerdo distinto."
        ]
      },
      {
        title: "Recepción y uso",
        items: [
          "El equipo se entrega operativo, con su certificado de calibración vigente y los accesorios indicados en la guía de remisión.",
          "Revise el equipo al recibirlo: cualquier falla o faltante se comunica dentro de las 48 horas; pasado ese plazo, se considera recibido conforme.",
          "El equipo debe ser usado por personal capacitado, solo en la obra indicada, y no puede cederse ni subalquilarse a terceros."
        ]
      },
      {
        title: "Daños y pérdida",
        items: [
          "El equipo debe devolverse en las mismas condiciones en que se entregó, con todos sus accesorios. DAICOM S.A.C. evalúa su estado al recibirlo.",
          "Desde la entrega hasta la devolución, la pérdida, el robo o el daño del equipo y sus accesorios son responsabilidad del cliente, que asume su reparación o reposición al costo vigente.",
          "Ante una falla en obra, avísenos antes de manipular o reparar el equipo."
        ]
      },
      {
        title: "Pago",
        items: [
          "El alquiler se paga por adelantado. Los días adicionales se valorizan al término."
        ]
      },
      CONFIDENCIALIDAD,
      QUEJAS
    ]
  }
}

export const TIPO_POR_DEFECTO = "servicio"

// Para un select o un filtro, con la sigla de la tabla: [{ value, title, sigla }].
export const OPCIONES_DE_TIPO = Object.entries(TIPOS_DE_COTIZACION)
  .map(([value, tipo]) => ({ value, title: tipo.texto, sigla: tipo.sigla }))

// Una hecha fuera del sistema (con el servidor caido): se sube su PDF.
export const SUBIR_PDF = "subir-pdf"

// Las opciones del boton "Nueva cotización" (meta.nuevo de su ruta).
export const OPCIONES_NUEVA_COTIZACION = [
  ...Object.entries(TIPOS_DE_COTIZACION)
    .map(([valor, tipo]) => ({ valor, texto: tipo.texto, detalle: tipo.detalle, icono: tipo.icono })),
  { valor: SUBIR_PDF, texto: "Subir PDF", detalle: "Hecha fuera del sistema", icono: "mdi-file-upload-outline" },
]

export const itemVacio = (unidad = "und") => ({
  description: "",
  quantity: 1,
  unit: unidad,
  unit_price: 0,
  row_total: 0,
  observations: "",
  // El codigo de la acreditacion bajo la que se declara (apps/company/acreditaciones.py); vacio, ninguna.
  accreditation: "",
  // El id del equipo maestro, si se eligio del catalogo: lo usa la orden. El
  // nombre y el precio quedan como se eligieron. null si se escribio a mano.
  equipo: null
})

export const quoteDefaultJSON = (kind = TIPO_POR_DEFECTO) => {
  const tipo = TIPOS_DE_COTIZACION[kind]
  return {
    meta: {
      schema_version: CURRENT_QUOTE_SCHEMA,
      kind,
      city: "Arequipa",
      date: hoyISO(),
      validity_days: 15,
      payment_terms: "Contado",
      currency: "PEN",
      delivery_time: tipo.plazo
    },
    // El canal de la cotizacion. No se edita en el formulario.
    contact: {
      email: "ventas@daicomsac.com",
      phone: "974 668 170"
    },
    billing_client: {
      type: "company",
      business_name: "",
      doc_type: "RUC",
      doc_number: "",
      address: "",
      // El contacto de esta cotizacion: area o dependencia, persona, telefono y
      // correo. No salen del cliente: dependen del area a la que va.
      area: "",
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
    intro_text: tipo.entrada,
    items: [],
    totals: {
      subtotal: 0,
      igv_percent: 18,
      igv: 0,
      total: 0
    },
    observations: [],
    payment_note: "Envíe el comprobante de pago junto con su orden de compra u orden de servicio, indicando el N.° de cotización. La factura electrónica se emite a nombre del cliente y se envía por correo.",
    terms: JSON.parse(JSON.stringify(tipo.terms))
  }
}

// Lo que se ve mientras se edita. Los que quedan en la cotizacion los calcula el
// back al guardar.
export const totalDeFila = (item) => esGrupo(item)
  ? 0
  : Math.round((Number(item.quantity) || 0) * (Number(item.unit_price) || 0) * 100) / 100

export const totalesDe = (cotizacion) => {
  const subtotal = cotizacion.items.reduce((suma, item) => suma + totalDeFila(item), 0)
  const igv = Math.round(subtotal * cotizacion.totals.igv_percent) / 100
  return { subtotal, igv, total: subtotal + igv }
}

const conLaForma = (base, guardado = {}) =>
  Object.fromEntries(Object.keys(base).map(campo => [campo, guardado[campo] ?? base[campo]]))

// Una cotizacion guardada, con la forma de quoteDefaultJSON: los campos que no
// estan en ella se descartan y los que faltan salen de los valores por defecto
// de su tipo. El contacto es siempre el vigente.
export const cotizacionDe = (guardada) => {
  const copia = JSON.parse(JSON.stringify(guardada || {}))
  const kind = TIPOS_DE_COTIZACION[copia.meta?.kind] ? copia.meta.kind : TIPO_POR_DEFECTO
  const base = quoteDefaultJSON(kind)
  return {
    ...conLaForma(base, copia),
    meta: { ...conLaForma(base.meta, copia.meta), kind },
    billing_client: conLaForma(base.billing_client, copia.billing_client),
    certificate_data: conLaForma(base.certificate_data, copia.certificate_data),
    items: (copia.items || []).map(item => esGrupo(item) ? conLaForma(grupoVacio(), item) : conLaForma(itemVacio(), item)),
    contact: base.contact,
  }
}
