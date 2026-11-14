<template>
  <v-dialog v-model="dialog" class="dialog-premium" fullscreen persistent>
    <v-card v-if="datos" class="d-flex flex-column" style="height: 100%;">
      <base-modal-header title="Nueva guía de remisión" icon="mdi-truck-delivery-outline" @close="dialog = false">
        <span>Remitente · Transporte privado en vehículo M1 o L</span>
        <!-- Las ordenes de las que sale; la "x" la saca antes de emitir. -->
        <v-chip v-for="orden in ordenes" :key="orden.id" size="small" variant="tonal" prepend-icon="mdi-clipboard-text"
                closable close-label="No vincular esta orden" class="ml-2"
                @click:close="ordenes = ordenes.filter(o => o !== orden)">
          {{ orden.numero }}
        </v-chip>
      </base-modal-header>

      <v-card-text class="pt-4 d-flex flex-column pantalla-de-trabajo"
                   style="flex-grow: 1; min-height: 0; overflow-y: hidden;">
        <div class="d-flex flex-column flex-grow-1 columna-de-trabajo" style="min-height: 0;">
          <workspace-layout :detalle-abierto="Boolean(elegido)" @cerrar="elegido = null">
            <template #apoyo="{ apilado }">
              <div class="titulo-de-hoja" :class="{ 'cursor-pointer': !apilado }"
                   @click="!apilado && (datosAbiertos = !datosAbiertos)">
                <span class="mr-auto text-truncate">
                  Destinatario y traslado
                  <span v-if="!apilado && !datosAbiertos" class="text-medium-emphasis font-weight-regular ml-2">
                    {{ resumen }}
                  </span>
                </span>
                <v-icon v-if="!apilado">{{ datosAbiertos ? 'mdi-chevron-up' : 'mdi-chevron-down' }}</v-icon>
              </div>
              <v-expand-transition>
                <div v-show="apilado || datosAbiertos" class="px-4 pb-4">
                  <client-lookup-bar v-model="clienteId" :seed="clienteInicial" :forma="apilado ? 'apilada' : 'mitades'"
                                     @client-selected="c => (clienteInicial = c)" />
                  <v-row dense class="mt-1">
                    <v-col v-bind="ancho(apilado, 3)">
                      <v-select v-model="datos.motivo.codigo" :items="motivos" item-title="nombre" item-value="codigo"
                                label="Motivo de traslado" v-bind="CAMPO" />
                    </v-col>
                    <v-col v-if="datos.motivo.codigo === OTROS" v-bind="ancho(apilado, 9)">
                      <v-text-field v-model="datos.motivo.descripcion" label="¿Cuál es el motivo? (opcional)"
                                    v-bind="CAMPO" />
                    </v-col>
                  </v-row>

                  <div class="text-body-2 font-weight-bold text-medium-emphasis mt-4 mb-2">Traslado</div>
                  <v-row dense>
                    <v-col v-bind="ancho(apilado, 3)">
                      <v-text-field v-model="datos.fecha_traslado" type="date" label="Fecha del traslado" :min="hoy"
                                    :rules="[reglaDesdeHoy]" v-bind="CAMPO" hide-details="auto" />
                    </v-col>
                    <v-col v-bind="ancho(apilado, 3)">
                      <v-text-field v-model="datos.peso" type="number" min="0" label="Peso total" suffix="kg"
                                    :placeholder="pesoDeLosItems ? String(pesoDeLosItems) : ''" persistent-placeholder
                                    :hint="pesoDeLosItems ? 'Vacío, va la suma de los ítems' : ''" persistent-hint
                                    v-bind="CAMPO" hide-details="auto" />
                    </v-col>
                    <v-col v-bind="ancho(apilado, 3)">
                      <v-text-field v-model="datos.bultos" type="number" min="0" label="Bultos (opcional)"
                                    v-bind="CAMPO" />
                    </v-col>
                  </v-row>

                  <template v-for="lugar in LUGARES" :key="lugar.clave">
                    <div class="text-body-2 font-weight-bold text-medium-emphasis mt-4 mb-2">{{ lugar.titulo }}</div>
                    <v-row dense>
                      <v-col v-bind="ancho(apilado, 3)">
                        <ubigeo-field v-model="datos[lugar.clave].ubigeo" />
                      </v-col>
                      <v-col v-bind="ancho(apilado, 9)">
                        <v-textarea v-model="datos[lugar.clave].direccion" label="Dirección" rows="1" no-resize
                                    class="crece-con-texto" v-bind="CAMPO" />
                      </v-col>
                    </v-row>
                  </template>

                  <div class="text-body-2 font-weight-bold text-medium-emphasis mt-4 mb-2">Observaciones</div>
                  <v-textarea v-model="datos.observaciones" rows="2" auto-grow v-bind="CAMPO" />
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
                <v-table v-if="datos.items.length" density="compact" class="lista-de-tarjetas" fixed-header>
                  <thead>
                    <tr>
                      <th style="width: 3rem;">N°</th>
                      <th>Descripción</th>
                      <th style="width: 6rem;">Cantidad</th>
                      <th style="width: 7rem;">Peso c/u</th>
                      <th style="width: 3rem;"></th>
                    </tr>
                  </thead>
                  <tbody>
                    <row-dispatch-guide v-for="(item, i) in datos.items" :key="i" :item="item" :indice="i"
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
                                    @cerrar="elegido = null" @borrar="borrar" />
            </template>

            <template #sin-detalle>
              <div class="titulo-de-hoja">Ítem</div>
              <div class="px-4 text-body-2 text-medium-emphasis">
                Elige un ítem de la lista para ver y llenar sus datos.
              </div>
            </template>
          </workspace-layout>
        </div>
      </v-card-text>

      <v-card-actions class="px-6 pb-4 pt-2 border-t-thin flex-shrink-0">
        <div class="d-flex flex-wrap align-center ga-2 columna-de-trabajo">
          <v-spacer />
          <v-btn variant="flat" class="font-weight-bold px-4" @click="dialog = false">Cancelar</v-btn>
          <v-btn variant="outlined" class="font-weight-bold px-4" prepend-icon="mdi-file-eye-outline"
                 :loading="armandoVista" :disabled="!sePuedeEmitir" @click="verVistaPrevia">
            Vista previa
          </v-btn>
          <v-btn color="primary" variant="flat" class="font-weight-bold px-4" prepend-icon="mdi-send"
                 :loading="emitiendo" :disabled="!sePuedeEmitir" @click="emitir">
            Emitir guía
          </v-btn>
        </div>
      </v-card-actions>

      <!-- La guia tal como saldria, sin emitir: desde aca se emite o se vuelve a editar. -->
      <pdf-preview-dialog v-model="vistaPrevia" :url="urlDeVista">
        <template #encabezado>
          <v-icon class="mr-2">mdi-file-eye-outline</v-icon>
          <span class="text-subtitle-1 font-weight-bold text-truncate">Vista previa · Guía de remisión</span>
        </template>
        <template #acciones>
          <v-btn variant="text" class="mr-2 font-weight-bold" prepend-icon="mdi-pencil" :disabled="emitiendo"
                 @click="vistaPrevia = false">
            Seguir editando
          </v-btn>
          <v-btn color="primary" variant="flat" class="font-weight-bold px-4" prepend-icon="mdi-send"
                 :loading="emitiendo" @click="emitir">
            Emitir guía
          </v-btn>
        </template>
      </pdf-preview-dialog>
    </v-card>

    <dialog-info-dispatch-guide v-model="emitida" :envio="envio" @volver="envio = null" @cambiada="alCambiar"
                                @ver-pdf="g => emit('ver-pdf', g)" />
  </v-dialog>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import ClientLookupBar from '@/components/shared/ClientLookupBar.vue'
