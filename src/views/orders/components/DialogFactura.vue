<template>
  <v-dialog v-model="dialogModel" width="520" persistent scrollable class="dialog-premium">
    <v-card style="max-height: 90vh; display: flex; flex-direction: column;">
      <!-- PdfDropZone va DENTRO del card (no lo envuelve) para no romper el
           selector premium `.v-overlay__content > .v-card`. El overlay cubre
           toda la ventana igual. -->
      <pdf-drop-zone
        label="Suelta el PDF del comprobante" @file="onPdfDropped" @invalid="pdfInvalido"
        style="display: flex; flex-direction: column; flex: 1 1 auto; min-height: 0;"
      >
      <base-modal-header
        :title="editando ? 'Editar factura' : 'Nueva factura'"
        icon="mdi-file-document-outline"
        @close="closeDialog"
      >
        <span v-if="order">Orden: <b class="text-primary">{{ order.order_number }}</b></span>
        <span v-else-if="esMulti">
          <b class="text-primary">{{ orders.length }}</b> órdenes:
          <span class="text-primary">{{ orders.map(o => o.order_number).join(', ') }}</span>
        </span>
        <span v-else>Factura independiente</span>
      </base-modal-header>

      <v-card-text class="pt-4" style="overflow-y: auto; flex-grow: 1;">
        <v-form ref="formRef" @submit.prevent>
          <!-- PDF + extracción (drag&drop en toda la ventana, ver PdfDropZone) -->
          <v-file-input
            v-model="facturaData.pdf"
            label="PDF del comprobante"
            prepend-inner-icon="mdi-file-pdf-box"
            variant="outlined" density="compact"
            accept="application/pdf" show-size clearable
            :loading="isExtracting"
            class="mb-1"
            @update:modelValue="onPdfSelected"
          />
          <div v-if="!editando" class="d-flex align-center mb-3">
            <v-checkbox
              v-model="extraerCorrelativo"
              density="compact" hide-details
              label="Extraer datos del PDF automáticamente"
              class="text-caption"
            />
          </div>

          <v-row density="compact">
            <v-col cols="12" md="7">
              <v-text-field
                v-model="facturaData.invoice_number"
                label="N° de comprobante"
                variant="outlined" density="compact"
                prepend-inner-icon="mdi-pound"
                placeholder="F001-00123"
              />
            </v-col>
            <v-col cols="12" md="5">
              <date-picker
                label="Fecha de emisión (*)"
                :date="facturaData.invoice_date"
                @setPickedDate="(v) => (facturaData.invoice_date = v)"
              />
            </v-col>

            <v-col cols="12" :md="esUSD ? 6 : 12">
              <v-text-field
                v-model="facturaData.amount"
                :label="`Monto total (${simbolo}) (*)`"
                variant="outlined" density="compact"
                type="number" step="0.01"
                prepend-inner-icon="mdi-cash"
                :rules="[v => (!!v && parseFloat(v) > 0) || 'Requerido']"
              />
            </v-col>

            <!-- Tipo de cambio: solo si la factura es en dólares -->
            <v-col cols="12" md="6" v-if="esUSD">
              <v-text-field
                v-model="facturaData.exchange_rate"
                label="Tipo de cambio del día (*)"
                variant="outlined" density="compact"
                type="number" step="0.001"
                prepend-inner-icon="mdi-swap-horizontal"
                hint="Se usa para el umbral de detracción (S/ 700)"
                persistent-hint
                :rules="[v => !!v || 'Obligatorio en dólares']"
              />
            </v-col>
          </v-row>

          <!-- Moneda: solo al crear factura SUELTA independiente. Con orden(es)
               la factura hereda la moneda de la(s) orden(es). -->
          <div v-if="!order && !editando && !esMulti" class="mt-3">
            <div class="text-caption text-medium-emphasis mb-1">Moneda de la factura</div>
            <v-btn-toggle v-model="monedaSuelta" mandatory density="compact" color="primary" variant="outlined">
              <v-btn value="PEN" size="small">Soles (S/)</v-btn>
              <v-btn value="USD" size="small">Dólares ($)</v-btn>
            </v-btn-toggle>
          </div>

          <!-- Aviso de detracción estimada (informativo, antes de guardar) -->
          <v-alert
            v-if="detraccionEstimada !== null"
            :type="detraccionEstimada > 0 ? 'warning' : 'success'"
            variant="tonal" density="compact" class="mt-4"
            :icon="detraccionEstimada > 0 ? 'mdi-bank-outline' : 'mdi-check-circle-outline'"
          >
            <template v-if="detraccionEstimada > 0">
              Esta factura tendrá detracción: <strong>{{ simbolo }} {{ detraccionEstimada.toFixed(2) }}</strong>
              ({{ esUSD ? '10%' : (tipoOrden === 2 ? '10%' : '12%') }} sobre el total).
            </template>
            <template v-else>
              Sin detracción (no supera el umbral de S/ 700).
            </template>
          </v-alert>
        </v-form>
      </v-card-text>

      <v-card-actions class="px-6 pb-4 pt-2" style="border-top: 1px solid rgba(0,0,0,0.1);">
        <v-btn v-if="editando" color="error" variant="text" @click="eliminar" :loading="isDeleting">
          <v-icon start>mdi-delete-outline</v-icon> Eliminar
        </v-btn>
        <v-spacer />
        <v-btn variant="flat" class="font-weight-bold mr-3 px-4" @click="closeDialog">Cancelar</v-btn>
        <v-btn color="primary" variant="flat" class="font-weight-bold px-4" :loading="isSaving" @click="save">
          {{ editando ? 'Guardar cambios' : 'Crear factura' }}
        </v-btn>
      </v-card-actions>
      </pdf-drop-zone>
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
import PdfDropZone from '@/components/commonComponents/PdfDropZone.vue'

