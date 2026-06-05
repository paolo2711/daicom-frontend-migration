<template>
  <v-dialog v-model="dialogModel" class="dialog-premium" width="500" persistent>
    <v-card>
      <base-modal-header :title="dialogTitle" icon="mdi-shield-account" @close="closeDialog" />

      <v-card-text class="pt-4">
        <v-form ref="formRef" @submit.prevent v-model="isValid">
          <v-text-field
            v-model="formData.name"
            label="Nombre del Rol (*)"
            density="compact"
            variant="outlined"
            counter="64"
            hide-details="auto"
            :rules="rol_name_rules"
            @keypress="isLetter"
            prepend-inner-icon="mdi-shield-check-outline"
          />
        </v-form>
      </v-card-text>

      <v-card-actions class="px-6 pb-4 pt-2">
        <v-spacer />
        <v-btn variant="flat" class="font-weight-bold mr-3 px-4" @click="closeDialog">Cancelar</v-btn>
        <v-btn color="primary" variant="flat" class="font-weight-bold px-4" :disabled="!isValid" :loading="isSending" @click="save">Guardar</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue'
import Swal from 'sweetalert2'
import RoleDataService from '@/services/roles/roleDataService'
import RoleMappers from '@/mappers/roleMappers'
import Characters from '@/validators/commonValidators/characters'
import { useAppStore } from '@/stores/appStore'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  role: { type: Object, default: null }
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

const formData = reactive({
  id: null,
  name: ''
})

const rol_name_rules = [
  v => !!v || "Nombre de rol es requerido",
  v => (v && v.length <= 64) || "No debe ser mayor a 64 caracteres",
  v => (v && v.trim().length !== 0) || "Ingrese nombre de rol válido",
]

const dialogTitle = computed(() => props.role ? 'Editar Rol' : 'Nuevo Rol')

watch(() => props.modelValue, (val) => {
  if (val) {
    if (props.role) {
      const mapped = RoleMappers.fullMap(props.role)
      Object.assign(formData, mapped)
    } else {
      formData.id = null
      formData.name = ''
    }
  }
})

const save = async () => {
  const { valid } = await formRef.value.validate()
  if (!valid) return
  isSending.value = true

  try {
    const payload = { ...formData }
    const response = props.role
      ? await RoleDataService.update(payload.id, payload)
      : await RoleDataService.create(payload)

    if (response.status === 200 || response.status === 201) {
      Swal.fire(appStore.successSavedOptions).then(() => {
        closeDialog()
        emit('reloadListComponent')
      })
    }
  } catch (e) {
    let errorText = ''
    if (e.response && e.response.data) {
      errorText = e.response.data[0] || 'Error al guardar el rol'
    }
    Swal.fire({ ...appStore.errorSavedOptions, text: errorText })
  } finally {
    isSending.value = false
  }
}

const closeDialog = () => {
  formRef.value?.reset()
  emit('update:modelValue', false)
}

const isLetter = (e) => Characters.checkCharacter(e, true)
</script>