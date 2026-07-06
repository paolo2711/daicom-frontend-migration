<template>
  <v-dialog v-model="dialogModel" class="dialog-premium" width="950" persistent scrollable>
    <v-card style="max-height: 90vh; display: flex; flex-direction: column;">
      <base-modal-header
        title="Facturación y Comprobantes"
        icon="mdi-file-document-edit-outline"
        @close="closeDialog"
      >
        <span v-if="order" class="d-flex align-center">
          Orden:
          <span class="font-weight-bold text-primary mx-2">{{ order.order_number }}</span>
          <span class="text-medium-emphasis mr-2">|</span>
          <span class="font-weight-medium text-medium-emphasis">{{ order.client_data?.name }}</span>
        </span>
      </base-modal-header>

      <v-card-text class="pa-0" style="flex: 1 1 auto; overflow-y: auto; min-height: 0;">
        <v-row class="ma-0" style="min-height: 480px; height: 100%;">
          
          <!-- ============================================== -->
          <!-- ── COLUMNA IZQUIERDA: Toggle + Historial ── -->
          <!-- ============================================== -->
          <v-col 
            cols="12" md="7" 
            class="pa-4 d-flex flex-column border-e"
            :class="theme.global.current.value.dark ? 'bg-grey-darken-4' : 'bg-grey-lighten-4'"
          >
            <v-switch
              v-model="wantsInvoice"
              :label="wantsInvoice ? 'Cliente requiere comprobante' : 'Cliente no requiere comprobante'"
              class="mb-3 font-weight-bold flex-grow-0"
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
                class="rounded-lg border bg-surface flex-grow-1 overflow-y-auto"
                lines="two"
                style="max-height: 350px;"
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
                      v-if="inv.otras_ordenes && inv.otras_ordenes.length > 0"
                      size="x-small"
                      color="amber-darken-2"
                      variant="tonal"
                      class="ml-2"
                      style="cursor: pointer;"
                      @click="irAOrden(inv)"
                    >
                      <v-tooltip activator="parent" location="top">
                        <div class="text-caption font-weight-bold mb-1">Órdenes relacionadas:</div>
                        <div v-for="hermana in inv.otras_ordenes" :key="hermana.order_id" class="text-caption">
                          {{ hermana.order_number }} - S/ {{ hermana.amount_allocated.toFixed(2) }}
                        </div>
                        <div class="text-caption mt-1 font-italic">Clic para filtrar lista por esta factura</div>
                      </v-tooltip>
                      <v-icon start size="x-small">mdi-link-variant</v-icon>
                      Compartida ({{ inv.otras_ordenes.length }})
                    </v-chip>
                    <v-chip
                      v-else-if="!esAsignacionTotal(inv)"
                      size="x-small"
                      color="grey-darken-1"
                      variant="tonal"
                      class="ml-2"
                    >
                      Saldo libre: S/ {{ (parseFloat(inv.amount) - parseFloat(inv.amount_allocated)).toFixed(2) }}
                    </v-chip>
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
                    <template v-if="inv.amount_allocated != null">
                      <span class="font-weight-bold ml-2">
                        — Asignado a esta orden: S/ {{ parseFloat(inv.amount_allocated).toFixed(2) }}
                      </span>
                      <span v-if="!esAsignacionTotal(inv)" class="text-medium-emphasis">
                        (de S/ {{ parseFloat(inv.amount).toFixed(2) }} totales)
                      </span>
                    </template>
                    <span v-else-if="inv.amount" class="font-weight-bold ml-2">
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
              <div v-if="invoices.length > 0" class="mt-3 rounded-lg border bg-surface pa-3 d-flex justify-space-around">
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
          </v-col>

          <!-- ============================================== -->
          <!-- ── COLUMNA DERECHA: Formulario Dinámico ── -->
          <!-- ============================================== -->
          <v-col cols="12" md="5" class="pa-0 bg-surface d-flex flex-column">
            
            <v-form ref="facturaFormRef" @submit.prevent class="pa-6 flex-grow-1 overflow-y-auto">

              <!-- SI EL CLIENTE NO REQUIERE FACTURA (Pantalla Centrada) -->
              <div v-if="!wantsInvoice" class="h-100 d-flex flex-column align-center justify-center text-center">
                <v-icon color="grey-lighten-1" size="72" class="mb-4">mdi-file-document-remove-outline</v-icon>
                <div class="text-h6 font-weight-bold text-medium-emphasis">El cliente no requiere comprobante</div>
                <div class="text-body-2 text-grey mx-auto mt-2" style="max-width: 380px;">
                  <template v-if="props.order.wants_invoice !== false">
                    Estás a punto de configurar esta orden para cerrarse directamente mediante el historial de abonos. Presiona "Guardar Estado" para confirmar.
                  </template>
                  <template v-else>
                    Esta orden ya está configurada para no requerir comprobante de pago.
                  </template>
                </div>
              </div>

              <!-- SI EL CLIENTE SÍ REQUIERE COMPROBANTE -->
              <div v-else>
                <div class="text-subtitle-2 font-weight-bold mb-3">
                  <template v-if="editando">Editar comprobante:</template>
                  <template v-else>Agregar comprobante:</template>
                </div>
                
                <v-radio-group v-if="!editando" v-model="modoFactura" inline density="compact" color="primary" class="mb-4" hide-details>
                  <v-radio label="Subir Nuevo" value="nuevo"></v-radio>
                  <v-radio label="Vincular Existente" value="vincular"></v-radio>
                </v-radio-group>

                <!-- Modo Nuevo (Solo cuando no se está editando) -->
                <v-row density="compact" v-if="modoFactura === 'nuevo' && !editando">
                  
                  <!-- 1. PDF y Auto-extraer -->
                  <v-col cols="12">
                    <v-file-input
                      v-model="facturaData.pdf"
                      label="Subir PDF del comprobante (*)"
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
                  <v-col cols="12" class="mt-0 pt-0 mb-3">
                    <v-switch
                      v-model="extraerCorrelativo"
                      label="Auto-extraer datos del PDF"
                      density="compact"
                      hide-details
                      color="info"
                      class="ml-1"
                    />
                  </v-col>

                  <!-- 2. Datos de la factura -->
                  <v-col cols="6">
                    <v-text-field
                      v-model="facturaData.invoice_number"
                      label="Número de Comprobante"
                      variant="outlined"
                      density="compact"
                      prepend-inner-icon="mdi-pound"
                      placeholder="Ej: F001-00123"
                      hide-details="auto"
                      :disabled="bloquearCamposFactura || isExtracting"
                    />
                  </v-col>
                  <v-col cols="6">
                    <div :style="(bloquearCamposFactura || isExtracting) ? 'pointer-events: none; opacity: 0.5;' : ''">
                      <date-picker
                        label="Fecha Emisión (*)"
                        :date="facturaData.invoice_date"
                        color="primary"
                        @setPickedDate="(v) => facturaData.invoice_date = v"
                      />
                    </div>
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
                      :disabled="bloquearCamposFactura || isExtracting"
                    />
                  </v-col>

                  <!-- 3. Cubre total de la orden -->
                  <v-col cols="12" class="mt-3 border-top pt-2">
                    <v-switch
                      v-model="cubreTotalOrden"
                      label="Esta factura cubre el total de la orden"
                      density="compact"
                      hide-details
                      color="primary"
                      class="ml-1"
                    />
                  </v-col>
                  <v-col cols="6" class="mt-1" v-if="!cubreTotalOrden">
                    <v-text-field
                      v-model="montoParaEstaOrden"
                      label="Monto que corresponde a esta orden (*)"
                      variant="outlined"
                      density="compact"
                      type="number"
                      step="0.01"
                      min="0"
                      :max="maxMontoParcial"
                      prepend-inner-icon="mdi-currency-usd"
                      hint="El resto quedará disponible para vincularlo a otra orden"
                      persistent-hint
                    />
                  </v-col>
                  <v-col cols="6" class="mt-1 d-flex flex-column justify-start" v-if="!cubreTotalOrden">
                    <v-checkbox
                      v-model="conIgvParcial"
                      label="Con IGV"
                      density="compact"
                      hide-details
                      color="primary"
                      class="mt-1"
                    />
                    <div v-if="!conIgvParcial && igvParcialInfo" class="text-caption text-medium-emphasis ml-1">
                      + IGV S/ {{ igvParcialInfo.igv.toFixed(2) }} = Total S/ {{ igvParcialInfo.total.toFixed(2) }}
                    </div>
                  </v-col>
                </v-row>

                <!-- Modo Vincular Existente -->
                <v-row density="compact" v-if="modoFactura === 'vincular' && !editando">
                  <v-col cols="12">
                    <v-autocomplete
                      v-model="facturaSeleccionada"
                      v-model:search="searchQuery"
                      :items="searchResults"
                      :loading="isSearching"
                      item-title="invoice_number"
                      item-value="id"
                      return-object
                      label="Buscar Comprobante (Ej. F001...)"
                      prepend-inner-icon="mdi-magnify"
                      variant="outlined"
                      density="compact"
                      placeholder="Escriba el número..."
                      hide-details="auto"
                      :no-data-text="noDataTextFactura"
                      clearable
                    >
                      <template v-slot:item="{ props, item }">
                        <v-list-item v-bind="props" :title="item.raw.invoice_number" :subtitle="`${item.raw.invoice_date} | Total: S/ ${item.raw.amount}`">
                          <template v-slot:append>
                            <v-chip color="success" size="small" variant="tonal" class="font-weight-bold">
                              Libre: S/ {{ item.raw.disponible.toFixed(2) }}
                            </v-chip>
                          </template>
                        </v-list-item>
                      </template>
                    </v-autocomplete>
                  </v-col>
                  
                  <v-col cols="12" v-if="facturaSeleccionada" class="mt-2">
                    <v-alert type="info" variant="tonal" density="compact" class="mb-3">
                      Saldo disponible en este comprobante: <strong>S/ {{ facturaSeleccionada.disponible.toFixed(2) }}</strong>
                    </v-alert>
                    <v-text-field
                      v-model="montoAVincular"
                      label="Monto a asignar a esta orden (*)"
                      variant="outlined"
                      density="compact"
                      type="number"
                      step="0.01"
                      min="0"
                      :max="facturaSeleccionada.disponible"
                      prepend-inner-icon="mdi-currency-usd"
                      hide-details="auto"
                    />
                  </v-col>
                </v-row>

                <!-- Modo Edición Full (Soporta cambios tanto físicos como de reparto intermedio) -->
                <v-row density="compact" v-if="editando">
                  
                  <!-- 1. PDF y Auto-extraer (Misma UX que en Nuevo) -->
                  <v-col cols="12">
                    <v-file-input
                      v-model="facturaData.pdf"
                      label="Actualizar archivo PDF (Opcional)"
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
                  <v-col cols="12" class="mt-0 pt-0 mb-3">
                    <v-switch
                      v-model="extraerCorrelativo"
                      label="Auto-extraer datos del nuevo PDF"
                      density="compact"
                      hide-details
                      color="info"
                      class="ml-1"
                    />
                  </v-col>

                  <!-- 2. Datos de la factura -->
                  <v-col cols="6">
                    <v-text-field
                      v-model="facturaData.invoice_number"
                      label="Número de Comprobante"
                      variant="outlined"
                      density="compact"
                      prepend-inner-icon="mdi-pound"
                      placeholder="Ej: F001-00123"
                      hide-details="auto"
                      :disabled="bloquearCamposFactura || isExtracting"
                    />
                  </v-col>
                  <v-col cols="6">
                    <div :style="(bloquearCamposFactura || isExtracting) ? 'pointer-events: none; opacity: 0.5;' : ''">
                      <date-picker
                        label="Fecha Emisión (*)"
                        :date="facturaData.invoice_date"
                        color="primary"
                        @setPickedDate="(v) => facturaData.invoice_date = v"
                      />
                    </div>
                  </v-col>
                  <v-col cols="6" class="mt-2">
                    <v-text-field
                      v-model="facturaData.amount"
                      label="Monto Físico Total (*)"
                      variant="outlined"
                      density="compact"
                      type="number"
                      step="0.01"
                      min="0"
                      prepend-inner-icon="mdi-currency-usd"
                      placeholder="Ej: 1200.00"
                      hide-details="auto"
                      :disabled="bloquearCamposFactura || isExtracting"
                    />
                  </v-col>

                  <!-- 3. Cubre total de la orden -->
                  <v-col cols="12" class="mt-3 border-top pt-2">
                    <v-switch
                      v-model="cubreTotalOrden"
                      label="Esta factura cubre el total de la orden"
                      density="compact"
                      hide-details
                      color="primary"
                      class="ml-1"
                    />
                  </v-col>
                  <v-col cols="6" class="mt-1" v-if="!cubreTotalOrden">
                    <v-text-field
                      v-model="montoAsignadoOrden"
                      label="Monto asignado a ESTA orden (*)"
                      variant="outlined"
                      density="compact"
                      type="number"
                      step="0.01"
                      min="0"
                      :max="maxMontoParcial"
                      prepend-inner-icon="mdi-currency-usd"
                      hide-details="auto"
                    />
                  </v-col>
                  <v-col cols="6" class="mt-1 d-flex flex-column justify-start" v-if="!cubreTotalOrden">
                    <v-checkbox
                      v-model="conIgvParcial"
                      label="Con IGV"
                      density="compact"
                      hide-details
                      color="primary"
                      class="mt-1"
                    />
                    <div v-if="!conIgvParcial && igvParcialInfo" class="text-caption text-medium-emphasis ml-1">
                      + IGV S/ {{ igvParcialInfo.igv.toFixed(2) }} = Total S/ {{ igvParcialInfo.total.toFixed(2) }}
                    </div>
                  </v-col>
                </v-row>

                <!-- Alerta informativa de detracción orientativa -->
                <v-alert
                  v-if="!editando && modoFactura === 'nuevo' && detraccionEstimada !== null"
                  :type="detraccionEstimada > 0 ? 'warning' : 'success'"
                  variant="tonal"
                  density="compact"
                  class="mt-4"
                  :icon="detraccionEstimada > 0 ? 'mdi-bank-outline' : 'mdi-check-circle-outline'"
                >
                  <template v-if="detraccionEstimada > 0">
                    Superará el umbral de S/ 700 el <strong>{{ facturaData.invoice_date }}</strong>.
                    Detracción estimada para la orden: <strong>S/ {{ detraccionEstimada.toFixed(2) }}</strong>
                  </template>
                  <template v-else>
                    No supera el umbral de S/ 700 en esta fecha — sin detracción.
                  </template>
                </v-alert>

              </div>
            </v-form>
          </v-col>

        </v-row>
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
          :disabled="botonGuardarDeshabilitado"
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
import { useRouter } from 'vue-router'
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

