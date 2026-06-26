<template>
  <v-dialog v-model="dialogModel" class="dialog-premium" width="620" persistent>
    <v-card>
      <base-modal-header
        title="Facturación y Comprobantes"
        icon="mdi-file-document-edit-outline"
        @close="closeDialog"
      >
        <span v-if="order">
          Orden:
          <span class="font-weight-bold text-primary ml-1">{{ order.order_number }}</span>
        </span>
      </base-modal-header>

      <v-card-text class="pa-0">

        <!-- ── ZONA SUPERIOR: Toggle + Historial de facturas ── -->
        <div
          class="pa-4"
          :class="theme.global.current.value.dark ? 'bg-grey-darken-4' : 'bg-grey-lighten-4'"
        >
          <v-switch
            v-model="wantsInvoice"
            :label="wantsInvoice ? 'Cliente requiere comprobante' : 'Cliente no requiere comprobante'"
            class="mb-3 font-weight-bold"
            color="primary"
            hide-details
            density="compact"
            @change="onWantsInvoiceChange"
          />

          <template v-if="wantsInvoice">
            <div class="text-subtitle-2 font-weight-bold mb-2">Comprobantes registrados:</div>

            <div v-if="isLoading" class="d-flex justify-center py-4">
              <v-progress-circular indeterminate color="primary" size="28" />
            </div>

            <v-alert
              v-else-if="invoices.length === 0"
              type="info"
              variant="text"
              density="compact"
              class="mb-0"
            >
              No hay comprobantes registrados aún para esta orden.
            </v-alert>

            <v-list
              v-else
              density="compact"
              class="rounded-lg border"
              lines="two"
            >
              <v-list-item
                v-for="inv in invoices"
                :key="inv.id"
                class="border-bottom"
              >
                <template #prepend>
                  <v-avatar
                    :color="inv.detraccion_applies ? 'deep-orange-lighten-5' : 'primary-lighten-5'"
                    size="40"
                  >
                    <v-icon :color="inv.detraccion_applies ? 'deep-orange' : 'primary'">
                      mdi-file-document-outline
                    </v-icon>
                  </v-avatar>
                </template>

                <v-list-item-title class="font-weight-bold">
                  {{ inv.invoice_number || 'Sin número' }}
                  <v-chip
                    v-if="inv.detraccion_applies"
                    size="x-small"
                    color="deep-orange"
                    variant="tonal"
                    class="ml-2 font-weight-bold"
                  >
                    <v-icon start size="x-small">mdi-bank-outline</v-icon>
                    Detrac. S/ {{ parseFloat(inv.detraccion_amount).toFixed(2) }}
                  </v-chip>
                </v-list-item-title>
                <v-list-item-subtitle>
                  {{ inv.invoice_date || 'Sin fecha' }}
                  <span v-if="inv.amount" class="font-weight-bold ml-2">
                    — S/ {{ parseFloat(inv.amount).toFixed(2) }}
                  </span>
                </v-list-item-subtitle>

                <template #append>
                  <div class="d-flex flex-row align-center">
                    <!-- Ver PDF -->
                    <v-tooltip location="bottom" v-if="inv.pdf_url">
                      <template v-slot:activator="{ props }">
                        <v-btn
                          v-bind="props"
                          icon size="small" color="primary" variant="text" density="comfortable"
                          :href="inv.pdf_url" target="_blank"
                        >
                          <v-icon size="small">mdi-file-eye</v-icon>
                        </v-btn>
                      </template>
                      <span>Ver Comprobante</span>
                    </v-tooltip>
                    <!-- Editar -->
                    <v-tooltip location="bottom">
                      <template v-slot:activator="{ props }">
                        <v-btn
                          v-bind="props"
                          icon size="small" color="primary" variant="text" density="comfortable"
                          class="mr-1"
                          @click="prepararEdicion(inv)"
                        >
                          <v-icon size="small">mdi-pencil</v-icon>
                        </v-btn>
                      </template>
                      <span>Editar Factura</span>
                    </v-tooltip>
                    <!-- Eliminar -->
                    <v-tooltip location="bottom">
                      <template v-slot:activator="{ props }">
                        <v-btn
                          v-bind="props"
                          icon size="small" color="error" variant="text" density="comfortable"
                          :loading="deletingId === inv.id"
                          @click="eliminarFactura(inv)"
                        >
                          <v-icon size="small">mdi-delete</v-icon>
                        </v-btn>
                      </template>
                      <span>Eliminar Comprobante</span>
                    </v-tooltip>
                  </div>
                </template>
              </v-list-item>
            </v-list>

            <!-- Resumen financiero -->
            <div v-if="invoices.length > 0" class="mt-3 rounded-lg border pa-3 d-flex justify-space-around">
              <div class="text-center">
                <div class="text-caption text-medium-emphasis mb-1">Total Facturado</div>
                <div class="font-weight-bold">S/ {{ totalFacturado.toFixed(2) }}</div>
              </div>
              <template v-if="totalDetraccion > 0">
                <v-divider vertical />
                <div class="text-center">
                  <div class="text-caption text-medium-emphasis mb-1">Detracción</div>
                  <div class="font-weight-bold text-deep-orange">— S/ {{ totalDetraccion.toFixed(2) }}</div>
                </div>
                <v-divider vertical />
                <div class="text-center">
                  <div class="text-caption text-medium-emphasis mb-1">Neto a Cobrar</div>
                  <div class="font-weight-bold text-primary">S/ {{ netoACobrar.toFixed(2) }}</div>
                </div>
              </template>
            </div>
          </template>
        </div>

        <v-divider />

        <!-- ── ZONA INFERIOR: Formulario agregar / editar ── -->
        <v-form ref="facturaFormRef" @submit.prevent class="pa-4">

          <div class="text-subtitle-2 font-weight-bold mb-3">
            <template v-if="!wantsInvoice">Fecha de cierre:</template>
            <template v-else-if="editando">Editar comprobante:</template>
            <template v-else>Agregar comprobante:</template>
          </div>

          <!-- Sin factura: solo fecha de cierre -->
          <template v-if="!wantsInvoice">
            <date-picker
              label="Fecha de Cierre (*)"
              :date="fechaCierre"
              color="primary"
              @setPickedDate="(v) => fechaCierre = v"
            />
          </template>

          <!-- Con factura: formulario completo -->
          <template v-else>
            <v-row density="compact">
              <v-col cols="6">
                <v-text-field
                  v-model="facturaData.invoice_number"
                  label="Número de Comprobante"
                  variant="outlined"
                  density="compact"
                  prepend-inner-icon="mdi-pound"
                  placeholder="Ej: F001-00123"
                  hide-details="auto"
                />
              </v-col>
              <v-col cols="6">
                <date-picker
                  label="Fecha Emisión (*)"
                  :date="facturaData.invoice_date"
                  color="primary"
                  @setPickedDate="(v) => facturaData.invoice_date = v"
                />
              </v-col>
              <v-col cols="6" class="mt-2">
                <v-text-field
                  v-model="facturaData.amount"
                  label="Monto con IGV (*)"
                  variant="outlined"
                  density="compact"
                  type="number"
                  step="0.01"
                  min="0"
                  prepend-inner-icon="mdi-currency-usd"
                  placeholder="Ej: 1200.00"
                  hide-details="auto"
                />
              </v-col>
              <v-col cols="6" class="mt-2">
                <v-file-input
                  v-model="facturaData.pdf"
                  label="PDF del comprobante"
                  prepend-inner-icon="mdi-file-pdf-box"
                  variant="outlined"
                  density="compact"
                  accept="application/pdf"
                  hide-details="auto"
                  :loading="isExtracting"
                  :disabled="isExtracting"
                  @update:model-value="onPdfSelected"
                />
              </v-col>
              <v-col cols="12" class="mt-1">
                <v-switch
                  v-model="extraerCorrelativo"
                  label="Auto-extraer datos del PDF"
                  density="compact"
                  hide-details
                  color="info"
                  class="ml-1"
                />
              </v-col>
            </v-row>

            <!-- Estimado de detracción (orientativo, solo al agregar) -->
            <v-alert
              v-if="!editando && detraccionEstimada !== null"
              :type="detraccionEstimada > 0 ? 'warning' : 'success'"
              variant="tonal"
              density="compact"
              class="mt-3"
              :icon="detraccionEstimada > 0 ? 'mdi-bank-outline' : 'mdi-check-circle-outline'"
            >
              <template v-if="detraccionEstimada > 0">
                Superará el umbral de S/ 700 el <strong>{{ facturaData.invoice_date }}</strong>.
                Detracción estimada: <strong>S/ {{ detraccionEstimada.toFixed(2) }}</strong>
              </template>
              <template v-else>
                No supera el umbral de S/ 700 — sin detracción.
              </template>
            </v-alert>
          </template>

        </v-form>
      </v-card-text>

      <!-- ── ACCIONES ── -->
      <v-card-actions class="px-6 pb-4 pt-2">
        <v-btn
          v-if="editando"
          variant="text"
          color="error"
          density="comfortable"
          @click="cancelarEdicion"
        >
          Cancelar edición
        </v-btn>
        <v-spacer />
        <v-btn
          variant="flat"
          class="font-weight-bold rounded-lg mr-3 px-6"
          @click="closeDialog"
        >
          Cerrar
        </v-btn>
        <v-btn
          color="primary"
          variant="flat"
          elevation="2"
          class="text-white font-weight-bold rounded-lg px-6"
          :loading="isSaving"
          :disabled="!isFormValido"
          @click="save"
        >
          {{ labelBotonGuardar }}
        </v-btn>
      </v-card-actions>

    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useTheme } from 'vuetify'
