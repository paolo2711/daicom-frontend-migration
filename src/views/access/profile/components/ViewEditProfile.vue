<template>
  <v-card variant="flat" class="border rounded-lg bg-surface elevation-0" :loading="is_loading">
    <div class="d-flex align-center pa-4" style="border-bottom: 1px solid var(--v-border-color, rgba(0,0,0,0.12));">
      <v-icon start color="primary" size="28" class="mr-2">mdi-badge-account-horizontal</v-icon>
      <h3 class="text-h6 font-weight mb-0">Información de la cuenta</h3>
      <v-spacer></v-spacer>
      <v-btn 
        v-if="!isEditing" 
        color="primary" 
        variant="flat" 
        prepend-icon="mdi-pencil" 
        @click="isEditing = true"
      >
        Editar Perfil
      </v-btn>
    </div>

    <v-card-text class="pt-6">
      <v-alert variant="tonal" type="info" density="compact" class="mb-6 rounded-lg font-weight-medium">
        Rol en el sistema: <strong>{{ userRole }}</strong>
      </v-alert>

      <v-form ref="editForm" @submit.prevent v-model="is_valid">
        <v-row>
          <v-col cols="12" md="6">
            <v-text-field 
              v-model="profile.username" 
              label="Usuario (*)"
              density="compact" 
              counter="120" 
              variant="outlined" 
              hide-details="auto" 
              :disabled="!isEditing"
              @keydown.space.prevent 
              :rules="user_name_rules"
              @keypress="isLetterOrDigit"
              prepend-inner-icon="mdi-account"
            />
          </v-col>

          <v-col cols="12" md="6">
            <v-text-field 
              v-model="profile.email" 
              label="Correo Electrónico" 
              density="compact" 
              :disabled="!isEditing"
              variant="outlined" 
              hide-details="auto" 
              :rules="email_rules"
              prepend-inner-icon="mdi-email"
            />
          </v-col>

          <v-col cols="12" md="6">
            <v-text-field 
              v-model="profile.first_name" 
              label="Nombre (*)" 
              density="compact" 
              counter="120"
              variant="outlined" 
              hide-details="auto" 
              :rules="first_name_rules" 
              :disabled="!isEditing"
              @keypress="isLetterOrSpace"
            />
          </v-col>

          <v-col cols="12" md="6">
            <v-text-field 
              v-model="profile.last_name" 
              label="Apellidos (*)" 
              density="compact" 
              counter="120"
              variant="outlined" 
              hide-details="auto" 
              :rules="first_name_rules" 
              :disabled="!isEditing"
              @keypress="isLetterOrSpace"
            />
          </v-col>
        </v-row>

        <div class="mt-8 mb-4">
          <v-divider></v-divider>
        </div>

        <div class="d-flex align-center mb-4">
          <h4 class="text-subtitle-1 font-weight">Seguridad y Acceso</h4>
          <v-spacer></v-spacer>
          <v-switch 
            v-model="edit_password" 
            color="primary"
            :disabled="!isEditing"
            :label="edit_password ? 'Actualizar contraseña' : 'Mantener contraseña actual'" 
            hide-details
            inset
          ></v-switch>
        </div>

        <v-expand-transition>
          <v-card v-if="edit_password" variant="outlined" class="pa-4 rounded-lg bg-grey-lighten-4" :class="isDark ? 'bg-grey-darken-4' : ''" style="border-style: dashed !important; border-width: 2px !important;">
            <v-row>
              <v-col cols="12" md="4">
                <v-text-field 
                  v-model="profile.current_password" 
                  label="Contraseña Actual (*)" 
                  density="compact" 
                  type="password"
                  variant="outlined" 
                  hide-details="auto" 
                  bg-color="surface"
                  @keydown.space.prevent 
                  :rules="password_rules" 
                  :disabled="!isEditing"
                />
              </v-col>

              <v-col cols="12" md="4">
                <v-text-field 
                  v-model="profile.password" 
                  label="Nueva Contraseña (*)" 
                  density="compact" 
                  type="password"
                  variant="outlined" 
                  hide-details="auto" 
                  bg-color="surface"
                  @keydown.space.prevent 
                  :rules="password_rules" 
                  :disabled="!isEditing"
                  @keypress="isValidPassword"
                />
              </v-col>

              <v-col cols="12" md="4">
                <v-text-field 
                  v-model="profile.confirm_password" 
                  label="Confirmar Nueva (*)" 
                  density="compact" 
                  type="password"
                  variant="outlined" 
                  hide-details="auto" 
                  bg-color="surface"
                  @keydown.space.prevent 
                  :rules="[confirmPasswordRule]" 
                  :disabled="!isEditing"
                />
              </v-col>
            </v-row>
          </v-card>
        </v-expand-transition>
      </v-form>
    </v-card-text>
    
    <v-divider v-if="isEditing"></v-divider>
    
    <v-card-actions v-if="isEditing" class="px-6 py-4 bg-grey-lighten-5" :class="isDark ? 'bg-grey-darken-4' : ''">
      <v-spacer></v-spacer>
      <v-btn variant="flat" class="font-weight-bold mr-3 px-6 rounded-lg" @click="cancelEdit">
        Cancelar
      </v-btn>
      <v-btn 
        color="primary" 
        variant="flat" 
        class="font-weight-bold px-6 rounded-lg"
        :loading="is_on_sending_process" 
        :disabled="!is_valid"
        @click="save"
      >
        <v-icon start size="small">mdi-content-save</v-icon> Guardar Cambios
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useTheme } from 'vuetify'
import Swal from 'sweetalert2'
import { useAppStore } from '@/stores/appStore'
import UsersRules from '@/validators/rules/usersRules'
import ProfileDataService from '@/services/profile/profileDataService'
import ProfileMappers from '@/mappers/profileMappers'
import Characters from '@/validators/commonValidators/characters'

