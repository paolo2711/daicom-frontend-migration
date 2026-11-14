<template>
  <v-dialog v-model="dialog" class="dialog-premium" fullscreen persistent>
    <v-card class="d-flex flex-column" style="height: 100%;">
      <base-modal-header :title="titulo" :icon="tipo.icono" @close="close">
        <span>
          <template v-if="!numero && numeroNuevo">
            Correlativo: <span class="font-weight-bold text-primary ml-1">{{ numeroNuevo }}</span> ·
          </template>
          {{ tipo.texto }}
        </span>
      </base-modal-header>

      <v-card-text class="pt-4 d-flex flex-column pantalla-de-trabajo"
                   style="flex-grow: 1; min-height: 0; overflow-y: hidden;">
        <div class="d-flex flex-column flex-grow-1 columna-de-trabajo" style="min-height: 0;">
          <workspace-layout :detalle-abierto="Boolean(abierto)" @cerrar="abierto = null">
            <template #apoyo="{ apilado }">
              <workspace-tabs v-model="pestana" v-model:abiertos="datosAbiertos" :pestanas="PESTANAS" :apilado="apilado"
                              :resumen="resumen">
                <billing-client-panel v-if="pestana === 'info'" :tipo-de-documento="tipoDeDocumento"
                                      v-model:meta="cotizacion.meta" v-model:billing="cotizacion.billing_client"
                                      v-model:certificate="cotizacion.certificate_data" v-model:clientId="clienteId"
                                      :apilado="apilado" />
                <option-rows v-else :opciones="opciones" :abierta="abierto?.clave" @abrir="abrir" />
              </workspace-tabs>
            </template>

            <template #lista>
              <div class="titulo-de-hoja titulo-principal flex-wrap ga-2 py-2">
                <span class="mr-auto">
                  Ítems <span class="text-medium-emphasis font-weight-regular">({{ cantidadDeItems }})</span>
                </span>
                <v-btn variant="outlined" class="font-weight-bold" prepend-icon="mdi-format-list-group"
                       @click="agregar(grupoVacio())">Añadir grupo</v-btn>
                <v-btn variant="outlined" class="font-weight-bold" prepend-icon="mdi-plus"
                       @click="agregar(itemVacio(tipo.unidad))">Añadir ítem</v-btn>
              </div>

              <div class="flex-grow-1 overflow-y-auto" style="min-height: 0;">
                <v-table v-if="cotizacion.items.length" density="compact" class="lista-de-tarjetas" fixed-header>
                  <thead>
                    <tr>
                      <th style="width: 6.5rem;"></th>
                      <th style="width: 3rem;">N°</th>
                      <th>Descripción</th>
                      <th class="text-right" style="width: 5.5rem;">Cant.</th>
                      <th style="width: 6rem;">Unidad</th>
                      <th class="text-right" style="width: 8rem;">P. unit.</th>
                      <th class="text-right" style="width: 8rem;">Total</th>
                      <th style="width: 3rem;"></th>
                    </tr>
                  </thead>
                  <tbody>
                    <row-quote-item v-for="(fila, i) in cotizacion.items" :key="clave(fila)" v-bind="arrastrable(i)"
                                    :class="claseDe(i)" :fila="fila" :indice="i" :numero="numeros[i]"
                                    :importe-de-la-fila="cuenta.importes?.[i] ?? 0" :primera="i === 0"
                                    :ultima="i === cotizacion.items.length - 1" :error="errores[i]"
                                    :elegida="abierto?.fila === fila" :asa="asa(i)" @elegir="abrir(null, fila)"
                                    @mover="(indice, paso) => mover(indice, indice + paso)" @borrar="borrar" />
                  </tbody>
                </v-table>
                <div v-else class="d-flex flex-column align-center justify-center fill-height ga-2 pa-8 text-medium-emphasis">
                  <v-icon size="x-large">mdi-format-list-numbered</v-icon>
                  Sin ítems. Agrega uno con "Añadir ítem".
                </div>
              </div>

              <div class="border-t-thin px-4 py-2 text-body-2 flex-shrink-0">
                <div class="d-flex justify-space-between"><span class="text-medium-emphasis">Subtotal</span>
                  <span>{{ monto(cuenta.subtotal, cotizacion.meta.currency) }}</span></div>
                <div class="d-flex justify-space-between">
                  <span class="text-medium-emphasis">IGV {{ cotizacion.totals.igv_percent }} %</span>
                  <span>{{ monto(cuenta.igv, cotizacion.meta.currency) }}</span></div>
                <div class="d-flex justify-space-between text-body-1 font-weight-bold"><span>Total</span>
                  <span>{{ monto(cuenta.total, cotizacion.meta.currency) }}</span></div>
              </div>
            </template>

            <template #detalle>
              <panel-service-item v-if="abierto?.fila && !esGrupo(abierto.fila)" :item="abierto.fila"
                                  :indice="numeros[indiceAbierto] - 1" :moneda="cotizacion.meta.currency"
                                  :error="errores[indiceAbierto]" :unidades="UNIDADES" :acreditaciones="acreditaciones"
                                  etiqueta-del-detalle="Comentario (opcional)" @cerrar="abierto = null"
                                  @borrar="borrar(indiceAbierto)" />
              <detail-panel v-else-if="abierto?.fila" titulo="Grupo" @cerrar="abierto = null">
                <v-text-field v-model="abierto.fila.description" label="Título del grupo" :maxlength="LIMITES.grupo"
                              class="titulo-de-grupo" v-bind="CAMPO" />
                <div class="text-caption text-medium-emphasis">
                  Los ítems de abajo, hasta el siguiente grupo, salen bajo este título en el PDF.
                </div>
                <template #pie>
                  <v-spacer />
                  <v-btn variant="text" color="red" prepend-icon="mdi-delete" @click="borrar(indiceAbierto)">Quitar</v-btn>
                </template>
              </detail-panel>
              <panel-quote-option v-else-if="abierto" :key="abierto.clave" v-model:quote="cotizacion"
                                  :clave="abierto.clave" @cerrar="abierto = null" />
            </template>

            <template #sin-detalle>
              <detail-empty titulo="Ítem" icono="mdi-format-list-checks"
                            texto="Elige un ítem, un grupo o una opción para editarlo aquí." />
            </template>
          </workspace-layout>
        </div>
      </v-card-text>

      <v-card-actions class="px-6 pb-4 pt-2 border-t-thin flex-shrink-0">
        <v-spacer />
        <v-btn variant="flat" class="font-weight-bold px-4" @click="close">Cancelar</v-btn>
        <v-btn variant="outlined" class="font-weight-bold px-4" prepend-icon="mdi-file-eye-outline"
               :loading="armandoVista" :disabled="!clienteId || !cantidadDeItems" @click="verVistaPrevia">
          Vista previa
        </v-btn>
        <v-btn color="primary" variant="flat" class="font-weight-bold px-4" prepend-icon="mdi-content-save"
               :loading="guardando" :disabled="!clienteId || !cantidadDeItems" @click="guardar">
          Guardar {{ definicion.nombre }}
        </v-btn>
      </v-card-actions>

      <!-- El PDF tal como saldria, sin guardar: desde aca se guarda o se vuelve a editar. -->
      <pdf-preview-dialog v-model="vistaPrevia" :url="urlDeVista">
        <template #encabezado>
          <v-icon class="mr-2">mdi-file-eye-outline</v-icon>
          <span class="text-subtitle-1 font-weight-bold text-truncate">Vista previa · {{ titulo }}</span>
        </template>
        <template #acciones>
          <v-btn variant="text" class="mr-2 font-weight-bold" prepend-icon="mdi-pencil" :disabled="guardando"
                 @click="vistaPrevia = false">
            Seguir editando
          </v-btn>
          <v-btn color="primary" variant="flat" class="font-weight-bold px-4" prepend-icon="mdi-content-save"
                 :loading="guardando" @click="guardar">
            Guardar {{ definicion.nombre }}
          </v-btn>
        </template>
      </pdf-preview-dialog>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import CompanyDataService from '@/services/company/companyDataService'
