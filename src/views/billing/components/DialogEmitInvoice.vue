<template>
  <v-dialog v-model="dialog" class="dialog-premium" fullscreen persistent>
    <v-card v-if="datos" class="d-flex flex-column" style="height: 100%;">
      <base-modal-header title="Nueva factura" icon="mdi-file-document-plus-outline" @close="dialog = false">
        <span>{{ serie ? `${serie} · se numera al emitir` : 'Se numera al emitir' }}</span>
      </base-modal-header>

      <v-card-text class="pt-4 d-flex flex-column pantalla-de-trabajo"
                   style="flex-grow: 1; min-height: 0; overflow-y: hidden;">
        <div class="d-flex flex-column flex-grow-1 columna-de-trabajo" style="min-height: 0;">
          <workspace-layout :detalle-abierto="Boolean(abierto)" @cerrar="abierto = null">
            <template #apoyo="{ apilado }">
              <div class="d-flex align-center flex-shrink-0 border-b-thin px-3 pt-2">
                <v-tabs v-model="pestana" density="compact" slider-color="primary" class="flex-grow-1 pestanas-parejas"
                        @update:model-value="datosAbiertos = true">
                  <v-tab value="info" prepend-icon="mdi-card-account-details-outline">Información</v-tab>
                  <v-tab value="opciones" prepend-icon="mdi-format-list-bulleted">Opciones</v-tab>
                </v-tabs>
                <v-btn v-if="!apilado" :icon="datosAbiertos ? 'mdi-chevron-up' : 'mdi-chevron-down'" variant="text"
                       size="small" :title="datosAbiertos ? 'Plegar' : resumen" @click="datosAbiertos = !datosAbiertos" />
              </div>
              <v-expand-transition>
                <div v-show="apilado || datosAbiertos" class="pa-4">
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

                  <div v-else class="d-flex flex-column ga-2">
                    <div v-for="opcion in opciones" :key="opcion.clave" class="fila-que-abre text-body-2"
                         :class="{ abierta: abierto?.clave === opcion.clave }" role="button" tabindex="0"
                         @click="abrir(opcion.clave)" @keydown.enter="abrir(opcion.clave)">
                      <v-icon size="small" color="primary">{{ opcion.icono }}</v-icon>
                      <span class="text-no-wrap mr-auto">{{ opcion.titulo }}</span>
                      <span v-if="opcion.valor" class="text-caption text-medium-emphasis text-truncate">{{ opcion.valor }}</span>
                      <v-icon size="small" class="text-medium-emphasis">mdi-chevron-right</v-icon>
                    </div>
                  </div>
                </div>
              </v-expand-transition>
            </template>

            <template #lista>
              <div class="titulo-de-hoja titulo-principal flex-wrap ga-2 py-2">
                <span class="mr-auto">
                  Ítems <span class="text-medium-emphasis font-weight-regular">({{ datos.items.length }})</span>
                </span>
                <v-btn variant="outlined" class="font-weight-bold" prepend-icon="mdi-plus" @click="agregar">
                  Agregar ítem
                </v-btn>
              </div>

              <div class="flex-grow-1 overflow-y-auto" style="min-height: 0;">
                <v-table density="compact" class="lista-de-tarjetas" fixed-header>
                  <thead>
                    <tr>
                      <th style="width: 3rem;">N°</th>
                      <th>Descripción</th>
                      <th class="text-right" style="width: 6rem;">Cantidad</th>
                      <th class="text-right" style="width: 8rem;">P. unitario</th>
                      <th style="width: 6rem;">IGV</th>
                      <th class="text-right" style="width: 8rem;">Importe</th>
                      <th style="width: 3rem;"></th>
                    </tr>
                  </thead>
                  <tbody>
                    <row-invoice-item v-for="(item, i) in datos.items" :key="i" :item="item" :indice="i"
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
              <panel-invoice-item v-if="abierto?.item" :item="abierto.item" :indice="indiceAbierto"
                                  :moneda="datos.moneda" :error="errores[indiceAbierto]" @cerrar="abierto = null"
                                  @borrar="borrar" />
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

      <v-card-actions class="px-6 pb-4 pt-2 border-t-thin flex-shrink-0">
        <v-spacer />
        <v-btn variant="flat" class="font-weight-bold px-4" @click="dialog = false">Cancelar</v-btn>
        <v-btn variant="outlined" class="font-weight-bold px-4" prepend-icon="mdi-eye-outline"
               :disabled="!sePuedeEmitir" :loading="armandoVista" @click="verVistaPrevia">Vista previa</v-btn>
        <v-btn color="primary" variant="flat" class="font-weight-bold px-4" prepend-icon="mdi-send"
               :disabled="!sePuedeEmitir" :loading="emitiendo" @click="emitir">Emitir factura</v-btn>
      </v-card-actions>
    </v-card>

    <pdf-preview-dialog v-model="vistaPrevia" :url="urlDeVista">
      <template #encabezado>
        <v-icon class="mr-2">mdi-file-eye-outline</v-icon>
        <span class="text-subtitle-1 font-weight-bold text-truncate">Vista previa · Factura</span>
      </template>
      <template #acciones>
        <v-btn variant="text" class="mr-2 font-weight-bold" prepend-icon="mdi-pencil" :disabled="emitiendo"
               @click="vistaPrevia = false">
          Seguir editando
        </v-btn>
        <v-btn color="primary" variant="flat" class="font-weight-bold" prepend-icon="mdi-send" :loading="emitiendo"
               @click="emitir">Emitir factura</v-btn>
      </template>
    </pdf-preview-dialog>

    <dialog-info-invoice v-model="emitida" :envio="envio" @volver="envio = null" @cambiada="f => emit('cambiada', f)"
                         @ver-pdf="f => emit('ver-pdf', f)" />
  </v-dialog>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import DatePicker from '@/components/commonComponents/DatePicker.vue'
