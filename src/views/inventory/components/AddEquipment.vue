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

      <v-window v-model="tab" class="pestanas-del-mismo-alto">
        <v-window-item :value="0" eager :transition="false" :reverse-transition="false">
          <v-card-text class="pt-6">
            <v-form ref="formRef" v-model="valid">
              <v-row>
                <v-col cols="12" md="4" class="d-flex flex-column">
                  <div class="text-subtitle-2 mb-2 font-weight-medium">
                    <v-icon start size="small">mdi-image-multiple</v-icon> Fotografías del Equipo
                  </div>

                  <input type="file" ref="fileInput" multiple accept="image/*" style="display: none" @change="onFileChange">

                  <!-- Zona clic + arrastrar (mismo componente comun PdfDropZone, en modo imagen) -->
                  <pdf-drop-zone accept="image/*" multiple label="Suelta las fotos aquí" icon="mdi-image-plus" @files="onFilesDropped">
                    <v-card
                      variant="outlined"
                      :class="isDark ? 'bg-grey-darken-3' : 'bg-grey-lighten-5'"
                      style="border: 2px dashed #9e9e9e; cursor: pointer;"
                      class="d-flex flex-column align-center justify-center pa-4 mb-2 transition-swing"
                      height="120"
                      hover
                      @click="fileInput?.click()"
                    >
                      <v-icon size="36" color="primary">mdi-cloud-upload</v-icon>
                      <div class="text-caption mt-2 font-weight-medium text-center">Haz clic o <strong>arrastra</strong> las fotos aquí</div>
                    </v-card>
                  </pdf-drop-zone>

                  <div v-if="existingImages.length || previewUrls.length" class="text-caption text-medium-emphasis mb-2">
                    <v-icon size="13" color="primary">mdi-star</v-icon> La <strong>primera</strong> foto es la que se muestra en el listado.
                  </div>

                  <div class="d-flex flex-wrap" style="gap: 8px; max-height: 250px; overflow-y: auto;">
                    <v-card
                      v-for="(img, i) in existingImages" :key="'exist-'+img.id"
                      variant="outlined" class="rounded"
                      style="position: relative; width: 70px; height: 70px; cursor: zoom-in;"
                      :style="i === 0 ? 'border: 2px solid rgb(var(--v-theme-primary)) !important;' : ''"
                      @click="visor?.open(existingImages, i)"
                    >
                      <v-img :src="img.image" height="100%" width="100%" cover></v-img>

                      <!-- Etiqueta "Principal" en la 1ra -->
                      <div v-if="i === 0" class="foto-principal-badge">Principal</div>
                      <!-- Estrella para marcar principal en las demas -->
                      <v-btn v-else icon variant="flat" size="x-small" color="amber-darken-2"
                             style="position: absolute; bottom: -4px; left: -4px; height: 20px; width: 20px; z-index: 2;"
                             @click.stop="setPrincipal(i)">
                        <v-icon size="13">mdi-star-outline</v-icon>
                        <v-tooltip activator="parent" location="top">Marcar como principal</v-tooltip>
                      </v-btn>

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
                      <v-text-field
                        :model-value="isEditing ? form.internal_id : (nextId || 'Calculando...')"
                        :label="isEditing ? 'ID Interno' : 'ID Interno (se asignará este)'"
                        variant="outlined" density="compact"
                        disabled
                        prepend-inner-icon="mdi-identifier"
                      ></v-text-field>
                    </v-col>
                    <v-col cols="12" sm="6">
                      <!-- El catalogo solo sugiere: un equipo que no se calibra no esta en el. -->
                      <v-combobox
                        v-model="form.name"
                        :items="nameSuggestions"
                        v-model:search="nameSearch"
                        :loading="loadingNames"
                        label="Nombre del Equipo (*)"
                        :rules="[v => !!v || 'Requerido']"
                        variant="outlined" density="compact"
                        hide-no-data auto-select-first no-filter
                        prepend-inner-icon="mdi-toolbox-outline"
                      >
                        <template v-if="hayMasNombres" #append-item><more-results-hint /></template>
                      </v-combobox>
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
                      <!-- "Alquilado" lo maneja el flujo de alquiler, no se edita a mano -->
                      <v-text-field
                        v-if="isEditing && form.status === 2"
                        model-value="Alquilado"
                        label="Estado actual"
                        variant="outlined" density="compact"
                        disabled
                        prepend-inner-icon="mdi-truck-fast"
                        hint="Gestionado por los alquileres" persistent-hint
                      ></v-text-field>
                      <v-select
                        v-else
                        v-model="form.status"
                        :items="statusOptions"
                        item-title="text" item-value="value"
                        label="Estado actual"
                        variant="outlined" density="compact"
                      ></v-select>
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

        <v-window-item :value="1" eager :transition="false" :reverse-transition="false">
          <v-card-text class="pa-4 text-center">
            <v-icon size="48" class="text-medium-emphasis">mdi-certificate-outline</v-icon>
            <h3 class="text-h6 font-weight-bold mt-1 mb-4">Certificado DAICOM</h3>

            <template v-if="form.latest_certificate">
              <v-card variant="tonal" class="mx-auto pa-4 mb-4 text-left" max-width="360" rounded="lg">
                <div v-for="[etiqueta, valor] in filasDe(form.latest_certificate)" :key="etiqueta"
                     class="d-flex justify-space-between align-center ga-4 py-1">
                  <span class="text-caption text-medium-emphasis">{{ etiqueta }}</span>
                  <span class="font-weight-medium text-right">{{ valor }}</span>
                </div>
              </v-card>
              <div class="d-flex justify-center align-center ga-2">
                <v-btn v-if="form.latest_certificate.pdf" variant="tonal" prepend-icon="mdi-file-pdf-box"
                       @click="abrirPdf(form.latest_certificate.pdf)">Ver PDF</v-btn>
                <span v-else class="text-caption text-medium-emphasis">Todavía sin PDF</span>
                <v-btn variant="text" prepend-icon="mdi-link-off" @click="form.latest_certificate = null">Desvincular</v-btn>
              </div>
            </template>

            <paginated-autocomplete v-else class="mx-auto text-left" style="max-width: 400px;" :model-value="null"
                                    :fetch="InventoryDataService.buscarCertificados" :mapper="aOpcion" :cache="false"
                                    label="Vincular certificado" placeholder="Su número: ACR-15 o 15"
                                    no-data-text="No hay un certificado con ese número"
                                    prepend-inner-icon="mdi-link-variant" v-bind="CAMPO"
                                    @selected="c => (form.latest_certificate = c)">
              <template #item="{ item, props: opcion }">
                <v-list-item v-bind="opcion" :title="item.raw.numero" :subtitle="detalleDe(item.raw)" />
              </template>
            </paginated-autocomplete>
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

    <photo-viewer ref="visor" />
  </v-dialog>
