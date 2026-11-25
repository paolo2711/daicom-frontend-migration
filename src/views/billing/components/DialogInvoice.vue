<template>
  <v-dialog v-model="dialogModel" width="520" persistent scrollable class="dialog-premium">
    <v-card style="max-height: 90vh; display: flex; flex-direction: column;">
      <!-- PdfDropZone va DENTRO del card (no lo envuelve) para no romper el
           selector premium `.v-overlay__content > .v-card`. El overlay cubre
           toda la ventana igual. -->
      <pdf-drop-zone
        label="Suelta el PDF del comprobante" :disabled="sinComprobante"
        @file="onPdfDropped" @invalid="avisarSoloPdf"
        style="display: flex; flex-direction: column; flex: 1 1 auto; min-height: 0;"
      >
      <base-modal-header
        :title="titulo"
        icon="mdi-file-document-outline"
        @close="closeDialog"
      >
        {{ subtitulo }}
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
            :disabled="sinComprobante"
            class="mb-1"
            @update:modelValue="onPdfSelected"
          />
          <div v-if="!editando" class="d-flex align-center mb-3">
            <v-checkbox
              v-model="extraerCorrelativo"
              density="compact" hide-details
              label="Extraer datos del PDF automáticamente"
              :disabled="sinComprobante"
              class="text-caption"
            />
          </div>

          <v-row density="compact">
            <v-col cols="12" md="6">
              <v-text-field
                v-model="facturaData.invoice_number"
                label="N° de comprobante (*)"
                variant="outlined" density="compact"
                prepend-inner-icon="mdi-pound"
                placeholder="F001-00123"
                :disabled="sinComprobante"
                :rules="[v => sinComprobante || !!v?.trim() || 'Requerido']"
              />
            </v-col>
            <v-col cols="12" md="6">
              <date-picker
                label="Fecha de emisión (*)"
                :date="facturaData.invoice_date"
                :campo="{ disabled: sinComprobante }"
                @setPickedDate="(v) => (facturaData.invoice_date = v)"
              />
            </v-col>

            <v-col cols="12" md="6">
              <v-text-field
                v-model="facturaData.amount"
                :label="`Monto total (${simboloDe(monedaActual)}) (*)`"
                variant="outlined" density="compact"
                type="number" step="0.01"
                prepend-inner-icon="mdi-cash"
                :rules="[v => (!!v && parseFloat(v) > 0) || 'Requerido']"
              />
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field
                v-model="facturaData.exchange_rate"
                label="Tipo de cambio"
                variant="outlined" density="compact"
                type="number" step="0.001"
                prepend-inner-icon="mdi-swap-horizontal"
                :disabled="!conTipoDeCambio"
                :rules="[v => !conTipoDeCambio || !!v || 'Obligatorio en dólares']"
              />
            </v-col>

            <v-col cols="12" md="6">
              <div class="text-caption text-medium-emphasis mb-1">Moneda</div>
              <segmented-field v-model="moneda" :opciones="monedas" />
            </v-col>
            <v-col cols="12" md="6">
              <div class="text-caption text-medium-emphasis mb-1">Condición de pago</div>
              <segmented-field v-model="facturaData.es_credito" :opciones="condiciones" />
            </v-col>
            <v-col cols="12" md="6" class="mt-3">
              <date-picker
                label="Vence (a crédito)"
                :date="facturaData.due_date"
                :min="facturaData.invoice_date || undefined"
                :campo="{ disabled: !facturaData.es_credito }"
                @setPickedDate="(v) => (facturaData.due_date = v)"
              />
            </v-col>
            <v-col cols="12" md="6" class="mt-3">
              <div class="aviso-de-detraccion">
                <v-icon size="18" :color="detraccion?.aplica ? 'modal_warning' : undefined">mdi-bank-outline</v-icon><span>{{ textoDeDetraccion }}</span>
              </div>
            </v-col>
          </v-row>
        </v-form>
      </v-card-text>

      <v-card-actions class="px-6 pb-4 pt-2 border-t-thin">
        <v-btn v-if="editando" :disabled="sinComprobante" color="error" variant="text" @click="eliminarEsta">
          <v-icon start>mdi-delete</v-icon> Eliminar
        </v-btn>
        <v-spacer />
        <v-btn variant="flat" class="font-weight-bold mr-3 px-4" @click="closeDialog">Cancelar</v-btn>
        <v-btn color="primary" variant="flat" class="font-weight-bold px-4" :loading="isSaving" @click="save">
          {{ textoDeGuardar }}
        </v-btn>
      </v-card-actions>
      </pdf-drop-zone>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useLatestRequest } from '@/composables/useLatestRequest'