import Swal from 'sweetalert2'
import OrderDataService from '@/services/certificates/orderDataService'
import { useAppStore } from '@/stores/appStore'
import DatePicker from '@/components/commonComponents/DatePicker.vue'
import BaseModalHeader from '@/components/commonComponents/BaseModalHeader.vue'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  order:      { type: Object, default: null }
})

const emit = defineEmits(['update:modelValue', 'updateOrder', 'close'])

const theme    = useTheme()
const appStore = useAppStore()

const dialogModel = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

// ─── Estado ────────────────────────────────────────────────────────────────

const isLoading        = ref(false)
const isSaving         = ref(false)
const isExtracting     = ref(false)
const deletingId       = ref(null)
const editando         = ref(false)
const editandoId       = ref(null)
const facturaFormRef   = ref(null)
const extraerCorrelativo = ref(true)

const invoices     = ref([])
const wantsInvoice = ref(true)
const fechaCierre  = ref('')

const facturaData = ref({
  invoice_number: '',
  invoice_date:   '',
  amount:         '',
  pdf:            null,
})

// ─── Computed ──────────────────────────────────────────────────────────────

const totalDetraccion = computed(() =>
  invoices.value.reduce((acc, inv) =>
    acc + (inv.detraccion_applies ? parseFloat(inv.detraccion_amount || 0) : 0), 0)
)

