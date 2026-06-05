<template>
  <v-dialog v-model="dialogModel" class="dialog-premium" width="600" persistent>
    <v-card>
      <base-modal-header :title="dialogTitle" icon="mdi-flask" @close="closeDialog" />

      <v-card-text class="pt-4 pb-4">
        <v-form ref="formRef" @submit.prevent v-model="isValid">
          <v-row>
            <v-col cols="12">
              <v-text-field v-model="formData.name" label="Nombre (*)" density="compact" counter="120" variant="outlined" hide-details="auto" :rules="lab_name_rules" @keypress="isValidCharacter" />
            </v-col>
          </v-row>
          <v-row>
            <v-col cols="12">
              <v-text-field v-model="formData.code" label="Código (*)" density="compact" counter="6" variant="outlined" hide-details="auto" :rules="lab_code_rules" @keypress="isValidCharacter" />
            </v-col>
          </v-row>
        </v-form>
      </v-card-text>

      <v-card-actions class="px-6 pb-4 pt-2">
        <v-spacer />
        <v-btn variant="flat" class="font-weight-bold mr-3 px-4" @click="closeDialog">Cancelar</v-btn>
        <v-btn color="primary" variant="flat" :disabled="!isValid" :loading="isSending" @click="save">Guardar</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue'
import Swal from 'sweetalert2'
import LabDataService from '@/services/labs/labDataService'
import LabRules from '@/validators/rules/labRules'
import Characters from '@/validators/commonValidators/characters'
import LabMappers from '@/mappers/labMappers'
import { useAppStore } from '@/stores/appStore'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  lab: { type: Object, default: null }
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
  name: '',
  code: '',
  id: null
})

const lab_name_rules = LabRules.lab_name_rules()
const lab_code_rules = LabRules.lab_code_rules()

const dialogTitle = computed(() => props.lab ? 'Editar Laboratorio' : 'Nuevo Laboratorio')

watch(() => props.modelValue, (val) => {
  if (val) {
    if (props.lab) {
      const mapped = LabMappers.putMap(props.lab)
      Object.keys(mapped).forEach(key => { formData[key] = mapped[key] })
    } else {
      Object.keys(formData).forEach(key => { formData[key] = '' })
      formData.id = null
    }
  }
})

const save = async () => {
  const { valid } = await formRef.value.validate()
  if (!valid) return
  isSending.value = true
  try {
    const payload = { ...formData }
    const response = props.lab
      ? await LabDataService.update(payload.id, payload)
      : await LabDataService.create(payload)
    if (response.status === 200 || response.status === 201) {
      Swal.fire(appStore.successSavedOptions).then(() => {
        closeDialog()
        emit('reloadListComponent')
      })
    }
  } catch (e) {
    let errorText = ''
    const fieldNames = { name: 'Nombre', code: 'Código' }
    if (e.response?.data) {
      for (const key in e.response.data) {
        const field = fieldNames[key] || key
        errorText += `${field}: ${e.response.data[key]}\n`
      }
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

const isValidCharacter = (e) => Characters.checkCharacterDigitsAndSymbols(e, true)
</script>