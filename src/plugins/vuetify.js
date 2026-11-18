import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import { es } from 'vuetify/locale'
import '@mdi/font/css/materialdesignicons.css'

const dark_theme = {
    dark: true,
    colors: {
        primary: '#1F4690',
        info: '#1e88e5',
        success: '#1E8449',
        accent: '#fc4b6c',
        error: '#fc4b6c',
        default: '#563dea',
        modal_header: '#1F4690',
        modal_warning: '#E65100',
        // Los tres planos de una pantalla de trabajo: el fondo, la hoja principal y las de apoyo.
        fondo_de_trabajo: '#141414',
        hoja: '#2B2B2B',
        hoja_de_apoyo: '#232323',
        // El de los paneles que flotan; en los formularios marca la fila elegida y el panel que abre.
        panel: '#2C3849',
        // La marca de lo elegido: 3:1 contra el tono del panel.
        seleccion: '#6C9BE8'
    }
}

const light_theme = {
    dark: false,
    colors: {
        primary: '#1F4690',
        info: '#1e88e5',
        success: '#1E8449',
        accent: '#fc4b6c',
        error: '#fc4b6c',
        default: '#563dea',
        modal_header: '#1F4690',
        modal_warning: '#F57C00',
        fondo_de_trabajo: '#CFD4DB',
        hoja: '#FFFFFF',
        hoja_de_apoyo: '#F1F4F8',
        panel: '#DCE4F0',
        seleccion: '#1F4690'
    }
}

export default createVuetify({
    components,
    directives,
    locale: {
        locale: 'es',
        messages: { es }
    },
    theme: {
        defaultTheme: localStorage.getItem('dark') === 'false' ? 'light' : 'dark',
        themes: {
            dark: dark_theme,
            light: light_theme,
        }
    }
})