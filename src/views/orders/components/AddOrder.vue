<template>
  <v-dialog v-model="dialog" class="dialog-premium" :fullscreen="pantallaCompleta"
            width="92%" :max-width="pantallaCompleta ? undefined : '80rem'" persistent>
    <v-card class="d-flex flex-column" :style="pantallaCompleta ? 'height: 100%;' : 'max-height: 90vh;'">
      <base-modal-header :title="titulo" icon="mdi-file-document-plus" @close="close">
        <span v-if="!editando && next_order_number">
          Sig. Orden: <span class="font-weight-bold text-primary ml-1">{{ next_order_number }}</span>
        </span>
      </base-modal-header>

      <v-card-text class="pt-4 d-flex flex-column" :class="{ 'pantalla-de-trabajo': pantallaCompleta }"
                   style="flex-grow: 1; min-height: 0;"
                   :style="{ overflowY: pantallaCompleta ? 'hidden' : 'auto' }">
        <v-form ref="addOrderForm" v-model="is_valid" class="d-flex flex-column flex-grow-1"
                :class="{ 'columna-de-trabajo': pantallaCompleta }" style="min-height: 0;"
                @submit.prevent>

          <form-order-service ref="formRef" v-if="esDeServicio(order)" :key="'srv-'+dialog" :cliente="clienteOrden"
                              @update-list="list => items_to_save = list">
            <template #orden="{ apilado }">
              <ClientLookupBar v-model="order.client" creatable :seed="clienteOrden"
                               :forma="apilado ? 'apilada' : 'ajustada'"
                               @client-selected="c => (clienteOrden = { id: c.id, name: c.name })" />
              <div v-if="sinPasar.length" class="text-caption text-medium-emphasis mt-2">
                No pasaron a la orden: {{ sinPasar.join(', ') }}
              </div>
              <div class="d-flex align-center mt-3 mb-2">
                <span class="text-body-2 font-weight-medium">Observaciones</span>
                <v-spacer />
                <versions-order-service v-if="editando && !apilado" :orden-id="editando.id" compacto />
              </div>
              <v-textarea v-model="observaciones" :maxlength="largoDeObservacion" rows="3" auto-grow
                          density="compact" variant="outlined" rounded="lg" hide-details />
              <versions-order-service v-if="editando && apilado" :orden-id="editando.id" />
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
          <template v-if="esDeServicio(order)">
            <v-btn variant="outlined" class="font-weight-bold px-4" prepend-icon="mdi-file-eye-outline"
                   :loading="armandoVista" :disabled="!sePuedeGuardar" @click="verVistaPrevia">
              Vista previa
            </v-btn>
            <v-btn variant="outlined" class="font-weight-bold px-4" prepend-icon="mdi-printer"
                   :disabled="!sePuedeGuardar || is_on_sending_process" @click="save(true)">
              Guardar e imprimir
            </v-btn>
          </template>
          <v-btn color="primary" variant="flat" class="font-weight-bold px-4" @click="save()"
                 :disabled="!sePuedeGuardar" :loading="is_on_sending_process">
            Guardar orden
          </v-btn>
        </div>
      </v-card-actions>

      <!-- El ingreso tal como saldria, sin guardar: desde aca se guarda o se vuelve a editar. -->
      <pdf-preview-dialog v-model="vistaPrevia" :url="urlDeVista">
        <template #encabezado>
          <v-icon class="mr-2">mdi-file-eye-outline</v-icon>
          <span class="text-subtitle-1 font-weight-bold text-truncate">Vista previa · {{ titulo }}</span>
        </template>
        <template #acciones>
          <v-btn variant="text" class="mr-2 font-weight-bold" prepend-icon="mdi-pencil"
                 :disabled="is_on_sending_process" @click="vistaPrevia = false">
            Seguir editando
          </v-btn>
          <v-btn color="primary" variant="flat" class="font-weight-bold px-4" prepend-icon="mdi-printer"
                 :loading="is_on_sending_process" @click="save(true)">
            Guardar e imprimir
          </v-btn>
        </template>
      </pdf-preview-dialog>
    </v-card>
    <dialog-certificate-owners :cambio="cambioDeCliente" @volver="volverAlCliente" @aplicado="aceptarCliente" />
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
import DialogCertificateOwners from './services/DialogCertificateOwners.vue'
import VersionsOrderService from './services/VersionsOrderService.vue'
import PdfPreviewDialog from '@/components/shared/PdfPreviewDialog.vue'
import { abrirIngreso } from '@/utils/orders/ingreso'
import ClientDataService from '@/services/clients/clientDataService'
import { sinServicio, useOrderServices } from '@/composables/useOrderServices'


