export default {
    user_name_rules(){
        return [
            v => !!v || "Usuario es requerido",
            v => (v && v.length <= 120) || "No debe ser mayor a 120 caracteres",
            v => (v && v.trim().length !== 0) || "Ingrese Usuario válido",
            v => (v && v.replace(/\s/g, '').length === v.length) || "Usuario no puede contener espacios en blanco",
            v => (v && v.length >= 6) || "Usuario es de al menos 6 caracteres"
        ]
    },
    first_name_rules(){
        return [
            v => !!v || "Nombre es requerido",
            v => (v && v.length <= 120) || "No debe ser mayor a 120 caracteres",
            v => (v && v.trim().length !== 0) || "Ingrese Nombre válido",
        ]
    },
    last_name_rules(){
        return [
            v => !!v || "Apellido es requerido",
            v => (v && v.length <= 120) || "No debe ser mayor a 120 caracteres",
            v => (v && v.trim().length !== 0) || "Ingrese Apellido válido",
        ]
    },
    password_rules() {
        return [
            v => !!v || "Contraseña es requerida",
            v => (v && v.length >= 8) || "La contraseña es de al menos 8 caracteres"
        ]
    },
    email_rules() {
        return [
            (v) => !v || /.+@.+\..+/.test(v) || "El correo debe ser válido",
        ]
    },
    user_kind_rules() {
        return [
            v => !!v || "Rol es requerido",
        ]
    }
}