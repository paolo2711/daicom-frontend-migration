export default {
    correlative_rules(){
        return [
            v => !!v || "Correlativo es requerido",
            v => (v && v.length <= 8) || "Máximo 8 caracteres",
        ]
    },
    client_rules(){
        return [
            v => !!v || "Cliente es requerido",
        ]
    }
}