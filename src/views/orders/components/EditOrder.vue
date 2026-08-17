<template>
  <v-dialog v-model="dialogModel" class="dialog-premium" width="680" persistent>
    <v-card style="max-height: 90vh; display: flex; flex-direction: column;">
      <base-modal-header :title="tituloModal" icon="mdi-pencil-box-multiple" @close="close">
        <span v-if="order">Orden: <span class="font-weight-bold text-primary ml-1">{{ order.order_number }}</span></span>
      </base-modal-header>
      <template v-if="edit_order_data">

      <v-card-text class="pt-4" style="overflow-y: auto; flex-grow: 1;">
        <v-row dense class="mb-2">
          <v-col cols="12">
            <v-autocomplete
              v-model="edit_order_data.client"
              :items="clients"
              label="Cliente Asignado a la Orden"
              variant="outlined"
              density="compact"
              item-title="name"
              item-value="id"
              hide-details="auto"
              :loading="loading_clients"
              v-model:search="search_client"
              no-filter
            />
          </v-col>
        </v-row>

        <!-- ORDEN CERTIFICADO -->
        <v-card variant="flat" class="border mt-2" v-if="order.order_type === 1 || !order.order_type" :color="isDark ? 'grey-darken-3' : 'grey-lighten-4'">
          <v-card-subtitle class="font-weight-bold pb-2">
            <v-icon size="small" start>mdi-link-variant</v-icon> Sincronizar dueño de Equipos
          </v-card-subtitle>
          <v-divider></v-divider>
          <v-list density="compact" class="pa-0" :color="isDark ? 'grey-darken-3' : 'transparent'">
            <v-list-item
              v-for="cert in edit_order_certs"
              :key="cert.id"
              style="border-bottom: 1px solid #ddd;"
              :disabled="cert.status === 5"
            >
              <template #prepend>
                <v-checkbox v-model="selected_certs_to_update" :value="cert.id" color="primary" class="mr-3" hide-details></v-checkbox>
              </template>
              <v-list-item-title class="font-weight-medium">{{ cert.equipment }}</v-list-item-title>
              <v-list-item-subtitle>Dueño actual: {{ cert.client_data ? cert.client_data.name : '---' }}</v-list-item-subtitle>
            </v-list-item>
          </v-list>
        </v-card>

        <!-- ORDEN ALQUILER — hogar único de documentos -->
        <div v-else-if="order.order_type === 2">

          <!-- Cotización y guías (documento único c/u) -->
          <div class="doc-group mt-2">
            <div class="doc-group__title"><v-icon size="small" start>mdi-file-check-outline</v-icon> Cotización y guías</div>
            <div v-for="u in unicos" :key="u.campo" class="d-flex align-center mb-2" style="gap: 8px;">
              <v-file-input v-model="files_to_upload[u.campo]" :label="u.label" variant="outlined" density="compact"
                            hide-details accept="application/pdf" :prepend-inner-icon="u.icon" prepend-icon="" class="flex-grow-1" />
              <v-btn v-if="order[u.campo]" icon="mdi-eye" size="small" variant="text" color="primary" @click="verUrl(order[u.campo])">
                <v-icon>mdi-eye</v-icon>
                <v-tooltip activator="parent" location="top">Ver actual</v-tooltip>
              </v-btn>
            </div>
            <div class="text-caption text-medium-emphasis pl-1">Sube un PDF para reemplazar el actual. Se guardan con "Guardar cambios".</div>
          </div>

          <!-- Secciones múltiples: OC + Valorizaciones -->
          <div v-for="s in secciones" :key="s.tipo" class="doc-group mt-4">
            <div class="doc-group__title">
              <v-icon size="small" start :color="s.color">{{ s.icon }}</v-icon> {{ s.titulo }}
              <v-chip size="x-small" variant="tonal" class="ml-2">{{ docs[s.tipo].length }}</v-chip>
            </div>

            <v-table v-if="docs[s.tipo].length" density="compact" class="doc-table mb-2">
              <tbody>
                <tr v-for="d in docs[s.tipo]" :key="d.id">
                  <td class="font-weight-medium">{{ d.numero || 'S/N' }}</td>
                  <td class="text-caption text-medium-emphasis">{{ (d.created_at || '').substring(0, 10) }}</td>
                  <td class="text-right" style="width: 80px">
                    <v-btn icon="mdi-eye" size="x-small" variant="text" color="primary" @click="verUrl(d.pdf)" />
                    <v-btn icon="mdi-delete-outline" size="x-small" variant="text" color="error" @click="borrarDoc(d)" />
                  </td>
                </tr>
              </tbody>
            </v-table>
            <div v-else class="text-caption text-medium-emphasis mb-2 pl-1">Sin documentos aún.</div>

            <div class="d-flex align-center" style="gap: 8px;">
              <v-text-field v-model="nuevoDoc[s.tipo].numero" label="Nº (opcional)" variant="outlined" density="compact"
                            hide-details prepend-inner-icon="mdi-pound" style="max-width: 140px;" />
              <v-file-input v-model="nuevoDoc[s.tipo].file" label="PDF" variant="outlined" density="compact"
                            hide-details accept="application/pdf" prepend-inner-icon="mdi-file-pdf-box" prepend-icon="" class="flex-grow-1" />
              <v-btn color="primary" variant="flat" :loading="subiendoDoc[s.tipo]" :disabled="!nuevoDoc[s.tipo].file" @click="subirDoc(s.tipo)">
                Subir
              </v-btn>
            </div>
          </div>
        </div>
      </v-card-text>

      <v-card-actions class="px-6 pb-4 pt-2" style="border-top: 1px solid rgba(0,0,0,0.1);">
        <v-spacer/>
        <v-btn variant="flat" class="font-weight-bold rounded-lg mr-3 px-6" @click="close">Cerrar</v-btn>
        <v-btn color="primary" variant="flat" elevation="2" class="text-white font-weight-bold rounded-lg px-6"
          @click="guardarEdicionOrden" :loading="saving_edit_order" :disabled="!edit_order_data.client">
          Guardar cambios
        </v-btn>
      </v-card-actions>
      </template>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, reactive, computed, watch, getCurrentInstance } from 'vue'
