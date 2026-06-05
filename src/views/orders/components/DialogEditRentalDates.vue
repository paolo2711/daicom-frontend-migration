<template>
  <v-dialog v-model="dialog" class="dialog-premium" max-width="500px" persistent>
    <v-card>
      <base-modal-header 
        title="Editar Fechas de Alquiler" 
        icon="mdi-calendar-edit" 
        @close="close" 
      >
        <span v-if="form.equipment_internal_id">Equipo: <span class="font-weight-bold text-primary ml-1">{{ form.equipment_internal_id }} - {{ form.equipment_name }}</span></span>
      </base-modal-header>
      
      <v-card-text class="pt-6">
        <v-form ref="formFechas" v-model="is_valid" @submit.prevent>

          <v-text-field
            v-model="form.departure_date"
            label="Fecha de Salida (*)"
            type="date"
            variant="outlined"
            density="compact"
            class="mb-1"
            :rules="[v => !!v || 'La fecha de salida es obligatoria']"
          ></v-text-field>

          <v-text-field
            v-model="form.expected_return_date"
            label="Fecha de Retorno Pactado"
            type="date"
            variant="outlined"
            density="compact"
            class="mb-1"
            clearable
            :rules="[
              v => !v || v >= form.departure_date || 'No puede ser anterior a la fecha de salida'
            ]"
          ></v-text-field>

          <v-text-field
            v-model="form.actual_return_date"
            label="Fecha de Retorno Real"
            type="date"
            variant="outlined"
            density="compact"
            class="mb-1"
            :clearable="form.return_status !== 2"
            :disabled="form.return_status !== 2"
            :hint="form.return_status !== 2 ? 'Solo editable si el equipo está devuelto' : ''"
            persistent-hint
            :rules="[
              v => (form.return_status !== 2 || !!v) || 'Esta fecha es obligatoria porque el equipo ya figura como devuelto',
              v => !v || v >= form.departure_date || 'No puede ser anterior a la fecha de salida'
            ]"
          ></v-text-field>
        </v-form>
      </v-card-text>

      <v-card-actions class="px-6 pb-4 pt-2">
        <v-spacer></v-spacer>
        <v-btn variant="flat" class="font-weight-bold mr-3 px-4" @click="close">Cancelar</v-btn>
        <v-btn color="primary" variant="flat" @click="save" :disabled="!is_valid" :loading="loading">
          <v-icon start size="small">mdi-content-save</v-icon> Guardar Cambios
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, getCurrentInstance } from 'vue'
import OrderDataService from '@/services/certificates/orderDataService'

const emit = defineEmits(['reload'])
const { appContext } = getCurrentInstance()
const $swal = appContext.config.globalProperties.$swal

const dialog = ref(false)
const is_valid = ref(false)
const loading = ref(false)
const formFechas = ref(null)

const form = ref({
  id: null,
  equipment_internal_id: '',
  equipment_name: '',
  departure_date: '',
  expected_return_date: '',
  actual_return_date: '',
  return_status: 1
})

function open(rental) {
  form.value = {
    id: rental.id,
    equipment_internal_id: rental.equipment_internal_id,
    equipment_name: rental.equipment_name,
    departure_date: rental.departure_date || '',
    expected_return_date: rental.expected_return_date || '',
    actual_return_date: rental.actual_return_date || '',
    return_status: rental.return_status
  }
  dialog.value = true
}

function close() {
  dialog.value = false
  formFechas.value?.resetValidation()
}

async function save() {
  if (!is_valid.value) return
  loading.value = true
  
  try {
    const payload = {
      departure_date: form.value.departure_date,
      expected_return_date: form.value.expected_return_date || null,
      actual_return_date: form.value.actual_return_date || null
    }

    await OrderDataService.updateRentalDates(form.value.id, payload)
    
    $swal.fire('Actualizado', 'Las fechas se actualizaron correctamente.', 'success')
    emit('reload')
    close()
  } catch (error) {
    console.error(error)
    $swal.fire('Error', 'Hubo un problema al actualizar las fechas.', 'error')
  } finally {
    loading.value = false
  }
}

defineExpose({ open })
</script>