import DocumentsDataService from '@/services/documents/documentsDataService'
import DetailEmpty from '@/components/shared/DetailEmpty.vue'
import DetailPanel from '@/components/shared/DetailPanel.vue'
import PdfPreviewDialog from '@/components/shared/PdfPreviewDialog.vue'
import OptionRows from '@/components/shared/OptionRows.vue'
import WorkspaceLayout from '@/components/shared/WorkspaceLayout.vue'
import WorkspaceTabs from '@/components/shared/WorkspaceTabs.vue'
import { useLatestRequest } from '@/composables/useLatestRequest'
import { useLocalDraft } from '@/composables/useLocalDraft'
import { usePdfPreview } from '@/composables/usePdfPreview'
import { useRowDrag } from '@/composables/useRowDrag'
import { useRowErrors } from '@/composables/useRowErrors'
import { useSwal } from '@/composables/useSwal'
import { fechaCorta } from '@/utils/dates'
import { debounce } from '@/utils/debounce'
import { avisarHecho } from '@/utils/documents/avisos'
import {
  DOCUMENTOS, LIMITES, TIPOS_DE_COTIZACION, TIPO_POR_DEFECTO, UNIDADES, cotizacionDe, esGrupo, grupoVacio, itemVacio,
  quoteDefaultJSON,
} from '@/utils/documents/quoteDefaults'
import { COTIZACION } from '@/utils/documents/tipos'
import { mensajeDeError } from '@/utils/errors'
import { CAMPO } from '@/utils/fields'
import { MONEDAS, monto } from '@/utils/money'
import BillingClientPanel from '../shared/BillingClientPanel.vue'
import PanelQuoteOption from '../shared/PanelQuoteOption.vue'
import PanelServiceItem from '../shared/PanelServiceItem.vue'
import RowQuoteItem from '../shared/RowQuoteItem.vue'

