<template>
  <v-dialog v-model="dialog" class="dialog-premium" fullscreen persistent>
    <v-card v-if="datos" class="d-flex flex-column" style="height: 100%;">
      <base-modal-header title="Nueva guía de remisión" icon="mdi-truck-delivery-outline" @close="salir">
        <span>Remitente · Transporte privado en vehículo M1 o L</span>
      </base-modal-header>

      <v-card-text class="pt-4 d-flex flex-column pantalla-de-trabajo"
                   style="flex-grow: 1; min-height: 0; overflow-y: hidden;">
        <div class="d-flex flex-column flex-grow-1 columna-de-trabajo" style="min-height: 0;">
          <workspace-layout :detalle-abierto="Boolean(elegido)" @cerrar="elegido = null">
            <template #apoyo="{ apilado }">
              <workspace-tabs v-model="pestana" v-model:abiertos="datosAbiertos" :pestanas="PESTANAS" :apilado="apilado"
                              :resumen="resumen">
                <div v-if="pestana === 'info'" class="d-flex flex-column ga-3">
                  <client-lookup-bar v-model="clienteId" :seed="clienteInicial" :forma="apilado ? 'apilada' : 'mitades'"
                                     :campo="CAMPO" @client-selected="c => (clienteInicial = c)" />
                  <v-row dense>
                    <v-col v-bind="ancho(apilado, 4)">
                      <v-select v-model="datos.motivo.codigo" :items="motivos" item-title="nombre" item-value="codigo"
                                label="Motivo de traslado" v-bind="CAMPO" />
                    </v-col>
                    <v-col v-if="datos.motivo.codigo === OTROS" v-bind="ancho(apilado, 8)">
                      <v-combobox v-model="datos.motivo.descripcion" :items="MOTIVOS_SUGERIDOS"
                                  :custom-filter="contieneSinTildes" label="¿Cuál es el motivo? (opcional)"
                                  hide-no-data v-bind="CAMPO" />
                    </v-col>
                  </v-row>
                  <v-row dense>
                    <v-col v-for="lugar in LUGARES" :key="lugar.clave" v-bind="ancho(apilado, 6)">
                      <section class="seccion">
                        <div class="titulo-de-seccion">{{ lugar.titulo }}</div>
                        <ubigeo-field v-model="datos[lugar.clave].ubigeo" />
                        <v-textarea v-model="datos[lugar.clave].direccion" label="Dirección" rows="1" no-resize
                                    class="crece-con-texto" v-bind="CAMPO" />
                      </section>
                    </v-col>
                  </v-row>
                  <section-linked-orders v-model="ordenes" :cliente-id="clienteId" titulo="Documentos relacionados" />
                </div>

                <div v-else class="d-flex flex-column ga-3">
                  <v-row dense>
                    <v-col v-bind="ancho(apilado, 4)">
                      <date-picker :date="datos.fecha_traslado" label="Fecha del traslado" :min="hoy" :campo="CAMPO"
                                   @setPickedDate="f => (datos.fecha_traslado = f)" />
                    </v-col>
                    <v-col v-bind="ancho(apilado, 4)">
                      <v-text-field v-model="datos.bultos" type="number" min="0" label="Bultos o pallets (opcional)"
                                    v-bind="CAMPO" />
                    </v-col>
                    <v-col v-bind="ancho(apilado, 4)">
                      <v-text-field v-model="datos.peso" type="number" min="0" label="Peso total" suffix="kg"
                                    :placeholder="pesoDeLosItems ? String(pesoDeLosItems) : ''" persistent-placeholder
                                    :hint="pesoDeLosItems ? 'Vacío, va la suma de los ítems' : ''" persistent-hint
                                    v-bind="CAMPO" hide-details="auto" />
                    </v-col>
                  </v-row>
                  <div class="d-flex ga-2 text-body-2 text-medium-emphasis">
                    <v-icon size="small">mdi-information-outline</v-icon>
                    Transporte privado en vehículo M1 o L: SUNAT no pide placa ni conductor.
                  </div>
                  <v-textarea v-model="datos.observaciones" label="Observaciones" rows="2" auto-grow v-bind="CAMPO" />
                </div>
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
                <v-table v-if="datos.items.length" density="compact" class="lista-de-tarjetas" fixed-header>
                  <thead>
                    <tr>
                      <th style="width: 4.5rem;">N°</th>
                      <th>Descripción</th>
                      <th style="width: 6rem;">Cantidad</th>
                      <th style="width: 7rem;">Peso c/u</th>
                      <th style="width: 3rem;"></th>
                    </tr>
                  </thead>
                  <tbody>
                    <row-dispatch-guide v-for="(item, i) in datos.items" :key="clave(item)" v-bind="arrastrable(i)"
                                        :class="claseDe(i)" :asa="asa(i)" :item="item" :indice="i"
                                        :error="errores[i]" :elegida="item === elegido" @elegir="elegido = item"
                                        @borrar="borrar" />
                  </tbody>
                </v-table>
                <div v-else
                     class="d-flex flex-column align-center justify-center fill-height ga-2 pa-8 text-medium-emphasis">
                  <v-icon size="x-large">mdi-package-variant-closed</v-icon>
                  Agrega un ítem o arma la guía desde Órdenes.
                </div>
              </div>
            </template>

            <template #detalle>
              <panel-dispatch-guide :item="elegido" :indice="indiceElegido" :error="errores[indiceElegido]"
                                    @cerrar="elegido = null" @otro-igual="otroIgual"
                                    @borrar="borrar" />
            </template>

            <template #sin-detalle>
              <detail-empty titulo="Ítem" icono="mdi-package-variant-closed"
                            texto="Elige un ítem de la lista para ver y llenar sus datos." />
            </template>
          </workspace-layout>
        </div>
      </v-card-text>

      <form-footer accion="Emitir guía" icono="mdi-send" :listo="sePuedeEmitir" :ocupado="emitiendo"
                   :vista="vista" titulo="Guía de remisión" @cancelar="salir" @confirmar="emitir" />
    </v-card>
  </v-dialog>
