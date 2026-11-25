<template>
  <v-dialog v-model="dialog" class="dialog-premium" fullscreen persistent>
    <v-card v-if="datos" class="d-flex flex-column" style="height: 100%;">
      <base-modal-header title="Nueva factura" icon="mdi-file-document-plus-outline" @close="salir">
        <span>{{ serie ? `${serie} · se numera al emitir` : 'Se numera al emitir' }}</span>
      </base-modal-header>

      <v-card-text class="pt-4 d-flex flex-column pantalla-de-trabajo"
                   style="flex-grow: 1; min-height: 0; overflow-y: hidden;">
        <div class="d-flex flex-column flex-grow-1 columna-de-trabajo" style="min-height: 0;">
          <workspace-layout :detalle-abierto="Boolean(abierto)" @cerrar="abierto = null">
            <template #apoyo="{ apilado }">
              <workspace-tabs v-model="pestana" v-model:abiertos="datosAbiertos" :pestanas="PESTANAS" :apilado="apilado"
                              :resumen="resumen">
                <div v-if="pestana === 'info'" class="d-flex flex-column ga-3">
                  <client-lookup-bar v-model="clienteId" :seed="clienteInicial" :forma="apilado ? 'apilada' : 'mitades'"
                                     :campo="CAMPO" @client-selected="c => (clienteInicial = c)" />
                  <div v-if="clienteInicial?.address" class="text-caption text-medium-emphasis">
                    {{ clienteInicial.address }}
                  </div>
                  <v-row dense>
                    <v-col v-bind="ancho(apilado, 4)">
                      <date-picker :date="datos.fecha" label="Fecha de emisión" :min="fechas.desde"
                                   :max="fechas.hasta" :campo="CAMPO" @setPickedDate="f => (datos.fecha = f)" />
                    </v-col>
                    <v-col v-bind="ancho(apilado, 4)">
                      <v-text-field :model-value="textoDeMoneda" label="Moneda y tipo de cambio" readonly
                                    append-inner-icon="mdi-pencil" class="cursor-pointer" v-bind="CAMPO"
                                    :class="{ 'campo-abierto': abierto?.clave === 'moneda' }"
                                    @click="abrir('moneda')" />
                    </v-col>
                    <v-col v-if="!ordenes.length" v-bind="ancho(apilado, 4)">
                      <segmented-field v-model="tipoDeOrden" :opciones="TIPOS_DE_ORDEN" />
                    </v-col>
                  </v-row>
                  <section-linked-orders v-model="ordenes" :cliente-id="clienteId" :tipo-de-orden="tipoDeOrden"
                                         titulo="Órdenes que factura" />
                </div>

                <option-rows v-else :opciones="opciones" :abierta="abierto?.clave" @abrir="abrir" />
              </workspace-tabs>
            </template>

            <template #lista>
              <div class="titulo-de-hoja titulo-principal flex-wrap ga-2 py-2">
                <span class="mr-auto">
                  Ítems <span class="text-medium-emphasis font-weight-regular">({{ datos.items.length }})</span>
                </span>
                <v-btn variant="tonal" class="font-weight-bold" prepend-icon="mdi-plus" @click="agregar">
                  Agregar ítem
                </v-btn>
              </div>

              <div class="flex-grow-1 overflow-y-auto" style="min-height: 0;">
                <v-table density="compact" class="lista-de-tarjetas" fixed-header>
                  <thead>
                    <tr>
                      <th style="width: 4.5rem;">N°</th>
                      <th>Descripción</th>
                      <th class="text-right" style="width: 6rem;">Cantidad</th>
                      <th class="text-right" style="width: 8rem;">P. unitario</th>
                      <th style="width: 6rem;">IGV</th>
                      <th class="text-right" style="width: 8rem;">Importe</th>
                      <th style="width: 3rem;"></th>
                    </tr>
                  </thead>
                  <tbody>
                    <row-invoice-item v-for="(item, i) in datos.items" :key="clave(item)" v-bind="arrastrable(i)"
                                      :class="claseDe(i)" :asa="asa(i)" :item="item" :indice="i"
                                      :importe-del-item="cuenta.importes?.[i] ?? 0" :error="errores[i]"
                                      :elegida="abierto?.item === item" @elegir="abrir(null, item)" @borrar="borrar" />
                  </tbody>
                </v-table>
              </div>

              <div class="border-t-thin px-4 py-2 text-body-2 flex-shrink-0">
                <div class="d-flex justify-space-between"><span class="text-medium-emphasis">Gravado</span>
                  <span>{{ monto(cuenta.gravado, datos.moneda) }}</span></div>
                <div class="d-flex justify-space-between"><span class="text-medium-emphasis">IGV 18 %</span>
                  <span>{{ monto(cuenta.igv, datos.moneda) }}</span></div>
                <div class="d-flex justify-space-between text-body-1 font-weight-bold"><span>Total</span>
                  <span>{{ monto(cuenta.total, datos.moneda) }}</span></div>
                <div v-if="Number(cuenta.total) > 0" class="text-caption text-medium-emphasis">{{ cuenta.en_letras }}</div>
              </div>
            </template>

            <template #detalle>
              <panel-service-item v-if="abierto?.item" :item="abierto.item" :indice="indiceAbierto"
                                  :moneda="datos.moneda" :error="errores[indiceAbierto]" @cerrar="abierto = null"
                                  @otro-igual="otroIgual" @borrar="borrar" />
              <panel-invoice-payment v-else-if="abierto?.clave === 'pago'" :datos="datos" :cuenta="cuenta"
                                     @cerrar="abierto = null" />
              <panel-invoice-option v-else-if="abierto" :key="abierto.clave" :clave="abierto.clave" :datos="datos"
                                    :cuenta="cuenta" :codigos="codigos" :cuenta-de-detracciones="cuentaDeDetracciones"
                                    :ordenes-de-compra="ordenesDeCompra"
                                    :cliente-id="clienteId" @cerrar="abierto = null" />
            </template>

            <template #sin-detalle>
              <div class="titulo-de-hoja">Resumen del cobro</div>
              <div class="px-4 d-flex flex-column ga-3">
                <card-invoice-summary :cuenta="cuenta" :moneda="datos.moneda" />
                <div class="text-body-2 text-medium-emphasis">
                  Elige un ítem o una opción para verla y editarla aquí.
                </div>
              </div>
            </template>
          </workspace-layout>
        </div>
      </v-card-text>

      <form-footer accion="Emitir factura" icono="mdi-send" :listo="sePuedeEmitir" :ocupado="emitiendo"
                   :vista="vista" titulo="Factura" @cancelar="salir" @confirmar="emitir" />
    </v-card>
  </v-dialog>
