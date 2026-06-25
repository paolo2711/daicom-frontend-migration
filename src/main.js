import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import axios from 'axios'

// 1. Importamos tus Plugins migrados
import vuetify from './plugins/vuetify'
import registerBaseComponents from './plugins/base'
import registerAlerts from './plugins/alerts'

// 2. Variables SCSS
import '@/scss/variables.scss'
import '@/scss/vuetify/overrides.scss' // <-- AGREGAR ESTA LÍNEA
import 'animate.css'

// 3. Configuración de Axios
//axios.defaults.withCredentials = true
//
axios.defaults.baseURL = "http://192.168.15.16/api/"
//axios.defaults.baseURL = "http://127.0.0.1:8000/api/" //ruta local
//axios.defaults.baseURL = "http://192.168.15.16:8000/api/" //ruta local del server

//axios.defaults.baseURL = "http://100.127.45.59/api/";//del server app// pc casa
//axios.defaults.baseURL = window.location.origin + "/api/";// funcional de app + conexion pagina

const app = createApp(App)

// 4. Inyecciones
app.use(createPinia())
app.use(router)
app.use(vuetify)

// 5. Registros globales
registerAlerts(app)
registerBaseComponents(app)

app.mount('#app')