const props = defineProps({
  modelValue:    { type: Boolean, default: false },
  order:         { type: Object, default: null },   // opcional: factura para UNA orden
  orders:        { type: Array,  default: null },   // opcional: UNA factura para VARIAS órdenes (selección)
  invoiceToEdit: { type: Object, default: null },   // opcional: editar una factura existente
  prefill:       { type: Object, default: null },   // opcional: datos pre-extraídos (drag&drop)
  order_type:    { type: Number, default: null },   // tipo de la pestaña (1=servicio/2=alquiler): tipa la factura suelta al crearla
})
const emit = defineEmits(['update:modelValue', 'updateOrder', 'close'])

const appStore = useAppStore()

const dialogModel = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
})

const isExtracting = ref(false)
const isSaving = ref(false)
const isDeleting = ref(false)
const extraerCorrelativo = ref(true)
const monedaSuelta = ref('PEN')
const formRef = ref(null)

const editando = computed(() => !!props.invoiceToEdit)
// Multi-orden: una sola factura para varias órdenes marcadas (viene de la
// barra de selección). Se crea suelta y se vinculan todas de una.
const esMulti = computed(() => !!(props.orders && props.orders.length))

// Moneda efectiva: si hay orden(es), la de la(s) orden(es) (todas comparten
// moneda); si edito, la de la factura; si es suelta, la elegida en el toggle.
const monedaActual = computed(() => {
  if (props.invoiceToEdit) return props.invoiceToEdit.currency || 'PEN'
  if (props.order) return props.order.currency || 'PEN'
  if (esMulti.value) return props.orders[0].currency || 'PEN'
  return monedaSuelta.value
})
const esUSD = computed(() => monedaActual.value === 'USD')
const simbolo = computed(() => (esUSD.value ? '$' : 'S/'))

