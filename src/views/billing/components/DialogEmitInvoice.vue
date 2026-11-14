<template>
  <v-dialog v-model="dialog" class="dialog-premium" fullscreen persistent>
    <v-card v-if="datos" class="d-flex flex-column" style="height: 100%;">
      <base-modal-header title="Nueva factura" icon="mdi-file-document-plus-outline" @close="dialog = false">
        <span>{{ serie ? `${serie} · se numera al emitir` : 'Se numera al emitir' }}</span>
        <v-chip v-for="orden in ordenes" :key="orden.id" size="small" variant="tonal" prepend-icon="mdi-clipboard-text"
                closable close-label="No vincular esta orden" class="ml-2"
                @click:close="ordenes = ordenes.filter(o => o !== orden)">
          {{ orden.numero }}
        </v-chip>
      </base-modal-header>

      <v-card-text class="pt-4 d-flex flex-column pantalla-de-trabajo"
                   style="flex-grow: 1; min-height: 0; overflow-y: hidden;">
        <div class="d-flex flex-column flex-grow-1 columna-de-trabajo" style="min-height: 0;">
          <workspace-layout :detalle-abierto="lgAndUp || opcionesAbiertas" @cerrar="opcionesAbiertas = false">
            <template #apoyo="{ apilado }">
              <div class="titulo-de-hoja" :class="{ 'cursor-pointer': !apilado }"
                   @click="!apilado && (datosAbiertos = !datosAbiertos)">
                <span class="mr-auto text-truncate">
                  Información
                  <span v-if="!apilado && !datosAbiertos" class="text-medium-emphasis font-weight-regular ml-2">
                    {{ resumen }}
                  </span>
                </span>
                <v-icon v-if="!apilado">{{ datosAbiertos ? 'mdi-chevron-up' : 'mdi-chevron-down' }}</v-icon>
              </div>
              <v-expand-transition>
                <div v-show="apilado || datosAbiertos" class="px-4 pb-4">
                  <div class="titulo-de-seccion">Cliente</div>
                  <client-lookup-bar v-model="clienteId" :seed="clienteInicial" :forma="apilado ? 'apilada' : 'mitades'"
                                     @client-selected="c => (clienteInicial = c)" />
                  <div v-if="clienteInicial?.address" class="text-caption text-medium-emphasis mt-1">
                    {{ clienteInicial.address }}
                  </div>

                  <div class="titulo-de-seccion mt-4">Comprobante</div>
                  <v-row dense>
                    <v-col v-bind="ancho(apilado, 4)">
                      <date-picker :date="datos.fecha" label="Fecha de emisión" :min="fechas.desde" :max="fechas.hasta"
                                   @setPickedDate="f => (datos.fecha = f)" />
                    </v-col>
                    <v-col v-bind="ancho(apilado, 4)">
                      <v-select v-model="datos.moneda" :items="MONEDAS" label="Moneda" v-bind="CAMPO" />
                    </v-col>
                    <v-col v-if="datos.moneda === 'USD'" v-bind="ancho(apilado, 4)">
                      <v-text-field v-model="datos.tipo_de_cambio" type="number" min="0" step="0.001"
                                    label="Tipo de cambio" v-bind="CAMPO" />
                    </v-col>
                    <v-col v-if="!ordenes.length" v-bind="ancho(apilado, 4)">
                      <v-select v-model="tipoDeOrden" :items="TIPO_DE_ORDEN" label="Es de" v-bind="CAMPO" />
                    </v-col>
                  </v-row>

                  <div class="titulo-de-seccion mt-4">Forma de pago</div>
                  <v-btn-toggle v-model="datos.forma_de_pago" mandatory density="compact" variant="outlined" divided
                                selected-class="bg-primary">
                    <v-btn value="contado">Contado</v-btn>
                    <v-btn value="credito">Crédito</v-btn>
                  </v-btn-toggle>
                  <div v-if="datos.forma_de_pago === 'credito'" class="d-flex flex-column ga-2 mt-3">
                    <div v-for="(cuota, i) in datos.cuotas" :key="i" class="border rounded-lg pa-2">
                      <div class="d-flex align-center mb-1">
                        <span class="text-caption font-weight-bold text-medium-emphasis mr-auto">Cuota {{ i + 1 }}</span>
                        <v-btn icon="mdi-close" variant="text" size="x-small" title="Quitar la cuota"
                               @click="datos.cuotas.splice(i, 1)" />
                      </div>
                      <v-row dense>
                        <v-col cols="6">
                          <v-text-field v-model="cuota.monto" type="number" min="0" :prefix="simboloDe(datos.moneda)"
                                        label="Monto" v-bind="CAMPO" />
                        </v-col>
                        <v-col cols="6">
                          <date-picker :date="cuota.fecha" label="Vence" :min="datos.fecha"
                                       @setPickedDate="f => (cuota.fecha = f)" />
                        </v-col>
                      </v-row>
                    </div>
                    <div class="d-flex align-center">
                      <v-btn variant="outlined" size="small" prepend-icon="mdi-plus" @click="agregarCuota">Cuota</v-btn>
                      <v-spacer />
                      <span class="text-caption" :class="cuotasCuadran ? 'text-medium-emphasis' : 'text-error'">
                        Suman {{ monto(sumaDeCuotas, datos.moneda) }} de {{ monto(cuenta.por_cobrar, datos.moneda) }}
                      </span>
                    </div>
                  </div>
                </div>
              </v-expand-transition>
            </template>

            <template #lista>
              <div class="flex-grow-1 overflow-y-auto px-4 pt-4" style="min-height: 0;">
                <services-table v-model:items="datos.items" :totales="totalesDeLaTabla" :moneda="datos.moneda"
                                :errores="errores" :tipo="TIPO_DE_FACTURA" :grupos="false" igv-por-item>
                  <template #pie>
                    <div class="d-flex justify-space-between text-body-2 mt-2">
                      <span class="text-medium-emphasis">
                        Detracción{{ cuenta.detraccion.aplica ? ` ${Number(cuenta.detraccion.porcentaje)} %` : '' }}
                      </span>
                      <span v-if="cuenta.detraccion.aplica">− {{ monto(cuenta.detraccion.monto, datos.moneda) }}</span>
                      <span v-else class="text-medium-emphasis">No aplica</span>
                    </div>
                    <div class="d-flex justify-space-between text-body-2 font-weight-bold">
                      <span>Por cobrar</span><span>{{ monto(cuenta.por_cobrar, datos.moneda) }}</span>
                    </div>
                    <div v-if="Number(cuenta.total) > 0" class="text-caption text-medium-emphasis mt-1">
                      {{ cuenta.en_letras }}
                    </div>
                  </template>
                </services-table>
              </div>
            </template>

            <template #detalle>
              <div class="titulo-de-hoja">
                <span class="mr-auto">Opciones</span>
                <v-menu location="bottom end">
                  <template #activator="{ props: menu }">
                    <v-btn v-bind="menu" variant="outlined" size="small" prepend-icon="mdi-plus"
                           :disabled="!porAgregar.length">Agregar</v-btn>
                  </template>
                  <v-list density="compact">
                    <v-list-item v-for="opcion in porAgregar" :key="opcion.clave" :title="opcion.titulo"
                                 :prepend-icon="opcion.icono" @click="visibles.push(opcion.clave)" />
                  </v-list>
                </v-menu>
                <v-btn v-if="!lgAndUp" icon="mdi-close" variant="text" size="small" title="Cerrar"
                       @click="opcionesAbiertas = false" />
              </div>
              <div class="flex-grow-1 overflow-y-auto d-flex flex-column ga-3 px-4 pb-4" style="min-height: 0;">
                <section v-if="cuenta.detraccion.aplica" class="seccion">
                  <div class="titulo-de-seccion">Detracción</div>
                  <v-text-field v-model="datos.detraccion.codigo" label="Código del bien o servicio" maxlength="3"
                                v-bind="CAMPO" />
                  <div class="d-flex justify-space-between text-body-2 mt-2">
                    <span class="text-medium-emphasis">{{ Number(cuenta.detraccion.porcentaje) }} %</span>
                    <span>{{ monto(cuenta.detraccion.monto, datos.moneda) }}</span>
                  </div>
                  <div v-if="datos.moneda === 'USD'" class="text-caption text-medium-emphasis text-end">
                    {{ cuenta.detraccion.en_soles != null
                      ? `${monto(cuenta.detraccion.en_soles, 'PEN')} al cambio ${datos.tipo_de_cambio}: así va a SUNAT`
                      : 'Escriba el tipo de cambio: SUNAT recibe la detracción en soles' }}
                  </div>
                </section>

                <section v-for="opcion in OPCIONES.filter(o => visibles.includes(o.clave))" :key="opcion.clave"
                         class="seccion">
                  <div class="d-flex align-center">
                    <div class="titulo-de-seccion mr-auto">{{ opcion.titulo }}</div>
                    <v-btn icon="mdi-close" variant="text" size="x-small" :title="`Quitar ${opcion.titulo.toLowerCase()}`"
                           @click="quitarOpcion(opcion.clave)" />
                  </div>
                  <v-text-field v-if="opcion.clave === 'orden_de_compra'" v-model="datos.orden_de_compra"
                                label="Número" v-bind="CAMPO" />
                  <div v-else-if="opcion.clave === 'guias'" class="d-flex flex-wrap ga-2">
                    <v-chip v-for="guia in datos.guias" :key="guia" size="small" variant="tonal" closable
                            prepend-icon="mdi-truck-delivery-outline"
                            @click:close="datos.guias = datos.guias.filter(g => g !== guia)">{{ guia }}</v-chip>
                    <span v-if="!datos.guias.length" class="text-caption text-medium-emphasis">
                      Las órdenes no tienen guías emitidas.
                    </span>
                  </div>
                  <v-textarea v-else v-model="datos.observaciones" rows="2" auto-grow v-bind="CAMPO" />
                </section>

                <div v-if="!cuenta.detraccion.aplica && !visibles.length"
                     class="text-caption text-medium-emphasis text-center pa-4">
                  Orden de compra, guías y observaciones se suman con "Agregar".
                </div>
              </div>
            </template>
          </workspace-layout>
        </div>
      </v-card-text>

      <v-card-actions class="px-6 pb-4 pt-2 border-t-thin flex-shrink-0">
        <v-btn v-if="!lgAndUp" variant="outlined" class="font-weight-bold px-4" prepend-icon="mdi-tune"
               @click="opcionesAbiertas = true">Opciones</v-btn>
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
import { useDisplay } from 'vuetify'
import DatePicker from '@/components/commonComponents/DatePicker.vue'
import ClientLookupBar from '@/components/shared/ClientLookupBar.vue'
import PdfPreviewDialog from '@/components/shared/PdfPreviewDialog.vue'
import WorkspaceLayout from '@/components/shared/WorkspaceLayout.vue'
import { useLatestRequest } from '@/composables/useLatestRequest'
import { usePdfPreview } from '@/composables/usePdfPreview'
import { useRowErrors } from '@/composables/useRowErrors'
import { useSwal } from '@/composables/useSwal'
import BillingDataService from '@/services/billing/billingDataService'
import { TIPO_DE_FACTURA } from '@/utils/billing/facturas'
import { itemVacio } from '@/utils/documents/quoteDefaults'
import { debounce } from '@/utils/debounce'
import { mensajeDeError } from '@/utils/errors'
import { MONEDAS, monto, simboloDe } from '@/utils/money'
import { ALQUILER, SERVICIO } from '@/utils/orders/estado'
import DialogInfoInvoice from './DialogInfoInvoice.vue'
import ServicesTable from '@/views/documents/components/shared/ServicesTable.vue'