</template>

<script setup>
import { computed, ref, reactive } from 'vue'
import { useRowDrag } from '@/composables/useRowDrag'
import DatePicker from '@/components/commonComponents/DatePicker.vue'
import DetailEmpty from '@/components/shared/DetailEmpty.vue'
import ClientLookupBar from '@/components/shared/ClientLookupBar.vue'
import FormFooter from '@/components/shared/FormFooter.vue'
import UbigeoField from '@/components/shared/UbigeoField.vue'
import WorkspaceLayout from '@/components/shared/WorkspaceLayout.vue'
import WorkspaceTabs from '@/components/shared/WorkspaceTabs.vue'
import { origenDe, useLocalDraft } from '@/composables/useLocalDraft'
import { usePdfPreview } from '@/composables/usePdfPreview'
import { useRowErrors } from '@/composables/useRowErrors'
import { useSwal } from '@/composables/useSwal'
import BillingDataService from '@/services/billing/billingDataService'
import { CURRENT_DISPATCH_GUIDE_SCHEMA, itemDeGuia } from '@/utils/billing/billingDefaults'
import { MOTIVOS_SUGERIDOS, OTROS } from '@/utils/billing/guias'
import { hoyISO } from '@/utils/dates'
import { mensajeDeError } from '@/utils/errors'
import { copiarDebajo } from '@/utils/lists'
import { CAMPO } from '@/utils/fields'
import { contieneSinTildes } from '@/utils/text'
import PanelDispatchGuide from './PanelDispatchGuide.vue'
import RowDispatchGuide from './RowDispatchGuide.vue'
import SectionLinkedOrders from './SectionLinkedOrders.vue'

// Todo lo que trae lleno (de las ordenes, de Empresa o de la ultima guia) se puede cambiar antes de emitir.
const emit = defineEmits(['emitida'])

const swal = useSwal()

const LUGARES = [{ clave: 'partida', titulo: 'Origen' }, { clave: 'llegada', titulo: 'Destino' }]
// SUNAT no recibe un traslado que empieza antes de emitir la guia.
const hoy = hoyISO()
// En la franja de arriba los campos van en la reticula de 4 columnas; en la columna angosta, uno por fila.
const ancho = (apilado, md) => (apilado ? { cols: 12 } : { cols: 12, md })

const dialog = ref(false)
// En franja, los datos se pliegan a una linea para dejar la altura a los items.
const datosAbiertos = ref(true)
const PESTANAS = [{ valor: 'info', texto: 'Información', icono: 'mdi-card-account-details-outline' },
                  { valor: 'traslado', texto: 'Traslado', icono: 'mdi-truck-outline' }]