import { Toast } from '@/plugins/alerts'
import { useTheme } from 'vuetify'
import OrderDataService from "@/services/certificates/orderDataService"
import ClientDataService from "@/services/clients/clientDataService"
import ClientMappers from "@/mappers/clientMappers"
import { usePaginatedSearch } from '@/composables/usePaginatedSearch'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  order: { type: Object, default: null }
})

const emit = defineEmits(['update:modelValue', 'close'])

const { appContext } = getCurrentInstance()
const $swal = appContext.config.globalProperties.$swal
const theme = useTheme()
const isDark = computed(() => theme.global.current.value.dark)

const edit_order_data = ref(null)
const edit_order_certs = ref([])
const selected_certs_to_update = ref([])
const files_to_upload = ref({ quote_pdf: null, dispatch_guide_pdf: null, return_guide_pdf: null })
const saving_edit_order = ref(false)

const tituloModal = computed(() => props.order?.order_type === 2 ? 'Editar alquiler' : 'Editar orden')

// Documentos únicos del alquiler (un PDF c/u) — se guardan con el form.
const unicos = [
  { campo: 'quote_pdf',          label: 'Cotización',       icon: 'mdi-file-pdf-box' },
  { campo: 'dispatch_guide_pdf', label: 'Guía de Salida',   icon: 'mdi-truck-fast' },
  { campo: 'return_guide_pdf',   label: 'Guía de Retorno',  icon: 'mdi-truck-check' }
]

// Documentos múltiples (viven en OrderDocument, se suben/borran al instante).
const secciones = [
  { tipo: 1, titulo: 'Órdenes de Compra', icon: 'mdi-file-document-outline', color: 'primary' },
  { tipo: 2, titulo: 'Valorizaciones',    icon: 'mdi-cash-multiple',         color: 'teal' }
]
const docs = reactive({ 1: [], 2: [] })
const nuevoDoc = reactive({ 1: { numero: '', file: null }, 2: { numero: '', file: null } })
const subiendoDoc = reactive({ 1: false, 2: false })

const dialogModel = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const {
  items: clients,
  loading: loading_clients,
  searchQuery: search_client,
} = usePaginatedSearch(
  (page, size, query) => ClientDataService.getFiltered(page, size, query),
  ClientMappers.getMap,
  () => edit_order_data.value?.client
)

watch(() => props.modelValue, (val) => {
  if (val && props.order) initFields()
})

