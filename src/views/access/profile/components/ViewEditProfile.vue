<template>
  <div class="d-flex flex-column" style="gap: 24px;">

    <!--  Datos de la cuenta (siempre editable)  -->
    <v-card variant="flat" class="border rounded-lg bg-surface elevation-0" :loading="is_loading">
      <div class="d-flex align-center pa-4" style="border-bottom: 1px solid var(--v-border-color, rgba(0,0,0,0.12));">
        <v-icon start color="primary" size="28" class="mr-2">mdi-badge-account-horizontal</v-icon>
        <h3 class="text-h6 font-weight mb-0">Información de la cuenta</h3>
        <v-spacer></v-spacer>
        <v-chip color="primary" variant="tonal" size="small" class="font-weight-medium">
          <v-icon start size="16">mdi-shield-account</v-icon>{{ userRole }}
        </v-chip>
      </div>

      <v-card-text class="pt-6">
        <v-form ref="infoForm" @submit.prevent v-model="info_valid">
          <v-row>
            <v-col cols="12" md="6">
              <v-text-field
                v-model="profile.username" label="Usuario (*)" density="compact" counter="120"
                variant="outlined" hide-details="auto" @keydown.space.prevent :rules="user_name_rules"
                @keypress="isLetterOrDigit" prepend-inner-icon="mdi-account"
              />
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field
                v-model="profile.email" label="Correo Electrónico" density="compact"
                variant="outlined" hide-details="auto" :rules="email_rules" prepend-inner-icon="mdi-email"
              />
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field
                v-model="profile.first_name" label="Nombre (*)" density="compact" counter="120"
                variant="outlined" hide-details="auto" :rules="first_name_rules" @keypress="isLetterOrSpace"
              />
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field
                v-model="profile.last_name" label="Apellidos (*)" density="compact" counter="120"
                variant="outlined" hide-details="auto" :rules="last_name_rules" @keypress="isLetterOrSpace"
              />
            </v-col>
            <v-col cols="12">
              <v-file-input
                v-model="uploadSignature" label="Firma Digital (Imagen)" accept="image/png, image/jpeg"
                prepend-inner-icon="mdi-draw-pen" density="compact" variant="outlined" hide-details="auto"
                @change="onSignatureChange"
              />
              <div class="d-flex align-center mt-3" style="gap: 16px;" v-if="signaturePreviewUrl || profile.signature_image">
                <div>
                  <div class="text-caption text-medium-emphasis mb-1">
                    {{ signaturePreviewUrl ? 'Nueva firma (sin guardar):' : 'Firma actual guardada:' }}
                  </div>
                  <v-img :src="signaturePreviewUrl || profile.signature_image" max-width="180" max-height="90" contain class="border rounded" />
                </div>
              </div>
            </v-col>
          </v-row>
        </v-form>
      </v-card-text>

      <v-divider></v-divider>
      <v-card-actions class="px-6 py-3">
        <v-spacer></v-spacer>
        <v-btn variant="text" class="mr-2" @click="resetInfo" :disabled="saving_info">Deshacer</v-btn>
        <v-btn color="primary" variant="flat" class="font-weight-bold px-6 rounded-lg" :loading="saving_info" :disabled="!info_valid" @click="saveInfo">
          <v-icon start size="small">mdi-content-save</v-icon> Guardar cambios
        </v-btn>
      </v-card-actions>
    </v-card>

    <!--  Contrasena (tarjeta aparte)  -->
    <v-card variant="flat" class="border rounded-lg bg-surface elevation-0">
      <div class="d-flex align-center pa-4" style="border-bottom: 1px solid var(--v-border-color, rgba(0,0,0,0.12));">
        <v-icon start color="primary" size="28" class="mr-2">mdi-lock-reset</v-icon>
        <h3 class="text-h6 font-weight mb-0">Contraseña</h3>
      </div>

      <v-card-text class="pt-6">
        <p class="text-body-2 text-medium-emphasis mb-4">
          Para cambiarla, confirma tu contraseña actual y escribe la nueva (mínimo 8 caracteres).
        </p>
        <v-form ref="passwordForm" @submit.prevent v-model="password_valid">
          <v-row>
            <v-col cols="12" md="4">
              <v-text-field
                v-model="pw.current" label="Contraseña Actual (*)" density="compact"
                :type="showCurrent ? 'text' : 'password'"
                :append-inner-icon="showCurrent ? 'mdi-eye' : 'mdi-eye-off'" @click:append-inner="showCurrent = !showCurrent"
                variant="outlined" hide-details="auto" @keydown.space.prevent :rules="current_password_rules"
              />
            </v-col>
            <v-col cols="12" md="4">
              <v-text-field
                v-model="pw.next" label="Nueva Contraseña (*)" density="compact" counter
                :type="showNew ? 'text' : 'password'"
                :append-inner-icon="showNew ? 'mdi-eye' : 'mdi-eye-off'" @click:append-inner="showNew = !showNew"
                variant="outlined" hide-details="auto" @keydown.space.prevent :rules="password_rules" @keypress="isValidPassword"
              />
            </v-col>
            <v-col cols="12" md="4">
              <v-text-field
                v-model="pw.confirm" label="Confirmar Nueva (*)" density="compact"
                :type="showConfirm ? 'text' : 'password'"
                :append-inner-icon="showConfirm ? 'mdi-eye' : 'mdi-eye-off'" @click:append-inner="showConfirm = !showConfirm"
                variant="outlined" hide-details="auto" @keydown.space.prevent :rules="[confirmPasswordRule]"
              />
            </v-col>
          </v-row>
        </v-form>
      </v-card-text>

      <v-divider></v-divider>
      <v-card-actions class="px-6 py-3">
        <v-spacer></v-spacer>
        <v-btn color="primary" variant="flat" class="font-weight-bold px-6 rounded-lg" :loading="saving_pw" :disabled="!password_valid" @click="changePassword">
          <v-icon start size="small">mdi-lock-check</v-icon> Cambiar contraseña
        </v-btn>
      </v-card-actions>
    </v-card>

  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, nextTick } from 'vue'
