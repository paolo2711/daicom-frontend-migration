<template>
  <v-dialog width="1000" v-model="dialog" class="dialog-premium" persistent>
    <v-card style="max-height: 90vh; display: flex; flex-direction: column;">
      <base-modal-header :title="`Generar Orden de ${order.order_type === 1 ? 'Servicio' : 'Alquiler'}`" icon="mdi-file-document-plus" @close="close">
        <span v-if="next_order_number">Sig. Orden: <span class="font-weight-bold text-primary ml-1">{{ next_order_number }}</span></span>
      </base-modal-header>

      <v-card-text class="pt-4" style="overflow-y: auto; flex-grow: 1;">
        <v-form ref="addOrderForm" v-model="is_valid" @submit.prevent>

          <v-row align="start" dense>
            <v-col cols="12" md="9">
              <v-autocomplete v-model="order.client" density="compact" :loading="loading_clients"
                              :items="clients" v-model:search="search_client"
                              item-title="name" item-value="id" variant="outlined" hide-details="auto"
                              label="Cliente (* Obligatorio)" :rules="[v => !!v || 'Debe seleccionar un cliente']" />
            </v-col>
            <v-col cols="12" md="3" class="pt-1">
              <v-btn color="primary" variant="flat" block height="40" @click="clientDialogOpen = true">
                <v-icon start>mdi-plus</v-icon> NUEVO
              </v-btn>
            </v-col>
          </v-row>

          <template v-if="order.order_type === 2">
            <v-row dense class="mt-3">
              <v-col cols="12" md="6">
                <v-text-field v-model="order.client_order_reference" label="Ref. OC del Cliente" variant="outlined" density="compact" hide-details="auto" prepend-inner-icon="mdi-pound" placeholder="Ej: OC-99234" />
              </v-col>
            </v-row>

            <v-row dense class="mt-2">
              <v-col cols="12" md="6">
                <v-file-input v-model="order.quote_pdf" label="Cotización DAICOM" variant="outlined" density="compact" hide-details="auto" accept="application/pdf" prepend-inner-icon="mdi-file-pdf-box" show-size />
              </v-col>
              <v-col cols="12" md="6">
                <v-file-input v-model="order.client_oc_pdf" label="OC Cliente (PDF)" variant="outlined" density="compact" hide-details="auto" accept="application/pdf" prepend-inner-icon="mdi-file-document" show-size />
              </v-col>
            </v-row>

            <v-row dense class="mt-2">
              <v-col cols="12" md="6">
                <v-file-input v-model="order.dispatch_guide_pdf" label="Guía de Remisión (Salida)" variant="outlined" density="compact" hide-details="auto" accept="application/pdf" prepend-inner-icon="mdi-truck-fast" show-size />
              </v-col>
              <v-col cols="12" md="6">
                <v-file-input v-model="order.return_guide_pdf" label="Guía de Retorno (Opcional)" variant="outlined" density="compact" hide-details="auto" accept="application/pdf" prepend-inner-icon="mdi-truck-check" show-size />
              </v-col>
            </v-row>
          </template>

          <v-divider class="my-4" />

          <form-order-service ref="formServicio" v-if="order.order_type === 1" :key="'srv-'+dialog" @update-list="list => items_to_save = list" />
          <form-order-rental v-else :key="'alq-'+dialog" @update-list="list => items_to_save = list" />

        </v-form>
      </v-card-text>

      <client-form-dialog v-model="clientDialogOpen" @reloadListComponent="retrieveClientes('')" />

      <!-- Agregamos un borde superior para delimitar los botones cuando el contenido hace scroll -->
      <v-card-actions class="px-6 pb-4 pt-2" style="border-top: 1px solid rgba(0,0,0,0.1);">
        <v-spacer />
        <v-btn variant="flat" class="font-weight-bold mr-3 px-4" @click="close">Cancelar</v-btn>
        <v-btn color="primary" @click="save" :disabled="!is_valid || items_to_save.length === 0" :loading="is_on_sending_process">
          Guardar Orden de {{ order.order_type === 1 ? 'Servicio' : 'Alquiler' }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, watch, nextTick, defineAsyncComponent, getCurrentInstance } from 'vue'
import { useAppStore } from '@/stores/appStore'
import ClientDataService from '@/services/clients/clientDataService'
import { usePaginatedSearch } from '@/composables/usePaginatedSearch'
import ClientMappers from '@/mappers/clientMappers'
import OrderDataService from '@/services/certificates/orderDataService'
import FormOrderService from './FormOrderService.vue'
import FormOrderRental from './FormOrderRental.vue'

const ClientFormDialog = defineAsyncComponent(() => import('@/views/clients/components/ClientFormDialog.vue'))

const emit = defineEmits(['reloadListComponent'])

