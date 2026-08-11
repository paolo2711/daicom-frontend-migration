<template>
  <v-dialog width="1000" v-model="dialog" class="dialog-premium" persistent>
    <v-card style="max-height: 90vh; display: flex; flex-direction: column;">
      <base-modal-header :title="`Generar Orden de ${order.order_type === 1 ? 'Servicio' : 'Alquiler'}`" icon="mdi-file-document-plus" @close="close">
        <span v-if="next_order_number">Sig. Orden: <span class="font-weight-bold text-primary ml-1">{{ next_order_number }}</span></span>
        <div class="currency-switch ml-4">
          <v-btn-toggle v-model="order.currency" mandatory density="compact" class="currency-switch__toggle">
            <v-btn value="PEN">S/</v-btn>
            <v-btn value="USD">$</v-btn>
          </v-btn-toggle>
        </div>
      </base-modal-header>

      <v-card-text class="pt-4" style="overflow-y: auto; flex-grow: 1;">
        <v-form ref="addOrderForm" v-model="is_valid" @submit.prevent>

          <v-row align="start" dense>
            <v-col cols="12" md="9">
              <ClientSmartSearch v-model="order.client" />
            </v-col>
            <v-col cols="12" md="3" class="pt-1">
              <v-btn color="primary" variant="flat" block height="40" @click="clientDialogOpen = true">
                <v-icon start>mdi-plus</v-icon> NUEVO
              </v-btn>
            </v-col>
          </v-row>

          <!-- Documentos del alquiler (cotización, OC, guías, valorizaciones) se
               gestionan luego en Editar → hogar único de documentos. Crear queda mínimo. -->

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
import { Toast } from '@/plugins/alerts'
import ClientSmartSearch from '@/components/shared/ClientSmartSearch.vue'
import { ref, watch, nextTick, defineAsyncComponent, getCurrentInstance } from 'vue'
import { useAppStore } from '@/stores/appStore'
import ClientDataService from '@/services/clients/clientDataService'
import { usePaginatedSearch } from '@/composables/usePaginatedSearch'
import ClientMappers from '@/mappers/clientMappers'
import OrderDataService from '@/services/certificates/orderDataService'
import FormOrderService from './services/FormOrderService.vue'
import FormOrderRental from './rentals/FormOrderRental.vue'

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
  order.value = { client: null, order_type: tipo, currency: 'PEN' }
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
    const payload_orden = { client: order.value.client, order_type: order.value.order_type, currency: order.value.currency }
    if (order.value.order_type === 2 && order.value.client_order_reference) {
      payload_orden.client_order_reference = order.value.client_order_reference
    }
    payload_orden.items = items_to_save.value

    await OrderDataService.create(payload_orden)
    // Los documentos del alquiler (cotización, OC, guías, valorizaciones) se
    // suben luego desde Editar. Crear solo registra la orden.

    Toast.fire(appStore.successSavedOptions).then(() => {
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

<style scoped>
.currency-switch {
  display: flex;
  align-items: center;
  flex-shrink: 0;
}
.currency-switch__toggle {
  height: 26px !important;
  border-radius: 20px !important;
  overflow: hidden;
  border: 1px solid rgba(0,0,0,0.12) !important;
}
.currency-switch__toggle .v-btn {
  min-width: 36px !important;
  height: 26px !important;
  font-size: 0.75rem !important;
  font-weight: 700;
  padding: 0 8px !important;
  letter-spacing: 0;
}
/* Forzamos el color primario dinámico de DAICOM (el azul/tema principal) */
.currency-switch__toggle .v-btn--active {
  background-color: rgb(var(--v-theme-primary)) !important;
  color: #fff !important;
}
</style>