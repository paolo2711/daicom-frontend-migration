export const CURRENT_FORMATO_INGRESO_SCHEMA = "1.0"

export const formatoIngresoDefaultJSON = () => {
  return {
    schema_version: CURRENT_FORMATO_INGRESO_SCHEMA, // trazabilidad, igual que en cotización
    format_code: "FORD-042",
    revision: "0",
    city: "Arequipa",
    date: new Date().toISOString().substring(0, 10),
    client_data: {
      full_name: "",
      dni: "",
      business_name: "",
      ruc: "",
      address: "",
      phone: ""
    },
    instruments: [
      // Cada instrumento cargado agrega una fila dinámica en el PDF
      // (a diferencia del papel original, que traía 11 filas fijas).
      // { description: "", brand: "", model: "", serial: "", condition: "" }
    ],
    observations: [],
    legal_notes: [
      "El presente documento no debe de ser reproducido o alterado en forma parcial o total sin la autorización expresa y por escrito del Laboratorio.",
      "Para el recojo de los instrumentos deberá presentar este formato debidamente llenado."
    ]
  }
}

// Helper para agregar un instrumento vacío desde el botón "+ Agregar" en Vue
export const emptyInstrumentRow = () => ({
  description: "",
  brand: "",
  model: "",
  serial: "",
  condition: ""
})