const { appContext } = getCurrentInstance()
const $swal = appContext.config.globalProperties.$swal
const appStore = useAppStore()

const dialog                = ref(false)
const is_on_sending_process = ref(false)
const is_valid              = ref(false)
const next_order_number     = ref('')
const order                 = ref({ client: null, order_type: 1 })
const items_to_save         = ref([])
const addOrderForm          = ref(null)

// Instancia del buscador de Clientes usando el Composable global
const { 
  items: clients, 
  loading: loading_clients, 
  searchQuery: search_client, 
  retrieveData: retrieveClientes 
} = usePaginatedSearch(
  (page, size, query) => ClientDataService.getFiltered(page, size, query),
  ClientMappers.getMap,
  () => order.value.client
)
const formServicio          = ref(null)

const clientDialogOpen      = ref(false)

watch(() => order.value.order_type, () => { calculateNextNumber() })

watch(items_to_save, (newVal) => {
  if (order.value?.order_type === 1 && newVal?.length > 0) {
    localStorage.setItem('daicom_draft_items_1', JSON.stringify(newVal))
  }
}, { deep: true })

function open(tipo) {
  const draft = tipo === 1 ? localStorage.getItem('daicom_draft_items_1') : null
  items_to_save.value = []
  order.value = { client: null, order_type: tipo }
  dialog.value = true
  retrieveClientes('')
  calculateNextNumber()

  if (draft) {
    setTimeout(() => {
      $swal.fire({
        title: '¿Recuperar borrador?',
        text: 'Tienes equipos de Servicio pendientes de una sesión anterior.',
        icon: 'info',
        showCancelButton: true,
        confirmButtonText: 'Sí, recuperar',
        cancelButtonText: 'Descartar',
        confirmButtonColor: '#1976D2'
      }).then((result) => {
        if (result.isConfirmed) {
          nextTick(() => {
            const recuperados = JSON.parse(draft)
            formServicio.value?.inyectarBorrador(recuperados)
          })
        } else {
          localStorage.removeItem('daicom_draft_items_1')
        }
      })
    }, 300)
  }
}

async function calculateNextNumber() {
  const prefijo = order.value.order_type === 1 ? 'OS-' : 'ALQ-'
  try {
    const res = await OrderDataService.getFiltered(1, 1, '', prefijo, '')
    const totalRegistros = res.data.count
    const year = new Date().getFullYear()
    next_order_number.value = `${prefijo}${year}-${(totalRegistros + 1).toString().padStart(5, '0')}`
  } catch (e) {
    next_order_number.value = `${prefijo}${new Date().getFullYear()}-XXXXX`
  }
}



async function save() {
  if (items_to_save.value.length === 0) return
  is_on_sending_process.value = true

  try {
    const payload_orden = { client: order.value.client, order_type: order.value.order_type }
    if (order.value.order_type === 2 && order.value.client_order_reference) {
      payload_orden.client_order_reference = order.value.client_order_reference
    }
    payload_orden.items = items_to_save.value

    const orderResponse = await OrderDataService.create(payload_orden)
    const newOrderId = orderResponse.data.id

    if (order.value.order_type === 2) {
      let fileData = new FormData()
      let hasFiles = false
      if (order.value.quote_pdf)         { fileData.append('quote_pdf', order.value.quote_pdf); hasFiles = true }
      if (order.value.client_oc_pdf)     { fileData.append('client_oc_pdf', order.value.client_oc_pdf); hasFiles = true }
      if (order.value.dispatch_guide_pdf){ fileData.append('dispatch_guide_pdf', order.value.dispatch_guide_pdf); hasFiles = true }
      if (order.value.return_guide_pdf)  { fileData.append('return_guide_pdf', order.value.return_guide_pdf); hasFiles = true }
      if (hasFiles) {
        await OrderDataService.uploadInvoice(newOrderId, fileData)
      }
    }

    $swal.fire(appStore.successSavedOptions).then(() => {
      const currentUser = JSON.parse(localStorage.getItem('user')) || {}
      if (window.enviarNotificacionGlobal) {
        window.enviarNotificacionGlobal(
          currentUser.username,
          'info',
          order.value.order_type === 1 ? 'Nueva Orden de Servicio' : 'Nueva Orden de Alquiler',
          `Se registró una orden con ${items_to_save.value.length} equipos.`
        )
      }
      close()
      
      
    })
  } catch (error) {
    console.error('Error al guardar la orden:', error)
    $swal.fire('Error', 'Fallo de conexión. Revise los datos e intente de nuevo.', 'error')
  } finally {
    is_on_sending_process.value = false
  }
}

function close() {
  if (order.value?.order_type === 1) {
    localStorage.removeItem('daicom_draft_items_1')
  }
  order.value.client = null
  items_to_save.value = []
  addOrderForm.value?.resetValidation()
  dialog.value = false
}

defineExpose({ open })
</script>