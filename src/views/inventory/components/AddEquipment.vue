<template>
  <v-dialog v-model="dialog" class="dialog-premium" max-width="950px" persistent>
    <v-card>
      <base-modal-header
        :title="isEditing ? `Editar Equipo: ${form.internal_id}` : 'Registrar Nuevo Equipo'"
        icon="mdi-toolbox-outline"
        @close="close"
      ></base-modal-header>

      <!-- Pestañas solo visibles cuando se edita un equipo existente -->
      <v-tabs v-model="tab" :bg-color="isDark ? 'grey-darken-4' : 'grey-lighten-4'" color="primary" grow>
        <v-tab :value="0" class="font-weight-bold" style="width: 50%;">
          <v-icon start size="small">mdi-file-document-edit</v-icon> Datos y Fotos
        </v-tab>
        <v-tab :value="1" class="font-weight-bold" style="width: 50%;">
          <v-icon start size="small">mdi-certificate</v-icon> Certificado
        </v-tab>
      </v-tabs>

      <v-window v-model="tab">
        <v-window-item :value="0">
          <v-card-text class="pt-6">
            <v-form ref="formRef" v-model="valid">
              <v-row>
                <v-col cols="12" md="4" class="d-flex flex-column">
                  <div class="text-subtitle-2 mb-2 font-weight-medium">
                    <v-icon start size="small">mdi-image-multiple</v-icon> Fotografías del Equipo
                  </div>

                  <input type="file" ref="fileInput" multiple accept="image/*" style="display: none" @change="onFileChange">

                  <v-card
                    variant="outlined"
                    :class="isDark ? 'bg-grey-darken-3' : 'bg-grey-lighten-5'"
                    style="border: 2px dashed #9e9e9e; cursor: pointer;"
                    class="d-flex flex-column align-center justify-center pa-4 mb-3 transition-swing"
                    height="120"
                    hover
                    @click="fileInput?.click()"
                  >
                    <v-icon size="36" color="primary">mdi-cloud-upload</v-icon>
                    <div class="text-caption mt-2 font-weight-medium text-center">Haz clic para subir fotos</div>
                  </v-card>

                  <div class="d-flex flex-wrap" style="gap: 8px; max-height: 250px; overflow-y: auto;">
                    <v-card v-for="(img, i) in existingImages" :key="'exist-'+i" variant="outlined" class="rounded" style="position: relative; width: 70px; height: 70px; cursor: zoom-in;" @click="openViewer(i)">
                      <v-img :src="img.image" height="100%" width="100%" cover></v-img>
                      <v-btn icon variant="flat" size="x-small" color="red" class="text-white" style="position: absolute; top: -4px; right: -4px; height: 20px; width: 20px; z-index: 2;" @click.stop="removeExistingImage(i, img.id)">
                        <v-icon size="14">mdi-close</v-icon>
                      </v-btn>
                    </v-card>

                    <v-card v-for="(url, i) in previewUrls" :key="'new-'+i" variant="outlined" class="rounded" style="position: relative; width: 70px; height: 70px; border: 2px solid #1976D2 !important;">
                      <v-img :src="url" height="100%" width="100%" cover></v-img>
                      <v-btn icon variant="flat" size="x-small" color="red" class="text-white" style="position: absolute; top: -4px; right: -4px; height: 20px; width: 20px;" @click="removeImage(i)">
                        <v-icon size="14">mdi-close</v-icon>
                      </v-btn>
                    </v-card>
                  </div>
                </v-col>

                <v-col cols="12" md="8">
                  <v-row dense>
                    <v-col cols="12" sm="6">
                      <v-text-field v-model="form.internal_id" label="ID Interno (*)" placeholder="Ej: DAI-001" :rules="[v => !!v || 'Requerido']" variant="outlined" density="compact"></v-text-field>
                    </v-col>
                    <v-col cols="12" sm="6">
                      <v-text-field v-model="form.name" label="Nombre del Equipo (*)" :rules="[v => !!v || 'Requerido']" variant="outlined" density="compact"></v-text-field>
                    </v-col>
                    <v-col cols="12" sm="6">
                      <v-text-field v-model="form.brand" label="Marca" variant="outlined" density="compact"></v-text-field>
                    </v-col>
                    <v-col cols="12" sm="6">
                      <v-text-field v-model="form.model" label="Modelo" variant="outlined" density="compact"></v-text-field>
                    </v-col>
                    <v-col cols="12" sm="6">
                      <v-text-field v-model="form.series" label="N° de Serie" variant="outlined" density="compact"></v-text-field>
                    </v-col>
                    <v-col cols="12" sm="6">
                      <v-select v-model="form.status" :items="statusOptions" item-title="text" item-value="value" label="Estado actual" variant="outlined" density="compact"></v-select>
                    </v-col>
                    <v-col cols="12">
                      <v-textarea v-model="form.notes" label="Observaciones / Detalles adicionales" rows="3" variant="outlined" density="compact" hide-details></v-textarea>
                    </v-col>
                  </v-row>
                </v-col>
              </v-row>
            </v-form>
          </v-card-text>

          </v-window-item>

        <v-window-item :value="1">
          <v-card-text class="pa-6 text-center" style="min-height: 400px;">
            <div class="mb-6">
              <v-icon size="64" :color="form.latest_certificate ? 'success' : 'grey'">mdi-certificate-outline</v-icon>
            </div>
            
            <h3 class="text-h6 font-weight-bold mb-2">Vincular Certificado DAICOM</h3>
            <p class="text-body-2 px-10 text-grey">Vincula un certificado de operatividad emitido por tu laboratorio a este equipo.</p>

            <div v-if="form.latest_certificate" class="mb-6 mt-4">
              <v-chip color="success" variant="flat" class="text-white font-weight-bold text-subtitle-2 px-4 py-4 mb-4">
                <v-icon start size="20">mdi-check-decagram</v-icon> EQUIPO CERTIFICADO
              </v-chip>
              
              <div class="text-subtitle-1 font-weight-bold">
                Expediente: <span class="text-primary">{{ form.latest_certificate.registry_code }}</span>
              </div>
              <div class="text-caption mb-4 text-grey">
                Emitido el: {{ form.latest_certificate.emission_date || '---' }}
              </div>

              <div class="d-flex justify-center" style="gap: 10px;">
                <v-btn color="primary" variant="outlined" :href="`https://daicomperu.com/${form.latest_certificate.uuid}`" target="_blank" :disabled="!form.latest_certificate.uuid">
                  <v-icon start>mdi-qrcode-scan</v-icon> Ver Certificado
                </v-btn>
                <v-btn color="error" variant="text" @click="unlinkCertificate" :loading="linkingCert">
                  <v-icon start>mdi-link-off</v-icon> Desvincular
                </v-btn>
              </div>
            </div>

            <div v-else class="mx-auto mt-6" style="max-width: 400px;">
              <v-row dense align="center">
                <v-col cols="8">
                  <v-text-field v-model="correlative_search" label="Nro. Correlativo (Ej: 15)" type="number" variant="outlined" density="compact" hide-details @keyup.enter="buscarCertificado"></v-text-field>
                </v-col>
                <v-col cols="4">
                  <v-btn color="secondary" variant="flat" block @click="buscarCertificado" :loading="searchingCert"><v-icon start>mdi-magnify</v-icon> Buscar</v-btn>
                </v-col>
              </v-row>

              <v-expand-transition>
                <v-card v-if="foundCert" variant="outlined" class="mt-4 pa-3 text-left bg-grey-lighten-4">
                  <div class="subtitle-2 font-weight-bold mb-1 text-primary">Vista Previa:</div>
                  <div><strong>Expediente:</strong> {{ foundCert.registry_code }}</div>
                  <div><strong>Equipo:</strong> {{ foundCert.equipment }}</div>
                  <v-btn block color="success" variant="flat" class="mt-3 text-white" @click="linkCertificate" :loading="linkingCert">
                    <v-icon start>mdi-link-variant</v-icon> Vincular a este equipo
                  </v-btn>
                </v-card>
              </v-expand-transition>
            </div>
          </v-card-text>
        </v-window-item>
      </v-window>
      
      <v-card-actions class="px-6 pb-4 pt-4 border-top" :class="isDark ? 'bg-grey-darken-4 border-grey-darken-3' : 'bg-grey-lighten-4 border-grey-lighten-3'">
        <v-spacer></v-spacer>
        <v-btn variant="flat" class="font-weight-bold mr-3 px-4" @click="close">Cancelar</v-btn>
        <v-btn color="primary" variant="flat" @click="save" :disabled="!valid" :loading="loading">
          <v-icon start size="small">mdi-content-save</v-icon> {{ isEditing ? 'Guardar Cambios' : 'Registrar Equipo' }}
        </v-btn>
      </v-card-actions>

    </v-card>

    <v-dialog v-model="viewerDialog" fullscreen hide-overlay transition="dialog-bottom-transition">
      <v-card tile color="black" class="d-flex flex-column" style="height: 100vh;">
        <v-toolbar color="transparent" class="text-white" flat>
          <v-spacer></v-spacer>
          <v-btn icon variant="text" size="large" @click="viewerDialog = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-toolbar>
        <v-carousel v-model="viewerIndex" hide-delimiters height="100%" :show-arrows="existingImages.length > 1 ? 'hover' : false">
          <v-carousel-item v-for="(img, i) in existingImages" :key="i">
            <v-img :src="img.image" height="100%"></v-img>
          </v-carousel-item>
        </v-carousel>
      </v-card>
    </v-dialog>
  </v-dialog>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { useTheme } from 'vuetify'