</template>

<script setup>
import { computed, nextTick, ref, watch, reactive } from 'vue'
import { useRowDrag } from '@/composables/useRowDrag'
import DatePicker from '@/components/commonComponents/DatePicker.vue'
import ClientLookupBar from '@/components/shared/ClientLookupBar.vue'
import FormFooter from '@/components/shared/FormFooter.vue'
import SegmentedField from '@/components/shared/SegmentedField.vue'
import OptionRows from '@/components/shared/OptionRows.vue'
import WorkspaceLayout from '@/components/shared/WorkspaceLayout.vue'
import WorkspaceTabs from '@/components/shared/WorkspaceTabs.vue'
import { useLatestRequest } from '@/composables/useLatestRequest'
import { origenDe, useLocalDraft } from '@/composables/useLocalDraft'
import { usePdfPreview } from '@/composables/usePdfPreview'
import { useRowErrors } from '@/composables/useRowErrors'
import { useSwal } from '@/composables/useSwal'
import BillingDataService from '@/services/billing/billingDataService'
import { CURRENT_INVOICE_SCHEMA, itemDeFactura } from '@/utils/billing/billingDefaults'
import { debounce } from '@/utils/debounce'
import { mensajeDeError } from '@/utils/errors'
import { copiarDebajo } from '@/utils/lists'
import { CAMPO } from '@/utils/fields'
import { MONEDAS, monto } from '@/utils/money'
import { ALQUILER, SERVICIO } from '@/utils/orders/estado'
import CardInvoiceSummary from './CardInvoiceSummary.vue'
import PanelInvoiceOption from './PanelInvoiceOption.vue'
import PanelInvoicePayment from './PanelInvoicePayment.vue'
import RowInvoiceItem from './RowInvoiceItem.vue'
import SectionLinkedOrders from './SectionLinkedOrders.vue'
import PanelServiceItem from '@/views/documents/components/shared/PanelServiceItem.vue'

// Todo lo que trae lleno (de las ordenes o de Empresa) se puede cambiar antes de emitir; la cuenta la hace el back.
const emit = defineEmits(['emitida'])

const swal = useSwal()

const SIN_CUENTA = { importes: [], gravado: 0, igv: 0, total: 0, por_cobrar: 0, en_letras: '',
                     cuotas: { suman: 0, falta: 0 }, detraccion: { aplica: false, porcentaje: 0, monto: 0, en_soles: 0 } }
const TIPOS_DE_ORDEN = [{ valor: SERVICIO, texto: 'Servicio' }, { valor: ALQUILER, texto: 'Alquiler' }]
const ancho = (apilado, md) => (apilado ? { cols: 12 } : { cols: 12, md })

