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

                  <div v-if="fotos.length" class="text-caption text-medium-emphasis mb-2">
                    La primera es la principal, la de la lista. Arrastra una foto para cambiar el orden.
                  </div>

                  <div class="cuadricula d-flex flex-wrap" v-bind="zona">
                    <div v-for="(foto, i) in fotos" :key="clave(foto)" class="foto rounded" :class="claseDe(i)"
                         v-bind="{ ...arrastrable(i), ...asa(i) }" @click="visor?.open(fotos, i)">
                      <v-img :src="foto.image" height="100%" width="100%" cover />
                      <div v-if="i === 0" class="foto-pie principal">Principal</div>
                      <button v-else type="button" class="foto-pie sobre-foto accion" @click.stop="mover(i, 0)">
                        Hacer principal
                      </button>
                      <button type="button" class="quitar sobre-foto accion" title="Eliminar" aria-label="Eliminar foto"
                              @click.stop="quitarFoto(i)">
                        <v-icon size="14">mdi-delete</v-icon>
                      </button>
                    </div>
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
                        v-if="isEditing && form.status === ALQUILADO"
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
import { useRowDrag } from '@/composables/useRowDrag'
import { mensajeDeError } from '@/utils/errors'
import { fechaCorta } from '@/utils/dates'
import { abrirPdf } from '@/utils/pdf'
import { LISTAS } from '@/utils/comboLists'
import { ALQUILADO } from '@/utils/equipments/estado'
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

// Las guardadas ({ id, image }) y las nuevas ({ archivo, image }), en el orden en que quedan.
const fotos = ref([])
const deletedImagesIds = ref([])
const visor = ref(null)
const { asa, arrastrable, claseDe, clave, mover, zona } = useRowDrag(fotos, { horizontal: true })

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

const agregarFotos = (archivos) => {
  fotos.value.push(...Array.from(archivos || [], archivo => ({ archivo, image: URL.createObjectURL(archivo) })))
}
const onFilesDropped = agregarFotos

const quitarFoto = (i) => {
  const [foto] = fotos.value.splice(i, 1)
  if (foto.id) deletedImagesIds.value.push(foto.id)
  else URL.revokeObjectURL(foto.image)
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
    fotos.value = (item.gallery ?? []).map(({ id, image }) => ({ id, image }))
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
  fotos.value.filter(foto => foto.archivo).forEach(foto => URL.revokeObjectURL(foto.image))
  fotos.value = []
  deletedImagesIds.value = []
  tab.value = 0
}

const onFileChange = (event) => {
  agregarFotos(event.target.files)
  if (fileInput.value) fileInput.value.value = ''
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

  // El orden de todas: las guardadas por su id y las nuevas como n0, n1... en el orden en que se suben.
  const nuevas = fotos.value.filter(foto => foto.archivo)
  nuevas.forEach(foto => formData.append('uploaded_images', foto.archivo))
  formData.append('orden', fotos.value.map(foto => (foto.archivo ? `n${nuevas.indexOf(foto)}` : foto.id)).join(','))
  if (deletedImagesIds.value.length > 0) {
    formData.append('deleted_images', deletedImagesIds.value.join(','))
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
.pestanas-del-mismo-alto :deep(.v-window-item:not(.v-window-item--active)) {
  visibility: hidden;
  opacity: 0;  /* las ayudas de los campos se ponen visibles por su cuenta */
  pointer-events: none;
}
/* El margen hacia afuera deja lugar a la linea de la primera y la ultima: el desplazamiento recorta lo que sale. */
.cuadricula { gap: 8px; max-height: 250px; overflow-y: auto; margin: 0 -6px; padding: 0 6px; }
.foto {
  position: relative;
  width: 70px;
  height: 70px;
  overflow: hidden;
  cursor: grab;
  border: thin solid rgba(var(--v-border-color), var(--v-border-opacity));
}
.foto-pie {
  position: absolute;
  inset: auto 0 0 0;
  z-index: 2;
  padding: 1px 0;
  color: #fff;
  font-size: 9px;
  font-weight: 700;
  text-align: center;
}
.principal { background: rgba(var(--v-theme-primary), 0.9); }
.sobre-foto { background: rgba(0, 0, 0, 0.6); color: #fff; }
.quitar {
  position: absolute;
  top: 3px;
  right: 3px;
  z-index: 2;
  display: grid;
  place-items: center;
  width: 20px;
  height: 20px;
  border-radius: 50%;
}
/* Rojo recien sobre el boton: avisa al momento de borrar. */
.quitar:hover, .quitar:focus-visible { background: rgb(var(--v-theme-error)); }
/* Lo que se hace con una foto aparece al pasar por ella; en una pantalla tactil, siempre. */
.accion { opacity: 0; transition: opacity 0.15s; }
.foto:hover .accion, .foto:focus-within .accion { opacity: 1; }
@media (hover: none) { .accion { opacity: 1; } }
/* Donde cae la que se arrastra: la pildora de seleccion (R4), en el espacio entre fotos. */
.foto.cae-antes, .foto.cae-despues { overflow: visible; }
.foto.cae-antes::before, .foto.cae-despues::after {
  content: '';
  position: absolute;
  top: 8px;
  bottom: 8px;
  width: 3px;
  border-radius: 2px;
  background: rgb(var(--v-theme-seleccion));
}
.foto.cae-antes::before { left: -5.5px; }
.foto.cae-despues::after { right: -5.5px; }
</style>