// Todo lo que trae lleno (de las ordenes o de Empresa) se puede cambiar antes de emitir; la cuenta la hace el back.
const emit = defineEmits(['emitida', 'cambiada', 'ver-pdf'])

const swal = useSwal()
const { lgAndUp } = useDisplay()

const CAMPO = { density: 'compact', variant: 'outlined', hideDetails: true }
const TIPO_DE_ORDEN = [{ title: 'Servicio', value: SERVICIO }, { title: 'Alquiler', value: ALQUILER }]
const OPCIONES = [
  { clave: 'orden_de_compra', titulo: 'Orden de compra', icono: 'mdi-file-sign' },
  { clave: 'guias', titulo: 'Guías de remisión', icono: 'mdi-truck-delivery-outline' },
  { clave: 'observaciones', titulo: 'Observaciones', icono: 'mdi-text-box-outline' },
]
const SIN_CUENTA = { gravado: 0, igv: 0, total: 0, por_cobrar: 0, en_letras: '',
                     detraccion: { aplica: false, porcentaje: 0, monto: 0 } }
const ancho = (apilado, md) => (apilado ? { cols: 12 } : { cols: 12, md })

const dialog = ref(false)
const datosAbiertos = ref(true)
const opcionesAbiertas = ref(false)
const emitiendo = ref(false)
const envio = ref(null)
const emitida = ref(null)
const clienteId = ref(null)
const clienteInicial = ref(null)
const ordenes = ref([])
const serie = ref('')
const fechas = ref({ desde: '', hasta: '' })
const tipoDeOrden = ref(SERVICIO)
const datos = ref(null)
const cuenta = ref(SIN_CUENTA)
const visibles = ref([])