// El mismo editor para la cotizacion y la valorizacion (DOCUMENTOS).
const props = defineProps({ tipoDeDocumento: { type: String, default: COTIZACION } })
const definicion = computed(() => DOCUMENTOS[props.tipoDeDocumento])

const swal = useSwal()

const dialog = ref(false)
const pestana = ref('info')
// Lo que se ve a la derecha: { fila } (item o grupo) o { clave } de una opcion; null, el resumen.
const abierto = ref(null)
// En franja, los datos se pliegan a una línea para dejar la altura a los ítems; al crear empiezan abiertos.
const datosAbiertos = ref(true)
const PESTANAS = [{ valor: 'info', texto: 'Información', icono: 'mdi-card-account-details-outline' },
                  { valor: 'opciones', texto: 'Opciones', icono: 'mdi-format-list-bulleted' }]
const guardando = ref(false)
const documentoId = ref(null)
const numero = ref('')
// El que tomaria al guardar; si otro guarda antes, sale el siguiente.
const numeroNuevo = ref('')
const clienteId = ref(null)
const cotizacion = ref(quoteDefaultJSON(TIPO_POR_DEFECTO, props.tipoDeDocumento))

const tipo = computed(() => TIPOS_DE_COTIZACION[cotizacion.value.meta.kind])
const SIN_CUENTA = { importes: [], subtotal: 0, igv: 0, total: 0 }
const cuenta = ref(SIN_CUENTA)
const { begin, isLatest } = useLatestRequest()
const recalcular = debounce(async () => {
  const turno = begin()
  try {
    const { data } = await DocumentsDataService.montos({ document_data: cotizacion.value })
    if (isLatest(turno)) cuenta.value = data
  } catch {
    if (isLatest(turno)) cuenta.value = SIN_CUENTA
  }
})
watch(() => [cotizacion.value.items, cotizacion.value.totals.igv_percent], recalcular, { deep: true })

// Los items se numeran de corrido, saltando los grupos, como en el PDF.
const numeros = computed(() => {
  let n = 0
  return cotizacion.value.items.map(fila => (esGrupo(fila) ? null : ++n))
})
const indiceAbierto = computed(() => cotizacion.value.items.indexOf(abierto.value?.fila))
const { asa, arrastrable, claseDe, clave, mover } = useRowDrag(computed(() => cotizacion.value.items))

const opciones = computed(() => {
  const c = cotizacion.value
  return [
    { clave: 'intro', titulo: 'Texto de entrada', icono: 'mdi-text-short', valor: c.intro_text?.trim() ? 'Sí' : '' },
    { clave: 'observaciones', titulo: 'Observaciones', icono: 'mdi-comment-text-outline',
      valor: c.observations.length ? String(c.observations.length) : '' },
    { clave: 'pago', titulo: 'Indicación de pago', icono: 'mdi-cash', valor: c.payment_note?.trim() ? 'Sí' : '' },
    { clave: 'terminos', titulo: 'Términos y condiciones', icono: 'mdi-script-text-outline',
      valor: c.terms.length ? String(c.terms.length) : '' },
  ]
})

// Las acreditaciones que se pueden declarar hoy; sin ninguna, el panel del item no las ofrece.
const acreditaciones = ref([])
CompanyDataService.acreditaciones().then(({ data }) => { acreditaciones.value = data }).catch(() => {})

function abrir (claveDeOpcion, fila = null) {
  abierto.value = fila ? { fila } : { clave: claveDeOpcion }
}
// Al abrir, el primer item queda a la derecha listo para llenar; sin items, uno nuevo.
function abrirElPrimero () {
  const primero = cotizacion.value.items.find(fila => !esGrupo(fila))
  if (primero) abrir(null, primero)
  else agregar(itemVacio(tipo.value.unidad))
}
function agregar (fila) {
  cotizacion.value.items.push(fila)
  abrir(null, fila)
}
function borrar (indice) {
  if (cotizacion.value.items[indice] === abierto.value?.fila) abierto.value = null
  cotizacion.value.items.splice(indice, 1)
}
// Los grupos son titulos: se cuentan solo los items.
const cantidadDeItems = computed(() => cotizacion.value.items.filter(fila => !esGrupo(fila)).length)
const { errores, marcarErrores } = useRowErrors(computed(() => cotizacion.value.items))