import PdfPreviewDialog from '@/components/shared/PdfPreviewDialog.vue'
import UbigeoField from '@/components/shared/UbigeoField.vue'
import WorkspaceLayout from '@/components/shared/WorkspaceLayout.vue'
import { usePdfPreview } from '@/composables/usePdfPreview'
import { useRowErrors } from '@/composables/useRowErrors'
import { useSwal } from '@/composables/useSwal'
import BillingDataService from '@/services/billing/billingDataService'
import { OTROS, RECHAZADA, itemVacio } from '@/utils/billing/guias'
import { hoyISO } from '@/utils/dates'
import { avisarHecho } from '@/utils/documents/avisos'
import { mensajeDeError } from '@/utils/errors'
import DialogInfoDispatchGuide from './DialogInfoDispatchGuide.vue'
import PanelDispatchGuide from './PanelDispatchGuide.vue'
import RowDispatchGuide from './RowDispatchGuide.vue'

// Todo lo que trae lleno (de las ordenes, de Empresa o de la ultima guia) se puede cambiar antes de emitir.
const emit = defineEmits(['emitida', 'cambiada', 'ver-pdf'])

const swal = useSwal()

const CAMPO = { density: 'compact', variant: 'outlined', hideDetails: true }
const LUGARES = [{ clave: 'partida', titulo: 'Partida' }, { clave: 'llegada', titulo: 'Llegada' }]
// SUNAT no recibe un traslado que empieza antes de emitir la guia.
const hoy = hoyISO()
const reglaDesdeHoy = (fecha) => !fecha || fecha >= hoy || 'No puede ser anterior a hoy'
// En la franja de arriba los campos van en la reticula de 4 columnas; en la columna angosta, uno por fila.
const ancho = (apilado, md) => (apilado ? { cols: 12 } : { cols: 12, md })

