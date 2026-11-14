<template>
  <v-dialog v-model="dialog" class="dialog-premium" fullscreen persistent>
    <v-card class="d-flex flex-column" style="height: 100%;">
      <base-modal-header :title="titulo" icon="mdi-file-document-plus" @close="close">
        <span v-if="!editando && next_order_number">
          Sig. Orden: <span class="font-weight-bold text-primary ml-1">{{ next_order_number }}</span>
        </span>
      </base-modal-header>

      <v-card-text class="pt-4 d-flex flex-column pantalla-de-trabajo"
                   style="flex-grow: 1; min-height: 0; overflow-y: hidden;">
        <v-form ref="addOrderForm" v-model="is_valid" class="d-flex flex-column flex-grow-1 columna-de-trabajo"
                style="min-height: 0;" @submit.prevent>

          <component :is="esDeServicio(order) ? FormOrderService : FormOrderRental" ref="formRef"
                     :key="`${order.order_type}-${dialog}`"
                     v-bind="esDeServicio(order) ? { cliente: clienteOrden } : {}" :opciones-del-panel="opcionesDelPanel"
                     @update-list="list => items_to_save = list">
            <template #orden="{ apilado }">
              <div class="d-flex flex-column ga-3">
                <ClientLookupBar v-model="order.client" creatable :seed="clienteOrden" :campo="CAMPO"
                                 :forma="apilado ? 'apilada' : 'ajustada'"
                                 @client-selected="c => (clienteOrden = { id: c.id, name: c.name })" />
                <div v-if="sinPasar.length" class="text-caption text-medium-emphasis">
                  No pasaron a la orden: {{ sinPasar.join(', ') }}
                </div>
                <v-text-field v-if="esAlquiler(order)" v-model="order.client_order_reference" label="Ref. OC del cliente"
                              v-bind="CAMPO" />
                <v-textarea v-model="observaciones" label="Observaciones" :maxlength="largoDeObservacion" rows="3"
                            auto-grow v-bind="CAMPO" />
              </div>
            </template>
            <template #opcion="{ clave }">
              <documents-order v-if="clave === 'documentos'" v-model:pendientes="documentosNuevos" :orden="editando"
                               :alquiler="esAlquiler(order)" :cliente-id="order.client" />
              <versions-order-service v-else-if="clave === 'versiones'" :orden-id="editando.id" />
            </template>
          </component>

        </v-form>
      </v-card-text>

      <!-- Agregamos un borde superior para delimitar los botones cuando el contenido hace scroll -->
      <v-card-actions class="px-6 pb-4 pt-2 border-t-thin">
        <div class="d-flex flex-wrap align-center ga-2 columna-de-trabajo">
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
import { usePdfPreview } from '@/composables/usePdfPreview'
import { useSavedNumbers } from '@/composables/useSavedNumbers'
import { mensajeDeError } from '@/utils/errors'
import { CAMPO } from '@/utils/fields'
import { SERVICIO, esAlquiler, esDeServicio } from '@/utils/orders/estado'
import OrderDataService from '@/services/orders/orderDataService'
import FormOrderService from './services/FormOrderService.vue'
import FormOrderRental from './rentals/FormOrderRental.vue'
import DocumentsOrder from './DocumentsOrder.vue'
import { sinPendientes, subirPendientes, vinculosAlCrear } from '@/utils/orders/documentos'
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

// Al crear: lo que se vincula y se sube con la orden. Guardada, cada documento se guarda al momento.
const documentosNuevos = ref(sinPendientes())
// La pestaña Opciones: los documentos de la orden y, al editar una de servicio, las versiones de su ingreso.
const opcionesDelPanel = computed(() => [
  { clave: 'documentos', titulo: 'Documentos', icono: 'mdi-paperclip' },
  ...(editando.value && esDeServicio(order.value)
    ? [{ clave: 'versiones', titulo: 'Versiones del ingreso', icono: 'mdi-history' }] : []),
])

// `cotizacion`, la orden que el back arma desde una (documents/<id>/orden): queda vinculada a ella.
async function open(tipo, cotizacion = null) {
  editando.value = null
  clienteOrden.value = null
  documentosNuevos.value = { ...sinPendientes(), cotizaciones: cotizacion ? [cotizacion.documento] : [] }
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

// Una orden guardada, de servicio o de alquiler, como la manda su fila, con sus equipos.
async function editar(orden) {
  const { data: lineas } = await OrderDataService.getEquipos(orden.id)
  editando.value = orden
  clienteOrden.value = clienteAceptado.value = { id: orden.client_data.id, name: orden.client_data.name }
  observaciones.value = orden.observaciones || ''
  order.value = { client: orden.client_data.id, order_type: orden.order_type,
                  client_order_reference: orden.client_order_reference || '' }
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
    payload_orden.observaciones = observaciones.value

    const filas = items_to_save.value
    const estimados = formRef.value?.estimados?.()
    const { data } = await OrderDataService.create({ ...payload_orden, ...vinculosAlCrear(documentosNuevos.value) })
    const noSubieron = await subirPendientes(data.id, documentosNuevos.value.archivos)

    close()
    avisarNumeros(`${data.order_number} creada`, filas, data.codigos, estimados)
    if (noSubieron.length) {
      $swal.fire('La orden se guardó', `No se subieron: ${noSubieron.join(', ')}. Súbelos desde "Ver y editar".`,
                 'warning')
    }
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
  const datos = { client: order.value.client, observaciones: observaciones.value, items, quitar }
  if (esAlquiler(order.value)) datos.client_order_reference = order.value.client_order_reference
  const { data } = await OrderDataService.patch(editando.value.id, datos)
  const orden = editando.value
  close()
  avisarNumeros(`${data.order_number} guardada`, nuevas.map(([fila]) => fila), data.codigos,
                nuevas.map(([, estimado]) => estimado))
  emit('guardada', orden)
}

// Ya guardada: si el PDF falla, la orden sigue guardada y se imprime desde su menu.
const imprimirIngreso = (id) => abrirIngreso(id).catch(error => $swal.fire('La orden se guardó',
  mensajeDeError(error, 'No se pudo abrir el ingreso: imprímalo desde el menú de la orden.'), 'warning'))

const { abierta: vistaPrevia, url: urlDeVista, armando: armandoVista, ver: verVistaPrevia } = usePdfPreview(
  () => OrderDataService.vistaPreviaIngreso({ client: order.value.client, items: items_to_save.value }),
  error => $swal.fire('No se pudo armar la vista previa', mensajeDeError(error, 'No se pudo armar la vista previa.'), 'error'))

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