import { debounce } from '@/utils/debounce'
import { Toast } from '@/plugins/alerts'
import { avisarHecho } from '@/utils/documents/avisos'
import { avisarSoloPdf } from '@/utils/pdf'
import Swal from 'sweetalert2'
import BillingDataService from '@/services/billing/billingDataService'
import { hoyISO } from '@/utils/dates'
import { mensajeDeError } from '@/utils/errors'
import { eliminar } from '@/utils/billing/facturas'
import { MONEDAS, monto, simboloDe } from '@/utils/money'
import { marcarSinComprobante } from '@/utils/orders/sinFactura'
import DatePicker from '@/components/commonComponents/DatePicker.vue'
import BaseModalHeader from '@/components/commonComponents/BaseModalHeader.vue'
import PdfDropZone from '@/components/commonComponents/PdfDropZone.vue'
import SegmentedField from '@/components/shared/SegmentedField.vue'

const props = defineProps({
  modelValue:    { type: Boolean, default: false },
  orders:        { type: Array,  default: null },   // opcional: las órdenes que cubre la factura nueva
  invoiceToEdit: { type: Object, default: null },   // opcional: editar una factura existente
  pdf:           { type: File,   default: null },   // opcional: PDF soltado sobre el panel; se lee al abrir
  sin_comprobante: { type: Boolean, default: false },  // la orden se cobra sin factura: solo su moneda y su monto
})
const emit = defineEmits(['update:modelValue', 'close', 'marcada'])

const dialogModel = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
})

const isExtracting = ref(false)
const isSaving = ref(false)
const extraerCorrelativo = ref(true)
const monedaSuelta = ref('PEN')
const formRef = ref(null)

const editando = computed(() => !!props.invoiceToEdit)
const sinComprobante = computed(() => props.sin_comprobante || props.invoiceToEdit?.es_fiscal === false)
const titulo = computed(() => (sinComprobante.value ? 'Sin comprobante' : editando.value ? 'Editar factura' : 'Nueva factura'))
const textoDeGuardar = computed(() =>
  (editando.value ? 'Guardar cambios' : sinComprobante.value ? 'Marcar sin comprobante' : 'Crear factura'))
const paraOrdenes = computed(() => !!(props.orders && props.orders.length))
const subtitulo = computed(() => {
  const ordenes = (props.orders || props.invoiceToEdit?.ordenes_vinculadas || []).map(o => o.order_number)
  const deQuien = ordenes.length ? `${ordenes.length === 1 ? 'Orden' : `${ordenes.length} órdenes`}: ${ordenes.join(', ')}` : 'Sin orden'
  return sinComprobante.value ? `${deQuien} · solo lleva moneda y monto` : deQuien
})

// Al editar, la de la factura; al crear, la elegida en el toggle del dialogo.
const monedaActual = computed(() => {
  if (props.invoiceToEdit) return props.invoiceToEdit.currency || 'PEN'
  return monedaSuelta.value
})
const esUSD = computed(() => monedaActual.value === 'USD')
const conTipoDeCambio = computed(() => esUSD.value && !sinComprobante.value)
// La moneda se elige al crear; despues se conserva.
const moneda = computed({ get: () => monedaActual.value, set: (v) => { monedaSuelta.value = v } })
const monedas = computed(() => MONEDAS.map(m => ({ valor: m.value, texto: m.title, desactivada: editando.value })))
const condiciones = computed(() => [{ valor: false, texto: 'Contado', desactivada: sinComprobante.value },
                                    { valor: true, texto: 'Crédito', desactivada: sinComprobante.value }])

