<template>
  <v-dialog v-model="dialogModel" class="dialog-premium" width="92%" max-width="80rem" persistent>
    <v-card class="d-flex flex-column" style="max-height: 90vh;">
      <base-modal-header title="Añadir Equipos Extra a la Orden" icon="mdi-plus-box-multiple" @close="close" />

      <v-card-text class="pt-4 pb-2 bg-surface" style="flex-grow: 1; min-height: 0; overflow-y: auto;">
        <form-order-rental ref="formRef" :key="'extra-rental-' + dialogModel" @update-list="list => items_to_save = list" />
      </v-card-text>

      <v-card-actions class="px-6 pb-4 pt-2 border-t-thin">
        <div class="d-flex flex-wrap align-center ga-2 w-100">
          <resumen-equipos :filas="items_to_save" />
          <v-spacer/>
          <v-btn variant="flat" class="font-weight-bold px-4" @click="close">Cancelar</v-btn>
          <v-btn color="primary" variant="flat" class="font-weight-bold px-4" @click="saveExtraEquipments"
                 :disabled="items_to_save.length === 0" :loading="loading_extra">
            Guardar equipos
          </v-btn>
        </div>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, computed, watch, getCurrentInstance } from 'vue'
import { useSavedNumbers } from '@/composables/useSavedNumbers'
import { mensajeDeError } from '@/utils/errors'
import FormOrderRental from './rentals/FormOrderRental.vue'
import ResumenEquipos, { cuantosEquipos } from './ResumenEquipos.vue'
import OrderDataService from "@/services/orders/orderDataService"

// Solo alquiler: en servicio los equipos se agregan desde Editar orden.
const props = defineProps({
  modelValue: { type: Boolean, default: false },
  order: { type: Object, default: null }
})

const emit = defineEmits(['update:modelValue', 'close', 'reload'])

const { appContext } = getCurrentInstance()
const $swal = appContext.config.globalProperties.$swal
const avisarNumeros = useSavedNumbers()

const loading_extra = ref(false)
const items_to_save = ref([])
const formRef = ref(null)

const dialogModel = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

watch(dialogModel, (abierto) => {
  if (!abierto) items_to_save.value = []
})

async function saveExtraEquipments() {
  if (items_to_save.value.length === 0) return
  loading_extra.value = true

  try {
    const filas = items_to_save.value
    const { data } = await OrderDataService.agregarEquipos(props.order.id, filas)
    avisarNumeros(cuantosEquipos(filas.length, 'añadido'), filas, data.codigos)
    emit('reload')
    close()
  } catch (error) {
    const data = error.response?.data
    formRef.value?.marcarErrores(data?.filas)
    $swal.fire('No se guardaron los equipos', mensajeDeError(error, 'No se pudieron guardar los equipos.'), 'error')
  } finally {
    loading_extra.value = false
  }
}

function close() {
  emit('close')
}
</script>
