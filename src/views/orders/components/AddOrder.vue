<template>
  <v-dialog v-model="dialog" class="dialog-premium" :fullscreen="pantallaCompleta"
            width="92%" :max-width="pantallaCompleta ? undefined : '80rem'" persistent>
    <v-card class="d-flex flex-column" :style="pantallaCompleta ? 'height: 100%;' : 'max-height: 90vh;'">
      <base-modal-header :title="`Generar Orden de ${esDeServicio(order) ? 'Servicio' : 'Alquiler'}`" icon="mdi-file-document-plus" @close="close">
        <span v-if="next_order_number">Sig. Orden: <span class="font-weight-bold text-primary ml-1">{{ next_order_number }}</span></span>
      </base-modal-header>

      <v-card-text class="pt-4 d-flex flex-column" :class="{ 'pantalla-de-trabajo': pantallaCompleta }"
                   style="flex-grow: 1; min-height: 0;"
                   :style="{ overflowY: pantallaCompleta ? 'hidden' : 'auto' }">
        <v-form ref="addOrderForm" v-model="is_valid" class="d-flex flex-column flex-grow-1"
                :class="{ 'columna-de-trabajo': pantallaCompleta }" style="min-height: 0;"
                @submit.prevent>

          <form-order-service ref="formRef" v-if="esDeServicio(order)" :key="'srv-'+dialog"
                              @update-list="list => items_to_save = list">
            <template #orden="{ apilado }">
              <ClientLookupBar v-model="order.client" creatable :forma="apilado ? 'apilada' : 'ajustada'" />
              <div v-if="sinPasar.length" class="text-caption text-medium-emphasis mt-2">
                No pasaron a la orden: {{ sinPasar.join(', ') }}
              </div>
            </template>
          </form-order-service>

          <!-- Documentos del alquiler (cotización, OC, guías, valorizaciones) se
               gestionan luego en Editar → hogar único de documentos. Crear queda mínimo. -->
          <template v-else>
            <ClientLookupBar v-model="order.client" creatable />
            <v-divider class="my-4" />
            <form-order-rental ref="formRef" :key="'alq-'+dialog" @update-list="list => items_to_save = list" />
          </template>

        </v-form>
      </v-card-text>

      <!-- Agregamos un borde superior para delimitar los botones cuando el contenido hace scroll -->
      <v-card-actions class="px-6 pb-4 pt-2 border-t-thin">
        <div class="d-flex flex-wrap align-center ga-2" :class="pantallaCompleta ? 'columna-de-trabajo' : 'w-100'">
          <resumen-equipos :filas="items_to_save" :por-tipo="esDeServicio(order)" />
          <v-spacer />
          <v-btn variant="flat" class="font-weight-bold px-4" @click="close">Cancelar</v-btn>
          <v-btn color="primary" variant="flat" class="font-weight-bold px-4" @click="save"
                 :disabled="!is_valid || items_to_save.length === 0 || (esDeServicio(order) && sinServicio(items_to_save))" :loading="is_on_sending_process">
            Guardar orden
          </v-btn>
        </div>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import ClientLookupBar from '@/components/shared/ClientLookupBar.vue'
import { ref, computed, watch, nextTick, getCurrentInstance } from 'vue'
import { useLocalDraft } from '@/composables/useLocalDraft'
import { useSavedNumbers } from '@/composables/useSavedNumbers'
import { mensajeDeError } from '@/utils/errors'
import { SERVICIO, esAlquiler, esDeServicio } from '@/utils/orders/estado'
import OrderDataService from '@/services/orders/orderDataService'
import FormOrderService from './services/FormOrderService.vue'
import FormOrderRental from './rentals/FormOrderRental.vue'
import ResumenEquipos from './ResumenEquipos.vue'
import { sinServicio } from '@/composables/useOrderServices'


const { appContext } = getCurrentInstance()
const $swal = appContext.config.globalProperties.$swal
const avisarNumeros = useSavedNumbers()

const dialog                = ref(false)
const is_on_sending_process = ref(false)
const is_valid              = ref(false)
const next_order_number     = ref('')
const order                 = ref({ client: null, order_type: SERVICIO })
const items_to_save         = ref([])
const addOrderForm          = ref(null)

const formRef               = ref(null)
// La de servicio es una pantalla de trabajo; la de alquiler sigue en su dialogo.
const pantallaCompleta      = computed(() => esDeServicio(order.value))
// Los items de la cotizacion de la que sale que no pasan a la orden.
const sinPasar              = ref([])

// Solo servicio: los equipos de un alquiler se eligen del inventario. La que
// sale de una cotizacion no usa borrador, para no pisar el que quedo en Ordenes:
// se vuelve a armar desde la cotizacion.
const borrador = useLocalDraft(() => 'daicom_borrador_orden_servicio')
const desdeCotizacion = ref(false)
const conBorrador = () => esDeServicio(order.value) && !desdeCotizacion.value

watch(() => order.value.order_type, () => { calculateNextNumber() })

watch([items_to_save, () => order.value.client], ([items, client]) => {
  if (conBorrador()) borrador.guardar({ client, items })
}, { deep: true })

// `cotizacion`, la orden que el back arma desde una (documents/<id>/orden).
async function open(tipo, cotizacion = null) {
  items_to_save.value = []
  order.value = { client: cotizacion?.client ?? null, order_type: tipo }
  sinPasar.value = cotizacion?.sin_pasar ?? []
  desdeCotizacion.value = Boolean(cotizacion)
  dialog.value = true
  calculateNextNumber()

  if (cotizacion) {
    await nextTick()
    formRef.value?.cargarFilas({ items: cotizacion.filas })
    return
  }
  if (tipo !== 1) return
  const recuperado = await borrador.ofrecer()
  if (!recuperado) return
  order.value.client = recuperado.client
  await nextTick()
  formRef.value?.cargarFilas(recuperado)
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
    if (esAlquiler(order.value) && order.value.client_order_reference) {
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
  if (conBorrador()) borrador.descartar()
  order.value.client = null
  items_to_save.value = []
  addOrderForm.value?.resetValidation()
  dialog.value = false
}

defineExpose({ open })
</script>