import Swal from 'sweetalert2'
import InventoryDataService from '@/services/inventory/inventoryDataService'
import CertificateDataService from '@/services/certificates/certificateDataService'

const emit = defineEmits(['saved'])

const theme = useTheme()
const isDark = computed(() => theme.global.current.value.dark)

const dialog = ref(false)
const valid = ref(false)
const loading = ref(false)
const isEditing = ref(false)
const tab = ref(0)
const formRef = ref(null)
const fileInput = ref(null)

// Variables para imágenes
const existingImages = ref([])
const deletedImagesIds = ref([])
const imageFiles = ref([])
const previewUrls = ref([])
const viewerDialog = ref(false)
const viewerIndex = ref(0)

// Variables para Certificado
const correlative_search = ref('')
const searchingCert = ref(false)
const foundCert = ref(null)
const linkingCert = ref(false)

const form = reactive({
  id: null,
  internal_id: '',
  name: '',
  brand: '',
  model: '',
  series: '',
  status: 1,
  notes: '',
  latest_certificate: null
})

const statusOptions = [
  { text: 'Disponible', value: 1 },
  { text: 'Alquilado', value: 2 },
  { text: 'Mantenimiento', value: 3 },
  { text: 'Baja', value: 4 },
]

const open = (item = null) => {
  resetForm()
  if (item) {
    isEditing.value = true
    Object.keys(form).forEach(key => {
      if (item[key] !== undefined) form[key] = item[key]
    })
    existingImages.value = item.gallery ? JSON.parse(JSON.stringify(item.gallery)) : []
  } else {
    isEditing.value = false
  }
  dialog.value = true
}

