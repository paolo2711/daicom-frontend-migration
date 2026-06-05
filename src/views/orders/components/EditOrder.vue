<template>
  <v-dialog v-model="dialogModel" class="dialog-premium" width="650" persistent>
    <v-card style="max-height: 90vh; display: flex; flex-direction: column;">
      <base-modal-header title="Editar Orden" icon="mdi-pencil-box-multiple" @close="close">
        <span v-if="order">Orden: <span class="font-weight-bold text-primary ml-1">{{ order.order_number }}</span></span>
      </base-modal-header>
      <template v-if="edit_order_data">

      <v-card-text class="pt-4" style="overflow-y: auto; flex-grow: 1;">
        <!-- :search-input.sync → v-model:search | item-text → item-title | outlined/dense → variant/density -->
        <v-autocomplete
          v-model="edit_order_data.client"
          :items="clients"
          label="Cliente Asignado a la Orden"
          variant="outlined"
          density="compact"
          item-title="name"
          item-value="id"
          class="mb-4"
          :loading="loading_clients"
          v-model:search="search_client"
        />

        <!-- ORDEN CERTIFICADO -->
        <!-- [R3] v-card outlined → variant="flat" class="border" -->
        <v-card variant="flat" class="border" v-if="order.order_type === 1 || !order.order_type" :color="isDark ? 'grey-darken-3' : 'grey-lighten-4'">
          <v-card-subtitle class="font-weight-bold pb-2">
            <!-- small → size="small" | left → start -->
            <v-icon size="small" start>mdi-link-variant</v-icon> Sincronizar dueño de Equipos
          </v-card-subtitle>
          <v-divider></v-divider>
          <!-- v-list dense → density="compact" | :color con isDark -->
          <v-list density="compact" class="pa-0" :color="isDark ? 'grey-darken-3' : 'transparent'">
            <v-list-item
              v-for="cert in edit_order_certs"
              :key="cert.id"
              style="border-bottom: 1px solid #ddd;"
              :disabled="cert.status === 5"
            >
              <!-- v-list-item-action → template #prepend (V3) -->
              <template #prepend>
                <v-checkbox v-model="selected_certs_to_update" :value="cert.id" color="primary" class="mr-3" hide-details></v-checkbox>
              </template>
              <!-- v-list-item-content eliminado en V3, contenido directo -->
              <v-list-item-title class="font-weight-medium">{{ cert.equipment }}</v-list-item-title>
              <v-list-item-subtitle>Dueño actual: {{ cert.client_data ? cert.client_data.name : '---' }}</v-list-item-subtitle>
            </v-list-item>
          </v-list>
        </v-card>

        <!-- ORDEN ALQUILER -->
        <div v-else-if="order.order_type === 2">
          <div class="text-subtitle-2 font-weight-bold mb-3 text-grey">Documentos de Respaldo (Sube un PDF para reemplazar el actual)</div>
          <v-text-field v-model="edit_order_data.client_order_reference" label="Nro OC del Cliente" variant="outlined" density="compact" prepend-inner-icon="mdi-pound"/>
          <v-file-input v-model="files_to_upload.quote_pdf" label="Reemplazar Cotización" variant="outlined" density="compact" prepend-inner-icon="mdi-file-pdf-box" accept="application/pdf" />
          <v-file-input v-model="files_to_upload.client_oc_pdf" label="Reemplazar OC del Cliente" variant="outlined" density="compact" prepend-inner-icon="mdi-file-document" accept="application/pdf" />
          <v-file-input v-model="files_to_upload.dispatch_guide_pdf" label="Reemplazar Guía de Salida" variant="outlined" density="compact" prepend-inner-icon="mdi-truck-fast" accept="application/pdf" />
          <v-file-input v-model="files_to_upload.return_guide_pdf" label="Subir/Reemplazar Guía de Retorno" variant="outlined" density="compact" prepend-inner-icon="mdi-truck-check" accept="application/pdf" />
        </div>
      </v-card-text>

      <v-card-actions class="px-6 pb-4 pt-2" style="border-top: 1px solid rgba(0,0,0,0.1);">
        <v-spacer/>
        <!-- depressed → variant="flat" -->
        <v-btn variant="flat" class="font-weight-bold rounded-lg mr-3 px-6" @click="close">Cancelar</v-btn>
        <v-btn color="primary" variant="flat" elevation="2" class="text-white font-weight-bold rounded-lg px-6"
          @click="guardarEdicionOrden" :loading="saving_edit_order" :disabled="!edit_order_data.client">
          Guardar Cambios
        </v-btn>
      </v-card-actions>
      </template>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, computed, watch, getCurrentInstance } from 'vue'
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
const files_to_upload = ref({ quote_pdf: null, client_oc_pdf: null, dispatch_guide_pdf: null, return_guide_pdf: null })
const saving_edit_order = ref(false)

const dialogModel = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

// Instancia del buscador usando el Composable global
const { 
  items: clients, 
  loading: loading_clients, 
  searchQuery: search_client, 
  // No necesitamos exportar retrieveClientes porque el Composable reacciona al watcher automáticamente
} = usePaginatedSearch(
  (page, size, query) => ClientDataService.getFiltered(page, size, query),
  ClientMappers.getMap,
  () => edit_order_data.value?.client
)

watch(() => props.modelValue, (val) => { 
  if (val && props.order) initFields() 
})

function initFields() {
  // Aseguramos que el cliente actual esté en la lista inicial antes de que cargue el asíncrono
  clients.value = [{ id: props.order.client_data.id, name: props.order.client_data.name }]
  
  edit_order_data.value = {
    id: props.order.id,
    client: props.order.client_data.id,
    order_number: props.order.order_number,
    client_order_reference: props.order.client_order_reference || ''
  }
  
  files_to_upload.value = { quote_pdf: null, client_oc_pdf: null, dispatch_guide_pdf: null, return_guide_pdf: null }

  if (props.order.order_type === 1 || !props.order.order_type) {
    edit_order_certs.value = JSON.parse(JSON.stringify(props.order.certificates))
    selected_certs_to_update.value = edit_order_certs.value.filter(c => c.status !== 5).map(c => c.id)
  }
}

function guardarEdicionOrden() {
  saving_edit_order.value = true
  let data = new FormData()
  data.append('client', edit_order_data.value.client)

  if (props.order.order_type === 1 || !props.order.order_type) {
    data.append('sync_certificates', selected_certs_to_update.value.join(','))
    OrderDataService.patch(edit_order_data.value.id, data).then(onSuccess).catch(onError)
  } else {
    data.append('client_order_reference', edit_order_data.value.client_order_reference)
    if (files_to_upload.value.quote_pdf) data.append('quote_pdf', files_to_upload.value.quote_pdf)
    if (files_to_upload.value.client_oc_pdf) data.append('client_oc_pdf', files_to_upload.value.client_oc_pdf)
    if (files_to_upload.value.dispatch_guide_pdf) data.append('dispatch_guide_pdf', files_to_upload.value.dispatch_guide_pdf)
    if (files_to_upload.value.return_guide_pdf) data.append('return_guide_pdf', files_to_upload.value.return_guide_pdf)

    OrderDataService.uploadInvoice(edit_order_data.value.id, data).then(onSuccess).catch(onError)
  }
}

function onSuccess() {
  window.dispatchEvent(new CustomEvent('wss-update-order-row', { detail: props.order.id }))
  $swal.fire('Éxito', 'La orden fue actualizada correctamente.', 'success')
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