<template>
  <v-dialog v-model="dialog" class="dialog-premium" fullscreen persistent>
    <v-card v-if="datos" class="d-flex flex-column" style="height: 100%;">
      <base-modal-header title="Nota de crédito" icon="mdi-file-undo-outline" @close="salir">
        <span>{{ serie ? `${serie} · se numera al emitir` : 'Se numera al emitir' }}</span>
      </base-modal-header>

      <v-card-text class="pt-4 d-flex flex-column pantalla-de-trabajo"
                   style="flex-grow: 1; min-height: 0; overflow-y: hidden;">
        <div class="d-flex flex-column flex-grow-1 columna-de-trabajo" style="min-height: 0;">
          <workspace-layout :detalle-abierto="false">
            <template #apoyo>
              <div class="titulo-de-hoja">Información</div>
              <div class="px-4 pb-4 d-flex flex-column ga-3">
                <div class="factura-afectada pa-3 rounded-lg text-body-2">
                  <div class="text-caption text-medium-emphasis">Factura que modifica</div>
                  <div class="font-weight-bold">{{ factura.numero }}</div>
                  <div class="text-caption text-medium-emphasis">{{ factura.cliente }} · {{ fechaCorta(factura.fecha) }}</div>
                  <div class="d-flex justify-space-between mt-1"><span>Total</span>
                    <b>{{ monto(factura.total, factura.moneda) }}</b></div>
                  <div v-if="Number(factura.total) !== Number(factura.total_vigente)"
                       class="d-flex justify-space-between text-medium-emphasis"><span>Notas anteriores</span>
                    <span>− {{ monto(factura.total - factura.total_vigente, factura.moneda) }}</span></div>
                  <div class="d-flex justify-space-between text-medium-emphasis"><span>Abonado</span>
                    <span>{{ monto(factura.abonado, factura.moneda) }}</span></div>
                </div>
                <div class="titulo-de-seccion">¿Qué quieres hacer?</div>
                <option-rows :opciones="ACCIONES" :abierta="accion" @abrir="elegirAccion" />
                <template v-if="accion">
                  <v-select v-model="datos.motivo" :items="opcionesDeMotivo" label="Motivo (catálogo 09 de SUNAT)"
                            v-bind="CAMPO" />
                  <div v-if="motivoElegido" class="explicacion pa-3 rounded-lg text-body-2">
                    {{ motivoElegido.explicacion }}
                  </div>
                  <date-picker :date="datos.fecha" label="Fecha de emisión" :min="fechas.desde" :max="fechas.hasta"
                               :campo="CAMPO" @setPickedDate="f => (datos.fecha = f)" />
                  <v-textarea v-model="datos.sustento" label="Sustento (lo leen SUNAT y el cliente)" rows="3" auto-grow
                              counter="250" v-bind="CAMPO" :hide-details="false" />
                </template>
              </div>
            </template>

            <template #lista>
              <detail-empty v-if="!grupo" titulo="Nota de crédito" icono="mdi-file-undo-outline"
                            texto="Elige qué quieres hacer con la factura." />
              <template v-else>
                <div class="titulo-de-hoja titulo-principal flex-wrap ga-2 py-2">
                  <span class="mr-auto">{{ LISTAS[grupo].titulo }}</span>
                  <span class="text-caption text-medium-emphasis">{{ LISTAS[grupo].ayuda }}</span>
                  <v-btn v-if="grupo === CUOTAS" variant="tonal" class="font-weight-bold" prepend-icon="mdi-plus"
                         @click="datos.cuotas.push({ monto: '', fecha: '' })">Agregar cuota</v-btn>
                </div>

                <div class="flex-grow-1 overflow-y-auto" style="min-height: 0;">
                  <v-table v-if="grupo === CUOTAS" density="compact" fixed-header>
                    <thead><tr><th>Cuota</th><th>Vence</th><th class="text-right">Monto</th><th style="width: 3rem;"></th></tr></thead>
                    <tbody>
                      <tr v-for="(cuota, i) in datos.cuotas" :key="i">
                        <td>{{ i + 1 }}</td>
                        <td><date-picker :date="cuota.fecha" label="Fecha" :min="datos.fecha" :campo="CAMPO"
                                         @setPickedDate="f => (cuota.fecha = f)" /></td>
                        <td><v-text-field v-model="cuota.monto" type="number" v-bind="CAMPO" class="campo-numero" /></td>
                        <td><v-btn icon="mdi-delete" variant="text" size="small" color="red" title="Quitar la cuota" @click="datos.cuotas.splice(i, 1)" /></td>
                      </tr>
                    </tbody>
                  </v-table>

                  <v-table v-else-if="grupo === MONTO" density="compact" fixed-header>
                    <thead><tr><th>Descripción</th><th class="text-right" style="width: 10rem;">Monto sin IGV</th>
                      <th class="text-right" style="width: 8rem;">Importe</th></tr></thead>
                    <tbody>
                      <tr>
                        <td><v-text-field v-model="porMonto.description" v-bind="CAMPO" /></td>
                        <td><v-text-field v-model="porMonto.unit_price" type="number" v-bind="CAMPO" class="campo-numero" /></td>
                        <td class="text-right">{{ importe(0) }}</td>
                      </tr>
                    </tbody>
                  </v-table>

                  <v-table v-else density="compact" fixed-header>
                    <thead>
                      <tr>
                        <th v-if="grupo === ITEMS" style="width: 3rem;"></th>
                        <th>Descripción</th>
                        <th class="text-right" style="width: 8rem;">Cantidad</th>
                        <th v-if="grupo !== TEXTO" class="text-right" style="width: 9rem;">P. unitario</th>
                        <th v-if="grupo !== TEXTO" class="text-right" style="width: 8rem;">Importe</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="(fila, i) in filas" :key="i" :class="{ 'text-medium-emphasis': grupo === ITEMS && !fila.incluir }">
                        <td v-if="grupo === ITEMS"><v-checkbox-btn v-model="fila.incluir" density="compact" /></td>
                        <td>
                          <v-text-field v-if="grupo === TEXTO" v-model="fila.description" v-bind="CAMPO" />
                          <span v-else>{{ fila.description }}</span>
                        </td>
                        <td class="text-right">
                          <v-text-field v-if="grupo === ITEMS && fila.incluir" v-model="fila.quantity" type="number"
                                        v-bind="CAMPO" class="campo-numero" :hint="`de ${fila.original}`" />
                          <span v-else>{{ fila.quantity }}</span>
                        </td>
                        <td v-if="grupo !== TEXTO" class="text-right">
                          <v-text-field v-if="grupo === ITEMS && fila.incluir" v-model="fila.unit_price" type="number"
                                        v-bind="CAMPO" class="campo-numero" />
                          <span v-else>{{ Number(fila.unit_price).toFixed(2) }}</span>
                        </td>
                        <td v-if="grupo !== TEXTO" class="text-right">{{ importeDeFila(fila) }}</td>
                      </tr>
                    </tbody>
                  </v-table>
                </div>

                <div class="border-t-thin px-4 py-2 text-body-2 flex-shrink-0">
                  <div class="d-flex justify-space-between"><span class="text-medium-emphasis">Gravado</span>
                    <span>{{ monto(cuenta.gravado, factura.moneda) }}</span></div>
                  <div class="d-flex justify-space-between"><span class="text-medium-emphasis">IGV 18 %</span>
                    <span>{{ monto(cuenta.igv, factura.moneda) }}</span></div>
                  <div class="d-flex justify-space-between text-body-1 font-weight-bold"><span>Total de la nota</span>
                    <span>{{ monto(cuenta.total, factura.moneda) }}</span></div>
                </div>
              </template>
            </template>

            <template #sin-detalle>
              <div class="titulo-de-hoja">Resumen</div>
              <div class="px-4 d-flex flex-column ga-2 text-body-2">
                <div class="d-flex justify-space-between font-weight-bold"><span>Nota de crédito</span>
                  <span>− {{ monto(cuenta.total, factura.moneda) }}</span></div>
                <div class="d-flex justify-space-between text-medium-emphasis"><span>Factura {{ factura.numero }}</span>
                  <span>{{ monto(factura.total_vigente, factura.moneda) }}</span></div>
                <div class="d-flex justify-space-between text-medium-emphasis"><span>Abonado</span>
                  <span>− {{ monto(cuenta.factura.abonado, factura.moneda) }}</span></div>
                <template v-if="preguntaDeposito">
                  <div class="text-medium-emphasis mt-1">¿El cliente ya depositó la detracción?</div>
                  <segmented-field v-model="datos.detraccion_depositada" :opciones="DEPOSITO" />
                  <div class="text-caption text-medium-emphasis">
                    Se sugiere «No» si la factura no tiene abonos, y «Sí» si ya los tiene.
                  </div>
                </template>
                <div v-if="Number(cuenta.factura.detraccion) > 0" class="d-flex justify-space-between text-medium-emphasis">
                  <span>Detracción</span><span>− {{ monto(cuenta.factura.detraccion, factura.moneda) }}</span></div>
                <div class="d-flex justify-space-between font-weight-bold"><span>Queda por cobrar</span>
                  <span>{{ monto(cuenta.factura.falta, factura.moneda) }}</span></div>
                <div v-if="grupo" class="efecto pa-3 rounded-lg mt-2" :class="`efecto-${EFECTOS[grupo].tono}`">
                  <div class="font-weight-bold">{{ EFECTOS[grupo].titulo }}</div>
                  <div>{{ EFECTOS[grupo].texto }}</div>
                </div>
              </div>
            </template>
          </workspace-layout>
        </div>
      </v-card-text>

      <form-footer accion="Emitir nota" icono="mdi-send" :listo="Boolean(grupo)" :ocupado="emitiendo"
                   :vista="vista" titulo="Nota de crédito" @cancelar="salir" @confirmar="emitir" />
    </v-card>
  </v-dialog>