</template>

<script setup>
import { avisarHecho } from '@/utils/documents/avisos'
import { ref, reactive, computed } from 'vue'
import { useTheme } from 'vuetify'
import Swal from 'sweetalert2'
import InventoryDataService from '@/services/inventory/inventoryDataService'
import { usePaginatedSearch } from '@/composables/usePaginatedSearch'
import { mensajeDeError } from '@/utils/errors'
import { fechaCorta } from '@/utils/dates'
import { abrirPdf } from '@/utils/pdf'
import { LISTAS } from '@/utils/comboLists'
import { textoDeVence } from '@/utils/equipments/expediente'
import { CAMPO } from '@/utils/fields'
import PaginatedAutocomplete from '@/components/commonComponents/PaginatedAutocomplete.vue'
import PdfDropZone from '@/components/commonComponents/PdfDropZone.vue'
import MoreResultsHint from '@/components/shared/MoreResultsHint.vue'
import PhotoViewer from '@/components/shared/PhotoViewer.vue'

const emit = defineEmits(['saved'])

const theme = useTheme()
const isDark = computed(() => theme.global.current.value.dark)

const dialog = ref(false)
const valid = ref(false)
const loading = ref(false)
const isEditing = ref(false)
const nextId = ref('')
const tab = ref(0)
const formRef = ref(null)
const fileInput = ref(null)

// Variables para imágenes
const existingImages = ref([])
const deletedImagesIds = ref([])
const imageFiles = ref([])
const previewUrls = ref([])
const visor = ref(null)

const { items: sugeridos, loading: loadingNames, searchQuery: nameSearch, olvidar: olvidarSugerencias, total } =
  usePaginatedSearch(LISTAS.equipos.fetch, LISTAS.equipos.mapper, () => null, 'equipos')
const nameSuggestions = computed(() => sugeridos.value.map(e => e.name))
const hayMasNombres = computed(() => total.value > sugeridos.value.length)

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

// "Alquilado" (2) no esta: lo gestiona el flujo de alquiler, no se pone a mano.
const statusOptions = [
  { text: 'Disponible', value: 1 },
  { text: 'Mantenimiento', value: 3 },
  { text: 'Baja', value: 4 },
]

// El certificado se elige o se quita aca y se graba con el resto, al guardar.
const aOpcion = (certificado) => ({ ...certificado, name: certificado.numero })
const detalleDe = (certificado) =>
  [certificado.equipment, textoDeVence(certificado), !certificado.pdf && 'sin PDF'].filter(Boolean).join(' · ')
