<template>
  <v-dialog width="1000" v-model="dialog" class="dialog-premium" persistent>
    <v-card style="max-height: 90vh; display: flex; flex-direction: column;">
      <base-modal-header :title="`Generar Orden de ${order.order_type === 1 ? 'Servicio' : 'Alquiler'}`" icon="mdi-file-document-plus" @close="close">
        <span v-if="next_order_number">Sig. Orden: <span class="font-weight-bold text-primary ml-1">{{ next_order_number }}</span></span>
      </base-modal-header>

      <v-card-text class="pt-4" style="overflow-y: auto; flex-grow: 1;">
        <v-form ref="addOrderForm" v-model="is_valid" @submit.prevent>

          <v-row align="start" dense>
            <v-col cols="12">
              <ClientLookupBar v-model="order.client" creatable />
            </v-col>
          </v-row>

          <!-- Documentos del alquiler (cotización, OC, guías, valorizaciones) se
               gestionan luego en Editar → hogar único de documentos. Crear queda mínimo. -->

          <v-divider class="my-4" />

          <form-order-service ref="formRef" v-if="order.order_type === 1" :key="'srv-'+dialog"
                              @update-list="list => items_to_save = list" @update-config="c => config = c" />
          <form-order-rental ref="formRef" v-else :key="'alq-'+dialog" @update-list="list => items_to_save = list" />

        </v-form>
      </v-card-text>

      <!-- Agregamos un borde superior para delimitar los botones cuando el contenido hace scroll -->
      <v-card-actions class="px-6 pb-4 pt-2 border-t-thin flex-wrap ga-2">
        <resumen-equipos :filas="items_to_save" :por-tipo="order.order_type === 1" />
        <v-spacer />
        <v-btn variant="flat" class="font-weight-bold px-4" @click="close">Cancelar</v-btn>
        <v-btn color="primary" variant="flat" class="font-weight-bold px-4" @click="save"
               :disabled="!is_valid || items_to_save.length === 0" :loading="is_on_sending_process">
          Guardar orden
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import ClientLookupBar from '@/components/shared/ClientLookupBar.vue'
import { ref, watch, nextTick, getCurrentInstance } from 'vue'
import { useBorradorLocal } from '@/composables/useBorradorLocal'
import { useSavedNumbers } from '@/composables/useSavedNumbers'
import { mensajeDeError } from '@/utils/errors'
import OrderDataService from '@/services/orders/orderDataService'
import FormOrderService from './services/FormOrderService.vue'
import FormOrderRental from './rentals/FormOrderRental.vue'
import ResumenEquipos from './ResumenEquipos.vue'


const { appContext } = getCurrentInstance()
const $swal = appContext.config.globalProperties.$swal
const avisarNumeros = useSavedNumbers()

const dialog                = ref(false)
const is_on_sending_process = ref(false)
const is_valid              = ref(false)
const next_order_number     = ref('')
const order                 = ref({ client: null, order_type: 1 })
const items_to_save         = ref([])
const config                = ref(null)
const addOrderForm          = ref(null)

const formRef               = ref(null)

// Solo servicio: los equipos de un alquiler se eligen del inventario.
const borrador = useBorradorLocal(() => 'daicom_borrador_orden_servicio')

watch(() => order.value.order_type, () => { calculateNextNumber() })

watch([items_to_save, config, () => order.value.client], ([items, elegido, client]) => {
  if (order.value.order_type === 1) borrador.guardar({ client, items, config: elegido })
}, { deep: true })

async function open(tipo) {
  items_to_save.value = []
  config.value = null
  order.value = { client: null, order_type: tipo }
  dialog.value = true
  calculateNextNumber()

  if (tipo !== 1) return
  const recuperado = await borrador.ofrecer()
  if (!recuperado) return
  order.value.client = recuperado.client
  await nextTick()
  formRef.value?.inyectarBorrador(recuperado)
}

async function calculateNextNumber() {
  try {
    const { data } = await OrderDataService.siguienteNumero(order.value.order_type)
    next_order_number.value = data.numero
  } catch {
    next_order_number.value = ''
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

    const filas = items_to_save.value
    const estimados = formRef.value?.estimados?.()
    const { data } = await OrderDataService.create(payload_orden)
    // Los documentos del alquiler (cotización, OC, guías, valorizaciones) se
    // suben luego desde Editar. Crear solo registra la orden.

    close()
    avisarNumeros(`${data.order_number} creada`, filas, data.codigos, estimados)
  } catch (error) {
    const data = error.response?.data
    formRef.value?.marcarErrores(data?.filas)
    $swal.fire('No se guardó la orden', mensajeDeError(error, 'No se pudo guardar la orden.'), 'error')
  } finally {
    is_on_sending_process.value = false
  }
}

function close() {
  if (order.value?.order_type === 1) borrador.descartar()
  order.value.client = null
  items_to_save.value = []
  addOrderForm.value?.resetValidation()
  dialog.value = false
}

defineExpose({ open })
</script>

