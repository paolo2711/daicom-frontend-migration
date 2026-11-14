<template>
  <dialog-baja v-model="abierto" :titulo="`Anular ${guia?.numero}`" :largo="LARGO_DEL_MOTIVO">
    <div v-if="sinSunat" class="text-body-2">Nunca llegó a SUNAT: se anula solo en la app, sin baja en SOL.</div>
    <div v-else class="text-body-2">
      La baja se da en SOL:
      <strong>Empresas → Guía de Remisión Electrónica → Dar de Baja GRE Remitente</strong>.
      SUNAT solo la permite antes de que salga el traslado.
    </div>
    <div class="text-body-2 text-medium-emphasis">Su PDF queda sellado como anulado.</div>

    <template #acciones="{ motivo }">
      <v-btn v-if="sinSunat" color="primary" variant="flat" class="font-weight-bold px-4"
             :disabled="!motivo" :loading="anulando === true" @click="anular(motivo, true)">
        Anular
      </v-btn>
      <template v-else>
        <v-btn variant="outlined" class="font-weight-bold px-4" :disabled="!motivo"
               :loading="anulando === false" @click="anular(motivo, false)">
          La daré de baja después
        </v-btn>
        <v-btn color="primary" variant="flat" class="font-weight-bold px-4" :disabled="!motivo"
               :loading="anulando === true" @click="anular(motivo, true)">
          Ya la di de baja en SOL
        </v-btn>
      </template>
    </template>
  </dialog-baja>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useSwal } from '@/composables/useSwal'
import BillingDataService from '@/services/billing/billingDataService'
import { POR_ENVIAR } from '@/utils/billing/guias'
import { avisarHecho } from '@/utils/documents/avisos'
import { mensajeDeError } from '@/utils/errors'
import DialogBaja from './DialogBaja.vue'

// La guia a anular, o null con el dialogo cerrado. La baja ante SUNAT se da en SOL.
const guia = defineModel({ type: Object, default: null })
const emit = defineEmits(['anulada'])

// El motivo_de_baja del back.
const LARGO_DEL_MOTIVO = 250

const swal = useSwal()
// El boton que se esta enviando: true, false o null.
const anulando = ref(null)
// La que no llego a SUNAT no se da de baja en SOL.
const sinSunat = computed(() => guia.value?.estado === POR_ENVIAR)
const abierto = computed({ get: () => Boolean(guia.value), set: (si) => { if (!si) guia.value = null } })

async function anular (motivo, yaEnSol) {
  anulando.value = yaEnSol
  try {
    const { data } = await BillingDataService.cancelDispatchGuide(guia.value.id, { motivo, ya_en_sol: yaEnSol })
    avisarHecho(`${data.numero} anulada`, { warning: data.baja_en_sol
      ? data.warning : 'Queda en Tus pendientes hasta que la des de baja en SOL.' })
    emit('anulada', data)
    guia.value = null
  } catch (error) {
    swal.fire({ icon: 'error', title: 'No se anuló', text: mensajeDeError(error, 'No se pudo anular la guía.') })
  } finally {
    anulando.value = null
  }
}
</script>