const dialog = ref(false)
const pestana = ref('info')
const datosAbiertos = ref(true)
const PESTANAS = [{ valor: 'info', texto: 'Información', icono: 'mdi-card-account-details-outline' },
                  { valor: 'opciones', texto: 'Opciones', icono: 'mdi-format-list-bulleted' }]
const emitiendo = ref(false)
// La ultima emitida desde lo escrito: si SUNAT la rechaza, `corregir` vuelve a abrir el formulario igual.
const emitidaDe = ref(null)
const clienteId = ref(null)
const clienteInicial = ref(null)
const ordenes = ref([])
const serie = ref('')
const fechas = ref({ desde: '', hasta: '' })
const codigos = ref([])
const detraccionPorTipo = ref({})
const cuentaDeDetracciones = ref('')
const ordenesDeCompra = ref([])
const tipoDeOrden = ref(SERVICIO)
const datos = ref(null)
const cuenta = ref(SIN_CUENTA)
// Lo que se ve a la derecha: { item } o { clave } de una opcion; null, el resumen del cobro.
const abierto = ref(null)

const items = computed(() => datos.value?.items ?? [])
const { asa, arrastrable, claseDe, clave } = useRowDrag(items)
const { errores, marcarErrores } = useRowErrors(items)
const indiceAbierto = computed(() => items.value.indexOf(abierto.value?.item))
const sePuedeEmitir = computed(() => Boolean(clienteId.value && items.value.length))
const nombreDeMoneda = (valor) => MONEDAS.find(m => m.value === valor)?.title ?? valor
const textoDeMoneda = computed(() => (datos.value.moneda === 'PEN' ? nombreDeMoneda('PEN')
  : `${nombreDeMoneda(datos.value.moneda)} · 1 = ${datos.value.tipo_de_cambio || '?'} soles`))
const resumen = computed(() => [clienteInicial.value?.name, datos.value.moneda,
  datos.value.forma_de_pago === 'credito' ? 'Crédito' : 'Contado'].filter(Boolean).join(' · '))

const opciones = computed(() => {
  const d = datos.value
  const detraccion = cuenta.value.detraccion
  return [
    { clave: 'pago', titulo: 'Condición de pago', icono: 'mdi-cash-clock',
      valor: d.forma_de_pago !== 'credito' ? 'Contado'
        : (d.cuotas.length ? `${d.cuotas.length} ${d.cuotas.length === 1 ? 'cuota' : 'cuotas'}` : 'Crédito') },
    { clave: 'detraccion', titulo: 'Detracción', icono: 'mdi-bank-outline',
      valor: detraccion.aplica ? `${d.detraccion.codigo} · ${Number(detraccion.porcentaje)} %` : 'No aplica' },
    { clave: 'orden_de_compra', titulo: 'Orden de compra', icono: 'mdi-file-sign', valor: d.orden_de_compra },
    { clave: 'guias', titulo: 'Guías de remisión', icono: 'mdi-truck-delivery-outline',
      valor: d.guias.length ? String(d.guias.length) : '' },
    { clave: 'observaciones', titulo: 'Observaciones', icono: 'mdi-text-box-outline', valor: d.observaciones ? 'Sí' : '' },
  ]
})

const paraElBack = () => ({ cliente: clienteId.value, ordenes: ordenes.value.map(o => o.id),
                            order_type: tipoDeOrden.value, datos: datos.value })

// Lo guardado, sobre lo que el formulario trae lleno: lo que no tenga queda como en una nueva.
// Primero el tipo: al cambiar propone su codigo de detraccion, y el que vale es el guardado.
async function llenar (guardada) {
  tipoDeOrden.value = guardada.tipoDeOrden
  await nextTick()
  clienteId.value = guardada.clienteId
  clienteInicial.value = guardada.clienteInicial
  ordenes.value = guardada.ordenes
  datos.value = { ...datos.value, ...guardada.datos,
                  items: guardada.datos.items.map(item => ({ ...itemDeFactura(), ...item })) }
  abierto.value = null
}

// La factura sin emitir: la nueva, la que sale de unas ordenes o la que usa otra de plantilla.
const origen = ref('')
const borrador = useLocalDraft({
  clave: () => `factura_${origen.value}`,
  version: CURRENT_INVOICE_SCHEMA,
  datos: () => ({ clienteId: clienteId.value, clienteInicial: clienteInicial.value, ordenes: ordenes.value,
                  tipoDeOrden: tipoDeOrden.value, datos: datos.value }),
  llenar,
  resumen: (guardada) => {
    const n = guardada.datos.items.filter(item => item.description?.trim()).length
    return n && `Hay una factura sin emitir con ${n} ${n === 1 ? 'ítem' : 'ítems'}`
  },
})

