<template>
  <v-dialog v-model="abierto" class="dialog-premium" width="90%" max-width="36rem" :persistent="enviando">
    <sunat-envio v-if="envio" :envio="envio" titulo="Emitir factura" texto-de-volver="Volver a la factura"
                 @volver="emit('volver')" />
    <v-card v-else-if="factura">
      <base-modal-header :title="`Factura ${factura.invoice_number}`" icon="mdi-file-document-outline" @close="cerrar" />

      <v-card-text class="pt-4">
        <sunat-info :comprobante="factura" :estado-sunat="factura.estado_sunat" :numero="factura.invoice_number"
                    :filas="filas" />
      </v-card-text>

      <v-card-actions class="px-6 pb-4 flex-wrap ga-2">
        <v-spacer />
        <v-btn variant="flat" class="font-weight-bold px-4" @click="cerrar">Cerrar</v-btn>
        <v-btn v-if="factura.pdf_url" variant="outlined" class="font-weight-bold px-4" prepend-icon="mdi-file-pdf-box"
               @click="verPdf">Ver PDF</v-btn>
        <v-btn v-if="factura.estado_sunat === POR_ENVIAR" color="primary" variant="flat" class="font-weight-bold px-4"
               prepend-icon="mdi-send" :loading="trabajando" @click="reintentar">Reintentar envío</v-btn>
      </v-card-actions>
    </v-card>
    <v-card v-else class="d-flex justify-center pa-8">
      <v-progress-circular indeterminate color="primary" />
    </v-card>
  </v-dialog>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { usePolling } from '@/composables/usePolling'
import { useSwal } from '@/composables/useSwal'
import BillingDataService from '@/services/billing/billingDataService'
import { reintentarFactura } from '@/utils/billing/pendientes'
import { ANULADA, POR_ENVIAR } from '@/utils/billing/sunat'
import { fechaCorta, fechaHora } from '@/utils/dates'
import { mensajeDeError } from '@/utils/errors'
import { monto } from '@/utils/money'
import SunatEnvio from './SunatEnvio.vue'
import SunatInfo from './SunatInfo.vue'

// La factura de la fila, o null con el dialogo cerrado. Al abrirse pide el detalle con el QR.
const fila = defineModel({ type: Object, default: null })
// Mientras se emite (ver SunatEnvio). Solo se cierra volviendo al formulario.
const props = defineProps({ envio: { type: Object, default: null } })
const emit = defineEmits(['cambiada', 'ver-pdf', 'volver'])

const swal = useSwal()
const { programar, parar } = usePolling()
const factura = ref(null)
const trabajando = ref(false)
const enviando = computed(() => Boolean(props.envio && !props.envio.motivo))
const abierto = computed({
  get: () => Boolean(fila.value || props.envio),
  set: (si) => { if (si) return; if (!props.envio) cerrar(); else if (!enviando.value) emit('volver') },
})

const filas = computed(() => [
  ['Cliente', factura.value.cliente || '—'],
  ['Emisión', fechaCorta(factura.value.invoice_date)],
  ['Total', monto(factura.value.amount, factura.value.currency)],
  ['Órdenes', factura.value.ordenes_vinculadas.map(o => o.order_number).join(', ') || '—'],
  ['Emitida por', `${factura.value.emitida_por} · ${fechaHora(factura.value.fecha_emision)}`],
  ...(baja.value ? [['Baja', baja.value]] : []),
])
const baja = computed(() => {
  const { estado_sunat: estado, motivo_de_baja: motivo, anulada_por: quien, anulada_en: cuando } = factura.value
  if (factura.value.baja_en_proceso) return `Enviada a SUNAT, esperando su respuesta · ${motivo}`
  if (estado === ANULADA) return `${motivo} · ${quien} · ${fechaHora(cuando)}`
  return factura.value.respuesta?.baja?.descripcion || ''
})

// Con la baja en proceso, el back le pregunta a SUNAT cada vez que se lee.
async function leer (id) {
  try {
    const { data } = await BillingDataService.getInvoiceInfo(id)
    if (fila.value?.id !== data.id) return
    if (factura.value && factura.value.estado_sunat !== data.estado_sunat) emit('cambiada', data)
    factura.value = data
    if (data.baja_en_proceso) programar(() => leer(id))
  } catch (error) {
    cerrar()
    swal.fire({ icon: 'error', title: 'No se abrió la factura', text: mensajeDeError(error, 'No se pudo leer la factura.') })
  }
}

watch(fila, (elegida) => {
  parar()
  factura.value = null
  if (elegida) leer(elegida.id)
})

function cerrar () {
  fila.value = null
}

function verPdf () {
  emit('ver-pdf', factura.value)
  cerrar()
}

async function reintentar () {
  trabajando.value = true
  const resuelta = await reintentarFactura(factura.value.id, factura.value.invoice_number)
  trabajando.value = false
  if (!resuelta) return
  factura.value = { ...factura.value, ...resuelta }
  emit('cambiada', resuelta)
}
</script>