const emit = defineEmits(['update:modelValue', 'updateOrder', 'close', 'navigate-to-order'])

const theme    = useTheme()
const appStore = useAppStore()
const router   = useRouter()

const expandedInvoiceId = ref(null)

const dialogModel = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

// ─── Estado ────────────────────────────────────────────────────────────────

const isLoading        = ref(false)
const modoFactura      = ref('nuevo') // 'nuevo' o 'vincular'
const searchQuery      = ref('')
const searchResults    = ref([])
const isSearching      = ref(false)
const facturaSeleccionada = ref(null)
const montoAVincular   = ref('')
let searchTimeout      = null
const isSaving         = ref(false)
const isExtracting     = ref(false)
const deletingId       = ref(null)
const editando         = ref(false)
const editandoId       = ref(null)
const montoAsignadoOrden    = ref('')
const montoAsignadoOriginal = ref(0)
const cubreTotalOrden    = ref(true)
const montoParaEstaOrden = ref('')
// Checkbox "Con IGV" — solo afecta el campo "monto asignado a esta orden".
// El backend siempre recibe el total con IGV; si el usuario lo desmarca,
// asumimos que escribió el monto SIN IGV y lo convertimos (×1.18) al guardar.
const conIgvParcial      = ref(true)
const facturaFormRef   = ref(null)
const extraerCorrelativo = ref(true)
const datosExtraidos     = ref(false)

