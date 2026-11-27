<template>
  <v-dialog v-model="dialogModel" class="dialog-premium" width="90%" max-width="37.5rem" persistent>
    <v-card>
      <base-modal-header :title="dialogTitle" :icon="user ? 'mdi-pencil-box-multiple' : 'mdi-account-plus'"
                         @close="closeDialog" />

      <v-card-text class="pt-4">
        <v-form ref="formRef" @submit.prevent>
          <v-row>
            <v-col cols="12" md="6">
              <v-text-field v-model="formData.username" label="Usuario (*)" counter="120" :rules="user_name_rules"
                            v-bind="CAMPO_DE_FORMULARIO" autocomplete="off" @keydown.space.prevent
                            @keypress="isLetterOrDigit" />
            </v-col>
            <v-col cols="12" md="6">
              <v-autocomplete v-model="formData.kind" label="Rol (*)" :items="roles" item-title="name" item-value="id"
                              :item-props="propsDeRol(isSuperAdmin, 'Solo un administrador puede asignarlo')"
                              :rules="user_kind_rules" v-bind="CAMPO_DE_FORMULARIO" clearable />
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field v-model="formData.first_name" label="Nombre (*)" counter="120" :rules="first_name_rules"
                            v-bind="CAMPO_DE_FORMULARIO" @keypress="isLetterOrSpace" />
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field v-model="formData.last_name" label="Apellidos (*)" counter="120" :rules="last_name_rules"
                            v-bind="CAMPO_DE_FORMULARIO" @keypress="isLetterOrSpace" />
            </v-col>
            <v-col cols="12">
              <v-text-field v-model="formData.email" label="Correo" :rules="email_rules" v-bind="CAMPO_DE_FORMULARIO" />
            </v-col>
            <v-col v-if="!user" cols="12" class="contrasena-nueva">
              <new-password-fields :key="aperturas" v-model="formData.password" />
            </v-col>
          </v-row>
        </v-form>
      </v-card-text>

      <v-card-actions class="px-6 pb-4 pt-2 flex-wrap ga-2">
        <v-btn v-if="user" variant="tonal" prepend-icon="mdi-lock-reset" @click="enContrasena = true">
          Restablecer contraseña
        </v-btn>
        <v-spacer />
        <v-btn variant="flat" class="font-weight-bold px-4" @click="closeDialog">Cancelar</v-btn>
        <v-btn color="primary" variant="flat" class="font-weight-bold px-4" :loading="isSending" @click="save">
          Guardar
        </v-btn>
      </v-card-actions>

      <password-dialog v-model="enContrasena" titulo="Restablecer contraseña" :cambiar="restablecer"
                       aviso="Asigna una contraseña nueva a este usuario, por si olvidó la suya. Se cierran sus sesiones abiertas." />
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue'
import Swal from 'sweetalert2'
import NewPasswordFields from '@/components/shared/NewPasswordFields.vue'
import PasswordDialog from '@/components/shared/PasswordDialog.vue'
import UserDataService from '@/services/users/userDataService'
import UserMappers from '@/mappers/userMappers'
import { usePermissions } from '@/composables/usePermissions'
import { useAppStore } from '@/stores/appStore'
import Characters from '@/validators/commonValidators/characters'
import UsersRules from '@/validators/rules/usersRules'
import { mensajeDeError } from '@/utils/errors'
import { CAMPO_DE_FORMULARIO } from '@/utils/fields'
import { propsDeRol } from '@/utils/users/roles'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  user: { type: Object, default: null },
  roles: { type: Array, default: () => [] },
})

const emit = defineEmits(['update:modelValue', 'reloadListComponent'])

const appStore = useAppStore()
const { isSuperAdmin } = usePermissions()

const dialogModel = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
})

const formRef = ref(null)
const isSending = ref(false)
const enContrasena = ref(false)
const aperturas = ref(0)

const VACIO = { id: null, username: '', first_name: '', last_name: '', kind: null, email: '', password: '' }
const formData = reactive({ ...VACIO })

const user_name_rules = UsersRules.user_name_rules()
const first_name_rules = UsersRules.first_name_rules()
const last_name_rules = UsersRules.last_name_rules()
const email_rules = UsersRules.email_rules()
const user_kind_rules = UsersRules.user_kind_rules()

const dialogTitle = computed(() => (props.user ? 'Editar usuario' : 'Nuevo usuario'))

watch(() => props.modelValue, (val) => {
  if (!val) return
  Object.assign(formData, VACIO, props.user ? UserMappers.putMap(props.user) : {})
  aperturas.value++
})

const save = async () => {
  const { valid } = await formRef.value.validate()
  if (!valid) return
  isSending.value = true
  try {
    // Al editar no viaja: la contraseña se cambia con Restablecer.
    const { password, ...datos } = formData
    if (props.user) await UserDataService.update(formData.id, datos)
    else await UserDataService.create({ ...datos, password })
    closeDialog()
    emit('reloadListComponent')
    Swal.fire(appStore.successSavedOptions)
  } catch (e) {
    const nombres = { email: 'Correo', username: 'Usuario', password: 'Contraseña', kind: 'Rol' }
    Swal.fire({ ...appStore.errorSavedOptions, text: mensajeDeError(e, 'No se pudo guardar el usuario.', nombres) })
  } finally {
    isSending.value = false
  }
}

const restablecer = ({ nueva }) => UserDataService.resetPassword(formData.id, nueva)

const closeDialog = () => {
  // Sin re-validar al cerrar: los valores se reinician al abrir.
  formRef.value?.resetValidation()
  emit('update:modelValue', false)
}

const isLetterOrSpace = (e) => Characters.checkCharacter(e, true)
const isLetterOrDigit = (e) => Characters.checkCharacterAndDigits(e, false)
</script>

<style scoped>
.contrasena-nueva {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(14rem, 1fr));
  align-items: start;
  gap: 1.5rem;
}
</style>
