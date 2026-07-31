<template>
  <v-dialog v-model="dialog" class="dialog-premium" width="1100" persistent>
    <v-card style="max-height: 95vh; display: flex; flex-direction: column;">
      
      <base-modal-header :title="docId ? 'Editar Cotización (FORD-022)' : 'Generar Cotización (FORD-022)'" icon="mdi-file-document-outline" @close="close">
        <span>Borrador <span class="font-weight-bold text-primary ml-1">{{ docId ? 'Edición' : 'Nueva' }}</span></span>
      </base-modal-header>

      <!-- PESTAÑAS (TABS) -->
      <v-tabs v-model="tab" bg-color="transparent" color="primary" class="border-bottom mx-4 mt-2" style="flex-shrink: 0;">
        <v-tab value="1"><v-icon start>mdi-domain</v-icon> 1. Cliente y Datos</v-tab>
        <v-tab value="2"><v-icon start>mdi-format-list-bulleted</v-icon> 2. Servicios a Cotizar</v-tab>
        <v-tab value="3"><v-icon start>mdi-script-text-outline</v-icon> 3. Términos y Anexos</v-tab>
      </v-tabs>

      <v-card-text class="pt-4 pb-0" style="overflow-y: auto; flex-grow: 1; min-height: 0; display: block;">
        <v-form ref="formCotizacion" @submit.prevent>
          <v-window v-model="tab" class="pa-1">
            
            <!-- PÁGINA 1 -->
            <v-window-item value="1">
              <BillingClientPanel 
                :meta="cotizacion.meta" 
                :billing="cotizacion.billing_client" 
                :certificate="cotizacion.certificate_data" 
                v-model:clientId="linkedClientId"
              />
            </v-window-item>

            <!-- PÁGINA 2 -->
            <v-window-item value="2">
              <ServicesTable 
                :items="cotizacion.items" 
                :totals="cotizacion.totals" 
                :currency="cotizacion.meta.currency"
              />
            </v-window-item>

            <!-- PÁGINA 3 -->
            <v-window-item value="3">
              <CommercialTermsPanel :quote="cotizacion" />
            </v-window-item>

          </v-window>
        </v-form>
      </v-card-text>

      <!-- BOTONES DE NAVEGACIÓN Y GUARDADO -->
      <v-card-actions class="px-6 pb-4 pt-3 border-top bg-surface" style="flex-shrink: 0;">
        <v-btn v-if="tab > '1'" variant="tonal" color="primary" @click="tab = String(Number(tab) - 1)">
          <v-icon start>mdi-arrow-left</v-icon> Anterior
        </v-btn>
        
        <v-spacer />
        <v-btn variant="flat" class="font-weight-bold mr-3 px-4" @click="close">Cancelar</v-btn>
        
        <v-btn v-if="tab < '3'" color="primary" variant="flat" @click="tab = String(Number(tab) + 1)">
          Siguiente <v-icon end>mdi-arrow-right</v-icon>
        </v-btn>
        
        <v-btn v-if="tab === '3'" color="primary" variant="flat" prepend-icon="mdi-content-save" @click="guardarCotizacion" :loading="is_loading">
          Guardar Cotización
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { inject } from 'vue'
import BillingClientPanel from '../shared/BillingClientPanel.vue'
import ServicesTable from '../shared/ServicesTable.vue'
import CommercialTermsPanel from '../shared/CommercialTermsPanel.vue'
import { quoteDefaultJSON } from '@/utils/documents/quoteDefaults'
import DocumentsDataService from '@/services/documents/documentsDataService'

const swal = inject('$swal')
const emit = defineEmits(['reload'])

const dialog = ref(false)
const tab = ref("1")
const formCotizacion = ref(null)
const is_loading = ref(false)

const docId = ref(null) 
const linkedClientId = ref(null)

// El JSON exacto definido 
const cotizacion = reactive(quoteDefaultJSON())

const open = (docExistente = null) => {
  dialog.value = true
  tab.value = "1"
  if (docExistente) {
    docId.value = docExistente.id
    Object.assign(cotizacion, JSON.parse(JSON.stringify(docExistente.document_data)))
    linkedClientId.value = docExistente.client || null
  } else {
    docId.value = null
    Object.assign(cotizacion, quoteDefaultJSON())
    linkedClientId.value = null
  }
}
defineExpose({ open })

const close = () => {
  dialog.value = false
}

const guardarCotizacion = async () => {
  // Validación básica antes de enviar
  if (!cotizacion.billing_client.business_name || !cotizacion.billing_client.doc_number) {
    swal.fire('Faltan Datos', 'Debe ingresar al menos el RUC/DNI y la Razón Social del cliente a facturar.', 'warning')
    tab.value = "1"
    return
  }

  if (cotizacion.items.length === 0) {
    swal.fire('Sin Servicios', 'Debe agregar al menos un servicio a la cotización.', 'warning')
    tab.value = "2"
    return
  }

  // NUEVA VALIDACIÓN: Revisar que ninguna fila esté en blanco o tenga precio cero
  for (let i = 0; i < cotizacion.items.length; i++) {
    const item = cotizacion.items[i];
    
    if (!item.description || item.description.trim() === '') {
      swal.fire('Falta Descripción', `El servicio del Ítem ${i + 1} no tiene descripción. Por favor complétela.`, 'warning')
      tab.value = "2" // Lo mandamos a la pestaña 2 automáticamente
      return
    }
    
    if (!item.unit_price || parseFloat(item.unit_price) <= 0) {
      swal.fire('Precio Inválido', `El valor unitario del Ítem ${i + 1} debe ser mayor a 0.`, 'warning')
      tab.value = "2" // Lo mandamos a la pestaña 2 automáticamente
      return
    }
  }

  is_loading.value = true
  
  // Preparamos el payload envolviendo el JSON en el campo 'document_data' 
  // y enviando los campos rápidos que necesita Django
  const payload = {
    document_type: 'COT',
    total_amount: cotizacion.totals.total,
    currency: cotizacion.meta.currency,
    schema_version: cotizacion.meta.schema_version, // <- Asigna la versión a la columna de Django
    document_data: cotizacion,
    client: linkedClientId.value
  }

  is_loading.value = true

  try {
    let response
    if (docId.value) {
      response = await DocumentsDataService.update(docId.value, payload)
    } else {
      response = await DocumentsDataService.create(payload)
    }

    if (response.status === 201 || response.status === 200 || response.status === 204) {
      const msgSuccess = docId.value ? 'Cotización Actualizada' : 'Cotización Creada'
      const detailSuccess = docId.value 
        ? 'Los cambios se guardaron y el PDF fue regenerado exitosamente.' 
        : `El documento ${response.data.document_number} se generó exitosamente.`
      
      swal.fire({ toast: true, position: 'top-end', showConfirmButton: false, timer: 2500, icon: 'success', title: msgSuccess, text: detailSuccess })
      
      // Enviamos la actualización masiva a través del WebSocket inyectado globalmente
      if (window.notificarActualizacionFila) {
        window.notificarActualizacionFila(null, null, docId.value || response.data.id)
      }
      
      emit('reload') // Le avisa a ListDocuments.vue que recargue la tabla
      close()
    }
  } catch (error) {
    console.error("Error al guardar:", error)
    swal.fire('Error', 'Hubo un problema al generar la cotización o el PDF.', 'error')
  } finally {
    is_loading.value = false
  }
}
</script>

<style scoped>
.border-bottom {
  border-bottom: 1px solid rgba(0, 0, 0, 0.12);
}
</style>