const invoices     = ref([])
const wantsInvoice = ref(true)

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

// Desglose informativo (+ IGV = Total) para el campo "monto asignado a esta orden"
// cuando el checkbox "Con IGV" está desmarcado. Comparte estado porque el campo
// de modo Nuevo y el de modo Edición nunca se muestran al mismo tiempo.
const igvParcialInfo = computed(() => {
  const raw   = editando.value ? montoAsignadoOrden.value : montoParaEstaOrden.value
  const monto = parseFloat(raw)
  if (!monto || monto <= 0) return null
  return {
    igv:   monto * 0.18,
    total: monto * 1.18,
  }
})

// Máximo permitido en el input del monto parcial: si el checkbox "Con IGV" está
// desmarcado, el usuario escribe el monto BASE, así que el tope visual debe ser
// facturaData.amount / 1.18 (para que, al convertir ×1.18, no supere el total real).
const maxMontoParcial = computed(() => {
  const total = parseFloat(facturaData.value.amount)
  if (!total) return undefined
  return conIgvParcial.value ? total : parseFloat((total / 1.18).toFixed(2))
})

const noDataTextFactura = computed(() => {
  if (isSearching.value) return 'Buscando...'
  if (!searchQuery.value) return 'No hay facturas con saldo disponible por el momento'
  return 'No se encontraron facturas con saldo libre para ese número'
})