const { appContext } = getCurrentInstance()
const $swal = appContext.config.globalProperties.$swal
const avisarNumeros = useSavedNumbers()
const emit = defineEmits(['guardada'])

const dialog                = ref(false)
const is_on_sending_process = ref(false)
const is_valid              = ref(false)
const next_order_number     = ref('')
const order                 = ref({ client: null, order_type: SERVICIO })
// Solo las de servicio.
const observaciones         = ref('')
const { largoDeObservacion } = useOrderServices()
const items_to_save         = ref([])
const sePuedeGuardar = computed(() => is_valid.value && items_to_save.value.length > 0
  && !(esDeServicio(order.value) && sinServicio(items_to_save.value)))
const addOrderForm          = ref(null)

const formRef               = ref(null)
// La de servicio es una pantalla de trabajo; la de alquiler sigue en su dialogo.
const pantallaCompleta      = computed(() => esDeServicio(order.value))
// Los items de la cotizacion de la que sale que no pasan a la orden.
const sinPasar              = ref([])
// La orden de servicio que se edita; null al crear una.
const editando              = ref(null)
const titulo = computed(() => (editando.value
  ? `Orden ${editando.value.order_number}`
  : `Generar Orden de ${esDeServicio(order.value) ? 'Servicio' : 'Alquiler'}`))

// El cliente de la orden con su nombre: el panel lo muestra como titular de los certificados.
const clienteOrden          = ref(null)
watch(() => order.value.client, async (id) => {
  if (!id || clienteOrden.value?.id === id) return
  const { data } = await ClientDataService.get(id)
  if (order.value.client === id && clienteOrden.value?.id !== id) clienteOrden.value = { id, name: data.name }
})

// Editando, cambiar el cliente pregunta a nombre de quien queda cada certificado ya guardado.
const clienteAceptado       = ref(null)
const cambioDeCliente       = ref(null)
watch(clienteOrden, (nuevo) => {
  if (!editando.value || !nuevo || [clienteAceptado.value?.id, cambioDeCliente.value?.nuevo.id].includes(nuevo.id)) return
  const filas = items_to_save.value.filter(f => f.modo === 'linea' && f.cert_id)
  if (filas.length) cambioDeCliente.value = { anterior: clienteAceptado.value, nuevo, filas }
  else clienteAceptado.value = nuevo
})

function volverAlCliente() {
  cambioDeCliente.value = null
  clienteOrden.value = clienteAceptado.value
  order.value.client = clienteAceptado.value.id
}

function aceptarCliente() {
  clienteAceptado.value = cambioDeCliente.value.nuevo
  cambioDeCliente.value = null
}

// Solo servicio: los equipos de un alquiler se eligen del inventario. La que
// sale de una cotizacion no usa borrador, para no pisar el que quedo en Ordenes:
// se vuelve a armar desde la cotizacion.
const borrador = useLocalDraft(() => 'daicom_borrador_orden_servicio')
const desdeCotizacion = ref(false)
const conBorrador = () => esDeServicio(order.value) && !desdeCotizacion.value && !editando.value

watch(() => order.value.order_type, () => { calculateNextNumber() })

watch([items_to_save, () => order.value.client, observaciones], ([items, client]) => {
  if (conBorrador()) borrador.guardar({ client, items, observaciones: observaciones.value })
}, { deep: true })

// `cotizacion`, la orden que el back arma desde una (documents/<id>/orden).
async function open(tipo, cotizacion = null) {
  editando.value = null
  clienteOrden.value = null
  items_to_save.value = []
  observaciones.value = ''
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
  observaciones.value = recuperado.observaciones || ''
  await nextTick()
  formRef.value?.cargarFilas(recuperado)
}

