<template>
  <v-dialog v-model="dialogModel" class="dialog-premium" width="950" persistent>
    <v-card style="max-height: 90vh; display: flex; flex-direction: column;">
      <base-modal-header title="Añadir Equipos Extra a la Orden" icon="mdi-plus-box-multiple" @close="close" />

      <v-card-text class="pt-4 pb-2 bg-surface" style="overflow-y: auto; flex-grow: 1;">
        <form-order-rental
          v-if="isRental"
          ref="formRef"
          :key="'extra-rental-' + dialogModel"
          @update-list="list => items_to_save = list"
        />

        <form-order-service
          v-else
          ref="formRef"
          :key="'extra-service-' + dialogModel"
          @update-list="list => items_to_save = list"
          @update-config="c => config = c"
        />
      </v-card-text>

      <v-card-actions class="px-6 pb-4 pt-2 border-t-thin flex-wrap ga-2">
        <resumen-equipos :filas="items_to_save" :por-tipo="!isRental" />
        <v-spacer/>
        <v-btn variant="flat" class="font-weight-bold px-4" @click="close">Cancelar</v-btn>
        <v-btn color="primary" variant="flat" class="font-weight-bold px-4" @click="saveExtraEquipments"
               :disabled="items_to_save.length === 0" :loading="loading_extra">
          Guardar equipos
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, computed, watch, nextTick, getCurrentInstance } from 'vue'
import { useLocalDraft } from '@/composables/useLocalDraft'
import { useSavedNumbers } from '@/composables/useSavedNumbers'
import { mensajeDeError } from '@/utils/errors'
import FormOrderService from './services/FormOrderService.vue'
import FormOrderRental from './rentals/FormOrderRental.vue'
import ResumenEquipos, { cuantosEquipos } from './ResumenEquipos.vue'
import OrderDataService from "@/services/orders/orderDataService"

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
const config = ref(null)
const formRef = ref(null)

const dialogModel = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

// Computado para saber si la orden recibida es de Alquiler
const isRental = computed(() => props.order && props.order.order_type === 2)

// Uno por orden: lo cargado para una no aparece al abrir otra.
const borrador = useLocalDraft(() => `daicom_borrador_equipos_${props.order?.id}`)

watch([items_to_save, config], ([items, elegido]) => {
  if (!isRental.value) borrador.guardar({ items, config: elegido })
}, { deep: true })

watch(dialogModel, async (abierto) => {
  if (!abierto) {
    items_to_save.value = []
    config.value = null
    return
  }
  if (isRental.value) return
  const recuperado = await borrador.ofrecer()
  if (!recuperado) return
  await nextTick()
  formRef.value?.inyectarBorrador(recuperado)
})

async function saveExtraEquipments() {
  if (items_to_save.value.length === 0) return
  loading_extra.value = true

  try {
    const filas = items_to_save.value
    const estimados = formRef.value?.estimados?.()
    const { data } = await OrderDataService.agregarEquipos(props.order.id, filas)
    avisarNumeros(cuantosEquipos(filas.length, 'añadido'), filas, data.codigos, estimados)
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
  if (!isRental.value) borrador.descartar()
  emit('close')
}
</script>