const openViewer = (index) => {
  viewerIndex.value = index
  viewerDialog.value = true
}

const close = () => {
  dialog.value = false
  resetForm()
}

const resetForm = () => {
  if (formRef.value) formRef.value.resetValidation()
  Object.assign(form, { id: null, internal_id: '', name: '', brand: '', model: '', series: '', status: 1, notes: '', latest_certificate: null })
  existingImages.value = []
  deletedImagesIds.value = []
  imageFiles.value = []
  previewUrls.value = []
  tab.value = 0
  correlative_search.value = ''
  foundCert.value = null
}

const onFileChange = (event) => {
  const files = event.target.files
  if (!files || files.length === 0) return
  Array.from(files).forEach(file => {
    imageFiles.value.push(file)
    previewUrls.value.push(URL.createObjectURL(file))
  })
  if (fileInput.value) fileInput.value.value = ''
}

const removeExistingImage = (index, imageId) => {
  deletedImagesIds.value.push(imageId)
  existingImages.value.splice(index, 1)
}

const removeImage = (index) => {
  imageFiles.value.splice(index, 1)
  previewUrls.value.splice(index, 1)
}

const save = async () => {
  const { valid: isValid } = await formRef.value.validate()
  if (!isValid) return
  loading.value = true

  let formData = new FormData()
  formData.append('internal_id', form.internal_id)
  formData.append('name', form.name)
  if (form.brand) formData.append('brand', form.brand)
  if (form.model) formData.append('model', form.model)
  if (form.series) formData.append('series', form.series)
  formData.append('status', form.status)
  if (form.notes) formData.append('notes', form.notes)
  
  // Si seleccionamos un certificado desde la pestaña de creación
  if (form.latest_certificate && form.latest_certificate.id) {
    formData.append('latest_certificate', form.latest_certificate.id)
  }

  if (imageFiles.value.length > 0) {
    imageFiles.value.forEach(file => formData.append('uploaded_images', file))
  }
  if (deletedImagesIds.value.length > 0) {
    formData.append('deleted_images', deletedImagesIds.value.join(','))
  }

  try {
    if (isEditing.value) {
      await InventoryDataService.update(form.id, formData)
      Swal.fire('Actualizado', 'Equipo actualizado correctamente', 'success')
    } else {
      await InventoryDataService.create(formData)
      Swal.fire('Guardado', 'Equipo registrado en inventario', 'success')
    }
    emit('saved')
    close()
  } catch (error) {
    console.error("Error del servidor:", error.response)
    let errorMsg = 'Revisa los datos e intenta de nuevo.'

    if (error.response && error.response.data && typeof error.response.data === 'object') {
      let messages = []
      for (let key in error.response.data) {
        let fieldErrors = error.response.data[key]
        let errorText = Array.isArray(fieldErrors) ? fieldErrors.join(', ') : fieldErrors
        messages.push(`<b>${key}:</b> ${errorText}`)
      }
      if (messages.length > 0) {
        errorMsg = messages.join('<br>')
      }
    }

    Swal.fire({
      title: 'Error al guardar',
      html: errorMsg,
      icon: 'error'
    })
  } finally {
    loading.value = false
  }
}