function initFields() {
  clients.value = [{ id: props.order.client_data.id, name: props.order.client_data.name }]

  edit_order_data.value = {
    id: props.order.id,
    client: props.order.client_data.id,
    order_number: props.order.order_number
  }

  files_to_upload.value = { quote_pdf: null, dispatch_guide_pdf: null, return_guide_pdf: null }

  if (props.order.order_type === 1 || !props.order.order_type) {
    edit_order_certs.value = JSON.parse(JSON.stringify(props.order.certificates))
    selected_certs_to_update.value = edit_order_certs.value.filter(c => c.status !== 5).map(c => c.id)
  } else if (props.order.order_type === 2) {
    cargarDocs()
  }
}

// ── Documentos múltiples (OC / valorizaciones) ──
function cargarDocs() {
  if (!props.order?.id) return
  OrderDataService.listDocuments(props.order.id).then((res) => {
    docs[1] = res.data.filter(d => d.tipo === 1)
    docs[2] = res.data.filter(d => d.tipo === 2)
  }).catch(() => {})
}

// Refresca la fila en la tabla para que se actualicen las pastillas OC/Val.
function refrescarFila() {
  window.dispatchEvent(new CustomEvent('wss-update-order-row', { detail: props.order.id }))
}

function subirDoc(tipo) {
  const n = nuevoDoc[tipo]
  if (!n.file) return
  subiendoDoc[tipo] = true
  const data = new FormData()
  data.append('tipo', tipo)
  data.append('numero', n.numero || '')
  data.append('pdf', n.file)
  OrderDataService.addDocument(props.order.id, data)
    .then(() => {
      nuevoDoc[tipo] = { numero: '', file: null }
      cargarDocs()
      refrescarFila()
      Toast.fire({ timer: 2000, icon: 'success', title: 'Documento subido' })
    })
    .catch(() => Toast.fire({ timer: 2500, icon: 'error', title: 'No se pudo subir' }))
    .finally(() => { subiendoDoc[tipo] = false })
}

async function borrarDoc(d) {
  const r = await $swal.fire({
    title: '¿Eliminar documento?',
    text: `${d.tipo_display} ${d.numero || ''}`.trim(),
    icon: 'warning', showCancelButton: true,
    confirmButtonText: 'Sí, eliminar', cancelButtonText: 'Cancelar'
  })
  if (!r.isConfirmed) return
  OrderDataService.deleteDocument(d.id)
    .then(() => {
      cargarDocs()
      refrescarFila()
      Toast.fire({ timer: 2000, icon: 'success', title: 'Documento eliminado' })
    })
    .catch(() => Toast.fire({ timer: 2500, icon: 'error', title: 'No se pudo eliminar' }))
}

function verUrl(url) { if (url) window.open(url, '_blank') }

//  Guardado del form (cliente, cotizacion, guias)
function guardarEdicionOrden() {
  saving_edit_order.value = true
  let data = new FormData()
  data.append('client', edit_order_data.value.client)

  if (props.order.order_type === 1 || !props.order.order_type) {
    data.append('sync_certificates', selected_certs_to_update.value.join(','))
    OrderDataService.patch(edit_order_data.value.id, data).then(onSuccess).catch(onError)
  } else {
    if (files_to_upload.value.quote_pdf) data.append('quote_pdf', files_to_upload.value.quote_pdf)
    if (files_to_upload.value.dispatch_guide_pdf) data.append('dispatch_guide_pdf', files_to_upload.value.dispatch_guide_pdf)
    if (files_to_upload.value.return_guide_pdf) data.append('return_guide_pdf', files_to_upload.value.return_guide_pdf)

    OrderDataService.uploadInvoice(edit_order_data.value.id, data).then(onSuccess).catch(onError)
  }
}

function onSuccess() {
  window.dispatchEvent(new CustomEvent('wss-update-order-row', { detail: props.order.id }))
  Toast.fire({ timer: 2200, icon: 'success', title: 'Orden actualizada' })
  close()
  saving_edit_order.value = false
}

function onError() {
  $swal.fire('Error', 'No se pudo actualizar la orden.', 'error')
  saving_edit_order.value = false
}

function close() {
  emit('close')
}
</script>

<style scoped>
.doc-group {
  border: 1px solid rgba(0,0,0,0.09);
  border-radius: 12px;
  padding: 12px 14px;
}
.doc-group__title {
  font-size: 0.8rem;
  font-weight: 700;
  color: rgba(0,0,0,0.65);
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}
.doc-table {
  border: 1px solid rgba(0,0,0,0.08);
  border-radius: 8px;
}
</style>