const filasDe = (certificado) => [
  ['Certificado', certificado.numero],
  ['Equipo', certificado.equipment || '—'],
  ['Emitido', fechaCorta(certificado.emission_date) || '—'],
  ['Vigencia', textoDeVence(certificado) || '—'],
]

// Marca una foto existente como principal: la pone primera (la que se muestra en la lista).
const setPrincipal = (i) => {
  const [img] = existingImages.value.splice(i, 1)
  existingImages.value.unshift(img)
}

// Fotos soltadas por drag&drop (mismo destino que el input file).
const onFilesDropped = (files) => {
  (files || []).forEach(file => {
    imageFiles.value.push(file)
    previewUrls.value.push(URL.createObjectURL(file))
  })
}

// `id`: el equipo que se edita; sin el, uno nuevo.
async function open(id = null, targetTab = 0) {
  let item = null
  try {
    if (id) item = (await InventoryDataService.get(id)).data
  } catch (error) {
    Swal.fire('No se abrió el equipo', mensajeDeError(error, 'Intenta de nuevo.'), 'error')
    return
  }
  resetForm()
  if (item) {
    isEditing.value = true
    Object.keys(form).forEach(key => {
      if (item[key] !== undefined) form[key] = item[key]
    })
    existingImages.value = item.gallery ? JSON.parse(JSON.stringify(item.gallery)) : []
  } else {
    isEditing.value = false
    // Previsualiza el ID que le tocará (DAI-XXX).
    nextId.value = ''
    InventoryDataService.getNextId()
      .then(r => { nextId.value = r.data.next_id })
      .catch(() => { nextId.value = '' })
  }
  // Pestana con la que abre: 0 = Datos y Fotos, 1 = Certificado.
  tab.value = targetTab
  dialog.value = true
}

const close = () => {
  // Los valores los reinicia open(): vaciarlos mientras se cierra los marca en rojo.
  formRef.value?.resetValidation()
  dialog.value = false
}

const resetForm = () => {
  if (formRef.value) formRef.value.resetValidation()
  olvidarSugerencias()
  Object.assign(form, { id: null, internal_id: '', name: '', brand: '', model: '', series: '', status: 1, notes: '', latest_certificate: null })
  existingImages.value = []
  deletedImagesIds.value = []
  imageFiles.value = []
  previewUrls.value = []
  tab.value = 0
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
  // internal_id lo genera el backend (DAI-XXX); no se envía.
  formData.append('name', form.name)
  if (form.brand) formData.append('brand', form.brand)
  if (form.model) formData.append('model', form.model)
  if (form.series) formData.append('series', form.series)
  formData.append('status', form.status)
  if (form.notes) formData.append('notes', form.notes)
  
  // Vacio lo desvincula.
  formData.append('latest_certificate', form.latest_certificate?.id ?? '')

  if (imageFiles.value.length > 0) {
    imageFiles.value.forEach(file => formData.append('uploaded_images', file))
  }
  if (deletedImagesIds.value.length > 0) {
    formData.append('deleted_images', deletedImagesIds.value.join(','))
  }
  // Foto principal = la primera de las existentes (la que se muestra en el listado).
  if (existingImages.value.length > 0 && existingImages.value[0].id) {
    formData.append('primary_image_id', existingImages.value[0].id)
  }

  try {
    if (isEditing.value) {
      const { data } = await InventoryDataService.update(form.id, formData)
      avisarHecho('Equipo actualizado', data)
    } else {
      const { data } = await InventoryDataService.create(formData)
      avisarHecho('Equipo registrado', data)
    }
    emit('saved')
    close()
  } catch (error) {
    const nombres = { series: 'N° de Serie', name: 'Nombre', brand: 'Marca', model: 'Modelo', status: 'Estado',
                      latest_certificate: 'Certificado' }
    Swal.fire({
      title: 'Error al guardar',
      text: mensajeDeError(error, 'Revisa los datos e intenta de nuevo.', nombres),
      icon: 'error'
    })
  } finally {
    loading.value = false
  }
}

defineExpose({ open })
</script>

<style scoped>
/* Las dos pestañas en el mismo lugar: el modal toma el alto de la mas alta y no cambia al pasar de una a otra. */
.pestanas-del-mismo-alto :deep(.v-window__container) { display: grid; }
.pestanas-del-mismo-alto :deep(.v-window-item) { grid-area: 1 / 1; display: block !important; }
.pestanas-del-mismo-alto :deep(.v-window-item:not(.v-window-item--active)) { visibility: hidden; }
.foto-principal-badge {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 2;
  background: rgba(var(--v-theme-primary), 0.9);
  color: #fff;
  font-size: 9px;
  font-weight: 700;
  text-align: center;
  letter-spacing: 0.5px;
  padding: 1px 0;
  border-bottom-left-radius: 4px;
  border-bottom-right-radius: 4px;
}
</style>