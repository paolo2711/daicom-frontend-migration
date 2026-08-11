<template>
  <v-dialog v-model="dialog" class="dialog-premium" width="1000" persistent>
    <v-card style="max-height: 95vh; display: flex; flex-direction: column;">

      <base-modal-header :title="docId ? 'Editar Guía de Ingreso (FORD-042)' : 'Nueva Guía de Ingreso (FORD-042)'" icon="mdi-toolbox-outline" @close="close">
        <span>Borrador <span class="font-weight-bold text-primary ml-1">{{ docId ? 'Edición' : 'Nueva' }}</span></span>
      </base-modal-header>

      <v-card-text class="pt-4 pb-0" style="overflow-y: auto; flex-grow: 1; min-height: 0; display: block;">
        <v-form ref="formFormato" @submit.prevent>
          <ReceptionClientPanel :formato="formato" :cliente="formato.client_data" v-model:clientId="linkedClientId" />

          <PhysicalInstrumentsTable :instruments="formato.instruments" />

          <v-card variant="flat" class="border rounded-lg pa-4 mt-4 bg-surface">
            <div class="text-subtitle-1 font-weight-bold text-primary mb-3">
              <v-icon size="small" class="mr-1">mdi-note-text-outline</v-icon> Observaciones
            </div>
            
            <div v-for="(obs, index) in formato.observations" :key="'obs'+index" class="d-flex align-center mb-2">
              <v-text-field
                v-model="formato.observations[index]"
                density="compact"
                variant="outlined"
                hide-details="auto"
                placeholder="Ej: El instrumento ingresa sin cable de poder..."
              />
              <v-btn icon variant="text" size="small" color="error" class="ml-1" @click="formato.observations.splice(index, 1)">
                <v-icon size="small">mdi-close</v-icon>
              </v-btn>
            </div>
            
            <v-btn variant="text" color="primary" size="small" class="mt-1" prepend-icon="mdi-plus" @click="formato.observations.push('')">
              Añadir Observación
            </v-btn>
          </v-card>

          <v-card variant="flat" class="border rounded-lg pa-4 mt-4 bg-surface">
            <div class="text-subtitle-1 font-weight-bold text-primary mb-3">
              <v-icon size="small" class="mr-1">mdi-gavel</v-icon> Notas Legales (pie de página)
            </div>

            <div v-for="(nota, index) in formato.legal_notes" :key="'legal'+index" class="d-flex align-center mb-2">
              <v-text-field
                v-model="formato.legal_notes[index]"
                density="compact"
                variant="outlined"
                hide-details="auto"
                placeholder="Ej: El presente documento no debe de ser reproducido..."
              />
              <v-btn icon variant="text" size="small" color="error" class="ml-1" @click="formato.legal_notes.splice(index, 1)">
                <v-icon size="small">mdi-close</v-icon>
              </v-btn>
            </div>

            <v-btn variant="text" color="primary" size="small" class="mt-1" prepend-icon="mdi-plus" @click="formato.legal_notes.push('')">
              Añadir Nota Legal
            </v-btn>
          </v-card>
        </v-form>
      </v-card-text>

      <v-card-actions class="px-6 pb-4 pt-3 border-top bg-surface" style="flex-shrink: 0;">
        <v-spacer />
        <v-btn variant="flat" class="font-weight-bold mr-3 px-4" @click="close">Cancelar</v-btn>
        <v-btn color="primary" variant="flat" prepend-icon="mdi-content-save" @click="guardarFormato" :loading="is_loading">
          Guardar Guía
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { Toast } from '@/plugins/alerts'
import { ref, reactive, inject } from 'vue'
import ReceptionClientPanel from '../shared/ReceptionClientPanel.vue'
import PhysicalInstrumentsTable from '../shared/PhysicalInstrumentsTable.vue'
import { formatoIngresoDefaultJSON, emptyInstrumentRow } from '@/utils/documents/formatoIngresoDefaults'
import DocumentsDataService from '@/services/documents/documentsDataService'

const swal = inject('$swal')
const emit = defineEmits(['reload'])

const dialog = ref(false)
const formFormato = ref(null)
const is_loading = ref(false)

const docId = ref(null) 
const linkedClientId = ref(null)

const formato = reactive(formatoIngresoDefaultJSON())

const open = (docExistente = null) => {
  dialog.value = true
  if (docExistente) {
    docId.value = docExistente.id
    Object.assign(formato, JSON.parse(JSON.stringify(docExistente.document_data)))
    linkedClientId.value = docExistente.client || null
  } else {
    docId.value = null
    Object.assign(formato, formatoIngresoDefaultJSON())
    linkedClientId.value = null
  }
}
defineExpose({ open })

const close = () => {
  dialog.value = false
}

const guardarFormato = async () => {
  // Validación básica antes de enviar
  if (!formato.client_data.full_name && !formato.client_data.business_name) {
    swal.fire('Faltan Datos', 'Debe ingresar al menos el nombre del cliente o la empresa.', 'warning')
    return
  }

  if (formato.instruments.length === 0) {
    swal.fire('Sin Instrumentos', 'Debe agregar al menos un instrumento a la guía.', 'warning')
    return
  }

  for (let i = 0; i < formato.instruments.length; i++) {
    if (!formato.instruments[i].description || formato.instruments[i].description.trim() === '') {
      swal.fire('Falta Descripción', `El instrumento ${i + 1} no tiene descripción. Por favor complétela.`, 'warning')
      return
    }
  }

  is_loading.value = true

  const payload = {
    document_type: 'FOI',
    total_amount: 0,
    currency: 'PEN',
    schema_version: formato.schema_version,
    document_data: formato,
    client: linkedClientId.value
  }

  try {
    let response
    if (docId.value) {
      response = await DocumentsDataService.update(docId.value, payload)
    } else {
      response = await DocumentsDataService.create(payload)
    }

    if (response.status === 201 || response.status === 200 || response.status === 204) {
      const msgSuccess = docId.value ? 'Guía Actualizada' : 'Guía Creada'
      const detailSuccess = docId.value
        ? 'Los cambios se guardaron y el PDF fue regenerado exitosamente.'
        : `El documento ${response.data.document_number} se generó exitosamente.`

      Toast.fire({ timer: 2500, icon: 'success', title: msgSuccess, text: detailSuccess })

      if (window.notificarActualizacionFila) {
        window.notificarActualizacionFila(null, null, docId.value || response.data.id)
      }

      emit('reload')
      close()
    }
  } catch (error) {
    console.error("Error al guardar:", error)
    swal.fire('Error', 'Hubo un problema al generar la guía o el PDF.', 'error')
  } finally {
    is_loading.value = false
  }
}
</script>