const { begin, isLatest } = useLatestRequest()
const recalcular = debounce(async () => {
  if (!datos.value) return
  const turno = begin()
  try {
    const { data } = await BillingDataService.invoiceAmounts(datos.value, tipoDeOrden.value)
    if (isLatest(turno)) cuenta.value = data
  } catch {
    if (isLatest(turno)) cuenta.value = SIN_CUENTA
  }
})
watch([datos, tipoDeOrden], recalcular, { deep: true })

// Al pasar de servicio a alquiler cambia el codigo propuesto, salvo que ya se haya elegido otro.
watch(tipoDeOrden, (nuevo, antes) => {
  if (datos.value?.detraccion.codigo === detraccionPorTipo.value[antes]) {
    datos.value.detraccion.codigo = detraccionPorTipo.value[nuevo]
  }
})
// Una sola cuota que nadie cambio sigue a lo que hay por cobrar, que el back recalcula despues de cada cambio.
watch(() => cuenta.value.por_cobrar, (nuevo, anterior) => {
  const cuotas = datos.value?.cuotas || []
  if (cuotas.length === 1 && Math.abs(Number(cuotas[0].monto) - Number(anterior)) < 0.005) {
    cuotas[0].monto = Number(nuevo)
  }
})

function abrir (clave, item = null) {
  abierto.value = item ? { item } : { clave }
}

function agregar () {
  const item = itemDeFactura()
  datos.value.items.push(item)
  abrir(null, item)
}

const otroIgual = () => abrir(null, copiarDebajo(datos.value.items, indiceAbierto.value))

function borrar (indice) {
  if (datos.value.items[indice] === abierto.value?.item) abierto.value = null
  datos.value.items.splice(indice, 1)
}

function noSePudo (titulo, porDefecto, error) {
  marcarErrores(error.response?.data?.filas)
  swal.fire({ icon: 'error', title: titulo, text: mensajeDeError(error, porDefecto) })
}

const vista = reactive(usePdfPreview(
  () => BillingDataService.previewInvoice(paraElBack()),
  error => noSePudo('No se armó la vista previa', 'No se pudo armar la vista previa.', error)))

// `nueva` es lo que devuelve el back: cliente, ordenes, tipo, serie, catalogo de detraccion y datos. Con `plantilla`
// (otra factura emitida) van su cliente, items y condiciones; la fecha es hoy y guias, OC y cuotas quedan vacias.
async function open (nueva, plantilla = null) {
  emitidaDe.value = null
  clienteId.value = nueva.cliente
  clienteInicial.value = nueva.cliente_data
  ordenes.value = nueva.ordenes
  serie.value = nueva.serie
  fechas.value = nueva.fechas
  codigos.value = nueva.codigos_de_detraccion
  detraccionPorTipo.value = nueva.detraccion_por_tipo
  cuentaDeDetracciones.value = nueva.cuenta_de_detracciones
  ordenesDeCompra.value = nueva.ordenes_de_compra
  tipoDeOrden.value = nueva.order_type
  datos.value = JSON.parse(JSON.stringify(nueva.datos))
  if (plantilla) {
    await llenar({ clienteId: plantilla.cliente_id, clienteInicial: plantilla.cliente_data, ordenes: [],
                   tipoDeOrden: plantilla.order_type,
                   datos: { ...plantilla.datos, fecha: nueva.datos.fecha, tipo_de_cambio: '', cuotas: [], guias: [],
                            orden_de_compra: '' } })
  }
  origen.value = plantilla ? `plantilla_${plantilla.id}` : origenDe(nueva.ordenes.map(o => o.id))
  abierto.value = null
  if (!datos.value.items.length) agregar()
  cuenta.value = SIN_CUENTA
  pestana.value = 'info'
  datosAbiertos.value = true
  dialog.value = true
  await borrador.abrir()
}

async function salir () {
  if (!await borrador.puedeSalir()) return
  borrador.cerrar()
  dialog.value = false
}

// El back responde enseguida y la manda a SUNAT en segundo plano: el formulario se cierra con lo escrito guardado.
async function emitir () {
  emitiendo.value = true
  borrador.cerrar()
  try {
    const { data } = await BillingDataService.emitInvoice(paraElBack())
    vista.cerrar()
    dialog.value = false
    emitidaDe.value = data.id
    emit('emitida', data)
  } catch (error) {
    noSePudo('No se emitió', 'No se pudo emitir.', error)
  } finally {
    emitiendo.value = false
  }
}
const corregible = (id) => emitidaDe.value === id
function corregir () {
  emitidaDe.value = null
  dialog.value = true
}

defineExpose({ open, corregir, corregible })
</script>

<style scoped>
.campo-abierto :deep(.v-field__outline) { color: rgb(var(--v-theme-primary)); }
</style>
