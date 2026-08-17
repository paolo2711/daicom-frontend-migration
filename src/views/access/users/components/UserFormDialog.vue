<template>
  <v-dialog v-model="dialogModel" class="dialog-premium" width="600" persistent>
    <v-card>
      <base-modal-header 
        :title="dialogTitle" 
        :icon="user ? 'mdi-pencil-box-multiple' : 'mdi-account-plus'" 
        @close="closeDialog" 
      />

      <v-card-text class="pt-4">
        <v-form ref="formRef" @submit.prevent v-model="isValid">
          <v-row>
            <v-col cols="12" md="6">
              <v-text-field 
                v-model="formData.username" 
                label="Usuario (*)"
                density="compact" 
                counter="120" 
                variant="outlined" 
                hide-details="auto"
                @keydown.space.prevent 
                :rules="user_name_rules"
                @keypress="isLetterOrDigit"
                prepend-inner-icon="mdi-account"
              />
            </v-col>
            <v-col cols="12" md="6">
              <v-autocomplete 
                v-model="formData.kind" 
                label="Rol (*)"
                density="compact" 
                variant="outlined" 
                hide-details="auto"
                :loading="loadingRoles" 
                :rules="user_kind_rules"
                :items="roles" 
                item-title="name" 
                item-value="id"
                clearable 
                prepend-inner-icon="mdi-shield-account-outline"
              />
            </v-col>
          </v-row>

          <v-row>
            <v-col cols="12" md="6">
              <v-text-field 
                v-model="formData.first_name" 
                label="Nombre (*)" 
                density="compact" 
                counter="120"
                variant="outlined" 
                hide-details="auto" 
                :rules="first_name_rules"
                @keypress="isLetterOrSpace"
              />
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field 
                v-model="formData.last_name" 
                label="Apellidos (*)" 
                density="compact" 
                counter="120"
                variant="outlined" 
                hide-details="auto" 
                :rules="first_name_rules"
                @keypress="isLetterOrSpace"
              />
            </v-col>
          </v-row>

          <v-row>
            <v-col cols="12" :md="!user ? 6 : 12">
              <v-text-field 
                v-model="formData.email" 
                label="Email" 
                density="compact"
                variant="outlined" 
                hide-details="auto" 
                :rules="email_rules"
                prepend-inner-icon="mdi-email-outline"
              />
            </v-col>
            <v-col cols="12" md="6" v-if="!user">
              <v-text-field 
                v-model="formData.password" 
                label="Contraseña (*)" 
                density="compact" 
                counter="120"
                type="password"
                variant="outlined" 
                hide-details="auto" 
                @keydown.space.prevent 
                :rules="password_rules"
                @keypress="isValidPassword"
                prepend-inner-icon="mdi-lock-outline"
              />
            </v-col>
          </v-row>
        </v-form>

        <!-- Reset de contrasena (solo al editar): su propio form y boton, aparte del guardado normal. -->
        <div v-if="user" class="mt-2">
          <v-divider class="mb-4" />
          <div class="d-flex align-center mb-1">
            <v-icon start color="primary" size="20">mdi-lock-reset</v-icon>
            <span class="text-subtitle-2 font-weight-medium">Restablecer contraseña</span>
          </div>
          <p class="text-caption text-medium-emphasis mb-3">
            Asigna una nueva contraseña a este usuario (por si la olvidó). Cerrará sus sesiones abiertas.
          </p>
          <v-form ref="resetFormRef" @submit.prevent v-model="resetValid">
            <v-row>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="resetPw.next" label="Nueva contraseña" density="compact" counter
                  :type="showResetPw ? 'text' : 'password'"
                  :append-inner-icon="showResetPw ? 'mdi-eye' : 'mdi-eye-off'" @click:append-inner="showResetPw = !showResetPw"
                  variant="outlined" hide-details="auto" @keydown.space.prevent :rules="password_rules"
                  @keypress="isValidPassword" prepend-inner-icon="mdi-lock-outline"
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="resetPw.confirm" label="Confirmar contraseña" density="compact"
                  :type="showResetPw ? 'text' : 'password'"
                  variant="outlined" hide-details="auto" @keydown.space.prevent :rules="[resetConfirmRule]"
                  prepend-inner-icon="mdi-lock-check-outline"
                />
              </v-col>
            </v-row>
          </v-form>
          <div class="d-flex justify-end mt-3">
            <v-btn color="primary" variant="tonal" class="font-weight-bold" :loading="resettingPw" :disabled="!resetValid" @click="doResetPassword">
              <v-icon start size="small">mdi-lock-reset</v-icon> Restablecer contraseña
            </v-btn>
          </div>
        </div>
      </v-card-text>

      <v-card-actions class="px-6 pb-4 pt-2">
        <v-spacer />
        <v-btn variant="flat" class="font-weight-bold mr-3 px-4" @click="closeDialog">Cancelar</v-btn>
        <v-btn color="primary" variant="flat" class="font-weight-bold px-4" :disabled="!isValid" :loading="isSending" @click="save">
          Guardar
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted, nextTick } from 'vue'
import Swal from 'sweetalert2'
import UserDataService from '@/services/users/userDataService'
import RoleDataService from '@/services/roles/roleDataService'
import Characters from '@/validators/commonValidators/characters'
import UserMappers from '@/mappers/userMappers'
import RoleMappers from '@/mappers/roleMappers'
import UsersRules from '@/validators/rules/usersRules'
import { useAppStore } from '@/stores/appStore'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  user: { type: Object, default: null }
})

