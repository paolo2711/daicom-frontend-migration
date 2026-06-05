<template>
  <v-container id="login" class="fill-height justify-center" tag="section">
    <div class='light x1'></div>
    <div class='light x3'></div>
    <div class='light x5'></div>
    <div class='light x7'></div>
    <div class='light x9'></div>

    <v-row justify="center">
      <v-col lg="11" sm="8" xl="7">
        <v-card class="elevation-6">
          <v-row>
            <v-col lg="7" class="bg-primary d-none d-md-flex align-center justify-center">
              <div class="d-none d-sm-block">
                <div class="d-flex align-center pa-10 text-center">
                  <div>
                    <h1 class="text-h4 text-white font-weight-medium"><b>Daicom S.A.C.</b></h1>
                    <h4 class="text-subtitle-1 mt-4 text-white op-5 font-weight-regular"><b>INICIO DE SESIÓN</b></h4>
                  </div>
                </div>
              </div>
            </v-col>
            <v-col lg="5">
              <div class="pa-7 pa-sm-12">
                <img src="@/assets/images/logo-icon.png" alt="Logo Daicom" />
                <h2 class="font-weight-bold mt-4 text-grey-darken-2">Inicio de sesión</h2>
                <h6 class="text-subtitle-1">Ingrese sus credenciales de usuario</h6>

                <v-form ref="form" v-model="valid" lazy-validation @submit.prevent="submit">
                  <v-text-field
                    v-model="username"
                    :rules="usernameRules"
                    label="Usuario"
                    class="mt-4"
                    required
                    variant="outlined"
                    @keydown.space.prevent
                  ></v-text-field>
                  <v-text-field
                    v-model="password"                    
                    :rules="passwordRules"
                    label="Contraseña"
                    required
                    variant="outlined"
                    :append-inner-icon="showPassword ? 'mdi-eye' : 'mdi-eye-off'"
                    @click:append-inner="showPassword = !showPassword"
                    :type="showPassword ? 'text' : 'password'"
                    @keydown.space.prevent
                    counter
                  ></v-text-field>

                  <v-btn
                    :disabled="!valid" 
                    :loading="loading"
                    color="primary"
                    block
                    class="mt-4"
                    type="submit"
                  >
                    Iniciar Sesión
                  </v-btn>
                </v-form>
              </div>
            </v-col>
          </v-row>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'

const router = useRouter()
const authStore = useAuthStore()

// Referencias del formulario
const form = ref(null)
const valid = ref(false)
const loading = ref(false)
const showPassword = ref(false)

// Estado de los inputs
const username = ref("")
const password = ref("")

// Reglas de validación
const usernameRules = [
  v => !!v || "Nombre de usuario es requerido",
  v => (v && v.length >= 6) || "El usuario es de al menos 6 caracteres"
]
const passwordRules = [
  v => !!v || "Contraseña es requerida",
  v => (v && v.length >= 6) || "La contraseña es de al menos 6 caracteres"
]

// Comprobar sesión activa al montar el componente
onMounted(() => {
  if (authStore.status.loggedIn) {
    router.push({ path: "/home" })
  }
})

// Función de envío
const submit = async () => {
  const { valid: isValid } = await form.value.validate()
  
  if (isValid) {
    loading.value = true
    try {
      await authStore.login({ 
        username: username.value, 
        password: password.value 
      })
      
      if (authStore.user?.kind < 1) {
        router.push({ path: "/home" })
      } else {
        router.push({ path: "/profile" })
      }
    } catch (error) {
      // El error visual ya es manejado por SweetAlert en el authStore
      console.error("Error en login:", error)
    } finally {
      loading.value = false
    }
  }
}
</script>

<style scoped>
/* Los estilos CSS originales de animación se mantienen intactos */
.theme--light.v-application, .theme--dark.v-application  {
  background: rgba(255, 255, 255, 0);
}

body {
  margin: 0;
  height: 100vh;
  font-weight: 100;
  background: radial-gradient(white, rgba(8, 25, 58, 0.57));
  -webkit-animation: fadeIn 1 1s ease-out;
  -moz-animation: fadeIn 1 1s ease-out;
  -o-animation: fadeIn 1 1s ease-out;
  animation: fadeIn 1 1s ease-out;
}

.light {
  position: absolute;
  width: 0px;
  opacity: .75;
  background-color: white;
  box-shadow: #1f4690 0px 0px 20px 2px;
  opacity: 0;
  top: 100vh;
  bottom: 0px;
  left: 0px;
  right: 0px;
  margin: auto;
}

.x1{ animation: floatUp 4s infinite linear; transform: scale(1.0); }
.x3{ animation: floatUp 2.5s infinite linear; transform: scale(.5); left: -15%; }
.x5{ animation: floatUp 8s infinite linear; transform: scale(2.2); left: -57%; }
.x7{ animation: floatUp 5.3s infinite linear; transform: scale(3.2); left: 37%; }
.x9{ animation: floatUp 4.1s infinite linear; transform: scale(0.9); left: 85%; }

@keyframes floatUp {
  0% { top: 100vh; opacity: 0; }
  25% { opacity: 1; }
  50% { top: 0vh; opacity: .8; }
  75% { opacity: 1; }
  100% { top: -100vh; opacity: 0; }
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
</style>