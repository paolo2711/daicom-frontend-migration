<template>
  <v-dialog v-model="dialogModel" class="dialog-premium" width="600" persistent>
    <v-card>
      <base-modal-header
        title="Liquidación y Abonos"
        icon="mdi-cash-register"
        @close="closeDialog"
      >
        <span v-if="invoice">
          <span class="font-weight-bold">{{ nombreDe(invoice) }}</span>
        </span>
      </base-modal-header>

      <v-card-text class="pa-0">
        <div v-if="desglose" class="pa-4 pb-0">
          <amount-breakdown v-bind="desglose" />
        </div>
        <div
          class="pa-4"
          :class="theme.global.current.value.dark ? 'bg-grey-darken-4' : 'bg-grey-lighten-4'"
        >
          <div class="text-subtitle-2 font-weight-bold mb-2">Historial de Pagos:</div>

          <v-alert
            v-if="abonosDeLaFactura.length === 0"
            type="info"
            variant="text"
            density="compact"
            class="mb-0"
          >
            No hay pagos registrados todavía.
          </v-alert>

          <v-list
            v-else
            density="compact"
            class="rounded-lg border"
            lines="two"
          >
            <v-list-item
              v-for="pago in abonosDeLaFactura"
              :key="pago.id"
              class="border-bottom"
            >
              <template #prepend>
                <v-avatar variant="tonal" size="40">
                  <v-icon>{{ formaDePago(pago).icono }}</v-icon>
                </v-avatar>
              </template>

              <v-list-item-title class="font-weight-bold">
                {{ monto(pago.amount, monedaActual) }}
              </v-list-item-title>
              <v-list-item-subtitle>
                {{ formaDePago(pago).texto }} · {{ fechaCorta(pago.payment_date) }}
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

        <v-alert v-if="anulada(invoice || {})" type="info" variant="tonal" density="compact" class="ma-4">
          Esta factura está anulada: no recibe abonos.
        </v-alert>
        <v-form v-else ref="liquidarFormRef" @submit.prevent class="pa-4">
          <div class="d-flex align-center justify-space-between mb-3">
            <div class="text-subtitle-2 font-weight-bold">
              {{ editando ? 'Editar Abono:' : 'Registrar Nuevo Abono:' }}
            </div>
            <v-tooltip location="top">
              <template v-slot:activator="{ props: tooltipProps }">
                <v-chip
                  v-bind="tooltipProps"
                  :color="monedaActual === 'USD' ? 'green-darken-1' : 'blue-darken-1'"
                  variant="tonal"
                  size="small"
                  class="font-weight-bold"
                >
                  <v-icon start size="14">mdi-cash-multiple</v-icon>
                  {{ monedaActual }}
                </v-chip>
              </template>
              <span>Se liquida en {{ nombreDeMoneda(monedaActual) }}</span>
            </v-tooltip>
          </div>
          <segmented-field v-model="payment_data.payment_method" :opciones="formas" />
          <button type="button" class="sugerido con-marca my-3" :disabled="!seSugiere"
                  @click="payment_data.amount = sugerido.valor">
            <span>{{ sugerido.texto }}</span>
            <strong>{{ monto(sugerido.valor, monedaActual) }}</strong>
            <span class="usar"><v-icon size="16" start>mdi-arrow-down-bold-circle-outline</v-icon>Usar este monto</span>
          </button>
          <v-row density="compact">
            <v-col cols="12" md="6">
              <v-text-field
                v-model="payment_data.amount"
                :label="`Monto Pagado (${simboloDe(monedaActual)})`"
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
            <v-col cols="12">
              <v-file-input
                v-model="file"
                :label="payment_data.payment_method === DETRACCION ? 'Constancia de detracción (opcional)' : 'Boleta o voucher (opcional)'"
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
                <v-btn v-if="!anulada(invoice || {})" color="primary" variant="flat" elevation="2"
          class="text-white font-weight-bold rounded-lg px-6"
          :loading="is_on_sending_process" :disabled="!payment_data.payment_method || !payment_data.amount" @click="save">
          {{ editando ? 'Guardar Cambios' : 'Registrar Abono' }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import AmountBreakdown from '@/components/shared/AmountBreakdown.vue'
import { desgloseDeFactura } from '@/utils/billing/desglose'
import { Toast } from '@/plugins/alerts'
import { ref, reactive, watch, computed } from 'vue'
import { useTheme } from 'vuetify'
import Swal from 'sweetalert2'
import BillingDataService from '@/services/billing/billingDataService'
import DatePicker from '@/components/commonComponents/DatePicker.vue'
import BaseModalHeader from '@/components/commonComponents/BaseModalHeader.vue'
import { fechaCorta, hoyISO } from '@/utils/dates'
import SegmentedField from '@/components/shared/SegmentedField.vue'
import { DETRACCION, FORMAS_DE_PAGO, anulada, formaDePago, nombreDe } from '@/utils/billing/facturas'
import { monto, nombreDe as nombreDeMoneda, simboloDe } from '@/utils/money'
import { avisarHecho } from '@/utils/documents/avisos'
import { mensajeDeError } from '@/utils/errors'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  invoice: { type: Object, default: null }
})

