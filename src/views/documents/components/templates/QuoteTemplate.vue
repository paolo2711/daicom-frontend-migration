<template>
  <v-dialog v-model="dialog" class="dialog-premium" width="1100" height="min(95vh, 900px)" persistent>
    <v-card style="display: flex; flex-direction: column;">
      <base-modal-header :title="titulo" :icon="tipo.icono" @close="close">
        <span>
          <template v-if="!numero && numeroNuevo">
            Correlativo: <span class="font-weight-bold text-primary ml-1">{{ numeroNuevo }}</span> ·
          </template>
          {{ tipo.texto }} · Total: <span class="font-weight-bold text-primary ml-1">{{ monto(totales.total, cotizacion.meta.currency) }}</span>
        </span>
      </base-modal-header>

      <v-tabs :model-value="tab" bg-color="transparent" color="primary" class="border-b-thin mx-4 mt-2 flex-shrink-0"
              @update:model-value="irA">
        <v-tab value="datos" prepend-icon="mdi-domain">Cliente y condiciones</v-tab>
        <v-tab value="servicios" prepend-icon="mdi-format-list-bulleted">
          {{ tipo.etiquetaItems }}
          <span v-if="armando" class="circulo-de-carga ml-2" />
          <v-chip v-else size="x-small" variant="tonal" class="ml-2" :color="hayErrores ? 'error' : undefined">{{ cantidadDeItems }}</v-chip>
        </v-tab>
        <v-tab value="terminos" prepend-icon="mdi-script-text-outline">Términos</v-tab>
      </v-tabs>

      <v-card-text class="pt-4" style="overflow-y: auto; flex-grow: 1; min-height: 0;">
        <div class="pestana" :class="{ 'pestana--oculta': tab !== 'datos' }">
          <billing-client-panel v-model:meta="cotizacion.meta" v-model:billing="cotizacion.billing_client"
                                v-model:certificate="cotizacion.certificate_data" v-model:clientId="clienteId" />
        </div>
        <div class="pestana" :class="{ 'pestana--oculta': tab !== 'servicios' }">
          <services-table v-if="tablaArmada" v-model:items="cotizacion.items" :totales="totales" :moneda="cotizacion.meta.currency"
                          :igv="cotizacion.totals.igv_percent" :errores="errores" :tipo="tipo" />
        </div>
        <div class="pestana" :class="{ 'pestana--oculta': tab !== 'terminos' }">
          <commercial-terms-panel v-model:quote="cotizacion" />
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
          Guardar cotización
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
            Guardar cotización
          </v-btn>
        </template>
      </pdf-preview-dialog>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import DocumentsDataService from '@/services/documents/documentsDataService'
import PdfPreviewDialog from '@/components/shared/PdfPreviewDialog.vue'
import { useLocalDraft } from '@/composables/useLocalDraft'
import { useRowErrors } from '@/composables/useRowErrors'
import { useSwal } from '@/composables/useSwal'
import { avisarHecho } from '@/utils/documents/avisos'
import { COTIZACION } from '@/utils/documents/estado'
import { TIPOS_DE_COTIZACION, TIPO_POR_DEFECTO, cotizacionDe, esGrupo, quoteDefaultJSON, totalesDe } from '@/utils/documents/quoteDefaults'
import { mensajeDeError } from '@/utils/errors'
import { monto } from '@/utils/money'
import BillingClientPanel from '../shared/BillingClientPanel.vue'
import ServicesTable from '../shared/ServicesTable.vue'
import CommercialTermsPanel from '../shared/CommercialTermsPanel.vue'

const swal = useSwal()

const dialog = ref(false)
const tab = ref('datos')
const guardando = ref(false)
const documentoId = ref(null)
const numero = ref('')
// El que tomaria al guardar; si otro guarda antes, sale el siguiente.
const numeroNuevo = ref('')
const clienteId = ref(null)
const cotizacion = ref(quoteDefaultJSON())

const tipo = computed(() => TIPOS_DE_COTIZACION[cotizacion.value.meta.kind])
const totales = computed(() => totalesDe(cotizacion.value))
// Los grupos son titulos: se cuentan solo los items.
const cantidadDeItems = computed(() => cotizacion.value.items.filter(fila => !esGrupo(fila)).length)
const { errores, marcarErrores } = useRowErrors(computed(() => cotizacion.value.items))
const hayErrores = computed(() => Object.keys(errores.value).length > 0)

