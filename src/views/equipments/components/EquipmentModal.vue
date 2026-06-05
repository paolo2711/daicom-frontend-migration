<template>
  <v-dialog width="750" v-model="dialog" class="dialog-premium" persistent>
    <v-card>
      <base-modal-header
        :title="isEdit ? 'Editar Equipo del Catálogo' : 'Registrar Nuevo Equipo'"
        :icon="isEdit ? 'mdi-pencil-outline' : 'mdi-toolbox-outline'"
        @close="close"
      />

      <v-form ref="smartForm" @submit.prevent v-model="is_valid">
        <v-card-text class="pt-6">
          <v-alert v-if="error_msg" type="error" density="compact" variant="outlined" class="mb-4">{{ error_msg }}</v-alert>

          <v-row align="center">
            <v-col cols="12" md="6">
              <v-combobox v-model="form.equipment_name" label="Nombre Base del Equipo (*)"
                          :items="uniqueEquipmentNames" variant="outlined" density="compact" hide-details="auto"
                          placeholder="Ej: Balanza Analítica"
                          prepend-inner-icon="mdi-toolbox-outline"
                          :rules="[v => !!v || 'Requerido']" />
            </v-col>
            <v-col cols="12" md="6">
              <v-combobox v-model="form.type" label="Tipo / Modelo / Característica"
                          :items="uniqueTypes" variant="outlined" density="compact" hide-details="auto"
                          placeholder="Ej: Clase I, Digital..."
                          prepend-inner-icon="mdi-shape-outline" />
            </v-col>
          </v-row>

          <v-row align="center" class="mt-4">
            <v-col cols="12" md="9">
              <v-autocomplete v-model="form.unit" hide-details="auto" density="compact"
                              :items="units" item-title="symbol" item-value="id"
                              clearable variant="outlined" label="Unidad de Medida Base (*)" prepend-inner-icon="mdi-ruler"
                              :rules="[v => !!v || 'Debe asignar una unidad']" />
            </v-col>
            <v-col cols="12" md="3">
              <v-btn variant="outlined" color="primary" block size="small" class="mb-2" @click="$emit('open-unit-modal')">
                <v-icon start>mdi-plus</v-icon> Unidad
              </v-btn>
            </v-col>
          </v-row>
        </v-card-text>

        <v-card-actions class="px-6 pb-4 pt-2">
          <v-spacer/>
          <v-btn variant="flat" class="font-weight-bold rounded-lg mr-3 px-6" @click="close">Cancelar</v-btn>
          <v-btn color="primary" variant="flat" elevation="2" class="text-white font-weight-bold rounded-lg px-6" @click="save" :disabled="!is_valid" :loading="is_saving">
            {{ isEdit ? 'Guardar Cambios' : 'Registrar' }}
          </v-btn>
        </v-card-actions>
      </v-form>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import Swal from 'sweetalert2'
import EquipmentDataService from '@/services/equipments/equipmentDataService'

const props = defineProps({
  existingEquipments: { type: Array, default: () => [] },
  units: { type: Array, default: () => [] }
})

const emit = defineEmits(['reload', 'open-unit-modal'])

const dialog = ref(false)
const isEdit = ref(false)
const is_valid = ref(false)
const is_saving = ref(false)
const error_msg = ref(null)
const smartForm = ref(null)

const form = reactive({ id: null, equipment_name: '', type: '', unit: null })

const uniqueEquipmentNames = computed(() => {
  const names = props.existingEquipments.map(e => e.equipment_name)
  return [...new Set(names)].filter(Boolean)
})

const uniqueTypes = computed(() => {
  const types = props.existingEquipments.map(e => e.type)
  return [...new Set(types)].filter(Boolean)
})

const open = (item = null) => {
  error_msg.value = null
  if (item) {
    isEdit.value = true
    form.id = item.id
    form.equipment_name = item.equipment_name
    form.type = item.type
    form.unit = item.unit
  } else {
    isEdit.value = false
    form.id = null
    form.equipment_name = ''
    form.type = ''
    form.unit = null
  }
  dialog.value = true
  if (smartForm.value) smartForm.value.resetValidation()
}

const close = () => { dialog.value = false }

const save = async () => {
  const { valid } = await smartForm.value.validate()
  if (valid) {

    const exists = props.existingEquipments.some(e =>
      e.equipment_name.toLowerCase() === form.equipment_name.toLowerCase() &&
      (e.type || '').toLowerCase() === (form.type || '').toLowerCase() &&
      e.unit === form.unit &&
      e.id !== form.id
    )

    if (exists) {
      error_msg.value = "Este equipo ya existe con la misma característica y unidad."
      return
    }

    error_msg.value = null
    is_saving.value = true

    let payload = {
      equipment_name: form.equipment_name,
      type: form.type,
      unit: form.unit
    }

    let request = isEdit.value
      ? EquipmentDataService.update(form.id, payload)
      : EquipmentDataService.create(payload)

    request.then(() => {
      emit('reload')
      close()
      Swal.fire({ icon: 'success', title: 'Guardado', text: 'Catálogo actualizado.' })
    }).catch(e => {
      console.error(e)
      error_msg.value = "Hubo un error de comunicación con el servidor."
    }).finally(() => {
      is_saving.value = false
    })
  }
}

defineExpose({ open })
</script>