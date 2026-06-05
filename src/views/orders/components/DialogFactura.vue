<template>
  <v-dialog v-model="dialogModel" class="dialog-premium" width="550" persistent>
    <v-card>
      <base-modal-header
        title="Datos de Facturación"
        icon="mdi-file-document-edit-outline"
        @close="closeDialog"
      >
        <span v-if="order">
          Orden:
          <span class="font-weight-bold text-primary ml-1">{{ order.order_number }}</span>
        </span>
      </base-modal-header>

      <v-form ref="facturaForm" @submit.prevent>
        <v-card-text class="pt-2">
          <v-switch
            v-model="noRequiereFactura"
            label="Cliente no requiere factura"
            class="mt-1 mb-4 font-weight-bold"
            hide-details
          />

          <v-row density="compact" align="center">
            <v-col cols="6" v-if="!noRequiereFactura">
              <v-text-field
                v-model="facturaData.invoice_number"
                label="Número de Factura (*)"
                variant="outlined"
                density="compact"
                prepend-inner-icon="mdi-pound"
                placeholder="Ej: 1234"
                hide-details="auto"
              />
            </v-col>

            <v-col :cols="noRequiereFactura ? 12 : 6">
              <date-picker
                :label="noRequiereFactura ? 'Fecha de Cierre (*)' : 'Fecha Emisión (*)'"
                :date="facturaData.invoice_date"
                color="primary"
                @setPickedDate="(value) => (facturaData.invoice_date = value)"
              />
              <div
                v-if="noRequiereFactura && !facturaData.invoice_date"
                class="text-primary text-darken-4 caption font-weight-bold mt-1 ml-1"
                style="line-height: 1.2;"
              >
                <v-icon size="x-small" color="primary-darken-4">mdi-alert</v-icon>
                Indicar fecha.
              </div>
            </v-col>

            <v-col cols="12" class="mt-2" v-if="!noRequiereFactura">
              <div v-if="localOrder?.billed_pdf && !archivoEliminado" class="d-flex flex-column align-center pa-4 border-dashed rounded-lg">
                <v-icon color="success" size="48">mdi-file-check</v-icon>
                <div class="text-subtitle-2 mt-2">Factura cargada en el servidor</div>

                <v-tooltip location="bottom">
                  <template v-slot:activator="{ props }">
                    <v-chip
                      v-bind="props"
                      class="ma-2"
                      color="primary"
                      label
                      closable
                      @click="abrirPdfActual"
                      @click:close="prepararEliminacion"
                    >
                      <v-icon start size="small">mdi-eye</v-icon>
                      {{ localOrder.billed_pdf.split('/').pop().slice(0, 35) }}...
                    </v-chip>
                  </template>
                  <span>Click para ver / 'X' para borrar</span>
                </v-tooltip>
              </div>

              <div v-else>
                <v-file-input
                  v-model="file"
                  label="Subir Factura (PDF) (*)"
                  prepend-inner-icon="mdi-file-pdf-box"
                  variant="outlined"
                  density="compact"
                  show-size
                  accept="application/pdf"
                  hide-details="auto"
                />
                <v-switch
                  v-model="extraerCorrelativo"
                  label="Auto-extraer correlativo del nombre"
                  density="compact"
                  hide-details
                  class="mt-3 ml-2"
                  color="info"
                />
              </div>
            </v-col>
          </v-row>
        </v-card-text>

        <v-card-actions class="px-6 pb-4 pt-2">
          <v-tooltip location="right" v-if="puedeResetear">
            <template v-slot:activator="{ props }">
              <!-- REGLA: v-btn icon → variant="text" + density="comfortable" -->
              <v-btn
                v-bind="props"
                icon="mdi-delete-restore"
                color="error"
                variant="text"
                density="comfortable"
                :disabled="isSending"
                @click="resetearFactura"
              />
            </template>
            <span>Eliminar Facturación</span>
          </v-tooltip>

          <v-spacer />

          <!-- REGLA: depressed → variant="flat" + density="comfortable" -->
          <v-btn variant="flat" class="font-weight-bold rounded-lg mr-3 px-6" @click="closeDialog">Cancelar</v-btn>
          <v-btn color="primary" variant="flat" elevation="2" class="text-white font-weight-bold rounded-lg px-6"
          :loading="isSending" :disabled="!isFacturaValid" @click="save">
          {{ (archivoEliminado && !file) ? 'Confirmar Eliminación' : 'Guardar Cambios' }}
        </v-btn>
        </v-card-actions>
      </v-form>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import Swal from 'sweetalert2'
import OrderDataService from '@/services/certificates/orderDataService'
import { useAppStore } from '@/stores/appStore'
import DatePicker from '@/components/commonComponents/DatePicker.vue'
import BaseModalHeader from '@/components/commonComponents/BaseModalHeader.vue'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  order: { type: Object, default: null }
})

