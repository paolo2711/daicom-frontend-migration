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
        modal_warning: '#E65100'
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
        modal_warning: '#F57C00'
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