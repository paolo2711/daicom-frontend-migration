<template>
  <v-dialog v-model="dialogModel" class="dialog-premium" width="950" persistent>
    <v-card style="max-height: 90vh; display: flex; flex-direction: column;">
      <base-modal-header title="Añadir Equipos Extra a la Orden" icon="mdi-plus-box-multiple" @close="close" />

      <v-card-text class="pt-4 pb-2 bg-surface" style="overflow-y: auto; flex-grow: 1;">
        <form-order-service 
          ref="formServicioRef" 
          :key="'extra-' + dialogModel" 
          @update-list="list => items_to_save = list" 
        />
      </v-card-text>

      <v-card-actions class="px-6 pb-4 pt-2">
        <v-spacer/>
        <v-btn variant="flat" class="font-weight-bold rounded-lg mr-3 px-6" @click="close">Cancelar</v-btn>
        <v-btn 
          color="primary" 
          variant="flat" 
          elevation="2" 
          class="text-white font-weight-bold rounded-lg px-6"
          @click="saveExtraEquipments" 
          :disabled="items_to_save.length === 0" 
          :loading="loading_extra"
        >
          <v-icon start>mdi-content-save</v-icon> Guardar {{ items_to_save.length }} Equipo(s)
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, computed, watch, getCurrentInstance } from 'vue'
import FormOrderService from './FormOrderService.vue'
import CertificateDataService from "@/services/certificates/certificateDataService"

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  order: { type: Object, default: null }
})

const emit = defineEmits(['update:modelValue', 'close', 'reload'])

const { appContext } = getCurrentInstance()
const $swal = appContext.config.globalProperties.$swal

const loading_extra = ref(false)
const items_to_save = ref([])
const formServicioRef = ref(null)

const dialogModel = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

// Limpiamos la tabla de equipos al cerrar el modal
watch(dialogModel, (newVal) => {
  if (!newVal) {
    items_to_save.value = []
  }
})

async function saveExtraEquipments() {
  if (items_to_save.value.length === 0) return
  loading_extra.value = true

  try {
    // Procesamos todos los equipos en paralelo para mayor velocidad UX
    const promesas = items_to_save.value.map(item => {
      if (item.modo === 'nuevo') {
        let data = new FormData()
        data.append('order', props.order.id)
        data.append('client', props.order.client_data.id)
        data.append('equipment', item.name)
        data.append('certificate_type', item.certificate_type)
        data.append('lab', item.lab)
        data.append('correlative', '00000000') // El backend generará el correlativo real
        data.append('calibration_date', new Date().toISOString().substr(0, 10))
        data.append('emission_date', new Date().toISOString().substr(0, 10))
        return CertificateDataService.create(data)
      } else {
        // Es existente, solo lo vinculamos con el PATCH
        return CertificateDataService.patch(item.cert_id, { order: props.order.id })
      }
    })

    await Promise.all(promesas)

    $swal.fire('Éxito', `${items_to_save.value.length} equipo(s) añadido(s) a la orden`, 'success')

    const currentUser = JSON.parse(localStorage.getItem('user')) || {}
    if (window.enviarNotificacionGlobal) {
      window.enviarNotificacionGlobal(
        currentUser.username, 
        'info', 
        'Equipos Extra', 
        `Se añadieron ${items_to_save.value.length} equipo(s) a una orden existente.`
      )
    }

    // Notificamos a TODO el sistema vía WebSocket
    if (window.notificarActualizacionFila) {
      window.notificarActualizacionFila(null, props.order.id);
      
      items_to_save.value.forEach(item => {
        if (item.modo === 'existente' && item.cert_id) {
          window.notificarActualizacionFila(item.cert_id, null);
        }
      });
    }
    
    close()
  } catch (error) {
    console.error("Error al guardar equipos extra:", error)
    $swal.fire('Error', 'No se pudieron procesar todos los equipos. Revisa tu conexión.', 'error')
  } finally {
    loading_extra.value = false
  }
}

function close() {
  emit('close')
}
</script>