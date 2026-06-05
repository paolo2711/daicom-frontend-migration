<template>
  <v-card variant="flat" class="rounded-lg overflow-hidden" :loading="is_loading">
    <v-card-title class="pa-4 d-flex align-center">
      <v-icon start color="primary">mdi-domain</v-icon>
      <span class="text-subtitle-1 font-weight-medium ml-2">
        Datos Generales de DAICOM S.A.C.
      </span>
      <v-spacer></v-spacer>
      <v-btn 
        v-if="!isEditing" 
        color="primary" 
        variant="flat" 
        prepend-icon="mdi-pencil" 
        @click="isEditing = true"
      >
        Editar Empresa
      </v-btn>
    </v-card-title>

    <v-divider></v-divider>

    <v-card-text class="pa-6">
      <v-form ref="editForm" @submit.prevent v-model="is_valid">
        <v-row>
          <v-col cols="12" md="8">
            <v-row dense>
              <v-col cols="12" md="8">
                <v-text-field v-model="company.name" label="Nombre (*)" density="compact" variant="outlined" counter="120" hide-details="auto" :rules="name_rules" :disabled="!isEditing" @keypress="isLetterOrSpace" />
              </v-col>

              <v-col cols="12" md="4">
                <v-text-field v-model="company.document" label="RUC" density="compact" variant="outlined" counter="11" hide-details="auto" :rules="document_rules" :disabled="!isEditing" @keypress="isDigit" />
              </v-col>

              <v-col cols="12" md="8">
                <v-text-field v-model="company.address" label="Dirección" density="compact" variant="outlined" counter="200" hide-details="auto" :rules="address_rules" :disabled="!isEditing" @keypress="isLetterOrDigit" />
              </v-col>

              <v-col cols="12" md="4">
                <v-text-field v-model="company.accredited_correlative" label="Correlativo para Acreditados" density="compact" variant="outlined" type="number" min="1" hide-details="auto" :rules="correlative_rules" :disabled="!isEditing" @keypress="isDigit" />
              </v-col>

              <v-col cols="12" md="8">
                <v-text-field v-model="company.phone" label="Teléfono" density="compact" variant="outlined" counter="20" hide-details="auto" :rules="phone_rules" :disabled="!isEditing" @keypress="isDigit" />
              </v-col>

              <v-col cols="12" md="4">
                <v-text-field v-model="company.non_accredited_correlative" label="Correlativo para NO Acreditados" density="compact" variant="outlined" type="number" min="1" hide-details="auto" :rules="correlative_rules" :disabled="!isEditing" @keypress="isDigit" />
              </v-col>

              <v-col cols="12" md="8">
                <v-text-field v-model="company.email" label="Email" density="compact" variant="outlined" hide-details="auto" :rules="email_rules" :disabled="!isEditing" />
              </v-col>

              <v-col cols="12" md="4">
                <v-text-field v-model="company.operationality_correlative" label="Correlativo para Operatividad" density="compact" variant="outlined" type="number" min="1" hide-details="auto" :rules="correlative_rules" :disabled="!isEditing" @keypress="isDigit" />
              </v-col>
            </v-row>

            <v-row class="mt-4">
              <v-col cols="12">
                <v-divider></v-divider>
                <div class="text-subtitle-2 font-weight-bold text-grey-darken-1 my-3">Fondos de Certificados (Formatos PDF)</div>
              </v-col>

              <v-col cols="12" md="6" class="mb-2">
                <v-file-input v-model="uploadFiles.accFirst" label="Fondo Certificado Acreditado Con Sello" density="compact" variant="outlined" show-size accept="application/pdf" :disabled="!isEditing" hide-details="auto" prepend-icon="" prepend-inner-icon="mdi-file-pdf-box" />
                <v-btn v-if="company.accredited_correlative_pdf_first_page" :href="company.accredited_correlative_pdf_first_page" target="_blank" variant="text" color="info" size="small" class="mt-1 px-0 text-caption" height="auto">
                  <v-icon start size="16">mdi-download</v-icon> Descargar archivo actual
                </v-btn>
              </v-col>

              <v-col cols="12" md="6" class="mb-2">
                <v-file-input v-model="uploadFiles.accOther" label="Fondo Certificado Acreditado Sin Sello" density="compact" variant="outlined" show-size accept="application/pdf" :disabled="!isEditing" hide-details="auto" prepend-icon="" prepend-inner-icon="mdi-file-pdf-box" />
                <v-btn v-if="company.accredited_correlative_pdf_other_pages" :href="company.accredited_correlative_pdf_other_pages" target="_blank" variant="text" color="info" size="small" class="mt-1 px-0 text-caption" height="auto">
                  <v-icon start size="16">mdi-download</v-icon> Descargar archivo actual
                </v-btn>
              </v-col>

              <v-col cols="12" md="6" class="mb-2">
                <v-file-input v-model="uploadFiles.nonAccFirst" label="Fondo Certificado NO Acreditado Con Sello" density="compact" variant="outlined" show-size accept="application/pdf" :disabled="!isEditing" hide-details="auto" prepend-icon="" prepend-inner-icon="mdi-file-pdf-box" />
                <v-btn v-if="company.non_accredited_correlative_pdf_first_page" :href="company.non_accredited_correlative_pdf_first_page" target="_blank" variant="text" color="info" size="small" class="mt-1 px-0 text-caption" height="auto">
                  <v-icon start size="16">mdi-download</v-icon> Descargar archivo actual
                </v-btn>
              </v-col>

              <v-col cols="12" md="6" class="mb-2">
                <v-file-input v-model="uploadFiles.nonAccOther" label="Fondo Certificado NO Acreditado Sin Sello" density="compact" variant="outlined" show-size accept="application/pdf" :disabled="!isEditing" hide-details="auto" prepend-icon="" prepend-inner-icon="mdi-file-pdf-box" />
                <v-btn v-if="company.non_accredited_correlative_pdf_other_pages" :href="company.non_accredited_correlative_pdf_other_pages" target="_blank" variant="text" color="info" size="small" class="mt-1 px-0 text-caption" height="auto">
                  <v-icon start size="16">mdi-download</v-icon> Descargar archivo actual
                </v-btn>
              </v-col>
            </v-row>
          </v-col>

          <v-col cols="12" md="4" class="pt-2">
            <div class="text-subtitle-2 font-weight-bold text-grey-darken-1 mb-3">Logotipo de la compañía</div>
            
            <v-card v-if="logoPreview" variant="flat" class="bg-grey-lighten-4 mb-4 rounded-lg d-flex align-center justify-center overflow-hidden" style="min-height: 180px; border: 1px solid rgba(0,0,0,0.12);">
              <v-img :src="logoPreview" contain max-height="250" class="w-100"></v-img>
            </v-card>
            <v-card v-else variant="flat" class="bg-grey-lighten-4 mb-4 rounded-lg d-flex align-center justify-center" style="min-height: 180px; border: 1px dashed rgba(0,0,0,0.24);">
              <v-icon size="64" color="grey-lighten-1">mdi-image-outline</v-icon>
            </v-card>

            <v-file-input 
              v-model="uploadFiles.image" 
              label="Seleccione logotipo" 
              density="compact" 
              variant="outlined" 
              show-size 
              accept="image/png, image/gif, image/jpeg" 
              :disabled="!isEditing" 
              hide-details="auto" 
              prepend-icon="" 
              prepend-inner-icon="mdi-camera" 
            />
          </v-col>
        </v-row>
      </v-form>
    </v-card-text>

    <v-divider v-if="isEditing"></v-divider>

    <v-card-actions v-if="isEditing" class="pa-4">
      <v-spacer></v-spacer>
      <v-btn variant="flat" class="font-weight-bold mr-3 px-6" @click="cancelEdit">
        Cancelar
      </v-btn>
      <v-btn color="primary" variant="flat" class="font-weight-bold px-6" :loading="is_on_sending_process" :disabled="!is_valid" @click="save">
        Guardar
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import Swal from 'sweetalert2'
import { useAppStore } from '@/stores/appStore'
import CompanyRules from "@/validators/rules/companyRules"
import Characters from "@/validators/commonValidators/characters"
import CompanyDataService from "@/services/company/companyDataService"
import CompanyMappers from "@/mappers/companyMappers"