const isFormValido = computed(() => {
  if (!wantsInvoice.value) return true
  if (modoFactura.value === 'vincular') {
    return !!facturaSeleccionada.value && 
           !!montoAVincular.value && 
           parseFloat(montoAVincular.value) > 0 &&
           parseFloat(montoAVincular.value) <= facturaSeleccionada.value.disponible
  }
  if (editando.value) {
    const baseValido = !!facturaData.value.invoice_date &&
                       !!facturaData.value.amount &&
                       parseFloat(facturaData.value.amount) > 0
    if (!baseValido) return false
    if (!cubreTotalOrden.value) {
      const montoConIgv = montoParcialConIgv(montoAsignadoOrden.value)
      return !!montoAsignadoOrden.value &&
             montoConIgv > 0 &&
             montoConIgv <= parseFloat(facturaData.value.amount)
    }
    return true
  }
  const baseValido = !!facturaData.value.invoice_date &&
         !!facturaData.value.amount &&
         parseFloat(facturaData.value.amount) > 0
  if (!baseValido) return false
  if (!cubreTotalOrden.value) {
    const montoConIgv = montoParcialConIgv(montoParaEstaOrden.value)
    return !!montoParaEstaOrden.value &&
           montoConIgv > 0 &&
           montoConIgv <= parseFloat(facturaData.value.amount)
  }
  return true
})

