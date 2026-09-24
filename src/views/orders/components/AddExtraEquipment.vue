<template>
  <v-dialog v-model="dialogModel" class="dialog-premium" width="950" persistent>
    <v-card style="max-height: 90vh; display: flex; flex-direction: column;">
      <base-modal-header title="Añadir Equipos Extra a la Orden" icon="mdi-plus-box-multiple" @close="close" />

      <v-card-text class="pt-4 pb-2 bg-surface" style="overflow-y: auto; flex-grow: 1;">
        <form-order-rental
          v-if="isRental"
          :key="'extra-rental-' + dialogModel"
          @update-list="list => items_to_save = list"
        />

        <form-order-service
          v-else
          ref="formServicioRef"
          :key="'extra-service-' + dialogModel"
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
import { Toast } from '@/plugins/alerts'
import { ref, computed, watch, nextTick, getCurrentInstance } from 'vue'
import { useBorradorLocal } from '@/composables/useBorradorLocal'
import FormOrderService from './services/FormOrderService.vue'
import FormOrderRental from './rentals/FormOrderRental.vue'
import OrderDataService from "@/services/orders/orderDataService"

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

// Computado para saber si la orden recibida es de Alquiler
const isRental = computed(() => props.order && props.order.order_type === 2)

// Uno por orden: lo cargado para una no aparece al abrir otra.
const borrador = useBorradorLocal(() => `daicom_borrador_equipos_${props.order?.id}`)

watch(items_to_save, (items) => {
  if (!isRental.value && items.length) borrador.guardar({ items })
}, { deep: true })

watch(dialogModel, async (abierto) => {
  if (!abierto) {
    items_to_save.value = []
    return
  }
  if (isRental.value) return
  const recuperado = await borrador.ofrecer()
  if (!recuperado) return
  await nextTick()
  formServicioRef.value?.inyectarBorrador(recuperado.items)
})

const guardarAlquileres = () => Promise.all(items_to_save.value.map(item => OrderDataService.createRental({
  order: props.order.id,
  equipment: item.equipment_id,
  departure_date: item.departure_date,
  expected_return_date: item.expected_return_date || null,
  delivery_notes: item.delivery_notes || '',
})))

async function saveExtraEquipments() {
  if (items_to_save.value.length === 0) return
  loading_extra.value = true

  try {
    if (isRental.value) await guardarAlquileres()
    else await OrderDataService.agregarEquipos(props.order.id, items_to_save.value)

    Toast.fire({ timer: 2200, icon: 'success', title: `${items_to_save.value.length} equipo(s) añadido(s)` })
    emit('reload')
    close()
  } catch (error) {
    const data = error.response?.data
    formServicioRef.value?.marcarErrores(data?.filas)
    $swal.fire('Error', data?.error || 'No se pudieron guardar los equipos.', 'error')
  } finally {
    loading_extra.value = false
  }
}

function close() {
  if (!isRental.value) borrador.descartar()
  emit('close')
}
</script>