const items = computed(() => datos.value?.items ?? [])
const { errores, marcarErrores } = useRowErrors(items)
const totalesDeLaTabla = computed(() => ({ subtotal: cuenta.value.gravado, igv: cuenta.value.igv,
                                           total: cuenta.value.total }))
const sumaDeCuotas = computed(() => (datos.value?.cuotas || []).reduce((s, c) => s + (Number(c.monto) || 0), 0))
const cuotasCuadran = computed(() => Math.abs(sumaDeCuotas.value - Number(cuenta.value.por_cobrar)) < 0.005)
const sePuedeEmitir = computed(() => Boolean(clienteId.value && items.value.length))
const porAgregar = computed(() => OPCIONES.filter(o => !visibles.value.includes(o.clave)))
const resumen = computed(() => [clienteInicial.value?.name, datos.value.moneda,
  datos.value.forma_de_pago === 'credito' ? 'Crédito' : 'Contado'].filter(Boolean).join(' · '))
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

function quitarOpcion (clave) {
  visibles.value = visibles.value.filter(c => c !== clave)
  datos.value[clave] = clave === 'guias' ? [] : ''
}

// La primera cuota propone todo lo que hay por cobrar a 30 dias; las siguientes, lo que falta.
function agregarCuota () {
  const falta = Math.max(Number(cuenta.value.por_cobrar) - sumaDeCuotas.value, 0)
  const vence = new Date(`${datos.value.fecha}T12:00:00`)
  vence.setDate(vence.getDate() + 30 * (datos.value.cuotas.length + 1))
  datos.value.cuotas.push({ monto: Math.round(falta * 100) / 100, fecha: vence.toISOString().slice(0, 10) })
}
watch(() => datos.value?.forma_de_pago, (forma) => {
  if (forma === 'credito' && !datos.value.cuotas.length) agregarCuota()
})
// Una sola cuota que nadie cambio sigue a lo que hay por cobrar, que el back recalcula despues de cada cambio.
watch(() => cuenta.value.por_cobrar, (nuevo, anterior) => {
  const cuotas = datos.value?.cuotas || []
  if (cuotas.length === 1 && Math.abs(Number(cuotas[0].monto) - Number(anterior)) < 0.005) {
    cuotas[0].monto = Number(nuevo)
  }
})