// Tipo de la orden (para la tasa). Si es factura suelta sin orden, no
// sabemos el tipo aún (lo adoptará al vincular); asumimos servicio (12%)
// solo para el aviso informativo.
const tipoOrden = computed(() => props.order?.order_type ?? props.orders?.[0]?.order_type ?? props.invoiceToEdit?.order_type ?? 1)

// Detracción estimada (solo informativa, antes de guardar). Convierte a
// soles con el tipo de cambio para el umbral de 700, pero el monto de la
// detracción queda en la moneda de la factura — igual que el backend.
const detraccionEstimada = computed(() => {
  const monto = parseFloat(facturaData.value.amount)
  const fecha = facturaData.value.invoice_date
  if (!fecha || isNaN(monto) || monto <= 0) return null
  const exchange = parseFloat(facturaData.value.exchange_rate) || 0
  if (esUSD.value && exchange <= 0) return null

  const tasa = tipoOrden.value === 2 ? 0.10 : 0.12
  const UMBRAL = 700
  const valorSoles = esUSD.value ? monto * exchange : monto
  return valorSoles <= UMBRAL ? 0 : parseFloat((monto * tasa).toFixed(2))
})

const facturaData = ref({
  invoice_number: '',
  invoice_date: '',
  amount: '',
  exchange_rate: '',
  pdf: null,
})

const resetForm = () => {
  facturaData.value = { invoice_number: '', invoice_date: '', amount: '', exchange_rate: '', pdf: null }
  extraerCorrelativo.value = true
  monedaSuelta.value = 'PEN'
}

// Al abrir: cargar datos si es edición o si vienen pre-extraídos (drag&drop).
// immediate + observar invoiceToEdit resuelve el caso en que el componente
// se monta con v-if cuando el modal ya está abierto (el watch de modelValue
// solo no alcanzaba a dispararse).
const cargarDatosIniciales = () => {
  if (!props.modelValue) return
  if (props.invoiceToEdit) {
    const inv = props.invoiceToEdit
    facturaData.value = {
      invoice_number: inv.invoice_number || '',
      invoice_date: inv.invoice_date || '',
      amount: inv.amount || '',
      exchange_rate: inv.exchange_rate || '',
      pdf: null,
    }
  } else if (props.prefill) {
    facturaData.value = {
      invoice_number: props.prefill.invoice_number || '',
      invoice_date: props.prefill.invoice_date || '',
      amount: props.prefill.amount || '',
      exchange_rate: '',
      pdf: props.prefill.pdf || null,
    }
  } else {
    resetForm()
  }
}

watch(() => props.modelValue, cargarDatosIniciales, { immediate: true })
watch(() => props.invoiceToEdit, cargarDatosIniciales)
watch(() => props.prefill, cargarDatosIniciales)

const onPdfSelected = async (archivo) => {
  if (!archivo || editando.value || !extraerCorrelativo.value) return
  isExtracting.value = true
  const data = new FormData()
  data.append('pdf', archivo)
  try {
    const res = await OrderDataService.extractInvoiceData(data)
    facturaData.value.invoice_number = res.data.invoice_number || facturaData.value.invoice_number
    facturaData.value.invoice_date = res.data.invoice_date || facturaData.value.invoice_date
    facturaData.value.amount = res.data.amount || facturaData.value.amount
    if (res.data.warning) {
      Swal.fire({ toast: true, position: 'top-end', showConfirmButton: false, timer: 5000, icon: 'warning', title: 'Extracción parcial', text: res.data.warning })
    } else {
      Swal.fire({ toast: true, position: 'top-end', showConfirmButton: false, timer: 2500, icon: 'success', title: '¡Datos extraídos!' })
    }
  } catch (err) {
    const msg = err.response?.data?.error || 'No se pudo leer el PDF. Ingresa los datos a mano.'
    Swal.fire({ toast: true, position: 'top-end', showConfirmButton: false, timer: 4000, icon: 'info', title: msg })
  } finally {
    isExtracting.value = false
  }
}