// La factura suelta todavia no tiene tipo: el back toma el de servicio hasta que se vincule.
const tipoOrden = computed(() => props.orders?.[0]?.order_type ?? props.invoiceToEdit?.order_type)

const facturaData = ref({
  invoice_number: '',
  invoice_date: '',
  amount: '',
  exchange_rate: '',
  es_credito: false,
  due_date: '',
  pdf: null,
})

const resetForm = () => {
  facturaData.value = { invoice_number: '', invoice_date: '', amount: '', exchange_rate: '', es_credito: false, due_date: '', pdf: null }
  extraerCorrelativo.value = true
  monedaSuelta.value = 'PEN'
}

const onPdfSelected = async (archivo) => {
  if (!archivo || editando.value || !extraerCorrelativo.value) return
  isExtracting.value = true
  const data = new FormData()
  data.append('pdf', archivo)
  try {
    const res = await BillingDataService.extractInvoiceData(data)
    facturaData.value.invoice_number = res.data.invoice_number || facturaData.value.invoice_number
    facturaData.value.invoice_date = res.data.invoice_date || facturaData.value.invoice_date
    facturaData.value.amount = res.data.amount || facturaData.value.amount
    facturaData.value.es_credito = !!res.data.es_credito
    facturaData.value.due_date = res.data.due_date || ''
    if (res.data.warning) {
      Toast.fire({ timer: 5000, icon: 'warning', title: 'Extracción parcial', text: res.data.warning })
    } else {
      Toast.fire({ timer: 2500, icon: 'success', title: '¡Datos extraídos!' })
    }
  } catch (err) {
    Toast.fire({ timer: 4000, icon: 'info', title: mensajeDeError(err, 'No se pudo leer el PDF. Ingresa los datos a mano.') })
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

// Al abrir: los datos de la que se edita, o los del PDF si llegó soltado sobre el panel.
const cargarDatosIniciales = () => {
  if (!props.modelValue) return
  if (props.invoiceToEdit) {
    const inv = props.invoiceToEdit
    facturaData.value = {
      invoice_number: sinComprobante.value ? '' : inv.invoice_number || '',
      invoice_date: inv.invoice_date || '',
      amount: inv.amount || '',
      exchange_rate: inv.exchange_rate || '',
      es_credito: inv.es_credito || false,
      due_date: inv.due_date || '',
      pdf: null,
    }
    return
  }
  resetForm()
  if (sinComprobante.value) facturaData.value.invoice_date = hoyISO()
  if (props.pdf) onPdfDropped(props.pdf)
}

// La detraccion la calcula el back con la misma regla que al guardar; el aviso solo la muestra.
const detraccion = ref(null)
const textoDeDetraccion = computed(() => {
  if (!detraccion.value) return 'Sin detracción'
  return detraccion.value.aplica
    ? `Detracción ${Number(detraccion.value.tasa)} %: ${monto(detraccion.value.monto, monedaActual.value)}`
    : 'Sin detracción (no supera S/ 700)'
})
const { begin, isLatest } = useLatestRequest()
const pedirDetraccion = debounce(async () => {
  const { amount, invoice_date: fecha, exchange_rate: cambio } = facturaData.value
  const turno = begin()
  if (sinComprobante.value || !fecha || !(parseFloat(amount) > 0) || (esUSD.value && !(parseFloat(cambio) > 0))) {
    detraccion.value = null
    return
  }
  try {
    const { data } = await BillingDataService.uploadDetraccion({
      amount, invoice_date: fecha, currency: monedaActual.value, exchange_rate: cambio || null,
      order_type: tipoOrden.value ?? null,
    })
    if (isLatest(turno)) detraccion.value = data
  } catch {
    if (isLatest(turno)) detraccion.value = null
  }
})
watch(() => [facturaData.value.amount, facturaData.value.invoice_date, facturaData.value.exchange_rate,
  monedaActual.value, tipoOrden.value], pedirDetraccion)

// Por su id: si la lista se recarga, lo escrito sigue.
watch([() => props.modelValue, () => props.invoiceToEdit?.id], cargarDatosIniciales, { immediate: true })

const buildFormData = () => {
  const data = new FormData()
  data.append('invoice_number', facturaData.value.invoice_number || '')
  data.append('invoice_date', facturaData.value.invoice_date)
  data.append('amount', facturaData.value.amount)
  data.append('currency', monedaActual.value)
  if (esUSD.value && facturaData.value.exchange_rate) {
    data.append('exchange_rate', facturaData.value.exchange_rate)
  }
  // Al contado el back borra el vencimiento.
  data.append('es_credito', facturaData.value.es_credito)
  if (facturaData.value.es_credito) data.append('due_date', facturaData.value.due_date)
  if (facturaData.value.pdf) data.append('pdf', facturaData.value.pdf)
  return data
}

const save = async () => {
  if (!sinComprobante.value && !facturaData.value.invoice_number?.trim()) {
    Swal.fire('Falta el número', 'El número de comprobante es obligatorio.', 'warning')
    return
  }
  if (!facturaData.value.invoice_date || !facturaData.value.amount || parseFloat(facturaData.value.amount) <= 0) {
    Swal.fire('Faltan datos', 'La fecha y el monto son obligatorios.', 'warning')
    return
  }
  if (conTipoDeCambio.value && !facturaData.value.exchange_rate) {
    Swal.fire('Falta el tipo de cambio', 'En dólares, el tipo de cambio es obligatorio.', 'warning')
    return
  }
  if (facturaData.value.es_credito && !facturaData.value.due_date) {
    Swal.fire('Falta el vencimiento', 'A crédito, la fecha de vencimiento es obligatoria.', 'warning')
    return
  }
  // El calendario no ofrece dias antes de la emision, pero la emision se puede cambiar despues.
  if (facturaData.value.es_credito && facturaData.value.due_date < facturaData.value.invoice_date) {
    Swal.fire('Vence antes de la emisión', 'La fecha de vencimiento no puede ser anterior a la de emisión.', 'warning')
    return
  }

  isSaving.value = true
  try {
    const data = buildFormData()
    if (sinComprobante.value && !editando.value) {
      if (await marcarSinComprobante(props.orders[0], monedaActual.value, facturaData.value.amount)) {
        emit('marcada')
        closeDialog()
      }
      return
    }
    let respuesta
    if (sinComprobante.value) {
      respuesta = await BillingDataService.updateInvoice(props.invoiceToEdit.id, { amount: facturaData.value.amount })
    } else if (editando.value) {
      respuesta = await BillingDataService.updateInvoice(props.invoiceToEdit.id, data)
    } else {
      if (paraOrdenes.value) data.append('ordenes', props.orders.map(o => o.id).join(','))
      respuesta = await BillingDataService.createInvoice(data)
    }
    avisarHecho(sinComprobante.value ? 'Monto actualizado' : editando.value ? 'Factura actualizada' : 'Factura guardada',
                respuesta.data)
    resetForm()
    closeDialog()
  } catch (err) {
    Swal.fire('Operación rechazada', mensajeDeError(err, 'No se pudo guardar la factura.'), 'error')
  } finally {
    isSaving.value = false
  }
}

const eliminarEsta = async () => {
  if (await eliminar(props.invoiceToEdit)) closeDialog()
}

const closeDialog = () => {
  emit('update:modelValue', false)
  emit('close')
}
</script>

<style scoped>
.aviso-de-detraccion { display: flex; align-items: center; gap: 0.5rem; min-height: 2.5rem; font-size: 0.875rem; }
</style>