// Una orden de servicio guardada, como la manda su fila, con sus lineas.
async function editar(orden) {
  const { data: lineas } = await OrderDataService.getEquipos(orden.id)
  editando.value = orden
  clienteOrden.value = clienteAceptado.value = { id: orden.client_data.id, name: orden.client_data.name }
  observaciones.value = orden.observaciones || ''
  order.value = { client: orden.client_data.id, order_type: SERVICIO }
  dialog.value = true
  await nextTick()
  formRef.value?.cargarLineas(lineas)
}

async function calculateNextNumber() {
  try {
    const { data } = await OrderDataService.siguienteNumero(order.value.order_type)
    next_order_number.value = data.numero
  } catch {
    next_order_number.value = ''
  }
}

// Con `imprimir`, despues de guardar abre el PDF del ingreso.
async function save(imprimir = false) {
  if (items_to_save.value.length === 0) return
  is_on_sending_process.value = true

  try {
    if (editando.value) {
      const id = editando.value.id
      await guardarEdicion()
      if (imprimir) await imprimirIngreso(id)
      return
    }
    const payload_orden = { client: order.value.client, order_type: order.value.order_type }
    if (esAlquiler(order.value) && order.value.client_order_reference) {
      payload_orden.client_order_reference = order.value.client_order_reference
    }
    payload_orden.items = items_to_save.value
    if (esDeServicio(order.value)) payload_orden.observaciones = observaciones.value

    const filas = items_to_save.value
    const estimados = formRef.value?.estimados?.()
    const { data } = await OrderDataService.create(payload_orden)
    // Los documentos del alquiler (cotización, OC, guías, valorizaciones) se
    // suben luego desde Editar. Crear solo registra la orden.

    close()
    avisarNumeros(`${data.order_number} creada`, filas, data.codigos, estimados)
    if (imprimir) await imprimirIngreso(data.id)
  } catch (error) {
    const data = error.response?.data
    formRef.value?.marcarErrores(data?.filas)
    $swal.fire('No se guardó la orden', mensajeDeError(error, 'No se pudo guardar la orden.'), 'error')
  } finally {
    is_on_sending_process.value = false
  }
}

async function guardarEdicion() {
  const { items, quitar } = formRef.value.paraGuardar()
  const estimados = formRef.value.estimados()
  const nuevas = items_to_save.value.map((fila, i) => [fila, estimados[i]]).filter(([fila]) => fila.modo !== 'linea')
  const { data } = await OrderDataService.patch(editando.value.id, {
    client: order.value.client, observaciones: observaciones.value, items, quitar,
  })
  const orden = editando.value
  close()
  avisarNumeros(`${data.order_number} guardada`, nuevas.map(([fila]) => fila), data.codigos,
                nuevas.map(([, estimado]) => estimado))
  emit('guardada', orden)
}

// Ya guardada: si el PDF falla, la orden sigue guardada y se imprime desde su menu.
const imprimirIngreso = (id) => abrirIngreso(id).catch(error => $swal.fire('La orden se guardó',
  mensajeDeError(error, 'No se pudo abrir el ingreso: imprímalo desde el menú de la orden.'), 'warning'))

// ── Vista previa: el ingreso que armaria el back, sin guardar nada ──
const vistaPrevia = ref(false)
const urlDeVista = ref('')
const armandoVista = ref(false)

const soltarVista = () => {
  if (urlDeVista.value) URL.revokeObjectURL(urlDeVista.value)
  urlDeVista.value = ''
}
watch(vistaPrevia, (abierta) => { if (!abierta) soltarVista() })

async function verVistaPrevia() {
  armandoVista.value = true
  try {
    const pdf = await OrderDataService.vistaPreviaIngreso({ client: order.value.client, items: items_to_save.value })
    soltarVista()
    urlDeVista.value = URL.createObjectURL(pdf)
    vistaPrevia.value = true
  } catch (error) {
    $swal.fire('No se pudo armar la vista previa', mensajeDeError(error, 'No se pudo armar la vista previa.'), 'error')
  } finally {
    armandoVista.value = false
  }
}

function close() {
  vistaPrevia.value = false
  if (conBorrador()) borrador.descartar()
  order.value.client = null
  items_to_save.value = []
  addOrderForm.value?.resetValidation()
  dialog.value = false
}

defineExpose({ open, editar })
</script>