const emit = defineEmits(['update:modelValue', 'close'])

const theme = useTheme()

const dialogModel = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const monedaActual = computed(() => props.invoice?.currency || 'PEN')
// Los de la factura se piden al abrir: la fila de la tabla solo trae cuantos son.
const abonosDeLaFactura = ref([])
async function cargarAbonos () {
  if (!props.invoice) return
  try {
    abonosDeLaFactura.value = (await BillingDataService.listInvoicePayments(props.invoice.id)).data
  } catch (error) {
    Swal.fire('No se cargaron los abonos', mensajeDeError(error, 'No se pudieron leer los abonos.'), 'error')
  }
}

// Lo que el cliente debe, restado de arriba abajo: el total, sus notas, la detraccion y lo abonado.
const saldo = computed(() => Math.max(Number(props.invoice?.saldo_pendiente) || 0, 0))
const desglose = computed(() => (props.invoice ? desgloseDeFactura(props.invoice) : null))

const is_on_sending_process = ref(false)
const file = ref(null)
const editando = ref(false)
const pago_id_editar = ref(null)
const liquidarFormRef = ref(null)

const payment_data = reactive({
  amount: '',
  payment_method: 'TRANSFERENCIA',
  notes: '',
  payment_date: hoyISO()
})

const formas = computed(() => Object.entries(FORMAS_DE_PAGO).map(([valor, { texto }]) =>
  ({ valor, texto, desactivada: valor === DETRACCION && !props.invoice?.es_fiscal })))
const sugerido = computed(() => (payment_data.payment_method === DETRACCION
  ? { texto: 'Detracción de la factura', valor: props.invoice?.detraccion_sin_constancia || 0 }
  : { texto: 'Falta cobrar', valor: saldo.value }))
// Al editar un abono, lo que falta ya lo descuenta: no es un monto que ponerle.
const seSugiere = computed(() => !editando.value && sugerido.value.valor > 0
  && Number(payment_data.amount) !== sugerido.value.valor)

const resetLocalForm = () => {
  payment_data.amount = ''
  payment_data.payment_method = 'TRANSFERENCIA'
  payment_data.notes = ''
  payment_data.payment_date = hoyISO()
  file.value = null
  editando.value = false
  pago_id_editar.value = null
  if (liquidarFormRef.value) liquidarFormRef.value.resetValidation()
}

watch(() => props.modelValue, (val) => {
  if (val) {
    resetLocalForm()
    abonosDeLaFactura.value = props.invoice?.payments || []
    cargarAbonos()
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
    data.append('notes', payment_data.notes || '')

    if (file.value) {
      data.append('payment_proof', file.value)
    }

    const peticion = editando.value
      ? BillingDataService.updatePayment(pago_id_editar.value, data)
      : BillingDataService.createInvoicePayment(props.invoice.id, data)

    const hecho = editando.value ? 'Abono actualizado' : 'Abono registrado'
    peticion
      .then(({ data: guardado }) => {
        closeDialog()
        avisarHecho(hecho, guardado)
      })
      .catch((err) => {
        Swal.fire('Operación rechazada', mensajeDeError(err, 'No se pudo guardar el abono.'), 'error')
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
      BillingDataService.deletePayment(id).then(() => {
        Toast.fire({ timer: 2200, icon: 'success', title: 'Abono eliminado' })
        cargarAbonos()
      }).catch((error) => {
        Swal.fire('No se eliminó', mensajeDeError(error, 'No se pudo eliminar el abono.'), 'error')
      })
    }
  })
}
</script>

<style scoped>
.sugerido {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
  padding: 0.625rem 0.875rem 0.625rem 1rem;
  border-radius: 0.625rem;
  text-align: left;
  font-size: 0.875rem;
  background: rgb(var(--v-theme-panel));
  transition: opacity 0.15s;
}
.sugerido strong { font-size: 1rem; font-variant-numeric: tabular-nums; }
.sugerido .usar { margin-left: auto; font-weight: 600; white-space: nowrap; }
.sugerido:hover:not(:disabled) .usar { text-decoration: underline; }
.sugerido:focus-visible { outline: 0.125rem solid rgb(var(--v-theme-seleccion)); outline-offset: 0.125rem; }
.sugerido:disabled { opacity: 0.45; }
.border-bottom {
  border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}
.border {
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}
</style>