const emit = defineEmits(['update:modelValue', 'reloadListComponent'])

const appStore = useAppStore()

const dialogModel = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const formRef = ref(null)
const isSending = ref(false)
const isValid = ref(false)
const roles = ref([])
const loadingRoles = ref(false)

// Reset de contrasena (solo al editar)
const resetFormRef = ref(null)
const resetValid = ref(false)
const resettingPw = ref(false)
const showResetPw = ref(false)
const resetPw = reactive({ next: '', confirm: '' })
const resetConfirmRule = computed(() => () => (resetPw.next === resetPw.confirm) || 'Las contraseñas no coinciden.')

const formData = reactive({
  id: null,
  username: '',
  first_name: '',
  last_name: '',
  kind: null,
  email: '',
  password: '',
})

const user_name_rules = UsersRules.user_name_rules()
const first_name_rules = UsersRules.first_name_rules()
const last_name_rules = UsersRules.last_name_rules()
const password_rules = UsersRules.password_rules()
const email_rules = UsersRules.email_rules()
const user_kind_rules = UsersRules.user_kind_rules()

const dialogTitle = computed(() => props.user ? 'Editar Usuario' : 'Nuevo Usuario')

const loadRoles = async () => {
  if (roles.value.length > 0) return
  loadingRoles.value = true
  try {
    const response = await RoleDataService.getAll()
    roles.value = response.data.map(RoleMappers.fullMap)
  } catch (e) {
    console.error("Error al cargar roles", e)
  } finally {
    loadingRoles.value = false
  }
}

watch(() => props.modelValue, (val) => {
  if (val) {
    resetPw.next = ''
    resetPw.confirm = ''
    loadRoles()
    if (props.user) {
      const mapped = UserMappers.putMap(props.user)
      Object.assign(formData, mapped)
      formData.password = '' // Evitar enviar contraseñas viejas
    } else {
      formData.id = null
      formData.username = ''
      formData.first_name = ''
      formData.last_name = ''
      formData.kind = null
      formData.email = ''
      formData.password = ''
    }
  }
})

const save = async () => {
  const { valid } = await formRef.value.validate()
  if (!valid) return
  isSending.value = true

  try {
    const payload = { ...formData }
    if (props.user) {
      delete payload.password // No enviamos password si estamos editando (se actualiza desde Mi Perfil)
    }

    const response = props.user
      ? await UserDataService.update(payload.id, payload)
      : await UserDataService.create(payload)

    if (response.status === 200 || response.status === 201) {
      closeDialog()
      emit('reloadListComponent')
      Swal.fire(appStore.successSavedOptions)
    }
  } catch (e) {
    let errorText = ''
    const fieldNames = { email: 'Email', username: 'Usuario' }
    const data = e.response?.data
    if (data?.detail) {
      // Errores de permiso/autenticación (ej. no eres admin) → mensaje directo.
      errorText = data.detail
    } else if (data) {
      for (const key in data) {
        const field = fieldNames[key] || key
        errorText += `<b>${field}:</b> ${data[key]}\n`
      }
    }
    Swal.fire({ ...appStore.errorSavedOptions, html: errorText || 'Ocurrió un error al guardar el usuario.' })
  } finally {
    isSending.value = false
  }
}

const doResetPassword = async () => {
  const { valid } = await resetFormRef.value.validate()
  if (!valid) return
  resettingPw.value = true
  try {
    const { data } = await UserDataService.resetPassword(formData.id, resetPw.next)
    Swal.fire({ ...appStore.successSavedOptions, title: data?.success || 'Contraseña restablecida.' })
    resetPw.next = ''
    resetPw.confirm = ''
    await nextTick()
    resetFormRef.value?.resetValidation()
  } catch (e) {
    const d = e.response?.data
    const msg = d?.detail || (d?.new_password ? d.new_password.join(', ') : null) || 'No se pudo restablecer la contraseña.'
    Swal.fire({ ...appStore.errorSavedOptions, html: msg })
  } finally {
    resettingPw.value = false
  }
}

const closeDialog = () => {
  // resetValidation (no reset): limpia errores sin re-validar -> sin parpadeo rojo
  // al cerrar. Los valores se reinician al abrir (watch de modelValue).
  formRef.value?.resetValidation()
  resetFormRef.value?.resetValidation()
  resetPw.next = ''
  resetPw.confirm = ''
  emit('update:modelValue', false)
}

const isLetterOrSpace = (e) => Characters.checkCharacter(e, true)
const isLetterOrDigit = (e) => Characters.checkCharacterAndDigits(e, false)
const isValidPassword = (e) => Characters.checkCharacterDigitsAndSymbols(e, false)
</script>