const appStore = useAppStore()

const editForm = ref(null)
const isEditing = ref(false)
const is_loading = ref(false)
const is_valid = ref(false)
const is_on_sending_process = ref(false)

const company = reactive({
  name: '',
  address: '',
  phone: '',
  email: '',
  image: '',
  accredited_correlative: '',
  non_accredited_correlative: '',
  operationality_correlative: '',
  accredited_correlative_pdf_first_page: '',
  accredited_correlative_pdf_other_pages: '',
  non_accredited_correlative_pdf_first_page: '',
  non_accredited_correlative_pdf_other_pages: '',
  document: '',
})

const uploadFiles = reactive({
  image: [],
  accFirst: [],
  accOther: [],
  nonAccFirst: [],
  nonAccOther: []
})

const name_rules = CompanyRules.name_rules()
const address_rules = CompanyRules.address_rules()
const phone_rules = CompanyRules.phone_rules()
const email_rules = CompanyRules.email_rules()
const document_rules = CompanyRules.document_rules()
const correlative_rules = CompanyRules.correlative_rules()

const logoPreview = computed(() => {
  if (uploadFiles.image && uploadFiles.image.length > 0) {
    return URL.createObjectURL(uploadFiles.image[0])
  }
  return company.image || null
})

const getCompany = () => {
  is_loading.value = true
  CompanyDataService.get().then((response) => {
    let mapped = CompanyMappers.putMap(response.data)
    Object.assign(company, mapped)
  }).finally(() => {
    is_loading.value = false
  })
}

