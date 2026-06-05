export default {
    client_name_rules(){
        return [
            v => !!v || "Nombre es requerido",
            v => (v && v.length <= 120) || "No debe ser mayor a 120 caracteres",
            v => (v && v.trim().length !== 0) || "Ingrese Nombre válido",
        ]
    },
    client_documentType_rules(){
        return [
            v => !!v || "Tipo de documento es requerido",
        ]
    },
    client_document_rules(){
        return [
            v => !!v || "Documento es requerido",
        ]
    },
    client_address_rules(){
        return []
    },
    client_phone_rules(){
        return []
    },
    client_email_rules(){
        return [
            (v) => !v || /.+@.+\..+/.test(v) || "El correo debe ser válido",
        ]
    }
}