const titulo = computed(() => (numero.value ? `Editar ${numero.value}` : `Nueva cotización de ${tipo.value.texto.toLowerCase()}`))

// Los items se arman en la pestaña oculta y recien ahi se cambia: con muchas
// filas no se ve ni se usa a medio armar.
const tablaArmada = ref(false)
const armando = ref(false)
const trasPintar = () => new Promise(listo => requestAnimationFrame(() => setTimeout(listo)))
async function irA (pestana) {
  if (armando.value) return
  if (pestana === 'servicios' && !tablaArmada.value) {
    armando.value = true
    await trasPintar()
    tablaArmada.value = true
    await trasPintar()
    armando.value = false
  }
  tab.value = pestana
}

// Lo que se va escribiendo queda en el navegador hasta guardar o cancelar: si
// se cierra la pestaña, se ofrece al volver a abrir la misma cotizacion.
const borrador = useLocalDraft(
  () => `daicom_borrador_cotizacion_${documentoId.value || `nueva_${cotizacion.value.meta.kind}`}`,
  {
    resumen: (guardado) => {
      const items = (guardado.cotizacion?.items || []).filter(fila => !esGrupo(fila)).length
      return items ? `Hay una cotización sin guardar con ${items} ítem(s) de una sesión anterior.` : ''
    },
  },
)
watch([cotizacion, clienteId], () => borrador.guardar({ cotizacion: cotizacion.value, clienteId: clienteId.value }),
  { deep: true })

// Una existente o una nueva del tipo elegido: el tipo no se cambia despues.
async function open (documento = null, kind = TIPO_POR_DEFECTO) {
  documentoId.value = documento?.id || null
  numero.value = documento?.document_number || ''
  numeroNuevo.value = ''
  if (!documento) {
    DocumentsDataService.siguienteNumero(COTIZACION)
      .then(({ data }) => { numeroNuevo.value = data.numero })
      .catch(() => {})
  }
  clienteId.value = documento?.client || null
  cotizacion.value = documento ? cotizacionDe(documento.document_data) : quoteDefaultJSON(kind)
  tab.value = 'datos'
  tablaArmada.value = false
  dialog.value = true

  const recuperado = await borrador.ofrecer()
  if (recuperado) {
    cotizacion.value = cotizacionDe(recuperado.cotizacion)
    clienteId.value = recuperado.clienteId
  }
}

const close = () => {
  borrador.descartar()
  dialog.value = false
}

const payload = () => ({
  document_type: COTIZACION,
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
    irA('servicios')
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
    mostrarRechazo(error, 'No se guardó la cotización', 'No se pudo guardar la cotización.')
  } finally {
    guardando.value = false
  }
}

// ── Vista previa: el PDF que armaria el back, sin guardar nada ──
const vistaPrevia = ref(false)
const urlDeVista = ref('')
const armandoVista = ref(false)

const soltarVista = () => {
  if (urlDeVista.value) URL.revokeObjectURL(urlDeVista.value)
  urlDeVista.value = ''
}
watch(vistaPrevia, (abierta) => { if (!abierta) soltarVista() })

async function verVistaPrevia () {
  armandoVista.value = true
  try {
    const pdf = await DocumentsDataService.vistaPrevia(payload())
    soltarVista()
    urlDeVista.value = URL.createObjectURL(pdf)
    vistaPrevia.value = true
  } catch (error) {
    mostrarRechazo(error, 'No se pudo armar la vista previa', 'No se pudo armar la vista previa.')
  } finally {
    armandoVista.value = false
  }
}

defineExpose({ open })
</script>

<style scoped>
/* La oculta sigue armada y medida: mostrarla no recalcula sus filas. */
.pestana--oculta { visibility: hidden; height: 0; overflow: hidden; }
/* La opacidad la anima el navegador aparte, sin redibujar las filas. */
.pestana:not(.pestana--oculta) { animation: aparecer 0.15s ease-out; }
@keyframes aparecer { from { opacity: 0; } }
</style>