const labelBotonGuardar = computed(() => {
  if (!wantsInvoice.value) return 'Guardar Estado'
  return editando.value ? 'Guardar Cambios' : (modoFactura.value === 'vincular' ? 'Vincular y Asignar' : 'Agregar Comprobante')
})

const bloquearCamposFactura = computed(() => {
  if (editando.value || modoFactura.value !== 'nuevo') return false
  return extraerCorrelativo.value && !datosExtraidos.value
})

const botonGuardarDeshabilitado = computed(() => {
  if (!wantsInvoice.value) {
    // Si ya estaba guardado como false en la BD, deshabilitamos el botón porque no hay cambios reales
    return props.order.wants_invoice === false 
  }
  return !isFormValido.value
})

// ─── Watchers ──────────────────────────────────────────────────────────────

// Búsqueda inteligente (Debounce) — ahora también trae resultados con q vacío
watch(searchQuery, (val) => {
  if (modoFactura.value !== 'vincular') return
  clearTimeout(searchTimeout)
  isSearching.value = true
  searchTimeout = setTimeout(async () => {
    try {
      const res = await OrderDataService.searchInvoices(val || '')
      searchResults.value = res.data
    } catch (e) {
      searchResults.value = []
    } finally {
      isSearching.value = false
    }
  }, 400) // 400ms para no bombardear el servidor
})

