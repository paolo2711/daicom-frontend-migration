export default {
    lab_name_rules(){
        return [
            v => !!v || "Nombre es requerido",
            v => (v && v.length <= 120) || "No debe ser mayor a 120 caracteres",
            v => (v && v.trim().length !== 0) || "Ingrese Nombre válido",
        ]
    },
    lab_code_rules(){
        return [
            v => !!v || "Código es requerido",
            v => (v && v.length <= 6) || "No debe ser mayor a 6 caracteres",
            v => (v && v.trim().length !== 0) || "Ingrese código válido",
        ]
    }
}