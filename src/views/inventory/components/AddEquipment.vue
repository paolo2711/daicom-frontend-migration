<template>
  <v-dialog v-model="dialog" class="dialog-premium" max-width="900px" persistent>
    <v-card>
      <base-modal-header
        :title="isEditing ? 'Editar Equipo' : 'Registrar Nuevo Equipo'"
        icon="mdi-toolbox-outline"
        @close="close"
      ></base-modal-header>

      <v-card-text class="pt-6">
        <v-form ref="formRef" v-model="valid">
          <v-row>
            <v-col cols="12" md="4" class="d-flex flex-column">
              <div class="text-subtitle-2 mb-2 font-weight-medium">
                <v-icon start size="small">mdi-image-multiple</v-icon> Fotografías del Equipo
              </div>

              <input
                type="file"
                ref="fileInput"
                multiple
                accept="image/*"
                style="display: none"
                @change="onFileChange"
              >

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
                <v-card v-for="(img, i) in existingImages" :key="'exist-'+i" variant="outlined" class="rounded" style="position: relative; width: 70px; height: 70px;">
                  <v-img :src="img.image" height="100%" width="100%" cover></v-img>
                  <v-btn icon variant="flat" size="x-small" color="red" class="text-white" style="position: absolute; top: -4px; right: -4px; height: 20px; width: 20px;" @click="removeExistingImage(i, img.id)">
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

      <v-card-actions class="px-6 pb-4 pt-2">
        <v-spacer></v-spacer>
        <v-btn variant="flat" class="font-weight-bold mr-3 px-4" @click="close">Cancelar</v-btn>
        <v-btn color="primary" variant="flat" @click="save" :disabled="!valid" :loading="loading">
          <v-icon start size="small">mdi-content-save</v-icon> Guardar Equipo
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { useTheme } from 'vuetify'
import Swal from 'sweetalert2'
import InventoryDataService from '@/services/inventory/inventoryDataService'

const emit = defineEmits(['saved'])

const theme = useTheme()
const isDark = computed(() => theme.global.current.value.dark)

const dialog = ref(false)
const valid = ref(false)
const loading = ref(false)
const isEditing = ref(false)
const formRef = ref(null)
const fileInput = ref(null)

const existingImages = ref([])
const deletedImagesIds = ref([])
const imageFiles = ref([])
const previewUrls = ref([])

const form = reactive({
  id: null,
  internal_id: '',
  name: '',
  brand: '',
  model: '',
  series: '',
  status: 1,
  notes: ''
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

const removeExistingImage = (index, imageId) => {
  deletedImagesIds.value.push(imageId)
  existingImages.value.splice(index, 1)
}

const close = () => {
  dialog.value = false
  resetForm()
}

const resetForm = () => {
  if (formRef.value) formRef.value.resetValidation()
  Object.assign(form, { id: null, internal_id: '', name: '', brand: '', model: '', series: '', status: 1, notes: '' })
  existingImages.value = []
  deletedImagesIds.value = []
  imageFiles.value = []
  previewUrls.value = []
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

  if (imageFiles.value && imageFiles.value.length > 0) {
    imageFiles.value.forEach((file) => {
      formData.append('uploaded_images', file)
    })
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

defineExpose({ open })
</script>