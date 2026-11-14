<template>
  <v-dialog v-model="abierto" class="dialog-premium" width="90%" max-width="36rem" :persistent="enviando">
    <sunat-envio v-if="envio" :envio="envio" titulo="Emitir guía" texto-de-volver="Volver a la guía"
                 @volver="emit('volver')" />
    <v-card v-else-if="guia">
      <base-modal-header :title="`Guía ${guia.numero}`" icon="mdi-truck-delivery-outline" @close="cerrar" />

      <v-card-text class="pt-4">
        <sunat-info :comprobante="guia" :estado-sunat="guia.estado" :numero="guia.numero" :filas="filas">
          <div v-if="bajaPendienteEnSol(guia)" class="text-body-2 text-error mt-1">
            Baja pendiente en SOL: Empresas → Guía de Remisión Electrónica → Dar de Baja GRE Remitente.
          </div>
          <div v-else-if="guia.estado === ANULADA" class="text-body-2 text-medium-emphasis mt-1">
            Baja dada en SOL el {{ fechaHora(guia.baja_en_sol) }}.
          </div>
        </sunat-info>
      </v-card-text>

      <v-card-actions class="px-6 pb-4 flex-wrap ga-2">
        <v-spacer />
        <v-btn variant="flat" class="font-weight-bold px-4" @click="cerrar">Cerrar</v-btn>
        <v-btn v-if="guia.pdf" variant="outlined" class="font-weight-bold px-4" prepend-icon="mdi-file-pdf-box"
               @click="verPdf">
          Ver PDF
        </v-btn>
        <v-btn v-if="guia.estado === POR_ENVIAR" color="primary" variant="flat" class="font-weight-bold px-4"
               prepend-icon="mdi-send" :loading="trabajando" @click="resolver(reintentarEnvio)">
          Reintentar envío
        </v-btn>
        <v-btn v-if="bajaPendienteEnSol(guia)" color="primary" variant="flat" class="font-weight-bold px-4"
               :loading="trabajando" @click="resolver(registrarBajaEnSol)">
          Ya la di de baja en SOL
        </v-btn>
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
import BillingDataService from '@/services/billing/billingDataService'
import { useSwal } from '@/composables/useSwal'
import { fechaCorta, fechaHora } from '@/utils/dates'
import { mensajeDeError } from '@/utils/errors'
import { ANULADA, ENVIADA, POR_ENVIAR, bajaPendienteEnSol } from '@/utils/billing/guias'
import { registrarBajaEnSol, reintentarEnvio } from '@/utils/billing/pendientes'
import SunatEnvio from './SunatEnvio.vue'
import SunatInfo from './SunatInfo.vue'

// La guia de la fila, o null con el dialogo cerrado. Al abrirse pide el detalle, que tambien le pregunta a SUNAT.
const fila = defineModel({ type: Object, default: null })
// Mientras se emite (ver SunatEnvio). Solo se cierra volviendo al formulario.
const props = defineProps({ envio: { type: Object, default: null } })
const emit = defineEmits(['cambiada', 'ver-pdf', 'volver'])

const swal = useSwal()
const guia = ref(null)
const trabajando = ref(false)
const { programar, parar } = usePolling()
const enviando = computed(() => Boolean(props.envio && !props.envio.motivo))
const abierto = computed({
  get: () => Boolean(fila.value || props.envio),
  set: (si) => { if (si) return; if (!props.envio) cerrar(); else if (!enviando.value) emit('volver') },
})

const filas = computed(() => {
  const { datos, cliente_data: cliente } = guia.value
  return [
    ['Destinatario', `${cliente.name} · ${cliente.documentType_name} ${cliente.document}`],
    ['Traslado', `${datos.partida.direccion} → ${datos.llegada.direccion}`],
    ['Inicio', fechaCorta(guia.value.fecha_traslado)],
    ['Órdenes', guia.value.ordenes.map(o => o.numero).join(', ') || '—'],
    ['Emitida por', `${guia.value.emitida_por} · ${fechaHora(guia.value.fecha_emision)}`],
    ...(guia.value.estado === ANULADA ? [['Motivo de la baja', guia.value.motivo_de_baja]] : []),
  ]
})

async function leer (id) {
  try {
    const { data } = await BillingDataService.getDispatchGuide(id)
    if (fila.value?.id !== data.id) return
    guia.value = data
    emit('cambiada', data)
    if (data.estado === ENVIADA) programar(() => leer(id))
  } catch (error) {
    cerrar()
    swal.fire({ icon: 'error', title: 'No se abrió la guía',
                text: mensajeDeError(error, 'No se pudo leer la guía.') })
  }
}

watch(fila, (elegida) => {
  parar()
  guia.value = null
  if (elegida) leer(elegida.id)
})

function cerrar () {
  fila.value = null
}

function verPdf () {
  emit('ver-pdf', guia.value)
  cerrar()
}

async function resolver (accion) {
  trabajando.value = true
  const resuelta = await accion(guia.value.id, guia.value.numero)
  trabajando.value = false
  if (!resuelta) return
  guia.value = { ...guia.value, ...resuelta }
  emit('cambiada', resuelta)
}
</script>
