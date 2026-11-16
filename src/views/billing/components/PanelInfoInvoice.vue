<template>
  <panel-sunat :abierto="Boolean(fila)" tipo="invoice" :id="fila?.id" nombre="Factura" :numero="fila?.invoice_number"
               :estado-sunat="factura?.estado_sunat" :respuesta="factura?.respuesta" :qr="factura?.qr" :filas="filas"
               :acciones="factura ? acciones : []" :corregible="corregible"
               @cerrar="cerrar" @accion="ejecutar" @tarea-terminada="fila && leer(fila.id)">
    <div v-if="factura?.notas?.length" class="mt-2">
      <div class="font-weight-bold text-body-2">Notas de crédito</div>
      <div v-for="nota in factura.notas" :key="nota.id" class="d-flex align-center ga-2 text-body-2 py-1">
        <div class="flex-grow-1">
          <div class="font-weight-medium">{{ nota.numero }}</div>
          <div class="text-caption text-medium-emphasis">{{ nota.motivo }} · {{ nota.motivo_nombre }}</div>
        </div>
        <span class="text-no-wrap">{{ Number(nota.total) ? `− ${monto(nota.total, nota.moneda)}` : 'Sin monto' }}</span>
        <v-btn size="small" variant="outlined" class="text-none" prepend-icon="mdi-file-pdf-box"
               :disabled="!nota.pdf_url" @click="abrirEnOtraPestana(nota.pdf_url)">PDF</v-btn>
      </div>
    </div>
  </panel-sunat>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { usePolling } from '@/composables/usePolling'
import { useSwal } from '@/composables/useSwal'
import BillingDataService from '@/services/billing/billingDataService'
import { useAppStore } from '@/stores/appStore'
import { reintentarFactura } from '@/utils/billing/pendientes'
import { ANULADA } from '@/utils/billing/sunat'
import { fechaCorta, fechaHora } from '@/utils/dates'
import { mensajeDeError } from '@/utils/errors'
import { monto } from '@/utils/money'
import { abrirEnOtraPestana } from '@/utils/pdf'
import { tareaDe } from '@/utils/uploadTasks'
import PanelSunat from './PanelSunat.vue'

// La factura de la fila, o null cerrado. Lee el detalle con el QR; con la baja en proceso, el back le pregunta a
// SUNAT cada vez que se lee.
const fila = defineModel({ type: Object, default: null })
defineProps({
  corregible: { type: Boolean, default: false },
  acciones: { type: Array, default: () => [] },  // las del menu de la fila
})
const emit = defineEmits(['cambiada', 'corregir', 'accion'])

const swal = useSwal()
const appStore = useAppStore()
const { programar, parar } = usePolling()
const factura = ref(null)

const filas = computed(() => {
  const f = factura.value
  if (!f) return fila.value ? [['Cliente', fila.value.cliente || '—']] : []
  return [
    ['Cliente', f.cliente || '—'],
    ['Emisión', fechaCorta(f.invoice_date)],
    ['Total', monto(f.amount, f.currency)],
    ['Órdenes', f.ordenes_vinculadas.map(o => o.order_number).join(', ') || '—'],
    ['Emitida por', `${f.emitida_por} · ${fechaHora(f.fecha_emision)}`],
    ...(baja.value ? [['Baja', baja.value]] : []),
  ]
})
const baja = computed(() => {
  const { estado_sunat: estado, motivo_de_baja: motivo, anulada_por: quien, anulada_en: cuando } = factura.value
  if (factura.value.baja_en_proceso) return `Enviada a SUNAT, esperando su respuesta · ${motivo}`
  if (estado === ANULADA) return `${motivo} · ${quien} · ${fechaHora(cuando)}`
  return factura.value.respuesta?.baja?.descripcion || ''
})


// Si falla y la factura tiene tarea de envio, el panel sigue con lo de la tarea.
async function leer (id) {
  try {
    const { data } = await BillingDataService.getInvoiceInfo(id)
    if (fila.value?.id !== data.id) return
    if (factura.value && factura.value.estado_sunat !== data.estado_sunat) emit('cambiada', data)
    factura.value = data
    if (data.baja_en_proceso) programar(() => leer(id))
  } catch (error) {
    if (fila.value?.id !== id || tareaDe(appStore.uploadTasks, 'invoice', id)) return
    cerrar()
    swal.fire({ icon: 'error', title: 'No se abrió la factura', text: mensajeDeError(error, 'No se pudo leer la factura.') })
  }
}

watch(() => fila.value?.id, (id) => {
  parar()
  factura.value = null
  if (id) leer(id)
})

function cerrar () {
  fila.value = null
}

// Reintentar se hace aca, para que el panel quede al dia; lo demas, como en el menu.
async function ejecutar (clave) {
  if (clave === 'corregir') return emit('corregir')
  if (clave !== 'reintentar') return emit('accion', clave)
  const resuelta = await reintentarFactura(factura.value.id, factura.value.invoice_number)
  if (!resuelta) return
  factura.value = { ...factura.value, ...resuelta }
  emit('cambiada', resuelta)
}
</script>