// Soltar un PDF (validado por PdfDropZone): fija el archivo y dispara la
// extracción (onPdfSelected respeta el modo edición / el checkbox de extraer).
const onPdfDropped = (file) => {
  facturaData.value.pdf = file
  onPdfSelected(file)
}
const pdfInvalido = () => {
  Swal.fire({ toast: true, position: 'top-end', showConfirmButton: false, timer: 2500, icon: 'info', title: 'Suelta un archivo PDF.' })
}

const buildFormData = () => {
  const data = new FormData()
  data.append('invoice_number', facturaData.value.invoice_number || '')
  data.append('invoice_date', facturaData.value.invoice_date)
  data.append('amount', facturaData.value.amount)
  data.append('currency', monedaActual.value)
  if (esUSD.value && facturaData.value.exchange_rate) {
    data.append('exchange_rate', facturaData.value.exchange_rate)
  }
  // Tipo de la pestaña: tipa la factura suelta al crearla (el backend lo usa
  // solo en la creación suelta; en editar/crear-en-orden lo ignora).
  if (props.order_type != null) data.append('order_type', props.order_type)
  if (facturaData.value.pdf) data.append('pdf', facturaData.value.pdf)
  return data
}

const save = async () => {
  if (!facturaData.value.invoice_date || !facturaData.value.amount || parseFloat(facturaData.value.amount) <= 0) {
    Swal.fire('Faltan datos', 'La fecha y el monto son obligatorios.', 'warning')
    return
  }
  if (esUSD.value && !facturaData.value.exchange_rate) {
    Swal.fire('Falta el tipo de cambio', 'En dólares, el tipo de cambio es obligatorio.', 'warning')
    return
  }

  isSaving.value = true
  try {
    const data = buildFormData()
    if (editando.value) {
      await OrderDataService.updateInvoice(props.invoiceToEdit.id, data)
    } else if (esMulti.value) {
      // Una sola factura para varias órdenes: se crea suelta y se vinculan
      // todas de una (el backend valida moneda/tipo al vincular).
      const res = await OrderDataService.createInvoiceSuelta(data)
      await OrderDataService.linkInvoice(res.data.id, props.orders.map(o => o.id))
    } else if (props.order) {
      await OrderDataService.createInvoice(props.order.id, data)
    } else {
      await OrderDataService.createInvoiceSuelta(data)
    }
    Swal.fire({ toast: true, position: 'top-end', showConfirmButton: false, timer: 2200, icon: 'success', title: editando.value ? 'Factura actualizada' : 'Factura guardada' })
    resetForm()
    emit('updateOrder')
    closeDialog()
  } catch (err) {
    let msg = 'No se pudo guardar la factura.'
    if (err.response?.data) {
      msg = err.response.data.error || Object.values(err.response.data).flat().join(' | ')
    }
    Swal.fire('Operación rechazada', msg, 'error')
  } finally {
    isSaving.value = false
  }
}

const eliminar = async () => {
  const r = await Swal.fire({
    title: '¿Eliminar esta factura?',
    text: 'Se eliminará el comprobante de forma permanente.',
    icon: 'warning', showCancelButton: true,
    confirmButtonText: 'Sí, eliminar', cancelButtonText: 'Cancelar',
  })
  if (!r.isConfirmed) return
  isDeleting.value = true
  try {
    await OrderDataService.deleteInvoice(props.invoiceToEdit.id, props.order?.id)
    Swal.fire({ toast: true, position: 'top-end', showConfirmButton: false, timer: 2200, icon: 'success', title: 'Factura eliminada' })
    emit('updateOrder')
    closeDialog()
  } catch (err) {
    const msg = err.response?.data?.error || 'No se pudo eliminar.'
    Swal.fire('Error', msg, 'error')
  } finally {
    isDeleting.value = false
  }
}

const closeDialog = () => {
  emit('update:modelValue', false)
  emit('close')
}
</script>