</template>

<script setup>
import { computed, nextTick, ref, watch, reactive } from 'vue'
import BaseModalHeader from '@/components/commonComponents/BaseModalHeader.vue'
import DatePicker from '@/components/commonComponents/DatePicker.vue'
import DetailEmpty from '@/components/shared/DetailEmpty.vue'
import OptionRows from '@/components/shared/OptionRows.vue'
import FormFooter from '@/components/shared/FormFooter.vue'
import SegmentedField from '@/components/shared/SegmentedField.vue'
import WorkspaceLayout from '@/components/shared/WorkspaceLayout.vue'
import { useFormChanges } from '@/composables/useFormChanges'
import { useLatestRequest } from '@/composables/useLatestRequest'
import { usePdfPreview } from '@/composables/usePdfPreview'
import { useSwal } from '@/composables/useSwal'
import BillingDataService from '@/services/billing/billingDataService'
import { fechaCorta } from '@/utils/dates'
import { debounce } from '@/utils/debounce'
import { mensajeDeError } from '@/utils/errors'
import { CAMPO } from '@/utils/fields'
import { monto } from '@/utils/money'

// La nota de credito de una factura (§5.15): el motivo decide que se edita al centro; la cuenta la hace el back.
const emit = defineEmits(['emitida'])

const ANULA = 'anula', ITEMS = 'items', MONTO = 'monto', TEXTO = 'texto', CUOTAS = 'cuotas'
const LISTAS = {
  [ANULA]: { titulo: 'Ítems de la factura', ayuda: 'La nota la anula entera: no se edita' },
  [ITEMS]: { titulo: 'Ítems que baja', ayuda: 'Marca los ítems y cuánto de cada uno' },
  [MONTO]: { titulo: 'Lo que baja', ayuda: 'Una línea con el monto' },
  [TEXTO]: { titulo: 'Descripción correcta', ayuda: 'Los montos no cambian' },
  [CUOTAS]: { titulo: 'Cuotas nuevas', ayuda: 'Lo que falta cobrar, con sus fechas' },
}
const EFECTOS = {
  [ANULA]: { tono: 'anula', titulo: 'La factura queda anulada por la nota.',
             texto: 'Sus órdenes quedan libres para facturar de nuevo; los abonos se quedan en ella, como en la baja.' },
  [ITEMS]: { tono: 'baja', titulo: 'Baja lo que falta cobrar.', texto: 'La factura sigue vigente con sus órdenes.' },
  [MONTO]: { tono: 'baja', titulo: 'Baja lo que falta cobrar.', texto: 'La factura sigue vigente con sus órdenes.' },
  [TEXTO]: { tono: 'nada', titulo: 'No cambia el cobro.', texto: 'Queda como constancia de la corrección.' },
  [CUOTAS]: { tono: 'nada', titulo: 'No cambia el total.', texto: 'Cambian las fechas o el monto pendiente de las cuotas.' },
}
// Lo que se quiere hacer, en palabras de quien la emite; cada una muestra solo sus motivos de SUNAT.
const ACCIONES = [
  { clave: 'anular', icono: 'mdi-file-cancel-outline', titulo: 'Anular toda la factura', valor: '01, 02 o 06',
    grupos: [ANULA], primero: '01' },
  { clave: 'parte', icono: 'mdi-minus-circle-outline', titulo: 'Bajar una parte', valor: 'descuento o devolución',
    grupos: [ITEMS, MONTO], primero: '04' },
  { clave: 'corregir', icono: 'mdi-pencil-outline', titulo: 'Corregir sin cambiar montos', valor: 'descripción o cuotas',
    grupos: [TEXTO, CUOTAS], primero: '03' },
]
const DEPOSITO = [{ valor: true, texto: 'Sí, ya depositó' }, { valor: false, texto: 'No todavía' }]
const SIN_CUENTA = { importes: [], gravado: 0, igv: 0, total: 0, factura: { abonado: 0, detraccion: 0, falta: 0 } }