const totalFacturado = computed(() =>
  invoices.value.reduce((acc, inv) => acc + parseFloat(inv.amount || 0), 0)
)

const netoACobrar = computed(() => totalFacturado.value - totalDetraccion.value)

const detraccionEstimada = computed(() => {
  const monto = parseFloat(facturaData.value.amount)
  const fecha = facturaData.value.invoice_date
  if (!fecha || isNaN(monto) || monto <= 0) return null

  const tasa    = props.order?.order_type === 2 ? 0.10 : 0.12
  const UMBRAL  = 700
  const sumaExistente = invoices.value
    .filter(inv => inv.invoice_date === fecha)
    .reduce((acc, inv) => acc + parseFloat(inv.amount || 0), 0)

  const sumaTotal = sumaExistente + monto
  return sumaTotal <= UMBRAL ? 0 : parseFloat((sumaTotal * tasa).toFixed(2))
})

const isFormValido = computed(() => {
  if (!wantsInvoice.value) return !!fechaCierre.value
  return !!facturaData.value.invoice_date &&
         !!facturaData.value.amount &&
         parseFloat(facturaData.value.amount) > 0
})

const labelBotonGuardar = computed(() => {
  if (!wantsInvoice.value) return 'Guardar'
  return editando.value ? 'Guardar Cambios' : 'Agregar Comprobante'
})

// ─── Watchers ──────────────────────────────────────────────────────────────

watch(() => props.modelValue, (val) => {
  if (val && props.order) {
    initDialog()
  } else {
    resetDialog()
  }
})

// ─── Métodos ───────────────────────────────────────────────────────────────

const initDialog = async () => {
  // Si ya existen facturas en la orden (aunque wants_invoice esté mal en BD),
  // forzar el switch a true para no confundir al usuario
  const yaHayFacturas = props.order.invoices?.length > 0
  wantsInvoice.value = yaHayFacturas || (props.order.wants_invoice ?? true)
  fechaCierre.value  = props.order.invoice_date || ''
  resetForm()
  if (wantsInvoice.value) {
    await cargarFacturas()
  }
}

const cargarFacturas = async () => {
  isLoading.value = true
  try {
    const res  = await OrderDataService.getInvoices(props.order.id)
    invoices.value = res.data
  } catch {
    invoices.value = []
  } finally {
    isLoading.value = false
  }
}

const resetForm = () => {
  facturaData.value = { invoice_number: '', invoice_date: '', amount: '', pdf: null }
  editando.value    = false
  editandoId.value  = null
}

const resetDialog = () => {
  invoices.value     = []
  wantsInvoice.value = true
  fechaCierre.value  = ''
  resetForm()
}