const clearUploads = () => {
  uploadFiles.image = []
  uploadFiles.accFirst = []
  uploadFiles.accOther = []
  uploadFiles.nonAccFirst = []
  uploadFiles.nonAccOther = []
}

const initCompany = () => {
  getCompany()
  clearUploads()
  isEditing.value = false
  if (editForm.value) editForm.value.resetValidation()
}

const cancelEdit = () => {
  initCompany()
}

const saveCompany = async () => {
  is_on_sending_process.value = true
  is_loading.value = true

  let data = new FormData()

  if (uploadFiles.image.length > 0) data.append('image', uploadFiles.image[0])
  if (uploadFiles.accFirst.length > 0) data.append('accredited_correlative_pdf_first_page', uploadFiles.accFirst[0])
  if (uploadFiles.accOther.length > 0) data.append('accredited_correlative_pdf_other_pages', uploadFiles.accOther[0])
  if (uploadFiles.nonAccFirst.length > 0) data.append('non_accredited_correlative_pdf_first_page', uploadFiles.nonAccFirst[0])
  if (uploadFiles.nonAccOther.length > 0) data.append('non_accredited_correlative_pdf_other_pages', uploadFiles.nonAccOther[0])

  let prepare_data = Object.assign({}, company)
  delete prepare_data['image']
  delete prepare_data['accredited_correlative_pdf_first_page']
  delete prepare_data['accredited_correlative_pdf_other_pages']
  delete prepare_data['non_accredited_correlative_pdf_first_page']
  delete prepare_data['non_accredited_correlative_pdf_other_pages']

  for (let key in prepare_data) {
    data.append(key, prepare_data[key] === undefined || prepare_data[key] === null ? '' : prepare_data[key])
  }

  try {
    const response = await CompanyDataService.update(data)
    if (response.status === 200) {
      Swal.fire(appStore.successSavedOptions)
      initCompany()
    }
  } catch (e) {
    let errorText = ''
    const fieldNames = { email: 'Email', name: 'Nombre', address: 'Dirección', phone: 'Teléfono' }
    
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
      html: errorText || 'Ocurrió un error inesperado al guardar los datos.'
    })
  } finally {
    is_on_sending_process.value = false
    is_loading.value = false
  }
}

const save = async () => {
  const { valid } = await editForm.value.validate()
  if (valid) {
    saveCompany()
  }
}

const isLetterOrSpace = (e) => Characters.checkCharacter(e, true)
const isLetterOrDigit = (e) => Characters.checkCharacterAndDigits(e, true)
const isDigit = (e) => Characters.checkDigits(e, false)

onMounted(() => {
  initCompany()
})
</script>