const resumen = computed(() => {
  const { meta, billing_client: cliente } = cotizacion.value
  const moneda = MONEDAS.find(m => m.value === meta.currency)?.title
  return [cliente.business_name, fechaCorta(meta.date), moneda, meta.payment_terms].filter(Boolean).join(' · ')
})

const titulo = computed(() => (numero.value
  ? `Editar ${numero.value}`
  : `Nueva ${definicion.value.nombre} de ${tipo.value.texto.toLowerCase()}`))

// Lo que se va escribiendo queda en el navegador hasta guardar o cancelar: si
// se cierra la pestaña, se ofrece al volver a abrir el mismo documento.
const borrador = useLocalDraft(
  () => `daicom_borrador_${props.tipoDeDocumento}_${documentoId.value || `nueva_${cotizacion.value.meta.kind}`}`,
  {
    resumen: (guardado) => {
      const items = (guardado.cotizacion?.items || []).filter(fila => !esGrupo(fila) && fila.description?.trim()).length
      const nombre = definicion.value.nombre
      return items ? `Hay una ${nombre} sin guardar con ${items} ítem(s) de una sesión anterior.` : ''
    },
  },
)
watch([cotizacion, clienteId], () => borrador.guardar({ cotizacion: cotizacion.value, clienteId: clienteId.value }),
  { deep: true })

// Una existente o una nueva del tipo elegido: el tipo no se cambia despues. `desdeOrdenes`, lo que
// sale de las ordenes elegidas (cliente e items), para una nueva ya llena.
async function open (documento = null, kind = TIPO_POR_DEFECTO, desdeOrdenes = null) {
  documentoId.value = documento?.id || null
  numero.value = documento?.document_number || ''
  numeroNuevo.value = ''
  if (!documento) {
    DocumentsDataService.siguienteNumero(props.tipoDeDocumento)
      .then(({ data }) => { numeroNuevo.value = data.numero })
      .catch(() => {})
  }
  clienteId.value = documento?.client || desdeOrdenes?.client || null
  const nueva = quoteDefaultJSON(kind, props.tipoDeDocumento)
  if (desdeOrdenes) {
    Object.assign(nueva, {
      billing_client: { ...nueva.billing_client, ...desdeOrdenes.billing_client },
      items: desdeOrdenes.items.map(item => ({ ...itemVacio(TIPOS_DE_COTIZACION[kind].unidad), ...item })),
    })
  }
  cotizacion.value = cotizacionDe(documento ? documento.document_data : nueva, props.tipoDeDocumento)
  pestana.value = 'info'
  cuenta.value = SIN_CUENTA
  datosAbiertos.value = !documento
  abrirElPrimero()
  dialog.value = true

  if (desdeOrdenes) return
  const recuperado = await borrador.ofrecer()
  if (recuperado) {
    cotizacion.value = cotizacionDe(recuperado.cotizacion, props.tipoDeDocumento)
    clienteId.value = recuperado.clienteId
    abrirElPrimero()
  }
}

const close = () => {
  borrador.descartar()
  dialog.value = false
}

const payload = () => ({
  document_type: props.tipoDeDocumento,
  schema_version: cotizacion.value.meta.schema_version,
  document_data: cotizacion.value,
  client: clienteId.value,
})

// El back revisa todo: lo que rechace vuelve marcado en su fila, se haya
// pedido al guardar o en la vista previa.
function mostrarRechazo (error, encabezado, porDefecto) {
  const filas = error.response?.data?.filas
  if (filas) {
    marcarErrores(filas)
    vistaPrevia.value = false
  }
  swal.fire({ icon: 'error', title: encabezado, text: mensajeDeError(error, porDefecto) })
}

async function guardar () {
  guardando.value = true
  try {
    const { data } = documentoId.value
      ? await DocumentsDataService.update(documentoId.value, payload())
      : await DocumentsDataService.create(payload())
    avisarHecho(`${data.document_number} ${documentoId.value ? 'actualizada' : 'creada'}`, data)
    vistaPrevia.value = false
    close()
  } catch (error) {
    const nombre = definicion.value.nombre
    mostrarRechazo(error, `No se guardó la ${nombre}`, `No se pudo guardar la ${nombre}.`)
  } finally {
    guardando.value = false
  }
}

const { abierta: vistaPrevia, url: urlDeVista, armando: armandoVista, ver: verVistaPrevia } = usePdfPreview(
  () => DocumentsDataService.vistaPrevia(payload()),
  error => mostrarRechazo(error, 'No se pudo armar la vista previa', 'No se pudo armar la vista previa.'))

defineExpose({ open })
</script>

<style scoped>
/* Como sale en el PDF; lo guardado queda como se escribio. */
.titulo-de-grupo :deep(input) { text-transform: uppercase; }
</style>
