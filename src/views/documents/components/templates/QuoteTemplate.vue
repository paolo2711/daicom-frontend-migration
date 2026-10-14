<template>
  <v-dialog v-model="dialog" class="dialog-premium" width="1100" persistent>
    <v-card style="max-height: 95vh; display: flex; flex-direction: column;">
      <base-modal-header :title="numero ? `Editar ${numero}` : `Nueva cotización de ${tipo.texto.toLowerCase()}`"
                         :icon="tipo.icono" @close="close">
        <span>
          <template v-if="!numero && numeroNuevo">
            Correlativo: <span class="font-weight-bold text-primary ml-1">{{ numeroNuevo }}</span> ·
          </template>
          {{ tipo.texto }} · Total: <span class="font-weight-bold text-primary ml-1">{{ monto(totales.total, cotizacion.meta.currency) }}</span>
        </span>
      </base-modal-header>

      <v-tabs v-model="tab" bg-color="transparent" color="primary" class="border-b-thin mx-4 mt-2 flex-shrink-0">
        <v-tab value="datos" prepend-icon="mdi-domain">Cliente y condiciones</v-tab>
        <v-tab value="servicios" prepend-icon="mdi-format-list-bulleted">
          {{ tipo.etiquetaItems }}
          <v-chip size="x-small" variant="tonal" class="ml-2" :color="hayErrores ? 'error' : undefined">{{ cotizacion.items.length }}</v-chip>
        </v-tab>
        <v-tab value="terminos" prepend-icon="mdi-script-text-outline">Términos</v-tab>
      </v-tabs>

      <v-card-text class="pt-4" style="overflow-y: auto; flex-grow: 1; min-height: 0;">
        <v-window v-model="tab">
          <v-window-item value="datos">
            <billing-client-panel v-model:meta="cotizacion.meta" v-model:billing="cotizacion.billing_client"
                                  v-model:certificate="cotizacion.certificate_data" v-model:clientId="clienteId" />
          </v-window-item>
          <v-window-item value="servicios">
            <services-table v-model:items="cotizacion.items" :totales="totales" :moneda="cotizacion.meta.currency"
                            :igv="cotizacion.totals.igv_percent" :errores="errores" :tipo="tipo" />
          </v-window-item>
          <v-window-item value="terminos">
            <commercial-terms-panel v-model:quote="cotizacion" />
          </v-window-item>
        </v-window>
      </v-card-text>

      <v-card-actions class="px-6 pb-4 pt-2 border-t-thin flex-shrink-0">
        <v-spacer />
        <v-btn variant="flat" class="font-weight-bold px-4" @click="close">Cancelar</v-btn>
        <v-btn color="primary" variant="flat" class="font-weight-bold px-4" prepend-icon="mdi-content-save"
               :loading="guardando" :disabled="!clienteId || !cotizacion.items.length" @click="guardar">
          Guardar cotización
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { computed, ref } from 'vue'
import DocumentsDataService from '@/services/documents/documentsDataService'
import { useRowErrors } from '@/composables/useRowErrors'
import { useSwal } from '@/composables/useSwal'
import { avisarHecho } from '@/utils/documents/avisos'
import { COTIZACION } from '@/utils/documents/estado'
import { TIPOS_DE_COTIZACION, TIPO_POR_DEFECTO, cotizacionDe, quoteDefaultJSON, totalesDe } from '@/utils/documents/quoteDefaults'
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
const { errores, marcarErrores } = useRowErrors(computed(() => cotizacion.value.items))
const hayErrores = computed(() => Object.keys(errores.value).length > 0)

// Una existente o una nueva del tipo elegido: el tipo no se cambia despues.
function open (documento = null, kind = TIPO_POR_DEFECTO) {
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
  dialog.value = true
}

const close = () => { dialog.value = false }

// El back revisa todo y calcula los totales: lo que rechace vuelve marcado.
async function guardar () {
  guardando.value = true
  const payload = {
    document_type: COTIZACION,
    schema_version: cotizacion.value.meta.schema_version,
    document_data: cotizacion.value,
    client: clienteId.value,
  }
  try {
    const { data } = documentoId.value
      ? await DocumentsDataService.update(documentoId.value, payload)
      : await DocumentsDataService.create(payload)
    avisarHecho(`${data.document_number} ${documentoId.value ? 'actualizada' : 'creada'}`, data)
    close()
  } catch (error) {
    const filas = error.response?.data?.filas
    if (filas) {
      marcarErrores(filas)
      tab.value = 'servicios'
    }
    swal.fire({ icon: 'error', title: 'No se guardó la cotización', text: mensajeDeError(error, 'No se pudo guardar la cotización.') })
  } finally {
    guardando.value = false
  }
}

defineExpose({ open })
</script>
