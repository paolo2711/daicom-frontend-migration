<template>
  <panel-sunat :abierto="Boolean(fila)" tipo="invoice" :id="fila?.id" nombre="Factura" :numero="fila?.invoice_number"
               :estado-sunat="factura?.estado_sunat" :reintentar-hasta="factura?.reintentar_hasta || ''"
               :respuesta="factura?.respuesta" :qr="factura?.qr" :filas="filas"
               :acciones="factura ? acciones : []" :corregible="corregible" :pendientes="pendientes" :ocupado="ocupado"
               @cerrar="cerrar" @accion="ejecutar" @tarea-terminada="fila && leer(fila.id)">
    <div v-if="factura?.notas?.length" class="mt-2">
      <div class="font-weight-bold text-body-2">Notas de crédito</div>
      <div v-for="nota in factura.notas" :key="nota.id" class="d-flex align-center ga-2 text-body-2 py-1">
        <div class="flex-grow-1">
          <div class="font-weight-medium">{{ nota.numero }}</div>
          <div class="text-caption text-medium-emphasis">{{ nota.motivo }} · {{ nota.motivo_nombre }}</div>
        </div>
        <span class="text-no-wrap">{{ Number(nota.total) ? `− ${monto(nota.total, nota.moneda)}` : 'Sin monto' }}</span>
        <v-btn size="small" variant="tonal" class="text-none" prepend-icon="mdi-file-pdf-box"
               :disabled="!nota.pdf_url" @click="abrirEnOtraPestana(nota.pdf_url)">PDF</v-btn>
      </div>
    </div>
  </panel-sunat>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useSwal } from '@/composables/useSwal'
import BillingDataService from '@/services/billing/billingDataService'
import { useAppStore } from '@/stores/appStore'
import { preguntarFactura, reintentarFactura, reintentarNota } from '@/utils/billing/pendientes'
import {
  ACEPTADA, ANULADA, ENVIADA, POR_ENVIAR, RECHAZADA, REVISAR, avisoDelPlazo, fueraDePlazo, loQueDijo, rechazoDeLaBaja,
} from '@/utils/billing/sunat'
import { fechaCorta, fechaHora } from '@/utils/dates'
import { mensajeDeError } from '@/utils/errors'
import { monto } from '@/utils/money'
import { abrirEnOtraPestana } from '@/utils/pdf'
import { tareaDe } from '@/utils/uploadTasks'
import PanelSunat from './PanelSunat.vue'

// La factura de la fila, o null cerrado. Lee el detalle con el QR.
const fila = defineModel({ type: Object, default: null })
defineProps({
  corregible: { type: Boolean, default: false },
  acciones: { type: Array, default: () => [] },  // las del menu de la fila
})
const emit = defineEmits(['cambiada', 'corregir', 'accion'])

const swal = useSwal()
const appStore = useAppStore()
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
  if (factura.value.baja_en_proceso) return `Enviada a SUNAT · ${motivo}`
  return estado === ANULADA ? `${motivo} · ${quien} · ${fechaHora(cuando)}` : ''
})

// La nota que SUNAT no acepto: no llego (se reintenta), la rechazo o no se sabe si la tiene (se busca en SOL).
const TEXTO_DE_LA_NOTA = {
  [POR_ENVIAR]: (n) => ({ titulo: `La nota ${n.numero} no llegó a SUNAT`, texto: avisoDelPlazo(n.reintentar_hasta) }),
  [RECHAZADA]: (n) => ({ titulo: `SUNAT rechazó la nota ${n.numero}`,
                         texto: `${loQueDijo(n.respuesta)} Se debe emitir una nueva.` }),
  [REVISAR]: (n) => ({ titulo: `SUNAT rechazó la nota ${n.numero} al reintentar`,
                       texto: `${loQueDijo(n.respuesta)} Pudo haberla recibido en el primer envío: verificar en SOL; `
                         + 'si no figura, emitir una nueva.' }),
}

// La baja y las notas, en los mismos avisos que el estado de la factura.
const pendientes = computed(() => {
  const f = factura.value
  if (!f) return []
  const baja = f.respuesta?.baja
  const bajaRechazada = !f.baja_en_proceso && f.estado_sunat !== ANULADA && baja?.descripcion
  return [
    ...(f.baja_en_proceso
      ? [{ clave: 'consultar', estado: ENVIADA, titulo: 'Baja sin respuesta de SUNAT',
           texto: 'SUNAT recibió la baja. Su respuesta está pendiente.', boton: 'Preguntar' }]
      : []),
    ...(bajaRechazada ? [{ clave: 'rechazo-de-la-baja', estado: RECHAZADA, titulo: 'SUNAT no aceptó la baja',
                           texto: rechazoDeLaBaja(baja) }] : []),
    ...f.notas.filter(n => n.estado !== ACEPTADA).map(n => ({
      clave: `nota-${n.id}`,
      estado: n.estado,
      ...TEXTO_DE_LA_NOTA[n.estado](n),
      boton: n.estado === POR_ENVIAR && !fueraDePlazo(n.reintentar_hasta) ? 'Reintentar' : '',
    })),
  ]
})

// Si falla y la factura tiene tarea de envio, el panel sigue con lo de la tarea.
async function leer (id) {
  try {
    const { data } = await BillingDataService.getInvoiceInfo(id)
    if (fila.value?.id !== data.id) return
    if (factura.value && factura.value.estado_sunat !== data.estado_sunat) emit('cambiada', data)
    factura.value = data
  } catch (error) {
    if (fila.value?.id !== id || tareaDe(appStore.uploadTasks, 'invoice', id)) return
    cerrar()
    swal.fire({ icon: 'error', title: 'No se abrió la factura', text: mensajeDeError(error, 'No se pudo leer la factura.') })
  }
}

watch(() => fila.value?.id, (id) => {
  factura.value = null
  if (id) leer(id)
})

function cerrar () {
  fila.value = null
}

// Reintentar y Preguntar a SUNAT (de la factura o de su nota) se hacen aca, para que el panel quede al dia; lo
// demas, como en el menu.
const EN_EL_PANEL = {
  reintentar: () => reintentarFactura(factura.value.id, factura.value.invoice_number),
  consultar: () => preguntarFactura(factura.value.id, factura.value.invoice_number),
}
const ocupado = ref(null)
async function ejecutar (clave) {
  if (clave === 'corregir') return emit('corregir')
  const nota = factura.value?.notas.find(n => `nota-${n.id}` === clave)
  const hacer = nota ? () => reintentarNota(nota) : EN_EL_PANEL[clave]
  if (!hacer) return emit('accion', clave)
  ocupado.value = clave
  try {
    const resuelta = await hacer()
    if (resuelta) aplicar(resuelta)
  } finally {
    ocupado.value = null
  }
  return null
}

function aplicar (resuelta) {
  factura.value = { ...factura.value, ...resuelta }
  emit('cambiada', resuelta)
}
</script>