const emit = defineEmits(['update:modelValue', 'reload'])

const dialogModel = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const appStore = useAppStore()

const isSending = ref(false)
const isFetchingDetails = ref(false) // Nuevo estado para la carga perezosa
const localOrder = ref(null) // Guardará los datos completos de la orden
const file = ref(null)
const archivoEliminado = ref(false)
const noRequiereFactura = ref(false)
const extraerCorrelativo = ref(true)
const facturaData = ref({
  invoice_number: '',
  invoice_date: ''
})

const puedeResetear = computed(() => {
  if (!localOrder.value) return false
  return (
    localOrder.value.status >= 2 ||
    !!localOrder.value.invoice_number ||
    localOrder.value.billed ||
    !!localOrder.value.billed_pdf
  )
})

const isFacturaValid = computed(() => {
  if (!localOrder.value) return false
  if (noRequiereFactura.value && facturaData.value.invoice_date) return true
  const tieneFecha = !!facturaData.value.invoice_date
  const tieneNumero = !!facturaData.value.invoice_number
  const tieneArchivo = !!file.value || (!!localOrder.value.billed_pdf && !archivoEliminado.value)
  return tieneFecha && tieneNumero && tieneArchivo
})

const initForm = (order) => {
  facturaData.value.invoice_number = order.invoice_number || ''
  facturaData.value.invoice_date = order.invoice_date || ''
  noRequiereFactura.value = order.invoice_number === 'SIN FACTURA'
  if (noRequiereFactura.value) facturaData.value.invoice_number = ''
  archivoEliminado.value = false
  file.value = null
}

watch(() => props.modelValue, (val) => {
  if (val && props.order) {
    localOrder.value = { ...props.order }
    initForm(localOrder.value)
  } else {
    localOrder.value = null
  }
})

watch(() => props.order, (nuevaOrden) => {
  if (props.modelValue && nuevaOrden) {
    localOrder.value = { ...nuevaOrden }
    initForm(localOrder.value)
  }
}, { deep: true })

watch(file, (nuevoArchivo) => {
  if (nuevoArchivo && extraerCorrelativo.value) {
    const partes = nuevoArchivo.name.split('-')
    if (partes.length >= 4) {
      const correlativoExtraido = partes[3].trim()
      facturaData.value.invoice_number = correlativoExtraido
    }
  }
})

const resetearFactura = () => {
  Swal.fire({
    title: '¿Resetear Facturación?',
    text: 'La orden volverá a estado "Abierta" y se borrarán todos los datos de facturación.',
    icon: 'warning',
    showCancelButton: true,
    cancelButtonColor: '#757575',
    confirmButtonColor: '#FF5252',
    confirmButtonText: 'Sí, resetear'
  }).then((result) => {
    if (result.isConfirmed) {
      isSending.value = true
      const data = new FormData()
      data.append('invoice_number', '')
      data.append('invoice_date', '')
      data.append('billed_pdf', '')
      data.append('billed', 'False')

      OrderDataService.uploadInvoice(props.order.id, data)
        .then(() => {
          Swal.fire('Reseteado', 'La facturación ha sido eliminada.', 'success').then(() => {
            closeDialog()
            if (window.notificarActualizacionFila) window.notificarActualizacionFila(null, props.order.id);
          })
        })
        .catch(() => {
          Swal.fire('Error', 'Hubo un problema al contactar con el servidor', 'error')
        })
        .finally(() => { isSending.value = false })
    }
  })
}

const prepararEliminacion = () => { archivoEliminado.value = true }
const abrirPdfActual = () => { window.open(localOrder.value.billed_pdf, '_blank') }

const save = () => {
  isSending.value = true
  const data = new FormData()

  if (noRequiereFactura.value) {
    data.append('invoice_number', 'SIN FACTURA')
    data.append('invoice_date', facturaData.value.invoice_date)
    data.append('billed', 'True')
    data.append('billed_pdf', '')
  } else {
    data.append('invoice_number', facturaData.value.invoice_number)
    data.append('invoice_date', facturaData.value.invoice_date)
    data.append('billed', 'True')
    if (file.value) {
      data.append('billed_pdf', file.value)
    }
  }

  OrderDataService.uploadInvoice(props.order.id, data)
    .then(() => {
      if (window.notificarActualizacionFila) window.notificarActualizacionFila(null, props.order.id);
      Swal.fire(appStore.successSavedOptions).then(() => {
        closeDialog();
      });
    })
    .catch(() => {
      Swal.fire('Error', 'Hubo un problema al guardar los datos.', 'error')
    })
    .finally(() => { isSending.value = false })
}

const closeDialog = () => {
  file.value = null
  archivoEliminado.value = false
  noRequiereFactura.value = false
  emit('update:modelValue', false)
}
</script>