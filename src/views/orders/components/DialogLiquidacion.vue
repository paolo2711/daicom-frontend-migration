<template>
  <v-dialog v-model="dialogModel" class="dialog-premium" width="600" persistent>
    <v-card>
      <base-modal-header
        title="Liquidación y Abonos"
        icon="mdi-cash-register"
        @close="closeDialog"
      >
        <span v-if="order">
          Orden:
          <span class="font-weight-bold text-primary ml-1">{{ order.order_number }}</span>
        </span>
      </base-modal-header>

      <v-card-text class="pa-0">
        <div
          class="pa-4"
          :class="theme.global.current.value.dark ? 'bg-grey-darken-4' : 'bg-grey-lighten-4'"
        >
          <div class="text-subtitle-2 font-weight-bold mb-2">Historial de Pagos:</div>

          <v-alert
            v-if="!order || !order.payments || order.payments.length === 0"
            type="info"
            variant="text"
            density="compact"
            class="mb-0"
          >
            No hay pagos registrados para esta orden.
          </v-alert>

          <v-list
            v-else
            density="compact"
            class="rounded-lg border"
            lines="two"
          >
            <v-list-item
              v-for="pago in order.payments"
              :key="pago.id"
              class="border-bottom"
            >
              <template #prepend>
                <v-avatar
                  :color="getColorPago(pago.payment_method) + '-lighten-5'"
                  size="40"
                >
                  <v-icon :color="getColorPago(pago.payment_method)">
                    {{ getIconoPago(pago.payment_method) }}
                  </v-icon>
                </v-avatar>
              </template>

              <v-list-item-title class="font-weight-bold">
                S/ {{ pago.amount }}
              </v-list-item-title>
              <v-list-item-subtitle>
                {{ pago.payment_method }} - {{ pago.payment_date }}
              </v-list-item-subtitle>
              <v-list-item-subtitle v-if="pago.notes" class="font-italic text-caption">
                "{{ pago.notes }}"
              </v-list-item-subtitle>

              <template #append>
                <div class="d-flex flex-row align-center">
                  <v-tooltip location="bottom" v-if="pago.payment_proof">
                    <template v-slot:activator="{ props }">
                      <v-btn
                        v-bind="props"
                        icon
                        size="small"
                        color="primary"
                        variant="text"
                        density="comfortable"
                        :href="pago.payment_proof"
                        target="_blank"
                      >
                        <v-icon size="small">mdi-file-eye</v-icon>
                      </v-btn>
                    </template>
                    <span>Ver Comprobante</span>
                  </v-tooltip>
                  <v-tooltip location="bottom">
                    <template v-slot:activator="{ props }">
                      <v-btn
                        v-bind="props"
                        icon
                        size="small"
                        color="primary"
                        variant="text"
                        density="comfortable"
                        class="mr-1"
                        @click="prepararEdicion(pago)"
                      >
                        <v-icon size="small">mdi-pencil</v-icon>
                      </v-btn>
                    </template>
                    <span>Editar Abono</span>
                  </v-tooltip>
                  <v-tooltip location="bottom">
                    <template v-slot:activator="{ props }">
                      <v-btn
                        v-bind="props"
                        icon
                        size="small"
                        color="error"
                        variant="text"
                        density="comfortable"
                        @click="eliminarPago(pago.id)"
                      >
                        <v-icon size="small">mdi-delete</v-icon>
                      </v-btn>
                    </template>
                    <span>Eliminar Abono</span>
                  </v-tooltip>
                </div>
              </template>
            </v-list-item>
          </v-list>
        </div>

        <v-divider class="mx-6 mb-0" />

        <v-form ref="liquidarFormRef" @submit.prevent class="pa-4">
          <div class="text-subtitle-2 font-weight-bold mb-3">
            {{ editando ? 'Editar Abono:' : 'Registrar Nuevo Abono:' }}
          </div>
          <v-row density="compact">
            <v-col cols="12" md="6">
              <v-text-field
                v-model="payment_data.amount"
                label="Monto Pagado (S/)"
                variant="outlined"
                density="compact"
                type="number"
                step="0.01"
                clearable
                prepend-inner-icon="mdi-currency-usd"
                :rules="[v => !!v || 'Monto requerido']"
              />
            </v-col>
            <v-col cols="12" md="6">
              <date-picker
                label="Fecha de Pago"
                :date="payment_data.payment_date"
                @setPickedDate="(value) => (payment_data.payment_date = value)"
              />
            </v-col>
            <v-col cols="12">
              <v-select
                v-model="payment_data.payment_method"
                :items="metodos"
                label="Método de Pago"
                variant="outlined"
                density="compact"
                clearable
                :rules="[v => !!v || 'Campo requerido']"
              />
            </v-col>
            <v-col cols="12">
              <v-textarea
                v-model="payment_data.notes"
                label="Comentarios u Observaciones"
                variant="outlined"
                density="compact"
                rows="2"
                clearable
                placeholder="Ej: Pago adelantado, cancelado por transferencia..."
              />
            </v-col>
            <v-col cols="12" v-if="payment_data.payment_method !== 'EFECTIVO'">
              <v-file-input
                v-model="file"
                label="Subir Comprobante (Opcional)"
                prepend-inner-icon="mdi-camera"
                variant="outlined"
                density="compact"
                show-size
                clearable
                accept="image/*,application/pdf"
              />
            </v-col>
          </v-row>
        </v-form>
      </v-card-text>

      <v-card-actions class="px-6 pb-4 pt-2">
        <v-spacer />
        <v-btn variant="flat" class="font-weight-bold rounded-lg mr-3 px-6" @click="closeDialog">Cerrar</v-btn>
                <v-btn color="primary" variant="flat" elevation="2" class="text-white font-weight-bold rounded-lg px-6"
          :loading="is_on_sending_process" :disabled="!payment_data.payment_method || !payment_data.amount" @click="save">
          {{ editando ? 'Guardar Cambios' : 'Registrar Abono' }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, reactive, watch, computed } from 'vue'
