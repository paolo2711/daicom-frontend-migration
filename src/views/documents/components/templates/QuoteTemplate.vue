<template>
  <v-dialog v-model="dialog" class="dialog-premium" fullscreen persistent>
    <v-card class="d-flex flex-column" style="height: 100%;">
      <base-modal-header :title="titulo" :icon="tipo.icono" @close="close">
        <span>
          <template v-if="!numero && numeroNuevo">
            Correlativo: <span class="font-weight-bold text-primary ml-1">{{ numeroNuevo }}</span> ·
          </template>
          {{ tipo.texto }} · Total: <span class="font-weight-bold text-primary ml-1">{{ monto(totales.total, cotizacion.meta.currency) }}</span>
        </span>
      </base-modal-header>

      <v-card-text class="pt-4 d-flex flex-column pantalla-de-trabajo"
                   style="flex-grow: 1; min-height: 0; overflow-y: hidden;">
        <div class="d-flex flex-column flex-grow-1 columna-de-trabajo" style="min-height: 0;">
          <workspace-layout :detalle-abierto="lgAndUp || terminosAbiertos" @cerrar="terminosAbiertos = false">
            <template #apoyo="{ apilado }">
              <div v-if="!apilado" class="titulo-de-hoja cursor-pointer" @click="datosAbiertos = !datosAbiertos">
                <span class="mr-auto text-truncate">
                  Cliente y condiciones
                  <span v-if="!datosAbiertos" class="text-medium-emphasis font-weight-regular ml-2">{{ resumen }}</span>
                </span>
                <v-icon>{{ datosAbiertos ? 'mdi-chevron-up' : 'mdi-chevron-down' }}</v-icon>
              </div>
              <v-expand-transition>
                <billing-client-panel v-show="apilado || datosAbiertos" :tipo-de-documento="tipoDeDocumento"
                                      v-model:meta="cotizacion.meta"
                                      v-model:billing="cotizacion.billing_client"
                                      v-model:certificate="cotizacion.certificate_data" v-model:clientId="clienteId"
                                      :apilado="apilado" class="pa-4" :class="{ 'pt-0': !apilado }" />
              </v-expand-transition>
            </template>
            <template #lista>
              <div class="flex-grow-1 overflow-y-auto px-4 pt-4 lista-de-items" style="min-height: 0;">
                <services-table v-model:items="cotizacion.items" :totales="totales"
                                :moneda="cotizacion.meta.currency" :igv="cotizacion.totals.igv_percent"
                                :errores="errores" :tipo="tipo" />
              </div>
            </template>
            <template #detalle>
              <div class="titulo-de-hoja">
                <span class="mr-auto">Términos y observaciones</span>
                <v-btn v-if="!lgAndUp" icon="mdi-close" variant="text" size="small" title="Cerrar"
                       @click="terminosAbiertos = false" />
              </div>
              <div class="flex-grow-1 overflow-y-auto px-4 pb-4" style="min-height: 0;">
                <commercial-terms-panel v-model:quote="cotizacion" />
              </div>
            </template>
          </workspace-layout>
        </div>
      </v-card-text>

      <v-card-actions class="px-6 pb-4 pt-2 border-t-thin flex-shrink-0">
        <v-btn v-if="!lgAndUp" variant="outlined" class="font-weight-bold px-4" prepend-icon="mdi-script-text-outline"
               @click="terminosAbiertos = true">
          Términos
        </v-btn>
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
import { useDisplay } from 'vuetify'
import DocumentsDataService from '@/services/documents/documentsDataService'
import PdfPreviewDialog from '@/components/shared/PdfPreviewDialog.vue'
import WorkspaceLayout from '@/components/shared/WorkspaceLayout.vue'
import { useLocalDraft } from '@/composables/useLocalDraft'
import { usePdfPreview } from '@/composables/usePdfPreview'
import { useRowErrors } from '@/composables/useRowErrors'
import { useSwal } from '@/composables/useSwal'
import { fechaCorta } from '@/utils/dates'
import { avisarHecho } from '@/utils/documents/avisos'
import {
  DOCUMENTOS, TIPOS_DE_COTIZACION, TIPO_POR_DEFECTO, cotizacionDe, esGrupo, quoteDefaultJSON, totalesDe,
} from '@/utils/documents/quoteDefaults'
import { COTIZACION } from '@/utils/documents/tipos'
import { mensajeDeError } from '@/utils/errors'
import { MONEDAS, monto } from '@/utils/money'
import BillingClientPanel from '../shared/BillingClientPanel.vue'
import ServicesTable from '../shared/ServicesTable.vue'
import CommercialTermsPanel from '../shared/CommercialTermsPanel.vue'

// El mismo editor para la cotizacion y la valorizacion (DOCUMENTOS).
const props = defineProps({ tipoDeDocumento: { type: String, default: COTIZACION } })
const definicion = computed(() => DOCUMENTOS[props.tipoDeDocumento])

const swal = useSwal()

const { lgAndUp } = useDisplay()

const dialog = ref(false)
// En pantallas angostas los términos van encima de la lista y se abren con su botón.
const terminosAbiertos = ref(false)
// En franja, los datos se pliegan a una línea para dejar la altura a los ítems; al crear empiezan abiertos.
const datosAbiertos = ref(true)
const guardando = ref(false)
const documentoId = ref(null)
const numero = ref('')
// El que tomaria al guardar; si otro guarda antes, sale el siguiente.
const numeroNuevo = ref('')
const clienteId = ref(null)
const cotizacion = ref(quoteDefaultJSON(TIPO_POR_DEFECTO, props.tipoDeDocumento))

const tipo = computed(() => TIPOS_DE_COTIZACION[cotizacion.value.meta.kind])
const totales = computed(() => totalesDe(cotizacion.value))
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

// Una existente o una nueva del tipo elegido: el tipo no se cambia despues.
async function open (documento = null, kind = TIPO_POR_DEFECTO) {
  documentoId.value = documento?.id || null
  numero.value = documento?.document_number || ''
  numeroNuevo.value = ''
  if (!documento) {
    DocumentsDataService.siguienteNumero(props.tipoDeDocumento)
      .then(({ data }) => { numeroNuevo.value = data.numero })
      .catch(() => {})
  }
  clienteId.value = documento?.client || null
  cotizacion.value = documento
    ? cotizacionDe(documento.document_data, props.tipoDeDocumento)
    : quoteDefaultJSON(kind, props.tipoDeDocumento)
  terminosAbiertos.value = false
  datosAbiertos.value = !documento
  dialog.value = true

  const recuperado = await borrador.ofrecer()
  if (recuperado) {
    cotizacion.value = cotizacionDe(recuperado.cotizacion, props.tipoDeDocumento)
    clienteId.value = recuperado.clienteId
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
/* El encabezado fijo de la tabla toma el fondo de la hoja. */
.lista-de-items { --fondo-del-dialogo: rgb(var(--v-theme-hoja)); }
</style>