import Swal from 'sweetalert2'
import { Toast } from '@/plugins/alerts'
import { useAppStore } from '@/stores/appStore'
import UsersRules from '@/validators/rules/usersRules'
import ProfileDataService from '@/services/profile/profileDataService'
import ProfileMappers from '@/mappers/profileMappers'
import Characters from '@/validators/commonValidators/characters'

const appStore = useAppStore()

const infoForm = ref(null)
const passwordForm = ref(null)
const is_loading = ref(false)
const info_valid = ref(false)
const password_valid = ref(false)
const saving_info = ref(false)
const saving_pw = ref(false)
const userRole = ref('')
const uploadSignature = ref([])
const signaturePreviewUrl = ref(null)
const showCurrent = ref(false)
const showNew = ref(false)
const showConfirm = ref(false)

const profile = reactive({
  username: '', first_name: '', last_name: '', email: '', signature_image: null,
})
const pw = reactive({ current: '', next: '', confirm: '' })

const user_name_rules = UsersRules.user_name_rules()
const first_name_rules = UsersRules.first_name_rules()
const last_name_rules = UsersRules.last_name_rules()
const password_rules = UsersRules.password_rules()
const current_password_rules = UsersRules.current_password_rules()
const email_rules = UsersRules.email_rules()

const confirmPasswordRule = computed(() => () => (pw.next === pw.confirm) || 'Las contraseñas no coinciden.')

const getProfile = () => {
  is_loading.value = true
  ProfileDataService.get().then((response) => {
    const mapped = ProfileMappers.putMap(response.data)
    profile.username = mapped.username ?? ''
    profile.first_name = mapped.first_name ?? ''
    profile.last_name = mapped.last_name ?? ''
    profile.email = mapped.email ?? ''
    profile.signature_image = mapped.signature_image ?? null
  }).catch(() => {
    Swal.fire('Error', 'No se pudo cargar la información del perfil.', 'error')
  }).finally(() => { is_loading.value = false })
}