// Al entrar a "Vincular Existente" precargamos las facturas disponibles
// (sin esperar a que el usuario escriba nada)
watch(modoFactura, (val) => {
  if (val === 'vincular' && !searchQuery.value && searchResults.value.length === 0) {
    isSearching.value = true
    OrderDataService.searchInvoices('')
      .then(res => { searchResults.value = res.data })
      .catch(() => { searchResults.value = [] })
      .finally(() => { isSearching.value = false })
  }
})

watch(() => props.modelValue, (val) => {
  if (val && props.order) {
    initDialog()
  } else {
    resetDialog()
  }
})

// ─── Métodos ───────────────────────────────────────────────────────────────

const initDialog = async () => {
  const yaHayFacturas = props.order.invoices?.length > 0
  // Forzamos a que sea true si ya hay facturas o si no está explícitamente guardado como false
  wantsInvoice.value = yaHayFacturas || props.order.wants_invoice !== false
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

// Devuelve el monto parcial SIEMPRE con IGV incluido, según el estado del checkbox.
// Si el checkbox está desmarcado, el valor ingresado se asume SIN IGV y se multiplica ×1.18.
const montoParcialConIgv = (rawValue) => {
  const monto = parseFloat(rawValue) || 0
  return conIgvParcial.value ? monto : parseFloat((monto * 1.18).toFixed(2))
}

const esAsignacionTotal = (inv) => {
  if (inv.amount_allocated == null || inv.amount == null) return true
  return Math.abs(parseFloat(inv.amount_allocated) - parseFloat(inv.amount)) < 0.01
}

const toggleOrdenesCompartidas = (inv) => {
  expandedInvoiceId.value = expandedInvoiceId.value === inv.id ? null : inv.id
}

const irAOrden = (inv) => {
  closeDialog()
  router.push({ query: { buscar_factura: inv.invoice_number } })
}

const resetForm = () => {
  facturaData.value = { invoice_number: '', invoice_date: '', amount: '', pdf: null }
  editando.value    = false
  editandoId.value  = null
  modoFactura.value = 'nuevo'
  searchQuery.value = ''
  searchResults.value = []
  facturaSeleccionada.value = null
  montoAVincular.value = ''
  montoAsignadoOrden.value = ''
  montoAsignadoOriginal.value = 0
  cubreTotalOrden.value = true
  montoParaEstaOrden.value = ''
  conIgvParcial.value = true
  extraerCorrelativo.value = true
  datosExtraidos.value = false
}

const resetDialog = () => {
  invoices.value     = []
  wantsInvoice.value = true
  resetForm()
}

const onPdfSelected = async (archivo) => {
  if (!archivo) {
    datosExtraidos.value = false
    return
  }
  if (!extraerCorrelativo.value) return
  
  isExtracting.value = true
  const data = new FormData()
  data.append('pdf', archivo)

  try {
    const res = await OrderDataService.extractInvoiceData(data)
    
    facturaData.value.invoice_number = res.data.invoice_number || ''
    facturaData.value.invoice_date   = res.data.invoice_date || ''
    facturaData.value.amount         = res.data.amount || ''
    datosExtraidos.value = true // ¡Éxito! Desbloqueamos los campos
    
    if (res.data.warning) {
      Swal.fire({ toast: true, position: 'top-end', showConfirmButton: false, timer: 5000, icon: 'warning', title: 'Extracción parcial', text: res.data.warning })
    } else {
      Swal.fire({ ...appStore.toastGuardadoExito, title: '¡Datos extraídos!', icon: 'success' })
    }
  } catch (err) {
    const msg = err.response?.data?.error || 'No se pudo leer el PDF. Ingresa los datos manualmente.'
    Swal.fire({
      toast: true, position: 'top-end', showConfirmButton: false, timer: 4500,
      icon: 'info', title: msg
    })
    datosExtraidos.value = false
    extraerCorrelativo.value = false // Apagamos el switch para desbloquear automáticamente los campos
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
  const montoOrden = inv.amount_allocated ?? inv.amount ?? 0
  montoAsignadoOrden.value    = montoOrden
  montoAsignadoOriginal.value = parseFloat(montoOrden) || 0
  
  // Encendemos el switch si el monto asignado es el 100% de la factura física
  cubreTotalOrden.value = Math.abs(parseFloat(montoOrden) - parseFloat(inv.amount)) < 0.01
  conIgvParcial.value = true // El checkbox siempre arranca activo al entrar en edición

  datosExtraidos.value = false
  extraerCorrelativo.value = false // Por defecto apagado para que no bloquee los campos si solo quiere editar texto
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
    // Switch apagado: mandamos el monto parcial que le corresponde a ESTA orden;
    // el resto de la factura queda libre para vincularlo a otra orden después.
    if (!editando.value && modoFactura.value === 'nuevo' && !cubreTotalOrden.value && montoParaEstaOrden.value) {
      data.append('amount_allocated', montoParcialConIgv(montoParaEstaOrden.value))
    }

    if (editando.value) {
      await OrderDataService.updateInvoice(editandoId.value, data)

      const nuevoMontoOrden = cubreTotalOrden.value ? parseFloat(facturaData.value.amount) : montoParcialConIgv(montoAsignadoOrden.value)
      if (nuevoMontoOrden !== montoAsignadoOriginal.value) {
        await OrderDataService.updateInvoiceAllocation(props.order.id, editandoId.value, nuevoMontoOrden)
      }
    } else {
      if (modoFactura.value === 'vincular') {
        await OrderDataService.linkInvoice(props.order.id, {
          invoice_id: facturaSeleccionada.value.id,
          amount: parseFloat(montoAVincular.value)
        })
      } else {
        await OrderDataService.createInvoice(props.order.id, data)
      }
      
      // Si la orden tenía wants_invoice=false/null en la BD, corregirlo
      if (!props.order.wants_invoice) {
        await OrderDataService.patch(props.order.id, { wants_invoice: true })
      }
    }

    resetForm()
    await cargarFacturas()
    Swal.fire({ ...appStore.toastGuardadoExito, title: editando.value ? 'Comprobante actualizado' : 'Comprobante registrado' })
  } catch (err) {
    let errorMsg = 'No se pudo guardar el comprobante.'
    if (err.response?.data) {
      if (err.response.data.error) {
        errorMsg = err.response.data.error
      } else {
        // Extrae y une los errores de validación nativos de Django (ej. campos vacíos o formatos incorrectos)
        errorMsg = Object.values(err.response.data).flat().join(' | ')
      }
    }
    Swal.fire('Operación rechazada', errorMsg, 'error')
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
      await OrderDataService.deleteInvoice(inv.id, props.order.id)
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

/* Vuetify trunca v-list-item-title (nowrap+ellipsis) y v-list-item-subtitle
   (line-clamp:2 por el lines="two" de la v-list) asumiendo que solo llevan texto.
   Acá metimos chips y un bloque expandible, así que hay que dejarlos crecer libres. */
:deep(.v-list-item-title) {
  white-space: normal !important;
  overflow: visible !important;
  text-overflow: unset !important;
}
:deep(.v-list-item-subtitle) {
  -webkit-line-clamp: unset !important;
  display: block !important;
  overflow: visible !important;
  white-space: normal !important;
}
:deep(.v-list-item) {
  height: auto !important;
  min-height: max-content !important;
  align-items: flex-start !important;
}
:deep(.v-list-item .v-list-item__prepend) {
  padding-top: 2px;
}
</style>