const theme = useTheme()
const appStore = useAppStore()

const isDark = computed(() => theme.global.current.value.dark)

const editForm = ref(null)
const isEditing = ref(false)
const is_loading = ref(false)
const edit_password = ref(false)
const userRole = ref('')
const is_valid = ref(false)
const is_on_sending_process = ref(false)

const profile = reactive({
  username: '',
  first_name: '',
  last_name: '',
  email: '',
  current_password: '',
  password: '',
  confirm_password: '',
})

const user_name_rules = UsersRules.user_name_rules()
const first_name_rules = UsersRules.first_name_rules()
const last_name_rules = UsersRules.last_name_rules()
const password_rules = UsersRules.password_rules()
const email_rules = UsersRules.email_rules()

const confirmPasswordRule = computed(() => {
  return () => (profile.password === profile.confirm_password) || 'Las contraseñas no coinciden.'
})

const getProfile = () => {
  is_loading.value = true
  ProfileDataService.get().then((response) => {
    let mappedProfile = ProfileMappers.putMap(response.data)
    Object.assign(profile, mappedProfile)
    profile.current_password = ''
    profile.password = ''
    profile.confirm_password = ''
  }).catch(() => {
    Swal.fire('Error', 'No se pudo cargar la información del perfil.', 'error')
  }).finally(() => {
    is_loading.value = false
  })
}

const initProfile = () => {
  getProfile()
  edit_password.value = false
  isEditing.value = false
  if (editForm.value) editForm.value.resetValidation()
}

const cancelEdit = () => {
  initProfile()
}

const saveProfile = async (profileData) => {
  let payload = { ...profileData }

  if (!edit_password.value) {
    delete payload['current_password']
    delete payload['password']
    delete payload['confirm_password']
  } else {
    delete payload['confirm_password']
  }

  is_on_sending_process.value = true
  is_loading.value = true

  try {
    const response = await ProfileDataService.update(payload)
    if (response.status === 200 || response.status === 204) {
      Swal.fire(appStore.successSavedOptions)
      initProfile()
    }
  } catch (e) {
    let errorText = ''
    const fieldNames = { email: 'Email', username: 'Usuario', password: 'Contraseña', current_password: 'Contraseña Actual' }
    
    if (e.response?.data) {
      for (const key in e.response.data) {
        const field = fieldNames[key] || key
        const errors = e.response.data[key]
        const errorMsg = Array.isArray(errors) ? errors.join(', ') : errors
        errorText += `<b>${field}:</b> ${errorMsg}<br>`
      }
    }

    Swal.fire({
      ...appStore.errorSavedOptions,
      html: errorText || 'Error al procesar la solicitud.'
    })
  } finally {
    is_on_sending_process.value = false
    is_loading.value = false
  }
}

const save = async () => {
  const { valid } = await editForm.value.validate()
  if (valid) {
    await saveProfile(profile)
  }
}

const isLetterOrDigit = (e) => Characters.checkCharacterAndDigits(e, false)
const isLetterOrSpace = (e) => Characters.checkCharacter(e, true)
const isValidPassword = (e) => Characters.checkCharacterDigitsAndSymbols(e, false)

onMounted(() => {
  const userStr = localStorage.getItem('user')
  try {
    const user = userStr ? JSON.parse(userStr) : {}
    userRole.value = user.kind_description || 'Rol no especificado'
  } catch (e) {
    userRole.value = 'Rol no especificado'
  }
  initProfile()
})
</script>