const clearSignaturePreview = () => {
  if (signaturePreviewUrl.value) {
    URL.revokeObjectURL(signaturePreviewUrl.value)
    signaturePreviewUrl.value = null
  }
  uploadSignature.value = []
}

const resetInfo = () => {
  clearSignaturePreview()
  getProfile()
  if (infoForm.value) infoForm.value.resetValidation()
}

const onSignatureChange = () => {
  if (signaturePreviewUrl.value) {
    URL.revokeObjectURL(signaturePreviewUrl.value)
    signaturePreviewUrl.value = null
  }
  const file = Array.isArray(uploadSignature.value) ? uploadSignature.value[0] : uploadSignature.value
  if (file instanceof File) signaturePreviewUrl.value = URL.createObjectURL(file)
}

const showApiError = (e, fallback) => {
  let html = ''
  const fieldNames = { email: 'Email', username: 'Usuario', password: 'Contraseña', current_password: 'Contraseña Actual' }
  if (e.response?.data) {
    for (const key in e.response.data) {
      const field = fieldNames[key] || key
      const errs = e.response.data[key]
      html += `<b>${field}:</b> ${Array.isArray(errs) ? errs.join(', ') : errs}<br>`
    }
  }
  Swal.fire({ ...appStore.errorSavedOptions, html: html || fallback })
}

// Guarda SOLO los datos de la cuenta (sin tocar la contrasena).
const saveInfo = async () => {
  const { valid } = await infoForm.value.validate()
  if (!valid) return
  saving_info.value = true
  try {
    const formData = new FormData()
    formData.append('username', profile.username)
    formData.append('email', profile.email ?? '')
    formData.append('first_name', profile.first_name)
    formData.append('last_name', profile.last_name)
    const file = Array.isArray(uploadSignature.value) ? uploadSignature.value[0] : uploadSignature.value
    if (file instanceof File) formData.append('signature_image', file)

    const r = await ProfileDataService.update(formData)
    if (r.status === 200 || r.status === 204) {
      Toast.fire({ icon: 'success', title: 'Datos actualizados.' })
      clearSignaturePreview()
      getProfile()
    }
  } catch (e) {
    showApiError(e, 'No se pudieron guardar los datos.')
  } finally {
    saving_info.value = false
  }
}

// Cambia SOLO la contrasena (endpoint valida la actual contra la BD).
const changePassword = async () => {
  const { valid } = await passwordForm.value.validate()
  if (!valid) return
  saving_pw.value = true
  try {
    const formData = new FormData()
    formData.append('current_password', pw.current)
    formData.append('password', pw.next)

    const r = await ProfileDataService.update(formData)
    if (r.status === 200 || r.status === 204) {
      Toast.fire({ icon: 'success', title: 'Contraseña actualizada.' })
      pw.current = ''; pw.next = ''; pw.confirm = ''
      // Limpiar los valores re-dispara las reglas (required); esperamos a que se
      // asiente y recien ahi limpiamos la validacion -> sin parpadeo rojo.
      await nextTick()
      passwordForm.value?.resetValidation()
    }
  } catch (e) {
    showApiError(e, 'No se pudo cambiar la contraseña.')
  } finally {
    saving_pw.value = false
  }
}

const isLetterOrDigit = (e) => Characters.checkCharacterAndDigits(e, false)
const isLetterOrSpace = (e) => Characters.checkCharacter(e, true)
const isValidPassword = (e) => Characters.checkCharacterDigitsAndSymbols(e, false)

onMounted(() => {
  try {
    const user = JSON.parse(localStorage.getItem('user')) || {}
    userRole.value = user.kind_description || 'Rol no especificado'
  } catch (e) { userRole.value = 'Rol no especificado' }
  getProfile()
})
</script>