import ClientLookupBar from '@/components/shared/ClientLookupBar.vue'
import PdfPreviewDialog from '@/components/shared/PdfPreviewDialog.vue'
import SegmentedField from '@/components/shared/SegmentedField.vue'
import WorkspaceLayout from '@/components/shared/WorkspaceLayout.vue'
import { useLatestRequest } from '@/composables/useLatestRequest'
import { usePdfPreview } from '@/composables/usePdfPreview'
import { useRowErrors } from '@/composables/useRowErrors'
import { useSwal } from '@/composables/useSwal'
import BillingDataService from '@/services/billing/billingDataService'
import { UNIDAD_DE_FACTURA } from '@/utils/billing/facturas'
import { itemVacio } from '@/utils/documents/quoteDefaults'
import { debounce } from '@/utils/debounce'
import { mensajeDeError } from '@/utils/errors'
import { CAMPO } from '@/utils/fields'
import { MONEDAS, monto } from '@/utils/money'
import { ALQUILER, SERVICIO } from '@/utils/orders/estado'
import CardInvoiceSummary from './CardInvoiceSummary.vue'
import DialogInfoInvoice from './DialogInfoInvoice.vue'
import PanelInvoiceItem from './PanelInvoiceItem.vue'
import PanelInvoiceOption from './PanelInvoiceOption.vue'
import PanelInvoicePayment from './PanelInvoicePayment.vue'
import RowInvoiceItem from './RowInvoiceItem.vue'
import SectionLinkedOrders from './SectionLinkedOrders.vue'

// Todo lo que trae lleno (de las ordenes o de Empresa) se puede cambiar antes de emitir; la cuenta la hace el back.
const emit = defineEmits(['emitida', 'cambiada', 'ver-pdf'])

const swal = useSwal()

const SIN_CUENTA = { importes: [], gravado: 0, igv: 0, total: 0, por_cobrar: 0, en_letras: '',
                     cuotas: { suman: 0, falta: 0 }, detraccion: { aplica: false, porcentaje: 0, monto: 0, en_soles: 0 } }
const TIPOS_DE_ORDEN = [{ valor: SERVICIO, texto: 'Servicio' }, { valor: ALQUILER, texto: 'Alquiler' }]
const ancho = (apilado, md) => (apilado ? { cols: 12 } : { cols: 12, md })

const dialog = ref(false)
const pestana = ref('info')
const datosAbiertos = ref(true)
const emitiendo = ref(false)
const envio = ref(null)
const emitida = ref(null)
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
  const item = { ...itemVacio(UNIDAD_DE_FACTURA), incluye_igv: false }
  datos.value.items.push(item)
  abrir(null, item)
}

function borrar (indice) {
  if (datos.value.items[indice] === abierto.value?.item) abierto.value = null
  datos.value.items.splice(indice, 1)
}

function noSePudo (titulo, porDefecto, error) {
  marcarErrores(error.response?.data?.filas)
  swal.fire({ icon: 'error', title: titulo, text: mensajeDeError(error, porDefecto) })
}

const { abierta: vistaPrevia, url: urlDeVista, armando: armandoVista, ver: verVistaPrevia } = usePdfPreview(
  () => BillingDataService.previewInvoice(paraElBack()),
  error => noSePudo('No se armó la vista previa', 'No se pudo armar la vista previa.', error))

// `nueva` es lo que devuelve el back: cliente, ordenes, tipo, serie, catalogo de detraccion y datos. Con `plantilla`
// (otra factura emitida) van su cliente, items y condiciones; la fecha es hoy y guias, OC y cuotas quedan vacias.
function open (nueva, plantilla = null) {
  clienteId.value = plantilla?.cliente_id ?? nueva.cliente
  clienteInicial.value = plantilla?.cliente_data ?? nueva.cliente_data
  ordenes.value = plantilla ? [] : nueva.ordenes
  serie.value = nueva.serie
  fechas.value = nueva.fechas
  codigos.value = nueva.codigos_de_detraccion
  detraccionPorTipo.value = nueva.detraccion_por_tipo
  cuentaDeDetracciones.value = nueva.cuenta_de_detracciones
  ordenesDeCompra.value = nueva.ordenes_de_compra
  tipoDeOrden.value = plantilla?.order_type ?? nueva.order_type
  datos.value = JSON.parse(JSON.stringify(plantilla
    ? { ...plantilla.datos, fecha: nueva.datos.fecha, tipo_de_cambio: '', cuotas: [], guias: [], orden_de_compra: '' }
    : nueva.datos))
  abierto.value = null
  if (!datos.value.items.length) agregar()
  cuenta.value = SIN_CUENTA
  pestana.value = 'info'
  datosAbiertos.value = true
  dialog.value = true
}

// Ver informacion acompaña el envio: espera a SUNAT y muestra lo que respondio. Si no salio, se vuelve al formulario.
async function emitir () {
  emitiendo.value = true
  vistaPrevia.value = false
  envio.value = {}
  try {
    const { data } = await BillingDataService.emitInvoice(paraElBack())
    emit('emitida', data)
    envio.value = null
    emitida.value = data
  } catch (error) {
    marcarErrores(error.response?.data?.filas)
    envio.value = { motivo: mensajeDeError(error, 'No se pudo emitir.') }
  } finally {
    emitiendo.value = false
  }
}
// La factura ya existe: al cerrar su informacion se cierra tambien el formulario.
watch(emitida, (ahora, antes) => { if (antes && !ahora) dialog.value = false })

defineExpose({ open })
</script>

<style scoped>
.campo-abierto :deep(.v-field__outline) { color: rgb(var(--v-theme-primary)); }
</style>