const swal = useSwal()
const dialog = ref(false)
const emitiendo = ref(false)
const factura = ref(null)
const serie = ref('')
const fechas = ref({ desde: '', hasta: '' })
const motivos = ref([])
const datos = ref(null)
// Los items de la factura, para marcar, corregir o copiar segun el motivo; y la linea del descuento por monto.
const filas = ref([])
const porMonto = ref({ description: '', unit_price: '' })
const cuenta = ref(SIN_CUENTA)
// La ultima emitida desde lo escrito: si SUNAT la rechaza, `corregir` vuelve a abrir el formulario igual.
const emitidaDe = ref(null)

const accion = ref(null)
const grupo = computed(() => motivos.value.find(m => m.codigo === datos.value?.motivo)?.grupo || '')
const opcionesDeMotivo = computed(() => {
  const grupos = ACCIONES.find(a => a.clave === accion.value)?.grupos || []
  return motivos.value.filter(m => grupos.includes(m.grupo)).map(m => ({
    title: `${m.codigo} · ${m.nombre}`, value: m.codigo,
    props: { disabled: !m.disponible, subtitle: m.por_que_no || undefined },
  }))
})
const motivoElegido = computed(() => motivos.value.find(m => m.codigo === datos.value?.motivo))
function elegirAccion (clave) {
  accion.value = clave
  datos.value.motivo = ACCIONES.find(a => a.clave === clave).primero
}
const preguntaDeposito = computed(() => [ITEMS, MONTO].includes(grupo.value) && Number(factura.value?.detraccion) > 0)