const onPdfSelected = async (archivo) => {
  // Validar que hay archivo y que el switch de Magia está encendido
  if (!archivo || !extraerCorrelativo.value) return
  
  isExtracting.value = true
  const data = new FormData()
  data.append('pdf', archivo)

  try {
    const res = await OrderDataService.extractInvoiceData(data)
    
    // Llenar los campos mágicamente con la respuesta del backend
    facturaData.value.invoice_number = res.data.invoice_number || ''
    facturaData.value.invoice_date   = res.data.invoice_date || ''
    facturaData.value.amount         = res.data.amount || ''
    
    // Mostrar alerta de éxito o advertencia parcial
    if (res.data.warning) {
      Swal.fire({ toast: true, position: 'top-end', showConfirmButton: false, timer: 5000, icon: 'warning', title: 'Extracción parcial', text: res.data.warning })
    } else {
      Swal.fire({ ...appStore.toastGuardadoExito, title: '¡Datos extraídos! ', icon: 'success' })
    }
  } catch (err) {
    // Si falla (ej. PDF escaneado o formato viejo), avisamos para llenar manual
    const msg = err.response?.data?.error || 'No se pudo leer el PDF. Ingresa los datos manualmente.'
    Swal.fire({
      toast: true, position: 'top-end', showConfirmButton: false, timer: 4500,
      icon: 'info', title: msg
    })
  } finally {
    isExtracting.value = false
  }
}

const onWantsInvoiceChange = async () => {
  if (wantsInvoice.value) {
    await cargarFacturas()
  }
}

const prepararEdicion = (inv) => {
  editando.value         = true
  editandoId.value       = inv.id
  facturaData.value = {
    invoice_number: inv.invoice_number || '',
    invoice_date:   inv.invoice_date   || '',
    amount:         inv.amount         || '',
    pdf:            null,
  }
}

const cancelarEdicion = () => {
  resetForm()
}


// ─── DESPUÉS ─────────────────────────────────────────────────────
const save = async () => {
  // Validación de anulación destructiva
  if (!wantsInvoice.value && invoices.value.length > 0) {
    const result = await Swal.fire({
      title: '¿Eliminar todos los comprobantes?',
      text: `Tienes ${invoices.value.length} comprobante(s) registrado(s). Si el cliente ya no requiere factura, estos se eliminarán de forma permanente.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar todo',
      cancelButtonText: 'Cancelar'
    });
    if (!result.isConfirmed) return;
  }

  isSaving.value = true
  try {
    if (!wantsInvoice.value) {
      await OrderDataService.patch(props.order.id, {
        wants_invoice: false,
        invoice_date:  fechaCierre.value,
      })
      Swal.fire(appStore.successSavedOptions).then(() => closeDialog())
      return
    }

    const data = new FormData()
    data.append('invoice_number', facturaData.value.invoice_number || '')
    data.append('invoice_date',   facturaData.value.invoice_date)
    data.append('amount',         facturaData.value.amount)
    if (facturaData.value.pdf) {
      data.append('pdf', facturaData.value.pdf)
    }

    if (editando.value) {
      await OrderDataService.updateInvoice(editandoId.value, data)
    } else {
      await OrderDataService.createInvoice(props.order.id, data)
      // Si la orden tenía wants_invoice=false/null en la BD, corregirlo
      if (!props.order.wants_invoice) {
        await OrderDataService.patch(props.order.id, { wants_invoice: true })
      }
    }

    resetForm()
    await cargarFacturas()
    Swal.fire({ ...appStore.toastGuardadoExito, title: editando.value ? 'Comprobante actualizado' : 'Comprobante registrado' })
  } catch {
    Swal.fire('Error', 'No se pudo guardar el comprobante.', 'error')
  } finally {
    isSaving.value = false
  }
}

const eliminarFactura = (inv) => {
  Swal.fire({
    title: '¿Eliminar este comprobante?',
    text: `${inv.invoice_number || 'Sin número'} — S/ ${parseFloat(inv.amount || 0).toFixed(2)}`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Sí, eliminar',
    cancelButtonText: 'Cancelar',
  }).then(async (result) => {
    if (!result.isConfirmed) return
    deletingId.value = inv.id
    try {
      await OrderDataService.deleteInvoice(inv.id)
      await cargarFacturas()
    } catch {
      Swal.fire('Error', 'No se pudo eliminar el comprobante.', 'error')
    } finally {
      deletingId.value = null
    }
  })
}

const closeDialog = () => {
  resetDialog()
  emit('update:modelValue', false)
  emit('close')
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