const pestana = ref('info')
const emitiendo = ref(false)
// La ultima emitida desde lo escrito: si SUNAT la rechaza, `corregir` vuelve a abrir el formulario igual.
const emitidaDe = ref(null)
const clienteId = ref(null)
const clienteInicial = ref(null)
const ordenes = ref([])
const motivos = ref([])
const datos = ref(null)
const elegido = ref(null)

const items = computed(() => datos.value?.items ?? [])
const { asa, arrastrable, claseDe, clave } = useRowDrag(items)
const { errores, marcarErrores } = useRowErrors(items)
const indiceElegido = computed(() => items.value.indexOf(elegido.value))
const sePuedeEmitir = computed(() => Boolean(clienteId.value && items.value.length))
const paraElBack = () => ({ cliente: clienteId.value, ordenes: ordenes.value.map(o => o.id), datos: datos.value })

// Lo guardado, sobre lo que el formulario trae lleno: lo que no tenga queda como en una nueva.
function llenar (guardada) {
  clienteId.value = guardada.clienteId
  clienteInicial.value = guardada.clienteInicial
  ordenes.value = guardada.ordenes
  datos.value = { ...datos.value, ...guardada.datos,
                  items: guardada.datos.items.map(item => ({ ...itemDeGuia(), ...item })) }
  elegido.value = null
}

// La guia sin emitir: la nueva, la que sale de unas ordenes o la que usa otra de plantilla.
const origen = ref('')
const borrador = useLocalDraft({
  clave: () => `guia_${origen.value}`,
  version: CURRENT_DISPATCH_GUIDE_SCHEMA,
  datos: () => ({ clienteId: clienteId.value, clienteInicial: clienteInicial.value, ordenes: ordenes.value,
                  datos: datos.value }),
  llenar,
  resumen: (guardada) => {
    const n = guardada.datos.items.filter(item => item.descripcion?.trim()).length
    return n && `Hay una guía sin emitir con ${n} ${n === 1 ? 'ítem' : 'ítems'}`
  },
})

function noSePudo (titulo, porDefecto, error) {
  marcarErrores(error.response?.data?.filas)
  swal.fire({ icon: 'error', title: titulo, text: mensajeDeError(error, porDefecto) })
}

const vista = reactive(usePdfPreview(
  () => BillingDataService.previewDispatchGuide(paraElBack()),
  error => noSePudo('No se armó la vista previa', 'No se pudo armar la vista previa.', error)))

const resumen = computed(() => {
  const { codigo, descripcion } = datos.value.motivo
  const motivo = codigo === OTROS ? descripcion : motivos.value.find(m => m.codigo === codigo)?.nombre
  return [clienteInicial.value?.name, motivo].filter(Boolean).join(' · ')
})
// Solo se muestra: si el peso total queda vacio, el back manda esta misma suma.
const pesoDeLosItems = computed(() => Math.round(items.value
  .reduce((suma, i) => suma + (Number(i.peso) || 0) * (Number(i.cantidad) || 0), 0) * 1000) / 1000)

function agregar() {
  const item = itemDeGuia()
  datos.value.items.push(item)
  elegido.value = item
}

const otroIgual = () => { elegido.value = copiarDebajo(datos.value.items, indiceElegido.value) }

function borrar(indice) {
  if (datos.value.items[indice] === elegido.value) elegido.value = null
  datos.value.items.splice(indice, 1)
}

// `nueva` es lo que devuelve el back (cliente, ordenes, datos y motivos); `plantilla`, otra guia emitida.
async function open(nueva, plantilla = null) {
  emitidaDe.value = null
  clienteId.value = nueva.cliente
  clienteInicial.value = nueva.cliente_data
  ordenes.value = nueva.ordenes
  motivos.value = nueva.motivos
  datos.value = JSON.parse(JSON.stringify(nueva.datos))
  if (plantilla) {
    llenar({ clienteId: plantilla.cliente, clienteInicial: plantilla.cliente_data, ordenes: [],
             datos: { ...plantilla.datos, fecha_traslado: nueva.datos.fecha_traslado } })
  }
  origen.value = plantilla ? `plantilla_${plantilla.id}` : origenDe(nueva.ordenes.map(o => o.id))
  elegido.value = null
  if (!datos.value.items.length) agregar()
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
async function emitir() {
  emitiendo.value = true
  borrador.cerrar()
  try {
    const { data } = await BillingDataService.createDispatchGuide(paraElBack())
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
