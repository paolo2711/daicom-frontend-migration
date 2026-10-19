<template>
  <v-dialog width="500" v-model="dialog" class="dialog-premium" persistent>
    <v-card>
      <base-modal-header :title="isEdit ? 'Editar Equipo Maestro' : 'Nuevo Equipo Maestro'" icon="mdi-toolbox-outline" @close="close" />
      <v-form ref="formRef" @submit.prevent v-model="is_valid">
        <v-card-text class="pt-6">
          <v-text-field 
            v-model="form.nombre_tecnico" 
            label="Nombre del Equipo (Diccionario Técnico) *"
            placeholder="Ej: Balanza Analítica" 
            variant="outlined" 
            density="compact" 
            prepend-inner-icon="mdi-format-title"
            :rules="[v => !!v || 'Requerido']"
          />
          <paginated-autocomplete v-model="form.laboratorio" :fetch="fetchLabs" :mapper="LabMappers.getMap"
                                  recurso="labs" :seed="laboratorio" @selected="l => laboratorio = l"
                                  label="Laboratorio que lo calibra" :return-object="false" item-title="name" item-value="id"
                                  prepend-inner-icon="mdi-flask-outline" variant="outlined" density="compact" clearable
                                  hint="La orden y el certificado lo proponen al elegir este equipo" persistent-hint />
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
import { Toast } from '@/plugins/alerts'
import { ref, reactive } from 'vue'
import Swal from 'sweetalert2'
import EquipmentDataService from '@/services/equipments/equipmentDataService'
import LabDataService from '@/services/labs/labDataService'
import LabMappers from '@/mappers/labMappers'
import PaginatedAutocomplete from '@/components/commonComponents/PaginatedAutocomplete.vue'

const emit = defineEmits(['reload'])
const dialog = ref(false)
const isEdit = ref(false)
const is_valid = ref(false)
const is_saving = ref(false)
const formRef = ref(null)

const form = reactive({ id: null, nombre_tecnico: '', laboratorio: null })
// El laboratorio elegido, para que se vea sin buscarlo.
const laboratorio = ref(null)
const fetchLabs = (page, size, query) => LabDataService.getFiltered(page, size, query)

const open = (item = null) => {
  isEdit.value = !!item
  form.id = item?.id ?? null
  form.nombre_tecnico = item?.nombre_tecnico ?? ''
  form.laboratorio = item?.laboratorio ?? null
  laboratorio.value = item?.laboratorio_data ?? null
  dialog.value = true
  if (formRef.value) formRef.value.resetValidation()
}

const close = () => { dialog.value = false }

const save = async () => {
  const { valid } = await formRef.value.validate()
  if (valid) {
    is_saving.value = true
    let request = isEdit.value ? EquipmentDataService.update(form.id, form) : EquipmentDataService.create(form)

    request.then(() => {
      emit('reload')
      close()
      Toast.fire({ timer: 2200, icon: 'success', title: 'Equipo maestro guardado' })
    }).catch(e => {
      let errorMsg = 'No se pudo guardar el equipo. Posible nombre duplicado.'
      if (e.response?.data?.nombre_tecnico) errorMsg = "Ese equipo ya existe en el diccionario."
      if (e.response?.data?.laboratorio) errorMsg = e.response.data.laboratorio[0]
      Swal.fire({ icon: 'error', title: 'Error', text: errorMsg })
    }).finally(() => { is_saving.value = false })
  }
}

defineExpose({ open })
</script>