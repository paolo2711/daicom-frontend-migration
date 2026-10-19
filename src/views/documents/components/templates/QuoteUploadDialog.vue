<template>
  <v-dialog v-model="dialog" class="dialog-premium" width="640" persistent>
    <v-card style="max-height: 95vh; display: flex; flex-direction: column;">
      <!-- PdfDropZone va dentro del card para no romper el selector premium `.v-overlay__content > .v-card`. -->
      <pdf-drop-zone label="Suelta el PDF de la cotización" @file="f => (pdf = f)" @invalid="avisarSoloPdf"
                     style="display: flex; flex-direction: column; flex: 1 1 auto; min-height: 0;">
        <base-modal-header title="Subir cotización en PDF" icon="mdi-file-upload-outline" @close="close">
          <span v-if="numero">Se registrará como <span class="font-weight-bold text-primary ml-1">{{ numero }}</span></span>
        </base-modal-header>

        <v-card-text class="pt-4" style="overflow-y: auto; flex-grow: 1; min-height: 0;">
          <v-alert type="info" variant="tonal" density="compact" class="mb-4">
            Para una cotización hecha fuera del sistema. Queda de solo lectura: no se podrá editar.
          </v-alert>

          <client-lookup-bar v-model="clienteId" class="mb-4" />

          <v-row dense>
            <v-col cols="12" sm="6">
              <v-text-field v-model="fecha" label="Fecha" type="date" :max="hoyISO()"
                            density="compact" variant="outlined" hide-details />
            </v-col>
            <v-col cols="12" sm="6">
              <v-select v-model="tipo" :items="OPCIONES_DE_TIPO" label="Tipo"
                        density="compact" variant="outlined" hide-details />
            </v-col>
            <v-col cols="12" sm="6">
              <v-select v-model="moneda" :items="MONEDAS" label="Moneda"
                        density="compact" variant="outlined" hide-details />
            </v-col>
            <v-col cols="12" sm="6">
              <v-text-field v-model="total" label="Total (inc. IGV)" type="number" min="0" step="0.01"
                            :prefix="simboloDe(moneda)" density="compact" variant="outlined" hide-details />
            </v-col>
            <v-col cols="12">
              <v-file-input v-model="pdf" label="PDF de la cotización" accept="application/pdf"
                            prepend-icon="" prepend-inner-icon="mdi-file-pdf-box" show-size clearable
                            density="compact" variant="outlined" hide-details />
            </v-col>
          </v-row>
        </v-card-text>

        <v-card-actions class="px-6 pb-4 pt-2 border-t-thin flex-shrink-0">
          <v-spacer />
          <v-btn variant="flat" class="font-weight-bold px-4" @click="close">Cancelar</v-btn>
          <v-btn color="primary" variant="flat" class="font-weight-bold px-4" prepend-icon="mdi-upload"
                 :loading="subiendo" :disabled="!completo" @click="subir">
            Subir cotización
          </v-btn>
        </v-card-actions>
      </pdf-drop-zone>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { computed, ref } from 'vue'
import DocumentsDataService from '@/services/documents/documentsDataService'
import ClientLookupBar from '@/components/shared/ClientLookupBar.vue'
import PdfDropZone from '@/components/commonComponents/PdfDropZone.vue'
import { useSwal } from '@/composables/useSwal'
import { avisarHecho } from '@/utils/documents/avisos'
import { COTIZACION } from '@/utils/documents/estado'
import { OPCIONES_DE_TIPO, TIPO_POR_DEFECTO } from '@/utils/documents/quoteDefaults'
import { hoyISO } from '@/utils/dates'
import { mensajeDeError } from '@/utils/errors'
import { MONEDAS, simboloDe } from '@/utils/money'
import { avisarSoloPdf } from '@/utils/pdf'

const swal = useSwal()

const dialog = ref(false)
const subiendo = ref(false)
// El que tomara al subir; si otra se guarda antes, sale el siguiente.
const numero = ref('')
const clienteId = ref(null)
const fecha = ref('')
const tipo = ref(TIPO_POR_DEFECTO)
const moneda = ref('PEN')
const total = ref('')
const pdf = ref(null)

const completo = computed(() => clienteId.value && fecha.value && Number(total.value) > 0 && pdf.value)

function open () {
  numero.value = ''
  DocumentsDataService.siguienteNumero(COTIZACION)
    .then(({ data }) => { numero.value = data.numero })
    .catch(() => {})
  clienteId.value = null
  fecha.value = hoyISO()
  tipo.value = TIPO_POR_DEFECTO
  moneda.value = 'PEN'
  total.value = ''
  pdf.value = null
  dialog.value = true
}

const close = () => { dialog.value = false }

async function subir () {
  const formulario = new FormData()
  formulario.append('client', clienteId.value)
  formulario.append('date', fecha.value)
  formulario.append('kind', tipo.value)
  formulario.append('currency', moneda.value)
  formulario.append('total', total.value)
  formulario.append('pdf', pdf.value)
  subiendo.value = true
  try {
    const { data } = await DocumentsDataService.subirCotizacion(formulario)
    avisarHecho(`${data.document_number} subida`, data)
    close()
  } catch (error) {
    swal.fire({ icon: 'error', title: 'No se subió la cotización', text: mensajeDeError(error, 'No se pudo subir la cotización.') })
  } finally {
    subiendo.value = false
  }
}

defineExpose({ open })
</script>
