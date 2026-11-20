<template>
  <panel-sunat :abierto="Boolean(fila)" tipo="dispatchguide" :id="fila?.id" nombre="Guía" :numero="fila?.numero"
               :estado-sunat="guia?.estado" :reintentar-hasta="guia?.reintentar_hasta || ''"
               :respuesta="guia?.respuesta" :qr="guia?.qr" :filas="filas"
               :acciones="guia ? acciones : []" :corregible="corregible" :pendientes="pendientes" :ocupado="ocupado"
               @cerrar="cerrar" @accion="ejecutar" @tarea-terminada="fila && leer(fila.id)" />
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useSwal } from '@/composables/useSwal'
import BillingDataService from '@/services/billing/billingDataService'
import { useAppStore } from '@/stores/appStore'
import { ANULADA, REVISAR, bajaPendienteEnSol } from '@/utils/billing/guias'
import { preguntarGuia, registrarBajaEnSol, reintentarEnvio } from '@/utils/billing/pendientes'
import { fechaCorta, fechaHora } from '@/utils/dates'
import { mensajeDeError } from '@/utils/errors'
import { tareaDe } from '@/utils/uploadTasks'
import PanelSunat from './PanelSunat.vue'

// La guia de la fila, o null cerrado. Lee el detalle, que tambien le pregunta a SUNAT, y sigue mientras espera.
const fila = defineModel({ type: Object, default: null })
defineProps({
  corregible: { type: Boolean, default: false },
  acciones: { type: Array, default: () => [] },  // las del menu de la fila
})
const emit = defineEmits(['cambiada', 'corregir', 'accion'])

const swal = useSwal()
const appStore = useAppStore()
const guia = ref(null)

const filas = computed(() => {
  if (!guia.value) return fila.value ? [['Destinatario', fila.value.cliente_data?.name || '—']] : []
  const { datos, cliente_data: cliente } = guia.value
  return [
    ['Destinatario', `${cliente.name} · ${cliente.documentType_name} ${cliente.document}`],
    ['Traslado', `${datos.partida.direccion} → ${datos.llegada.direccion}`],
    ['Inicio', fechaCorta(guia.value.fecha_traslado)],
    ['Órdenes', guia.value.ordenes.map(o => o.numero).join(', ') || '—'],
    ['Emitida por', `${guia.value.emitida_por} · ${fechaHora(guia.value.fecha_emision)}`],
    ...(guia.value.estado === ANULADA ? [['Motivo de la baja', guia.value.motivo_de_baja]] : []),
    ...(guia.value.baja_en_sol ? [['Baja en SOL', fechaHora(guia.value.baja_en_sol)]] : []),
  ]
})

const pendientes = computed(() => (guia.value && bajaPendienteEnSol(guia.value)
  ? [{ clave: 'baja-en-sol', estado: REVISAR, titulo: 'Falta darla de baja en SOL', boton: 'Hecho',
       texto: 'Ruta en SOL: Empresas → Guía de Remisión Electrónica → Dar de Baja GRE Remitente.' }]
  : []))

// Si falla y la guia tiene tarea de envio, el panel sigue con lo de la tarea: la rechazada al enviarla se borra.
async function leer (id) {
  try {
    const { data } = await BillingDataService.getDispatchGuide(id)
    if (fila.value?.id !== data.id) return
    guia.value = data
    emit('cambiada', data)
  } catch (error) {
    if (fila.value?.id !== id || tareaDe(appStore.uploadTasks, 'dispatchguide', id)) return
    cerrar()
    swal.fire({ icon: 'error', title: 'No se abrió la guía', text: mensajeDeError(error, 'No se pudo leer la guía.') })
  }
}

watch(() => fila.value?.id, (id) => {
  guia.value = null
  if (id) leer(id)
})

function cerrar () {
  fila.value = null
}

// Reintentar, Preguntar a SUNAT y la baja en SOL se hacen aca, para que el panel quede al dia.
const EN_EL_PANEL = { reintentar: reintentarEnvio, consultar: preguntarGuia, 'baja-en-sol': registrarBajaEnSol }
const ocupado = ref(null)
async function ejecutar (clave) {
  if (clave === 'corregir') return emit('corregir')
  if (!EN_EL_PANEL[clave]) return emit('accion', clave)
  ocupado.value = clave
  try {
    const resuelta = await EN_EL_PANEL[clave](guia.value.id, guia.value.numero)
    if (!resuelta) return null
    guia.value = { ...guia.value, ...resuelta }
    emit('cambiada', resuelta)
  } finally {
    ocupado.value = null
  }
  return null
}
</script>
