export default {
    name_rules(){
        return [
            v => !!v || "Nombre es requerido",
            value => (value || '').length <= 120 || "Máximo 120 caracteres",
            v => (v && v.trim().length !== 0) || "Ingrese nombre válido",
        ]
    },
    address_rules() {
        return [
            value => (value || '').length <= 120 || "Máximo 120 caracteres",
        ]
    },
    phone_rules() {
        return [
            value => (value || '').length <= 14 || "Máximo 14 caracteres",
        ]
    },
    document_rules() {
        return [
            value => (value || '').length <= 14 || "Máximo 14 caracteres",
        ]
    },
    correlative_rules(){
        return [
            v => !!v || "Correlativo es requerido",
        ]
    },
    email_rules() {
        return [
            (v) => !v || /.+@.+\..+/.test(v) || "El correo debe ser válido",
        ]
    }
}