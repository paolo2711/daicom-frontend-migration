<template>
  <v-dialog v-model="dialogModel" class="dialog-premium" width="600" persistent>
    <v-card>
      <base-modal-header :title="dialogTitle" icon="mdi-account-plus" @close="closeDialog" />

      <v-card-text class="pt-4">
        <v-form ref="formRef" @submit.prevent v-model="isValid">
          <v-row>
            <v-col cols="12">
              <v-text-field v-model="formData.name" label="Razón Social (*)" density="compact" variant="outlined"
                counter="120" hide-details="auto" :rules="client_name_rules" @keypress="isValidCharacter" />
            </v-col>
          </v-row>
          <v-row>
            <v-col cols="6">
              <v-autocomplete v-model="formData.documentType" :items="documentTypes" item-title="name" item-value="value"
                label="Tipo de Documento (*)" density="compact" variant="outlined" hide-details="auto"
                :rules="client_documentType_rules" @update:model-value="onDocumentTypeChange" />
            </v-col>
            <v-col cols="6">
              <v-text-field v-model="formData.document" label="Documento" :disabled="formData.documentType === 3"
                density="compact" variant="outlined" hide-details="auto" :rules="dynamicDocumentRules"
                @keypress="isDigit" :append-inner-icon="showDocSearchIcon ? 'mdi-magnify' : ''"
                :loading="isSearchingDoc" @click:append-inner="buscarDatosEnApiPeru" />
            </v-col>
          </v-row>
          <v-row>
            <v-col cols="12">
              <v-text-field v-model="formData.address" label="Dirección" density="compact" variant="outlined"
                counter="120" hide-details="auto" :rules="client_address_rules" @keypress="isValidCharacter" />
            </v-col>
          </v-row>
          <v-row>
            <v-col cols="6">
              <v-text-field v-model="formData.phone" label="Teléfono" density="compact" variant="outlined"
                counter="14" hide-details="auto" :rules="client_phone_rules" @keypress="isDigit" />
            </v-col>
            <v-col cols="6">
              <v-text-field v-model="formData.email" label="Email" density="compact" variant="outlined"
                hide-details="auto" :rules="client_email_rules" />
            </v-col>
          </v-row>
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
import { ref, reactive, computed, watch, getCurrentInstance } from 'vue'
import Swal from 'sweetalert2'
import ClientDataService from '@/services/clients/clientDataService'
import ClientRules from '@/validators/rules/clientRules'
import Characters from '@/validators/commonValidators/characters'
import ClientMappers from '@/mappers/clientMappers'
import ApiPeruService from '@/services/external/apiPeruService'
import { useAppStore } from '@/stores/appStore'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  client: { type: Object, default: null },
})

const emit = defineEmits(['update:modelValue', 'reloadListComponent'])

const appStore = useAppStore()

const dialogModel = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
})

const formRef = ref(null)
const isSending = ref(false)
const isValid = ref(false)
const isSearchingDoc = ref(false)

const formData = reactive({
  name: '',
  documentType: null,
  document: '',
  address: '',
  phone: '',
  email: '',
  id: null,
})

const documentTypes = [
  { value: 1, name: 'DNI' },
  { value: 2, name: 'RUC' },
  { value: 3, name: 'SIN DOCUMENTO' },
]

const client_name_rules = ClientRules.client_name_rules()
const client_documentType_rules = ClientRules.client_documentType_rules()
const client_document_rules = ClientRules.client_document_rules()
const client_address_rules = ClientRules.client_address_rules()
const client_phone_rules = ClientRules.client_phone_rules()
const client_email_rules = ClientRules.client_email_rules()

const dialogTitle = computed(() => props.client ? 'Editar Cliente' : 'Nuevo Cliente')

const dynamicDocumentRules = computed(() => {
  if (formData.documentType === 3) return []
  const baseRules = [...(client_document_rules || [])]
  const lengthRule = v => {
    if (!v) return true
    if (formData.documentType === 1) return v.length === 8 || 'El DNI debe tener exactamente 8 dígitos'
    if (formData.documentType === 2) return v.length === 11 || 'El RUC debe tener exactamente 11 dígitos'
    return true
  }
  return [...baseRules, lengthRule]
})

const showDocSearchIcon = computed(() => {
  return !props.client && (formData.documentType === 1 || formData.documentType === 2) && !!formData.document
})

watch(() => props.modelValue, (val) => {
  if (val) {
    if (props.client) {
      const mapped = ClientMappers.putMap(props.client)
      Object.keys(mapped).forEach(key => { formData[key] = mapped[key] })
    } else {
      Object.keys(formData).forEach(key => { formData[key] = key === 'documentType' ? null : '' })
      formData.id = null
    }
  }
})

const onDocumentTypeChange = () => {
  if (formData.documentType === 3) formData.document = ''
}

const save = async () => {
  const { valid } = await formRef.value.validate()
  if (!valid) return
  isSending.value = true
  try {
    const payload = { ...formData }
    const response = props.client
      ? await ClientDataService.update(payload.id, payload)
      : await ClientDataService.create(payload)
    if (response.status === 200 || response.status === 201) {
      Swal.fire(appStore.successSavedOptions).then(() => {
        closeDialog()
        emit('reloadListComponent')
      })
    }
  } catch (e) {
    let errorText = ''
    const fieldNames = { email: 'Email', name: 'Nombre', documentType: 'Tipo de documento' }
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

const buscarDatosEnApiPeru = async () => {
  if (!formData.document || props.client) return
  isSearchingDoc.value = true
  try {
    if (formData.documentType === 1) {
      formData.name = await ApiPeruService.consultaDNI(formData.document)
    } else if (formData.documentType === 2) {
      const res = await ApiPeruService.consultaRUC(formData.document)
      formData.name = res.compania
      formData.address = res.direccion
    }
  } catch {
    Swal.fire({ icon: 'warning', title: 'No encontrado', text: 'No se encontraron datos para este documento.' })
  } finally {
    isSearchingDoc.value = false
  }
}

const isDigit = (e) => Characters.checkDigits(e, false)
const isValidCharacter = (e) => Characters.checkCharacterDigitsAndSymbols(e, true)
</script>