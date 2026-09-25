import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import axios from 'axios'

// 1. Importamos Plugins migrados
import vuetify from './plugins/vuetify'
import registerBaseComponents from './plugins/base'
import registerAlerts from './plugins/alerts'
import registerSession from './plugins/session'

// 2. Variables SCSS
import '@/scss/variables.scss'
import '@/scss/notifications.scss'   // tonos de notificación (cableado único)
import '@/scss/vuetify/overrides.scss'
import 'animate.css'

// 3. Configuración de Axios
//axios.defaults.withCredentials = true

// La ruta sale de .env.development (npm run dev) o .env.production (npm run
// build), donde estan las cuatro que usamos. Sin VITE_API_URL se arma con el
// origen de la pagina, que es lo que sirve igual por IP o por daicom.com.
axios.defaults.baseURL = import.meta.env.VITE_API_URL || window.location.origin + "/api/"

const app = createApp(App)

// 4. Inyecciones
app.use(createPinia())
app.use(router)
app.use(vuetify)

// 5. Registros globales
registerAlerts(app)
registerBaseComponents(app)
registerSession()

app.mount('#app')