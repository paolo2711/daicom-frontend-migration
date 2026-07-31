<template>
  <v-dialog width="700" v-model="dialog" class="dialog-premium" persistent>
    <v-card>
      <base-modal-header :title="isEdit ? 'Editar Servicio' : 'Añadir Servicio al Catálogo'" icon="mdi-currency-usd" @close="close" />
      <v-form ref="formRef" @submit.prevent v-model="is_valid">
        <v-card-text class="pt-6">
          <v-select 
            v-model="form.tipo_servicio" 
            :items="tipos" 
            item-title="title" 
            item-value="value"
            label="Tipo de Servicio *" 
            variant="outlined" 
            density="compact" 
            prepend-inner-icon="mdi-shape-outline"
            :rules="[v => !!v || 'Requerido']" 
          />
          
          <v-textarea 
            v-model="form.descripcion_comercial" 
            label="Descripción Comercial Larga (Para Cotizaciones) *"
            placeholder="Ej: Servicio de calibración acreditada de balanza..." 
            variant="outlined" 
            density="compact" 
            rows="3"
            prepend-inner-icon="mdi-text"
            :rules="[v => !!v || 'Requerido']" 
            class="mt-3"
          />

          <v-row class="mt-1">
            <v-col cols="12" md="6">
              <v-text-field 
                v-model.number="form.precio_estandar" 
                type="number" 
                label="Precio Estándar (Contado) *"
                prefix="S/" 
                variant="outlined" 
                density="compact" 
                prepend-inner-icon="mdi-cash"
                :rules="[v => v >= 0 || 'Inválido']" 
              />
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field 
                v-model.number="form.precio_corporativo" 
                type="number" 
                label="Precio Corporativo (Crédito) *"
                prefix="S/" 
                variant="outlined" 
                density="compact" 
                prepend-inner-icon="mdi-domain"
                :rules="[v => v >= 0 || 'Inválido']" 
              />
            </v-col>
          </v-row>
        </v-card-text>
        <v-card-actions class="px-6 pb-4 pt-0">
          <v-spacer/>
          <v-btn variant="flat" class="font-weight-bold rounded-lg mr-3 px-6" @click="close">Cancelar</v-btn>
          <v-btn color="secondary" variant="flat" class="font-weight-bold rounded-lg px-6 text-white" @click="save" :disabled="!is_valid" :loading="is_saving">
            {{ isEdit ? 'Guardar Cambios' : 'Añadir Servicio' }}
          </v-btn>
        </v-card-actions>
      </v-form>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, reactive } from 'vue'
import Swal from 'sweetalert2'
import ServicioCatalogoDataService from '@/services/equipments/servicioCatalogoDataService'

const emit = defineEmits(['reload'])
const dialog = ref(false)
const isEdit = ref(false)
const is_valid = ref(false)
const is_saving = ref(false)
const formRef = ref(null)

const tipos = [
  { title: 'Calibración', value: 1 },
  { title: 'Mantenimiento Preventivo', value: 2 },
  { title: 'Reparación', value: 3 },
  { title: 'Paquete Integral (Calibración + Mant.)', value: 4 },
  { title: 'Otros Servicios', value: 5 }
]

const form = reactive({ id: null, equipo: null, tipo_servicio: 1, descripcion_comercial: '', precio_estandar: 0, precio_corporativo: 0 })

const open = (item = null, equipoId = null) => {
  isEdit.value = !!item
  if (item) {
    form.id = item.id
    form.equipo = item.equipo
    form.tipo_servicio = item.tipo_servicio
    form.descripcion_comercial = item.descripcion_comercial
    form.precio_estandar = item.precio_estandar
    form.precio_corporativo = item.precio_corporativo
  } else {
    form.id = null
    form.equipo = equipoId
    form.tipo_servicio = 1
    form.descripcion_comercial = ''
    form.precio_estandar = 0
    form.precio_corporativo = 0
  }
  dialog.value = true
  if (formRef.value) formRef.value.resetValidation()
}

const close = () => { dialog.value = false }

const save = async () => {
  const { valid } = await formRef.value.validate()
  if (valid) {
    is_saving.value = true
    let payload = { ...form }
    
    let request = isEdit.value ? ServicioCatalogoDataService.update(form.id, payload) : ServicioCatalogoDataService.create(payload)

    request.then(() => {
      emit('reload')
      close()
      Swal.fire({ toast: true, position: 'top-end', showConfirmButton: false, timer: 2200, icon: 'success', title: 'Servicio guardado' })
    }).catch(e => {
      Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo guardar. Verifica que no estés duplicando un servicio exacto.' })
    }).finally(() => { is_saving.value = false })
  }
}

defineExpose({ open })
</script>