// --- LÓGICA DE CERTIFICADOS DIRECTO A LA BD ---

const buscarCertificado = async () => {
  if (!correlative_search.value) return
  searchingCert.value = true
  foundCert.value = null

  try {
    const res = await CertificateDataService.getFiltered(1, 10, '', '', '', '', Number(correlative_search.value), '')
    const validos = res.data.results.filter(c => c.status !== 5)
    if (validos.length > 0) {
      foundCert.value = validos[0]
    } else {
      Swal.fire('No encontrado', 'No existe un certificado válido con ese correlativo.', 'warning')
    }
  } catch (e) {
    Swal.fire('Error', 'Hubo un problema al buscar.', 'error')
  } finally {
    searchingCert.value = false
  }
}

const linkCertificate = async () => {
  if (isEditing.value) {
    // Si el equipo ya existe en BD, vinculamos directamente
    linkingCert.value = true
    try {
      await InventoryDataService.update(form.id, { latest_certificate: foundCert.value.id })
      form.latest_certificate = foundCert.value
      Swal.fire({ title: 'Vinculado', text: 'Certificado asociado exitosamente', icon: 'success', timer: 1500, showConfirmButton: false })
      emit('saved') // Refresca la tabla por detrás
    } catch (e) {
      Swal.fire('Error', 'No se pudo vincular', 'error')
    } finally {
      linkingCert.value = false
      foundCert.value = null
      correlative_search.value = ''
    }
  } else {
    // Si es un equipo NUEVO, solo guardamos el dato en memoria temporalmente
    form.latest_certificate = foundCert.value
    foundCert.value = null
    correlative_search.value = ''
    Swal.fire({ title: 'Certificado Seleccionado', text: 'Se vinculará al terminar de registrar el equipo.', icon: 'info', timer: 2000, showConfirmButton: false })
  }
}

const unlinkCertificate = async () => {
  if (isEditing.value) {
    linkingCert.value = true
    try {
      await InventoryDataService.update(form.id, { latest_certificate: null })
      form.latest_certificate = null
      Swal.fire({ title: 'Desvinculado', text: 'El certificado fue retirado del equipo', icon: 'info', timer: 1500, showConfirmButton: false })
      emit('saved')
    } catch (e) {
      Swal.fire('Error', 'No se pudo desvincular', 'error')
    } finally {
      linkingCert.value = false
    }
  } else {
    // En creación nueva, solo borramos la variable de memoria
    form.latest_certificate = null
    Swal.fire({ title: 'Removido', text: 'Se ha quitado el certificado de este registro.', icon: 'info', timer: 1500, showConfirmButton: false })
  }
}

defineExpose({ open })
</script>