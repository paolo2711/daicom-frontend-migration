<template>
  <v-dialog width="450" v-model="dialog" class="dialog-premium" persistent>
    <v-card>
      <base-modal-header :title="isEdit ? 'Editar Unidad' : 'Nueva Unidad'" icon="mdi-ruler" @close="close" />
      <v-form ref="unitForm" @submit.prevent v-model="is_valid">
        <v-card-text class="pt-6">
          <v-text-field v-model="form.symbol" label="Símbolo de la Unidad (*)"
                        placeholder="Ej: PSI, kg, mm" variant="outlined" density="compact" hide-details="auto"
                        prepend-inner-icon="mdi-ruler-square"
                        :rules="[v => !!v || 'Requerido']" />
        </v-card-text>
        <v-card-actions class="px-6 pb-4 pt-2">
          <v-spacer/>
          <v-btn variant="flat" class="font-weight-bold rounded-lg mr-3 px-6" @click="close">Cancelar</v-btn>
          <v-btn color="primary" variant="flat" class="font-weight-bold rounded-lg px-6" @click="save" :disabled="!is_valid" :loading="is_saving">
            {{ isEdit ? 'Guardar Cambios' : 'Registrar' }}
          </v-btn>
        </v-card-actions>
      </v-form>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, reactive } from 'vue'
import Swal from 'sweetalert2'
import UnitDataService from '@/services/equipments/unitDataService'

const emit = defineEmits(['reload'])

const dialog = ref(false)
const isEdit = ref(false)
const is_valid = ref(false)
const is_saving = ref(false)
const unitForm = ref(null)

const form = reactive({ id: null, symbol: '' })

const open = (item = null) => {
  isEdit.value = !!item
  if (item) {
    form.id = item.id
    form.symbol = item.symbol
  } else {
    form.id = null
    form.symbol = ''
  }
  dialog.value = true
  if (unitForm.value) unitForm.value.resetValidation()
}

const close = () => { dialog.value = false }

const save = async () => {
  const { valid } = await unitForm.value.validate()
  if (valid) {
    is_saving.value = true

    let request = isEdit.value
      ? UnitDataService.update(form.id, form)
      : UnitDataService.create(form)

    request.then(() => {
      emit('reload')
      close()
      Swal.fire({ icon: 'success', title: 'Éxito', text: 'Unidad guardada correctamente.' })
    }).catch(e => {
      let errorMsg = 'No se pudo guardar la unidad. Revise si el símbolo ya existe.'
      if (e.response && e.response.data && e.response.data.symbol) {
        errorMsg = "Ese símbolo ya está registrado."
      }
      Swal.fire({ icon: 'error', title: 'Error', text: errorMsg })
    }).finally(() => {
      is_saving.value = false
    })
  }
}

defineExpose({ open })
</script>