function noSePudo (titulo, porDefecto, error) {
  marcarErrores(error.response?.data?.filas)
  swal.fire({ icon: 'error', title: titulo, text: mensajeDeError(error, porDefecto) })
}

const { abierta: vistaPrevia, url: urlDeVista, armando: armandoVista, ver: verVistaPrevia } = usePdfPreview(
  () => BillingDataService.previewInvoice(paraElBack()),
  error => noSePudo('No se armó la vista previa', 'No se pudo armar la vista previa.', error))

// `nueva` es lo que devuelve el back: cliente, ordenes, tipo, serie y datos. Con `plantilla` (otra factura emitida)
// van su cliente, sus items y condiciones; la fecha es la de hoy y las guias, la OC y las cuotas quedan vacias.
function open (nueva, plantilla = null) {
  clienteId.value = plantilla?.cliente_id ?? nueva.cliente
  clienteInicial.value = plantilla?.cliente_data ?? nueva.cliente_data
  ordenes.value = plantilla ? [] : nueva.ordenes
  serie.value = nueva.serie
  fechas.value = nueva.fechas
  tipoDeOrden.value = plantilla?.order_type ?? nueva.order_type
  datos.value = JSON.parse(JSON.stringify(plantilla
    ? { ...plantilla.datos, fecha: nueva.datos.fecha, tipo_de_cambio: '', cuotas: [], guias: [], orden_de_compra: '' }
    : nueva.datos))
  if (!datos.value.items.length) datos.value.items.push(itemVacio(TIPO_DE_FACTURA.unidad))
  if (datos.value.forma_de_pago === 'credito' && !datos.value.cuotas.length) agregarCuota()
  visibles.value = OPCIONES.map(o => o.clave).filter(c => (Array.isArray(datos.value[c]) ? datos.value[c].length
                                                                                        : datos.value[c]))
  cuenta.value = SIN_CUENTA
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