// Lo que va al back segun el motivo.
const comoItem = (f) => ({ description: f.description, observations: f.observations, quantity: f.quantity,
                           unit_price: f.unit_price, incluye_igv: f.incluye_igv })
const paraElBack = () => {
  const d = datos.value
  const items = {
    [ITEMS]: () => filas.value.filter(f => f.incluir).map(comoItem),
    [MONTO]: () => [{ ...porMonto.value, quantity: 1, incluye_igv: false }],
    [TEXTO]: () => filas.value.map(comoItem),
  }[grupo.value]
  return { ...d, items: items ? items() : [] }
}

const importe = (indice) => monto(cuenta.value.importes?.[indice] ?? 0, factura.value.moneda)
const importeDeFila = (fila) => {
  if (grupo.value === ANULA) return importe(filas.value.indexOf(fila))
  const elegidas = filas.value.filter(f => f.incluir)
  return fila.incluir ? importe(elegidas.indexOf(fila)) : '—'
}

const { begin, isLatest } = useLatestRequest()
const recalcular = debounce(async () => {
  if (!datos.value || !grupo.value) return
  const turno = begin()
  try {
    const { data } = await BillingDataService.creditNoteAmounts(factura.value.id, paraElBack())
    if (isLatest(turno)) cuenta.value = data
  } catch {
    if (isLatest(turno)) cuenta.value = SIN_CUENTA
  }
})
watch([datos, filas, porMonto], recalcular, { deep: true })

const cambios = useFormChanges(() => ({ accion: accion.value, datos: datos.value, filas: filas.value,
                                       porMonto: porMonto.value }))

function noSePudo (titulo, porDefecto, error) {
  swal.fire({ icon: 'error', title: titulo, text: mensajeDeError(error, porDefecto) })
}

const vista = reactive(usePdfPreview(
  () => BillingDataService.previewCreditNote(factura.value.id, paraElBack()),
  error => noSePudo('No se armó la vista previa', 'No se pudo armar la vista previa.', error)))

// `nueva`: lo que devuelve el back para la factura (sus datos, motivos, items, cuotas y la sugerencia del deposito).
async function open (nueva) {
  emitidaDe.value = null
  factura.value = nueva.factura
  serie.value = nueva.serie
  fechas.value = nueva.fechas
  motivos.value = nueva.motivos
  datos.value = { ...nueva.datos, cuotas: JSON.parse(JSON.stringify(nueva.datos.cuotas)) }
  filas.value = nueva.datos.items.map(i => ({ ...i, incluir: false, original: i.quantity }))
  porMonto.value = { description: '', unit_price: '' }
  accion.value = null
  cuenta.value = SIN_CUENTA
  dialog.value = true
  await nextTick()
  cambios.empezar()
}

async function salir () {
  if (await cambios.puedeSalir()) dialog.value = false
}

async function emitir () {
  emitiendo.value = true
  try {
    const { data } = await BillingDataService.emitCreditNote(factura.value.id, paraElBack())
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
.factura-afectada { background: rgba(var(--v-theme-on-surface), 0.05); }
.explicacion { background: rgba(var(--v-theme-primary), 0.1); }
.efecto-anula { background: rgba(var(--v-theme-error), 0.12); color: rgb(var(--v-theme-error)); }
.efecto-baja { background: rgba(var(--v-theme-primary), 0.12); }
.efecto-nada { background: rgba(var(--v-theme-on-surface), 0.05); }
.campo-numero :deep(input) { text-align: right; }
</style>