import { useTheme } from 'vuetify'
import Swal from 'sweetalert2'
import OrderDataService from '@/services/certificates/orderDataService'
import { useAppStore } from '@/stores/appStore'
import DatePicker from '@/components/commonComponents/DatePicker.vue'
import BaseModalHeader from '@/components/commonComponents/BaseModalHeader.vue'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  order: { type: Object, default: null }
})

const emit = defineEmits(['update:modelValue', 'updateOrder', 'close'])

const theme = useTheme()
const appStore = useAppStore()

const dialogModel = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const is_on_sending_process = ref(false)
const file = ref(null)
const editando = ref(false)
const pago_id_editar = ref(null)
const liquidarFormRef = ref(null)

const payment_data = reactive({
  amount: '',
  payment_method: '',
  notes: '',
  payment_date: new Date().toISOString().split('T')[0]
})

const metodos = ['EFECTIVO', 'BILLETERA', 'TRANSFERENCIA']

const resetLocalForm = () => {
  payment_data.amount = ''
  payment_data.payment_method = ''
  payment_data.notes = ''
  payment_data.payment_date = new Date().toISOString().split('T')[0]
  file.value = null
  editando.value = false
  pago_id_editar.value = null
  if (liquidarFormRef.value) liquidarFormRef.value.resetValidation()
}

watch(() => props.modelValue, (val) => {
  if (val) {
    resetLocalForm()
  }
})

const prepararEdicion = (pago) => {
  editando.value = true
  pago_id_editar.value = pago.id
  payment_data.amount = pago.amount
  payment_data.payment_method = pago.payment_method
  payment_data.notes = pago.notes || ''
  payment_data.payment_date = pago.payment_date
  file.value = null
}

const save = async () => {
  const { valid } = await liquidarFormRef.value.validate()
  if (valid) {
    is_on_sending_process.value = true

    const data = new FormData()
    data.append('amount', payment_data.amount)
    data.append('payment_method', payment_data.payment_method)
    data.append('payment_date', payment_data.payment_date)
    data.append('notes', payment_data.notes)

    if (file.value) {
      data.append('payment_proof', file.value)
    }

    const peticion = editando.value
      ? OrderDataService.updatePayment(pago_id_editar.value, data)
      : OrderDataService.liquidate(props.order.id, data)

    peticion
      .then(() => { 
        closeDialog()
        Swal.fire(appStore.successSavedOptions)
      })
      .finally(() => {
        is_on_sending_process.value = false
      })
  }
}

const closeDialog = () => {
  resetLocalForm()
  emit('update:modelValue', false)
  emit('close')
}

const getIconoPago = (metodo) => {
  if (metodo === 'EFECTIVO') return 'mdi-cash'
  if (metodo === 'BILLETERA') return 'mdi-cellphone-nfc'
  if (metodo === 'TRANSFERENCIA') return 'mdi-bank-transfer'
  return 'mdi-cash-register'
}

const getColorPago = (metodo) => {
  if (metodo === 'EFECTIVO') return 'green'
  if (metodo === 'BILLETERA') return 'purple'
  if (metodo === 'TRANSFERENCIA') return 'blue'
  return 'grey'
}

const eliminarPago = (id) => {
  Swal.fire({
    title: '¿Eliminar este abono?',
    text: 'Se borrará el registro financiero y su comprobante asociado.',
    icon: 'warning',
    showCancelButton: true,
    cancelButtonText: 'Cancelar',
    confirmButtonText: 'Sí, eliminar'
  }).then((result) => {
    if (result.isConfirmed) {
      OrderDataService.deletePayment(id).then(() => {
        Swal.fire('Eliminado', 'El abono ha sido borrado.', 'success')
      }).catch(() => {
        Swal.fire('Error', 'No se pudo eliminar el abono.', 'error')
      })
    }
  })
}
</script>

<style scoped>
.border-bottom {
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
}
.border {
  border: 1px solid rgba(0, 0, 0, 0.1);
}
</style>