const dialog = ref(false)
// En franja, los datos se pliegan a una linea para dejar la altura a los items.
const datosAbiertos = ref(true)
const emitiendo = ref(false)
const envio = ref(null)
const emitida = ref(null)
const rechazada = ref(false)
const clienteId = ref(null)
const clienteInicial = ref(null)
const ordenes = ref([])
const motivos = ref([])
const datos = ref(null)
const elegido = ref(null)

const items = computed(() => datos.value?.items ?? [])
const { errores, marcarErrores } = useRowErrors(items)
const indiceElegido = computed(() => items.value.indexOf(elegido.value))
const sePuedeEmitir = computed(() => Boolean(clienteId.value && items.value.length))
const paraElBack = () => ({ cliente: clienteId.value, ordenes: ordenes.value.map(o => o.id), datos: datos.value })

function noSePudo (titulo, porDefecto, error) {
  marcarErrores(error.response?.data?.filas)
  swal.fire({ icon: 'error', title: titulo, text: mensajeDeError(error, porDefecto) })
}

const { abierta: vistaPrevia, url: urlDeVista, armando: armandoVista, ver: verVistaPrevia } = usePdfPreview(
  () => BillingDataService.previewDispatchGuide(paraElBack()),
  error => noSePudo('No se armó la vista previa', 'No se pudo armar la vista previa.', error))

const resumen = computed(() => {
  const { codigo, descripcion } = datos.value.motivo
  const motivo = codigo === OTROS ? descripcion : motivos.value.find(m => m.codigo === codigo)?.nombre
  return [clienteInicial.value?.name, motivo].filter(Boolean).join(' · ')
})
// Solo se muestra: si el peso total queda vacio, el back manda esta misma suma.
const pesoDeLosItems = computed(() => Math.round(items.value
  .reduce((suma, i) => suma + (Number(i.peso) || 0) * (Number(i.cantidad) || 0), 0) * 1000) / 1000)

function agregar() {
  const item = itemVacio()
  datos.value.items.push(item)
  elegido.value = item
}

function borrar(indice) {
  if (datos.value.items[indice] === elegido.value) elegido.value = null
  datos.value.items.splice(indice, 1)
}

// `nueva` es lo que devuelve el back (cliente, ordenes, datos y motivos); `plantilla`, otra guia emitida.
function open(nueva, plantilla = null) {
  clienteId.value = plantilla?.cliente ?? nueva.cliente
  clienteInicial.value = plantilla?.cliente_data ?? nueva.cliente_data
  ordenes.value = plantilla ? [] : nueva.ordenes
  motivos.value = nueva.motivos
  datos.value = JSON.parse(JSON.stringify(plantilla
    ? { ...plantilla.datos, fecha_traslado: nueva.datos.fecha_traslado }
    : nueva.datos))
  elegido.value = null
  datosAbiertos.value = true
  dialog.value = true
}

// Ver informacion acompaña el envio y sigue preguntando hasta que SUNAT resuelva. Si no salio, se vuelve al formulario.
async function emitir() {
  emitiendo.value = true
  vistaPrevia.value = false
  envio.value = {}
  rechazada.value = false
  try {
    const { data } = await BillingDataService.createDispatchGuide(paraElBack())
    if (data.warning) avisarHecho(`Guía ${data.numero} emitida`, { warning: data.warning })
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
function alCambiar (guia) {
  rechazada.value = guia.estado === RECHAZADA
  emit('cambiada', guia)
}
// Al cerrar su informacion se cierra el formulario, salvo que SUNAT la rechace: queda para corregir y emitir otra.
watch(emitida, (ahora, antes) => { if (antes && !ahora && !rechazada.value) dialog.value = false })

defineExpose({ open })
</script>
